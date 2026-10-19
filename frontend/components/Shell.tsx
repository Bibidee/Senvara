"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { WalletControl } from "./WalletControl";
import { CONFIGURED } from "@/lib/constants";

const routes=[{href:"/open/",title:"Observatory"},{href:"/workbench/",title:"Start a review"},{href:"/method/",title:"How it works"}];
export function Shell({children}:{children:ReactNode}){
  const path=usePathname();const [mobile,setMobile]=useState(false);
  return <div className="app-shell"><header className="site-header">
    <Link prefetch={false} href="/" className="identity" aria-label="Senvara home"><span className="identity-symbol" aria-hidden>✳</span><span className="identity-name">senvara<span className="identity-period">.</span></span></Link>
    <nav className="desktop-nav" aria-label="Primary navigation">{routes.map(link=><Link prefetch={false} key={link.href} href={link.href} className={path===link.href.slice(0,-1)?"active":""}>{link.title}</Link>)}</nav>
    <div className="header-actions"><span className="chain-label"><span className="chain-dot"/>Studionet <b>61999</b></span><WalletControl/><button className="mobile-toggle" onClick={()=>setMobile(v=>!v)} aria-expanded={mobile} aria-controls="mobile-navigation" aria-label="Toggle navigation">☰</button></div>
    {mobile&&<nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">{routes.map(link=><Link prefetch={false} key={link.href} href={link.href} onClick={()=>setMobile(false)}>{link.title} ↗</Link>)}</nav>}
  </header>
  {!CONFIGURED&&<div className="preview-notice" role="status"><span className="preview-dot"/> Predeployment preview. A canonical contract address must be configured before live reads or writes.</div>}
  <main>{children}</main>
  <footer className="site-footer"><div><Link prefetch={false} href="/" className="footer-brand">senvara.</Link><p>Public documentary evidence, independently reviewed.</p></div><div><span>CHAIN 61999 / GENLAYER STUDIONET</span><span>NO CUSTODY · NO ADMINISTRATOR VERDICTS</span></div><div><Link prefetch={false} href="/method/">Read the verification method ↗</Link><span>Review outcomes describe documents, not deployed software.</span></div></footer></div>;
}
