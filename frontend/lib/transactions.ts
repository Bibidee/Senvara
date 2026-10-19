import { CONFIGURED } from "./constants";
import { dossierById, listDossiers, transactionState, writeContract } from "./chain";
import { clearIntent, digestIntent, getIntent, putIntent, readActionArgs, saveActionArgs, saveLocalTransaction, storageAvailable } from "./tx-store";
import { walletError } from "./wallet-errors";
import type { Dossier, TxPhase, TxReceipt, WalletSession } from "./types";
const inProgress=new Set<string>();

async function confirmCanonical(tx:TxReceipt, method:string, args:unknown[]):Promise<{verified:boolean;id?:number}> {
  const now = Date.now();
  const changedRecently = (unix:number) => Number.isSafeInteger(unix) && unix * 1000 >= tx.createdAt - 300000 && unix * 1000 <= now + 300000;
  const id=tx.recordId;
  if(method==="propose") {
    // Never infer successful creation from a mere increase in the global count.
    const wanted=String(args[0]);const repo=String(args[1]);const revision=String(args[2]);
    const page=await listDossiers(0,20);
    for(const item of page.ids){const result=await dossierById(item);if(result.proposer===tx.account&&result.assertion===wanted&&result.repository===repo&&result.commit===revision&&result.primary_path===String(args[3])&&result.reviewer===String(args[4]).toLowerCase()&&changedRecently(result.created_at))return {verified:true,id:item};}
    return {verified:false};
  }
  if(!id)return {verified:false};
  const rec:Dossier=await dossierById(id);
  const is = (s:string)=>rec.status===s;
  if(method==="respond")return {verified:(is("READY_FOR_REVIEW")||is("DECIDED")||is("REVIEW_EXHAUSTED")) && rec.reviewer===tx.account && rec.opposing_path===String(args[1]) && rec.reviewer_note===String(args[2]).trim() && changedRecently(rec.updated_at),id};
  if(method==="decline")return {verified:is("DECLINED")&&rec.reviewer===tx.account&&changedRecently(rec.updated_at),id};
  if(method==="withdraw")return {verified:is("WITHDRAWN")&&rec.proposer===tx.account&&changedRecently(rec.updated_at),id};
  if(method==="close_expired")return {verified:(is("EXPIRED_UNANSWERED")||is("EXPIRED_UNRESOLVED"))&&changedRecently(rec.updated_at),id};
  if(method==="evaluate")return {verified:Boolean(tx.expectedAttempt && rec.attempts===tx.expectedAttempt && rec.last_attempt_by===tx.account && changedRecently(rec.last_attempt_at)),id};
  return {verified:false};
}
export async function refreshStoredTransaction(tx:TxReceipt):Promise<TxReceipt> {
  if(!tx.hash) return tx;
  try {
    const phase=await transactionState(tx.hash);
    let next={...tx,phase:phase.phase,message:phase.description};
    if(phase.phase==="VERIFYING") {
      // Finality does not imply the proposed application outcome occurred.
      const action=tx.action;
      const args=readActionArgs(tx.id);
      const {verified,id}=await confirmCanonical(tx,action,args);
      next={...next,recordId:id||next.recordId,phase:verified?"VERIFIED" as TxPhase:"FINALIZED_UNVERIFIED" as TxPhase,
        message:verified?"Finalized and independently reconciled against contract state.":"Finalized but this specific state change could not be verified. Check the public record before attempting another write."};
      if(verified)clearIntent(tx.id);
    }
    saveLocalTransaction(next);return next;
  } catch(cause) {
    const next={...tx,phase:"UNKNOWN" as TxPhase,message:`Cannot verify the transaction right now: ${walletError(cause)}. Keep the hash; no automatic retry.`};
    saveLocalTransaction(next);return next;
  }
}
export async function sendAction(session:WalletSession, assertCurrent:(session:WalletSession)=>Promise<void>,
  method:string,args:unknown[], recordId?:number):Promise<TxReceipt> {
  if(!CONFIGURED)throw new Error("A deployed, verified Studionet contract address is required before signing.");
  if(!storageAvailable()) throw new Error("Browser transaction recovery storage is unavailable. Enable site storage before signing.");
  await assertCurrent(session);
  const expectedAttempt = method==="evaluate" && recordId ? (await dossierById(recordId)).attempts+1 : undefined;
  const key=await digestIntent({method,args,account:session.account,recordId,chain:61999});
  if(inProgress.has(key)||getIntent(key)) throw new Error("This exact action already has a pending or uncertain transaction. Reconcile its receipt before sending again.");
  inProgress.add(key);
  const createdAt=Date.now();
  let tx:TxReceipt={id:key,action:method,account:session.account,walletId:session.walletId,recordId,createdAt,
    hash:"",phase:"SIGNING",message:"Waiting for wallet authorization. No transaction hash yet.",argsDigest:key,expectedAttempt};
  const persist=(t:TxReceipt)=>{tx=t;saveLocalTransaction(t);};
  // Note that a crash during wallet signing retains the lock. Manual resolution is required.
  if(!putIntent(key,"SIGNING") || !saveLocalTransaction(tx) || !saveActionArgs(key,args)) {
    clearIntent(key);inProgress.delete(key);
    throw new Error("Browser transaction recovery storage is unavailable. Nothing was signed.");
  }
  try {
    await assertCurrent(session);
    const hash=await writeContract(method,args,session.account,session.provider,()=>assertCurrent(session));
    persist({...tx,hash,phase:"SUBMITTED",message:"Submitted. Waiting for consensus and execution."});
    putIntent(key,hash);
    return tx;
  } catch(cause){
    const number=Number((cause as{code?:number})?.code);
    if(number===4001){clearIntent(key);persist({...tx,phase:"REJECTED",message:"Wallet signature rejected. Nothing was submitted."});}
    else persist({...tx,phase:"UNKNOWN",message:"Submission was interrupted or its result is uncertain. Check your wallet before clearing this action."});
    throw new Error(walletError(cause));
  } finally {inProgress.delete(key);}
}
