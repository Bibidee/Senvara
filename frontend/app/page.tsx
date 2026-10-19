import Link from "next/link";
import { TransactionDesk } from "@/components/TransactionDesk";

export default function Home(){return <>
  <section className="landing-hero wrap"><div className="hero-copy">
    <div className="eyebrow"><span className="eyebrow-line"/>Evidence as a public record · GenLayer</div>
    <h1>Make room for <span className="serif-emphasis">what&apos;s</span> <span className="highlight-word">actually</span> true.</h1>
    <p className="hero-lede">A claim may sound convincing. A source may look official. Senvara asks a narrower question: what do the exact, versioned documents establish when independent validators examine them?</p>
    <div className="hero-ctas"><Link prefetch={false} className="solid-button" href="/workbench/">Start a review <span>↗</span></Link><Link prefetch={false} className="underlined-link" href="/open/">Browse public records <span>↗</span></Link></div>
    <div className="hero-meta"><span><strong>01</strong>One frozen assertion</span><span><strong>02</strong>Two distinct source files</span><span><strong>03</strong>One independently assessed result</span></div>
  </div><aside className="illustration-stage" aria-label="Illustration of two documents being examined together">
    <div className="stage-grid"/><div className="orbit orbit-one"/><div className="orbit orbit-two"/>
    <div className="art-top">SENVARA <span> / DOCUMENT LAB 001</span></div>
    <div className="art-paper art-paper-back"><div className="art-paper-tag">COUNTER SOURCE</div><div className="art-lines"><i/><i/><i/><i/></div><span className="art-paper-icon">↗</span></div>
    <div className="art-paper art-paper-front"><div className="art-paper-tag">PRIMARY SOURCE</div><strong>Does the record<br/>support the claim?</strong><div className="art-lines"><i/><i/><i/></div><div className="art-lens"><span>?</span></div></div>
    <div className="art-bottom"><span>FREEZE THE SOURCES</span><span>REVIEW THE EVIDENCE</span></div>
  </aside></section>
  <section className="approach-panel"><div className="wrap approach-inner"><div><div className="eyebrow">A better question</div><h2>A verdict isn&apos;t useful without a <span>verifiable trail.</span></h2></div><p>Senvara freezes a precise assertion and public source revision. A separately named reviewer can add a counter-source from the same version. GenLayer validators then retrieve both sources independently and judge their documentary meaning. If the sources cannot be authenticated or read, the result stays unresolved.</p></div></section>
  <section className="process-section wrap"><div className="section-intro"><span className="eyebrow">The method / in three moves</span><h2>Nothing hidden<br/><em>between the lines.</em></h2></div><div className="process-grid">
    <article className="process-card"><span className="process-index">01 / PROPOSE</span><div className="process-art art-propose">⌁</div><h3>Define the exact claim.</h3><p>Name a public repository, its complete commit, an evidence file and one reviewer. The question cannot be rewritten once recorded.</p></article>
    <article className="process-card"><span className="process-index">02 / RESPOND</span><div className="process-art art-respond">⇄</div><h3>Put sources in context.</h3><p>The invited reviewer supplies a different file from that same pinned revision. Both sides stay attributable to wallet addresses, not asserted real-world identities.</p></article>
    <article className="process-card"><span className="process-index">03 / EXAMINE</span><div className="process-art art-examine">✳</div><h3>Review without a referee.</h3><p>Independent validators assess what the documentation supports, contradicts or leaves unclear. Failed retrieval never becomes a manufactured verdict.</p></article>
  </div></section>
  <section className="home-bottom wrap"><div className="bottom-panel"><div className="eyebrow">An explicit boundary</div><h2>A review of documents.<br/><span>Not a security certification.</span></h2><p>A signed GitHub commit and verifiable file identity establish the documentary record, not that any shipped application works, is safe or was written by the wallet submitting the case.</p><Link prefetch={false} className="underlined-link" href="/method/">Explore our trust boundaries ↗</Link></div><TransactionDesk compact/></section>
</>}
