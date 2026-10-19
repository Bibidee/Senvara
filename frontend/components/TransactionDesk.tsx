"use client";
import { useEffect, useRef, useState } from "react";
import { EXPLORER } from "@/lib/constants";
import { clearEvaluationGuard, clearIntent, readLocalTransactions, saveLocalTransaction } from "@/lib/tx-store";
import { refreshStoredTransaction } from "@/lib/transactions";
import type { TxReceipt } from "@/lib/types";

export function TransactionDesk({compact=false}:{compact?:boolean}) {
  const [items,setItems]=useState<TxReceipt[]>([]);
  const [busy,setBusy]=useState("");
  const outstanding=useRef(new Set<string>());
  useEffect(()=>{
    const update=()=>setItems(readLocalTransactions());update();
    window.addEventListener("senvara:transactions",update);
    window.addEventListener("storage",update);
    return ()=>{window.removeEventListener("senvara:transactions",update);window.removeEventListener("storage",update);};
  },[]);
  useEffect(()=>{
    const timer=window.setInterval(()=>{
      for(const tx of readLocalTransactions().filter(t=>t.hash&&["SUBMITTED","ACCEPTED_PROVISIONAL","IN_PROGRESS"].includes(t.phase)).slice(0,3)){
        if(outstanding.current.has(tx.id))continue;
        outstanding.current.add(tx.id);
        void refreshStoredTransaction(tx).finally(()=>outstanding.current.delete(tx.id));
      }
    },6500);
    return()=>window.clearInterval(timer);
  },[]);
  const dismissLocalGuard=(tx:TxReceipt)=>{
    const caution=tx.hash?"The saved transaction has a chain hash. Releasing this guard does not prove anything about its outcome. Confirm that it failed before retrying.":"No transaction hash was received. A previous wallet request might still have been broadcast. Check wallet activity and the contract before retrying.";
    if(!window.confirm(caution+"\n\nClear the local duplicate-action lock anyway?"))return;
    clearIntent(tx.id);
    if(tx.recordId&&tx.action==="evaluate") clearEvaluationGuard(tx.recordId,tx.account,tx.id,tx.chainId,tx.contractAddress,tx.contractVersion);
    saveLocalTransaction({...tx,phase:"GUARD_RELEASED",message:"Local duplicate-action guard manually released. No network outcome was verified; check for any earlier broadcast before retrying."});
  };
  const displayed=compact?items.slice(0,3):items;
  return <section className="receipt-desk" aria-label="Local transaction recovery">
    <div className="section-title-row"><div><div className="eyebrow">Local recovery only</div><h3>Transaction trace</h3></div><span className="quiet-count">{items.length} saved</span></div>
    {displayed.length===0?<p className="empty-caption">No local transaction history in this browser. Public records are always read from the contract.</p>:
      <div className="receipt-list">{displayed.map(tx=><article className="receipt-item" key={tx.id}>
        <div className="receipt-top"><strong>{tx.action.replaceAll("_"," ")}</strong><span className={`phase phase-${tx.phase.toLowerCase()}`}>{tx.phase.replaceAll("_"," ")}</span></div>
        <p>{tx.message}</p>
        <div className="receipt-footer">{tx.hash?<a href={`${EXPLORER}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">Explorer ↗</a>:<span>No hash available</span>}
          {tx.hash&&tx.phase!=="VERIFIED"&&tx.phase!=="FAILED"&&tx.phase!=="REJECTED"&&<button disabled={busy===tx.id} onClick={async()=>{setBusy(tx.id);try{await refreshStoredTransaction(tx)}finally{setBusy("")}}}>{busy===tx.id?"Checking…":"Check receipt"}</button>}
          {tx.recordId&&<a href={`/record/?id=${tx.recordId}`}>Record #{tx.recordId}</a>}
          {((!tx.hash&&tx.phase==="UNKNOWN")||(tx.hash&&tx.phase==="FAILED"))&&<button type="button" title="Manual risk acknowledgement required" onClick={()=>dismissLocalGuard(tx)}>Release local guard</button>}</div>
      </article>)}</div>}
    <p className="small-copy">A receipt is not proof of a successful judgment. Unknown requests are never automatically rebroadcast.</p>
  </section>;
}
