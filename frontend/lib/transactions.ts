import { CHAIN_ID, CONFIGURED, CONTRACT_ADDRESS, CONTRACT_IDENTITY, CONTRACT_VERSION } from "./constants";
import { dossierById, listDossiers, transactionState, writeContract } from "./chain";
import { claimEvaluationGuard, clearEvaluationGuard, clearIntent, digestIntent, getIntent, putIntent, readActionArgs, saveActionArgs, saveLocalTransaction, storageAvailable } from "./tx-store";
import { walletError } from "./wallet-errors";
import type { Dossier, TxPhase, TxReceipt, WalletSession } from "./types";
const inProgress=new Set<string>();

async function confirmCanonical(tx:TxReceipt, method:string, args:unknown[]):Promise<{verified:boolean;id?:number}> {
  const id=tx.recordId;
  if(method==="propose") {
    // list_dossiers is paginated, and the contract's exact fingerprint makes
    // this full immutable tuple unique. A count/timestamp is never enough.
    const wanted=String(args[0]);const repo=String(args[1]);const revision=String(args[2]);
    const maxPages=50;let offset=0;
    for(let pageNumber=0;pageNumber<maxPages;pageNumber++){
      const page=await listDossiers(offset,20);
      for(const item of page.ids){const result=await dossierById(item);if(result.proposer===tx.account&&result.assertion===wanted&&result.repository===repo&&result.commit===revision&&result.primary_path===String(args[3])&&result.reviewer===String(args[4]).toLowerCase())return {verified:true,id:item};}
      if(page.ids.length===0 || offset+page.ids.length>=page.total)break;
      offset+=page.ids.length;
    }
    return {verified:false};
  }
  if(!id)return {verified:false};
  const rec:Dossier=await dossierById(id);
  const is = (s:string)=>rec.status===s;
  if(method==="respond")return {verified:(is("READY_FOR_REVIEW")||is("DECIDED")||is("REVIEW_EXHAUSTED")) && rec.reviewer===tx.account && rec.opposing_path===String(args[1]) && rec.reviewer_note===String(args[2]).trim(),id};
  if(method==="decline")return {verified:is("DECLINED")&&rec.reviewer===tx.account,id};
  if(method==="withdraw")return {verified:is("WITHDRAWN")&&rec.proposer===tx.account,id};
  if(method==="evaluate"){
    // v0.2.0 records a one-way nonce fingerprint so the saved calldata can
    // be attributed without exposing the nonce. Historical v0.1.0 records do
    // not have this effect identifier and therefore remain unverified.
    if(typeof args[1]!=="string" || !rec.last_attempt_nonce_sha256 || !tx.expectedAttempt || rec.attempts!==tx.expectedAttempt || rec.last_attempt_by!==tx.account) return {verified:false,id};
    const bytes=new TextEncoder().encode(args[1].toLowerCase());
    const digest=await window.crypto.subtle.digest("SHA-256",bytes);
    const fingerprint=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,"0")).join("");
    return {verified:fingerprint===rec.last_attempt_nonce_sha256,id};
  }
  if(method==="close_expired")return {verified:false,id};
  return {verified:false};
}
export async function refreshStoredTransaction(tx:TxReceipt):Promise<TxReceipt> {
  if(!tx.hash) return tx;
  if(tx.chainId!==CHAIN_ID || tx.contractAddress?.toLowerCase()!==CONTRACT_ADDRESS.toLowerCase() || tx.contractVersion!==CONTRACT_VERSION) {
    const next={...tx,phase:"FINALIZED_UNVERIFIED" as TxPhase,message:"This saved transaction belongs to a different Senvara release identity and cannot be reconciled against the active contract."};
    saveLocalTransaction(next);return next;
  }
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
      if(verified){clearIntent(tx.id);if(tx.recordId&&tx.action==="evaluate")clearEvaluationGuard(tx.recordId,tx.account,tx.id);}
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
  const key=await digestIntent({identity:CONTRACT_IDENTITY,method,args,account:session.account,recordId});
  if(inProgress.has(key)||getIntent(key)) throw new Error("This exact action already has a pending or uncertain transaction. Reconcile its receipt before sending again.");
  const evaluationGuard = method==="evaluate" && recordId ? claimEvaluationGuard(recordId,session.account,key) : null;
  if(method==="evaluate" && !evaluationGuard) throw new Error("This record already has a pending or uncertain evaluation. Reconcile or manually release that guard before requesting another attempt.");
  inProgress.add(key);
  const createdAt=Date.now();
  let tx:TxReceipt={id:key,action:method,account:session.account,walletId:session.walletId,recordId,createdAt,
    hash:"",phase:"SIGNING",message:"Waiting for wallet authorization. No transaction hash yet.",argsDigest:key,expectedAttempt,
    chainId:CHAIN_ID,contractAddress:CONTRACT_ADDRESS.toLowerCase(),contractVersion:CONTRACT_VERSION,evaluationGuardKey:evaluationGuard||undefined};
  const persist=(t:TxReceipt)=>{tx=t;saveLocalTransaction(t);};
  // Note that a crash during wallet signing retains the lock. Manual resolution is required.
  if(!putIntent(key,"SIGNING") || !saveLocalTransaction(tx) || !saveActionArgs(key,args)) {
    clearIntent(key);if(recordId&&method==="evaluate")clearEvaluationGuard(recordId,session.account,key);inProgress.delete(key);
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
    if(number===4001){clearIntent(key);if(recordId&&method==="evaluate")clearEvaluationGuard(recordId,session.account,key);persist({...tx,phase:"REJECTED",message:"Wallet signature rejected. Nothing was submitted."});}
    else persist({...tx,phase:"UNKNOWN",message:"Submission was interrupted or its result is uncertain. Check your wallet before clearing this action."});
    throw new Error(walletError(cause));
  } finally {inProgress.delete(key);}
}
