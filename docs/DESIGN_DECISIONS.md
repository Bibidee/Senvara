# Design Decisions

## Product mechanics over decorative complexity

The unit of value is a narrow, version-bound question about *public documentation*, not a general claim that a release is safe or compliant. The project repeatedly produces inspectable public records. It does not require a moderator or a database-backed feed.

## Named reviewer instead of open challenge slots

Allowing arbitrary challengers to compete for a fixed number of evidence slots creates first-arrival monopolization and Sybil/denial-of-service risks without an identity mechanism. In the initial version, the proposer instead nominates one wallet. Only that wallet may contribute the second source and only either participant can trigger the bounded semantic assessment. The consequence is explicit: review is paired, not independent arbitration. If the nominated reviewer does not respond, the question expires unanswered rather than self-certifying.

## Two exact files, one commit

Using a shared revision intentionally narrows the claim to one documentary snapshot and removes branches, mutable web pages, cross-host redirection and time-relative comparisons. This is smaller and more auditable than broad open-web research but can miss relevant sources outside the chosen files. Full UTF-8 source contents and their Git blob IDs are verified at evaluation time.

## Signed-only GitHub provenance

The commit's GitHub `verification` metadata must report a verified valid signature, with a signed payload and signature present. This excludes unsigned revisions and requires explicit limitations: the contract consumes GitHub's reported verification, not a locally recomputed signature verification. The policy can restrict participation and is subject to GitHub availability.

## Deterministic result and strict consensus equivalence

The language model cannot submit arbitrary top-level outcomes. It classifies each file in a closed vocabulary, provides an exact in-text decisive quotation, and the contract derives the four possible results. The validator independently refetches and reclassifies. Full agreement is required on documentary fingerprints, signed-payload fingerprint, all classifications, citations and derived result. This is conservative and can reduce liveness when models quote different valid passages; hosted testing must calibrate this boundary before changing it.

## No custody in initial version

Financial bonds would require materially more cross-message, refund, accounting and recipient-delivery assumptions without proving that documentary judgments became more useful. V1 makes no custody promise, has no payable methods and creates no withdrawal state. Participants still pay normal chain transaction fees.

## Static frontend and genuine wallet choice

The browser talks to Studionet directly. EIP-6963 provider discovery is complemented by fallback to delayed `window.ethereum` injection; users deliberately select an extension. A lost or unknown transaction never triggers automatic replay. The tradeoff is conservative recovery friction when a request hash is unknown.

## Deliberately absent

No reputation score, crowdsourced judicial claim, rewards token, centralized search index, subscription notifications, backend cron, off-chain AI verdict, admin override, screenshot-based proof of runtime behavior, arbitrary website URL input, multisource crawler or privileged personal identity verification.
