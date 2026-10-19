"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CONFIGURED } from "@/lib/constants";
import { dossierById, listDossiers } from "@/lib/chain";
import { dateLabel, shortAddress, STATUS_LABEL } from "@/lib/format";
import type { Dossier } from "@/lib/types";

export default function Observatory(){
  const[records,setRecords]=useState<Dossier[]>([]);const[page,setPage]=useState(0);const[total,setTotal]=useState(0);
  const[loading,setLoading]=useState(false);const[error,setError]=useState("");
  const fetchPage=useCallback(async(offset:number)=>{if(!CONFIGURED)return;setLoading(true);setError("");try{const p=await listDossiers(offset,12);const data=await Promise.all(p.ids.map(id=>dossierById(id)));setRecords(data);setPage(offset);setTotal(p.total);}catch(e){setError(e instanceof Error?e.message:"Public record read failed.");setRecords([]);}finally{setLoading(false);}},[]);
  useEffect(()=>{const timer=window.setTimeout(()=>{void fetchPage(0)},0);return()=>window.clearTimeout(timer)},[fetchPage]);
  return <div className="inner-page wrap"><div className="page-heading"><div className="eyebrow">The observatory / records without a curator</div><h1>Open to <em>inspection.</em></h1><p>Every entry comes from finalized GenLayer contract state. No invented examples, off-chain rankings or private review database.</p></div>
    <div className="list-heading"><div className="list-count"><strong>{CONFIGURED?total:"—"}</strong><span>public questions recorded</span></div><button className="outline-button" onClick={()=>void fetchPage(page)} disabled={loading||!CONFIGURED}>{loading?"Refreshing…":"Refresh records ↻"}</button></div>
    {error&&<div className="inline-error" role="alert">{error}</div>}
    {!CONFIGURED?<div className="empty-register"><span className="empty-symbol">✳</span><h2>Awaiting the first deployment.</h2><p>The app will read live contract records once a verified Studionet contract address is configured.</p><Link prefetch={false} href="/method/">Review the verification process ↗</Link></div>:
    loading?<div className="loading-register" role="status">Reading finalized public records…</div>:
    records.length===0&&!error?<div className="empty-register"><span className="empty-symbol">∅</span><h2>No records in this range.</h2><p>A question starts here only after a wallet submits it and the contract confirms its state.</p><Link prefetch={false} href="/workbench/">Start the first review ↗</Link></div>:
    <div className="record-list">{records.map(r=><Link prefetch={false} className="record-line" key={r.id} href={`/record/?id=${r.id}`}><div className="record-number">{String(r.id).padStart(3,"0")}</div><div className="record-main"><span className="record-meta">{r.repository} / {r.commit.slice(0,8)}</span><h2>{r.assertion}</h2><span className="record-by">Proposed by {shortAddress(r.proposer)} · {dateLabel(r.created_at)}</span></div><div className="record-end"><span className={`status-tag status-${r.status.toLowerCase()}`}>{r.status==="DECIDED"?r.decision:STATUS_LABEL[r.status]}</span><span className="record-open">View record ↗</span></div></Link>)}</div>}
    {CONFIGURED&&total>12&&<div className="pagination"><button className="outline-button" onClick={()=>void fetchPage(Math.max(0,page-12))} disabled={loading||page===0}>← Newer</button><span>{Math.min(page+1,total)}–{Math.min(page+12,total)} of {total}</span><button className="outline-button" onClick={()=>void fetchPage(page+12)} disabled={loading||page+12>=total}>Older →</button></div>}
  </div>;
}
