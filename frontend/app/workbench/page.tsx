"use client";
import { useState } from "react";
import Link from "next/link";
import { CHAIN_ID, CONFIGURED } from "@/lib/constants";
import { prepareProposal } from "@/lib/validation";
import { sendAction } from "@/lib/transactions";
import { useWallet } from "@/components/WalletContext";
import { TransactionDesk } from "@/components/TransactionDesk";

export default function Workbench(){
  const {session,assertCurrent,switchNetwork}=useWallet();
  const [claim,setClaim]=useState("");const[repo,setRepo]=useState("");const[commit,setCommit]=useState("");
  const [primary,setPrimary]=useState("");const[reviewer,setReviewer]=useState("");const[days,setDays]=useState(3);
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
  const submit=async()=>{
    setError("");setSuccess("");
    try{
      const {args}=prepareProposal({assertion:claim,repository:repo,commit,primary,reviewer,days});
      if(!session)throw new Error("Connect a wallet from the top-right menu to sign a new review.");
      if(reviewer.trim().toLowerCase()===session.account)throw new Error("The invited reviewer must use a different wallet.");
      if(session.chainId!==CHAIN_ID)throw new Error("Switch your wallet to Studionet 61999 first.");
      if(!CONFIGURED)throw new Error("The reviewed contract address has not been configured yet.");
      setBusy(true);
      const tx=await sendAction(session,assertCurrent,"propose",args);
      setSuccess(`Submitted ${tx.hash}. Your review will appear in the public observatory after finality and canonical verification.`);
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not create the review.");}
    finally{setBusy(false);}
  };
  return <div className="inner-page wrap"><div className="page-heading"><div className="eyebrow">Workbench / start with a question</div><h1>A claim worth <em>examining.</em></h1><p>Record a narrowly scoped documentary claim and invite a second wallet to offer contrary evidence. No wallet signature is requested until you submit.</p></div>
    <div className="workbench-grid"><section className="form-sheet"><div className="sheet-header"><div><span className="sheet-step">01</span><h2>Prepare the question</h2></div><span className="sheet-meta">All fields are frozen on submission</span></div>
      <div className="form-fields"><label>Precise documentary claim <span>{claim.length}/420</span><textarea value={claim} maxLength={420} rows={4} onChange={e=>setClaim(e.target.value)} placeholder="Example: The release documentation explicitly describes how a failed operation can be retried without duplicating a write."/><small>Use a claim about the written materials, not an assertion that deployed code is secure.</small></label>
      <div className="field-pair"><label>GitHub repository <input value={repo} onChange={e=>setRepo(e.target.value)} placeholder="organization/repository" autoComplete="off"/></label><label>Full revision SHA <input value={commit} onChange={e=>setCommit(e.target.value)} placeholder="40 hexadecimal characters" maxLength={40} autoComplete="off"/></label></div>
      <label>Primary evidence path <input value={primary} onChange={e=>setPrimary(e.target.value)} placeholder="docs/capability.md"/><small>A public UTF-8 file no larger than 8 KiB at the specified commit.</small></label>
      <div className="field-pair"><label>Reviewer wallet address <input value={reviewer} onChange={e=>setReviewer(e.target.value)} placeholder="0x…" maxLength={42} autoComplete="off"/></label><label>Response window <select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={1}>1 day</option><option value={3}>3 days</option><option value={7}>7 days</option><option value={14}>14 days</option></select></label></div>
      <div className="form-consent"><strong>Before you sign</strong><p>The record binds your claim, repository, commit and reviewer. Your wallet does not prove you own the repository. The invited wallet is not an authenticated independent auditor.</p></div>
      {!session?<div className="form-wallet-message">Connect a wallet using the button in the header before submitting.</div>:session.chainId!==CHAIN_ID?<button className="outline-button" onClick={()=>void switchNetwork()}>Switch to Studionet 61999</button>:null}
      <button className="solid-button full submit-button" onClick={()=>void submit()} disabled={busy||!CONFIGURED}>{busy?"Waiting for wallet…":"Record the question ↗"}</button>
      {error&&<p className="inline-error" role="alert">{error}</p>}{success&&<p className="inline-success" role="status">{success}</p>}
      </div></section>
      <aside className="workbench-aside"><div className="preview-sheet"><div className="eyebrow">Live composition / unsigned</div><div className="preview-topline"><span>DOCUMENT QUESTION</span><span>00 / DRAFT</span></div><h3>{claim||"Your evidence question takes shape here."}</h3><div className="preview-divider"/><div className="preview-row"><span>Proposed by</span><strong>{session?.account||"Wallet not connected"}</strong></div><div className="preview-row"><span>Revision</span><strong>{commit?commit.slice(0,12)+"…":"No commit selected"}</strong></div><div className="preview-row"><span>Source A</span><strong>{primary||"Awaiting path"}</strong></div><div className="preview-row"><span>Source B</span><strong>Added by reviewer</strong></div><div className="preview-stamp">PROVISIONAL / NOT PUBLISHED</div></div>
        <TransactionDesk compact/><Link prefetch={false} className="aside-link" href="/method/">Read the evidence admissibility policy ↗</Link></aside></div>
  </div>;
}
