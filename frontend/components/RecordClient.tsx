"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { dossierById, observationById } from "@/lib/chain";
import { CHAIN_ID, CONFIGURED } from "@/lib/constants";
import { dateLabel, hasRetryableDiagnostic, isTimeToExpire, recordOutcomeSummary, repositoryUrl, shortAddress, STATUS_LABEL } from "@/lib/format";
import { validPath } from "@/lib/validation";
import { sendAction } from "@/lib/transactions";
import type { Dossier, Observation } from "@/lib/types";
import { useWallet } from "./WalletContext";
import { TransactionDesk } from "./TransactionDesk";

export function RecordClient(){
  const search=useSearchParams();const id=Number(search.get("id"));
  const {session,assertCurrent,switchNetwork}=useWallet();
  const [record,setRecord]=useState<Dossier|null>(null);const[observation,setObservation]=useState<Observation|null>(null);
  const [loading,setLoading]=useState(true);const[readError,setReadError]=useState("");const[actionError,setActionError]=useState("");const[actionSuccess,setActionSuccess]=useState("");const[busy,setBusy]=useState(false);
  const [counterPath,setCounterPath]=useState("");const[note,setNote]=useState("");const[clock,setClock]=useState(()=>Math.floor(Date.now()/1000));
  useEffect(()=>{const t=window.setInterval(()=>setClock(Math.floor(Date.now()/1000)),15000);return()=>window.clearInterval(t)},[]);
  const load=useCallback(async()=>{
    if(!CONFIGURED){setReadError("The contract address has not been configured yet.");setLoading(false);return;}
    if(!Number.isSafeInteger(id)||id<1){setReadError("Enter a valid record number using /record/?id=1.");setLoading(false);return;}
    setLoading(true);setReadError("");try{const data=await dossierById(id);setRecord(data);setObservation(data.attempts?await observationById(id,data.attempts):null)}
    catch(e){setReadError(e instanceof Error?e.message:"Record read unavailable.");}
    finally{setLoading(false)}
  },[id]);
  useEffect(()=>{const timer=window.setTimeout(()=>{void load()},0);return()=>window.clearTimeout(timer)},[load]);
  const execute=async(method:string,args:unknown[])=>{
    setActionError("");setActionSuccess("");
    if(!record)return;
    if(!session){setActionError("Connect a wallet from the header to authorize this action.");return;}
    if(session.chainId!==CHAIN_ID){setActionError("Wrong network. Switch to Studionet before signing.");return;}
    setBusy(true);
    try{const result=await sendAction(session,assertCurrent,method,args,record.id);
      setActionSuccess("Transaction submitted: "+result.hash+". Reconcile its receipt below before treating the record as changed.");}
    catch(e){setActionError(e instanceof Error?e.message:"Transaction failed to start.");}
    finally{setBusy(false)}
  };
  const respond=async()=>{try{const path=validPath(counterPath);if(record?.primary_path===path)throw new Error("Choose a different source file from the primary evidence.");if(note.length>300)throw new Error("Reviewer context is limited to 300 characters.");await execute("respond",[BigInt(id),path,note]);}catch(e){setActionError(e instanceof Error?e.message:"Invalid response");}};
  const reviewer=session?.account===record?.reviewer;
  const proposer=session?.account===record?.proposer;
  const expired=record?isTimeToExpire(record,clock):false;
  const eligible=Boolean(record && (proposer||reviewer) && record.status==="READY_FOR_REVIEW" && clock<record.review_deadline && record.attempts<3 && (!record.last_attempt_at || clock>=record.last_attempt_at+600));
  const evaluationNonce = () => {
    const bytes = new Uint8Array(32); window.crypto.getRandomValues(bytes);
    return [...bytes].map(value=>value.toString(16).padStart(2,"0")).join("");
  };
  return <div className="inner-page wrap record-page"><div className="record-nav"><Link prefetch={false} href="/open/">← Observatory</Link><span>Documentary record / {Number.isSafeInteger(id)&&id>0?String(id).padStart(3,"0"):"INVALID"}</span></div>
    {loading?<div role="status" className="loading-register">Reading canonical Studionet record…</div>:readError?<div className="error-screen"><h1>Record unavailable.</h1><p role="alert">{readError}</p><button className="outline-button" onClick={()=>void load()}>Retry read</button></div>:record&&<>
      <div className="record-hero"><div><div className="eyebrow">Frozen question / #{record.id}</div><h1>{record.assertion}</h1><div className="record-hero-tags"><span className={`status-tag status-${record.status.toLowerCase()}`}>{STATUS_LABEL[record.status]}</span>{record.decision&&<span className="decision-pill">{record.decision}</span>}</div></div><div className="record-timing"><div className="eyebrow">Timeline</div><div><span>Proposed</span><strong>{dateLabel(record.created_at)}</strong></div><div><span>Reviewer response deadline</span><strong>{dateLabel(record.response_deadline)}</strong></div><div><span>Assessment deadline</span><strong>{dateLabel(record.review_deadline)}</strong></div></div></div>
      <div className="record-detail-grid"><div className="record-detail-main">
        <section className="detail-section"><div className="detail-head"><div><span className="section-index">01 / SOURCES</span><h2>What can be examined</h2></div><span className="mini-note">ONE PINNED REVISION</span></div>
          <div className="source-pair"><article className="source-box primary-source"><div className="source-type">A / PROPOSING FILE</div><h3>{record.primary_path}</h3><p>Submitted by {shortAddress(record.proposer)}</p><a target="_blank" rel="noopener noreferrer" href={repositoryUrl(record,record.primary_path)}>Open exact file ↗</a></article>
          <article className="source-box opposing-source"><div className="source-type">B / REVIEWER FILE</div><h3>{record.opposing_path||"Awaiting a second source"}</h3><p>{record.opposing_path?`Submitted by ${shortAddress(record.reviewer)}`:"The appointed reviewer has not responded."}</p>{record.opposing_path&&<a target="_blank" rel="noopener noreferrer" href={repositoryUrl(record,record.opposing_path)}>Open exact file ↗</a>}</article></div>
          <div className="source-origin"><span>Repository</span><strong>{record.repository}</strong><span>Commit</span><code>{record.commit}</code></div></section>
        <section className="detail-section"><div className="detail-head"><div><span className="section-index">02 / EXAMINATION</span><h2>Validator observation</h2></div><span className="mini-note">ATTEMPTS {record.attempts}/3</span></div>
          {record.status==="DECIDED"&&observation?.kind==="EVALUATED"?<div className="assessment-result"><div className="decision-big"><span>Documentary classification</span><h3>{record.decision}</h3><p>This result concerns the two version-pinned documents, not actual runtime behavior.</p></div><div className="classification-grid"><div><span>PRIMARY / {observation.primary}</span><blockquote>{observation.primary_quote||"No decisive quotation supplied."}</blockquote><small>SHA-256: {observation.primary_sha256}</small></div><div><span>OPPOSING / {observation.opposing}</span><blockquote>{observation.opposing_quote||"No decisive quotation supplied."}</blockquote><small>SHA-256: {observation.opposing_sha256}</small></div></div><p className="signed-payload">GitHub signed-payload fingerprint: <code>{observation.signed_payload_sha256}</code></p></div>
          :<div className="unresolved-panel"><span className="unresolved-symbol">◇</span><div><h3>{record.status==="DECIDED"?"Observation readback incomplete":record.status==="EXPIRED_UNRESOLVED"?"Review window expired without a verdict":"No definitive assessment recorded."}</h3><p>{record.status==="DECIDED"?"The canonical decision exists, but its observation readback is incomplete.":recordOutcomeSummary(record)}</p>{hasRetryableDiagnostic(record)&&<div className="historical-diagnostic" role="note"><span>Historical retry diagnostic</span><code>{record.last_reason}</code><p>Recorded by {shortAddress(record.last_attempt_by)} on {dateLabel(record.last_attempt_at)}. This is execution history, not a semantic verdict.</p></div>}</div></div>}
        </section>
        <section className="detail-section"><div className="detail-head"><div><span className="section-index">03 / ACTIONS</span><h2>Available next step</h2></div><span className="mini-note">ON-CHAIN AUTHORIZATION</span></div>
          {record.status==="AWAITING_REVIEWER"&&!expired&&reviewer?<div className="response-form"><h3>Add a contrary source</h3><p>Choose another file from the same repository and exact commit. Your response is immutable once submitted.</p><label>Opposing source path<input value={counterPath} onChange={e=>setCounterPath(e.target.value)} placeholder="docs/limitations.md"/></label><label>Context note (optional)<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={300} rows={3} placeholder="A factual note for the evaluators. The source itself remains authoritative."/></label><button className="solid-button" disabled={busy} onClick={()=>void respond()}>Submit source ↗</button><button className="outline-button" disabled={busy} onClick={()=>void execute("decline",[BigInt(id)])}>Decline invitation</button></div>:null}
          {record.status==="AWAITING_REVIEWER"&&!expired&&proposer?<button className="outline-button" disabled={busy} onClick={()=>void execute("withdraw",[BigInt(id)])}>Withdraw unanswered question</button>:null}
          {eligible?<div className="action-panel"><h3>Request independent examination</h3><p>Validators retrieve and assess the exact file bytes. A failed provider read does not settle the question.</p><button className="solid-button" disabled={busy} onClick={()=>void execute("evaluate",[BigInt(id),evaluationNonce()])}>Request assessment ↗</button></div>:null}
          {record.status==="READY_FOR_REVIEW"&&!eligible&&!expired?<p className="quiet-panel">An earlier attempt is cooling down, or the assessment budget has been exhausted. Refresh the record to see the current state.</p>:null}
          {expired?<div className="action-panel"><h3>Expiration is now permitted.</h3><p>Close this unanswered or unresolved question. Expiration does not imply support or contradiction.</p><button className="outline-button" disabled={busy} onClick={()=>void execute("close_expired",[BigInt(id)])}>Record expiration ↗</button></div>:null}
          {!session?<div className="quiet-panel">Connect your wallet from the header if you need to submit an authorized action. Public records can be inspected without connecting.</div>:session.chainId!==CHAIN_ID?<button className="outline-button" onClick={()=>void switchNetwork()}>Switch to Studionet 61999</button>:null}
          {actionError&&<p className="inline-error" role="alert">{actionError}</p>}{actionSuccess&&<p className="inline-success" role="status">{actionSuccess}</p>}
          <button className="text-refresh" onClick={()=>void load()} disabled={loading}>↻ Refresh canonical state</button>
        </section>
      </div><aside className="record-detail-side"><div className="identity-sidebar"><div className="eyebrow">Participant wallets</div><div><span>Proposer</span><code>{record.proposer}</code></div><div><span>Designated reviewer</span><code>{record.reviewer}</code></div><p>Neither wallet is an authenticated legal or publisher identity. The reviewer is nominated, not independently appointed.</p></div><TransactionDesk compact/></aside></div>
    </>}
  </div>
}
