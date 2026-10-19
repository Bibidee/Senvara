import { CHAIN_ID, CONTRACT_ADDRESS, CONTRACT_VERSION, EVALUATION_GUARD_PREFIX, INTENT_PREFIX, TX_PREFIX } from "./constants";
import type { TxReceipt } from "./types";

const cap = (items:TxReceipt[])=>items.sort((a,b)=>b.createdAt-a.createdAt).slice(0,50);
export function readLocalTransactions():TxReceipt[] {
  if(typeof window==="undefined") return [];
  try {const data=JSON.parse(window.localStorage.getItem(TX_PREFIX+"history")||"[]");return Array.isArray(data)?cap(data.filter(x=>x&&typeof x.id==="string")):[];}
  catch{return [];}
}
export function storageAvailable(): boolean {
  if(typeof window==="undefined") return false;
  try {
    const key = "senvara.storage.probe";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch { return false; }
}
export function saveLocalTransaction(receipt:TxReceipt): boolean {
  if(typeof window==="undefined") return false;
  try {
    const others=readLocalTransactions().filter(r=>r.id!==receipt.id);
    window.localStorage.setItem(TX_PREFIX+"history",JSON.stringify(cap([receipt,...others])));
    window.dispatchEvent(new Event("senvara:transactions"));
    return true;
  } catch { return false; }
}
export function intentStorageKey(id:string) {return INTENT_PREFIX+id;}
export function getIntent(id:string) {try {return typeof window==="undefined"?null:window.localStorage.getItem(intentStorageKey(id));} catch {return null;}}
export function putIntent(id:string, value:string): boolean {try {window.localStorage.setItem(intentStorageKey(id),value);return true;} catch {return false;}}
export function clearIntent(id:string) {try {window.localStorage.removeItem(intentStorageKey(id));} catch {/* optional local recovery state */}}
export function saveActionArgs(id:string, args:unknown[]): boolean {
  try {window.localStorage.setItem("senvara.args."+id,JSON.stringify(args,(_,v)=>typeof v==="bigint"?v.toString():v));return true;} catch {return false;}
}
export function readActionArgs(id:string): unknown[] {
  const raw = window.localStorage.getItem("senvara.args."+id);
  const parsed = JSON.parse(raw || "[]");
  if(!Array.isArray(parsed)) throw new Error("Saved transaction arguments are malformed.");
  return parsed;
}

export type EvaluationGuard = {
  id: string; recordId: number; account: string; chainId: number;
  contractAddress: string; contractVersion: string; createdAt: number; txId: string;
};

export function evaluationGuardKey(recordId:number, account:string, chainId=CHAIN_ID,
  contractAddress=CONTRACT_ADDRESS, contractVersion=CONTRACT_VERSION) {
  return `${EVALUATION_GUARD_PREFIX}${chainId}:${contractAddress.toLowerCase()}:${contractVersion}:${recordId}:${account.toLowerCase()}`;
}
function readEvaluationGuard(key:string):EvaluationGuard|null {
  try {
    const raw=typeof window==="undefined"?null:window.localStorage.getItem(key);
    if(!raw)return null;
    const guard=JSON.parse(raw) as EvaluationGuard;
    return guard&&typeof guard.id==="string"&&Number.isSafeInteger(guard.recordId)?guard:null;
  } catch{return null;}
}
export function getEvaluationGuard(recordId:number, account:string, chainId=CHAIN_ID,
  contractAddress=CONTRACT_ADDRESS, contractVersion=CONTRACT_VERSION) {
  return readEvaluationGuard(evaluationGuardKey(recordId,account,chainId,contractAddress,contractVersion));
}
const ACTIVE_EVALUATION_PHASES = new Set(["SIGNING","SUBMITTED","ACCEPTED_PROVISIONAL","IN_PROGRESS","VERIFYING","FINALIZED_UNVERIFIED","UNKNOWN"]);
export function claimEvaluationGuard(recordId:number, account:string, txId:string, now=Date.now(),
  chainId=CHAIN_ID, contractAddress=CONTRACT_ADDRESS, contractVersion=CONTRACT_VERSION):string|null {
  const key=evaluationGuardKey(recordId,account,chainId,contractAddress,contractVersion);
  const existing=readEvaluationGuard(key);
  if(existing && ACTIVE_EVALUATION_PHASES.has((readLocalTransactions().find(tx=>tx.id===existing.txId)?.phase)||"UNKNOWN")) return null;
  const guard:EvaluationGuard={id:key,recordId,account:account.toLowerCase(),chainId,contractAddress:contractAddress.toLowerCase(),contractVersion,createdAt:now,txId};
  try {
    window.localStorage.setItem(key,JSON.stringify(guard));
    return readEvaluationGuard(key)?.txId===txId?key:null;
  } catch{return null;}
}
export function clearEvaluationGuard(recordId:number, account:string, txId?:string,
  chainId=CHAIN_ID, contractAddress=CONTRACT_ADDRESS, contractVersion=CONTRACT_VERSION) {
  const key=evaluationGuardKey(recordId,account,chainId,contractAddress,contractVersion);
  try {
    const existing=readEvaluationGuard(key);
    if(!txId || existing?.txId===txId) window.localStorage.removeItem(key);
  } catch{/* optional browser recovery state */}
}
export async function digestIntent(value:unknown):Promise<string> {
  if(typeof window==="undefined"||!window.crypto?.subtle) throw new Error("A secure browser context is required for transaction fingerprinting.");
  const bytes = new TextEncoder().encode(JSON.stringify(value,(_,v)=>typeof v==="bigint"?v.toString():v));
  const hash=await window.crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,"0")).join("");
}
