"use client";
import { useState } from "react";
import { useWallet } from "./WalletContext";
import { CHAIN_ID } from "@/lib/constants";
import { shortAddress } from "@/lib/format";

export function WalletControl() {
  const {wallets,session,connecting,error,clearError,connect,disconnect,switchNetwork} = useWallet();
  const [isOpen,setIsOpen]=useState(false);
  const close=()=>{setIsOpen(false);clearError();};
  return <div className="wallet-control">
    <button className={session ? "wallet-pill is-connected" : "wallet-pill"} onClick={()=>setIsOpen(v=>!v)} aria-expanded={isOpen} aria-controls="wallet-popover">
      <span className={session && session.chainId===CHAIN_ID ? "live-dot" : "live-dot offline"}/>
      {session ? shortAddress(session.account) : "Connect wallet"}
      <span className="chevron" aria-hidden>⌄</span>
    </button>
    {isOpen && <div className="wallet-popover" id="wallet-popover" role="region" aria-label="Wallet connection">
      <div className="pop-head"><strong>{session ? "Wallet session" : "Choose a wallet"}</strong><button className="icon-close" onClick={close} aria-label="Close wallet panel">×</button></div>
      {session ? <>
        <p className="wallet-label">{session.name}</p>
        <code className="wallet-address">{session.account}</code>
        <p className={session.chainId===CHAIN_ID?"wallet-good":"wallet-bad"}>{session.chainId===CHAIN_ID?"Connected to Studionet 61999":`Wrong network: ${session.chainId}`}</p>
        {session.chainId!==CHAIN_ID && <button className="solid-button full" onClick={()=>void switchNetwork()}>Switch to Studionet</button>}
        <button className="outline-button full" onClick={()=>{disconnect();close();}}>Disconnect from this app</button>
        <p className="wallet-footnote">Disconnect clears this app&apos;s active session. It does not revoke your wallet extension&apos;s site permissions.</p>
      </> : <>
        <p className="small-copy">Select the extension you want to use. Public records do not require a wallet.</p>
        {wallets.length===0 ? <div className="quiet-panel">No EVM wallet detected. Enable MetaMask, Rabby, or another compatible extension.</div>
          : <div className="wallet-list">{wallets.map(w=><button key={w.id} className="wallet-option" disabled={Boolean(connecting)} onClick={()=>void connect(w.id)}><span className="wallet-avatar">{w.name.slice(0,1).toUpperCase()}</span><span>{w.name}</span><span className="wallet-arrow">{connecting===w.id?"Connecting…":"↗"}</span></button>)}</div>}
      </>}
      {error && <div className="inline-error" role="alert">{error}</div>}
    </div>}
  </div>;
}
