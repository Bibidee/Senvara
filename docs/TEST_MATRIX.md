# Verification Matrix

The checklist uses **executed** only for checks actually run against the current source in the local working environment. Mocked, source-only and hosted evidence remain distinct.

| Area | Local evidence | Live or full test required | Status |
|---|---|---|---|
| Proposal roles, full SHA and identity parsing | Python model tests + 5-test GenVM Direct Mode suite | 61999 lifecycle | Local tests executed; hosted open |
| Immutable response and cancellation | Python model tests | Wallet A/B replay on chain | Local tests executed |
| Duplicate fingerprint and pagination | Python model tests | Chain source/storage compatibility | Local tests executed |
| Provider outage, unsigned revision, blob mismatch | Python mocks | Real GitHub provider 403/404/429 and signed revision | Local tests executed |
| Independent validator and semantic vector | Python leader/validator model + Direct Mode fixtures | Live consensus | Local tests executed; hosted open |
| Malicious quote, disagreement, cooldown and exhaustion | Python mocks | GenVM hosted negative fixtures, deadline transitions | Local tests executed |
| TypeScript proposal, wallet primitives and receipt reconciliation | Node tests after TypeScript transpile | Full TS compilation and browser E2E | Local tests executed |
| Wallet provider selection and direct selected-provider send | Node transaction mock plus local Playwright fake EIP-6963 providers | Real MetaMask and Rabby extension sessions, including approval and selected-provider sends | Real Rabby connection, app disconnect/reconnect, injected selection, wallet switching and signed selected-provider sends passed on 61999; MetaMask unavailable |
| Unknown transaction, late finality and deduplication | Node transaction mock | Hosted finality and provider failure tests | Local mock executed; hosted not executed |
| Next.js static export build | Dependency-aware production build | Hosted deployment smoke test | Local build executed |
| Mobile and accessibility | Responsive source review + Playwright harness | Playwright + axe + keyboard + manual mobile | Local Playwright/keyboard/accessibility assertions passed; hosted preview routes read in Brave; axe-specific and manual mobile open |
| Studionet deployment/source parity | Finalized deployment receipt, fetched exact source comparison, schema/version readback | Two-wallet application lifecycle, explorer-linked evidence and hosted record transactions | Deployment/source readback and Wallet A/B lifecycle executed; three finalized `JUDGMENT_UNAVAILABLE` evaluations exhausted the retry budget without a false decision |
| GitHub Actions exact-head CI | Workflow source added | Hosted workflow on exact merge SHA | Runs 9 and 10 passed on the final code/documentation heads; only GitHub runner/action deprecation notices were emitted |
| Dependency and artifact reproducibility | npm lockfiles, production audit and static build | Hosted exact-head reproducibility | Local executed; hosted not executed |

## Negative-path test obligations

Run hosted tests for malformed GitHub JSON (including duplicate keys), invalid repository identity, missing path, blob hash mismatch, unsigned commits, dynamically rate-limited public APIs, quote hallucination, prompt injection, semantic disagreement, invalid nested source paths, truncated model output, duplicate creation, unknown execution status, equal reviewer/proposer accounts, stale transaction attempt, every deadline boundary, callback/order races where applicable and wrong-chain writes.

## Minimum two-wallet hosted demo

1. Fund two disposable Studionet wallets as appropriate for transaction fees only.
2. Proposer creates a new record using an accessible signed public GitHub commit and a short UTF-8 source file.
3. Check transaction was finalized successfully and exact `get_dossier` state matches the submitted fields.
4. Reviewer from the other wallet binds a separate source file, checks finality and canonical state.
5. Participant requests semantic review and records leader/validator consensus, stable hashes and final result.
6. Independently read both source fingerprints, signed-payload fingerprint, judgment categories and decision.
7. Execute a separate inconclusive/provider-unavailable fixture, if provider access permits, without weakening safeguards. **Executed live:** three finalized retryable observations recorded `JUDGMENT_UNAVAILABLE`; the third exhausted the review budget and no false decision was emitted.
8. Verify unauthorized writes, replay, expiry, reload recovery, wallet switching and mobile UI.
9. Pin source SHA-256, CLI version, exact-head CI URL, deployment address, all transactions and production deployment identity in the release manifest.

The deployment/source readback row is hosted evidence already recorded in `docs/RELEASE_MANIFEST.json`; the local browser row is executed against the configured static export; hosted preview navigation was read-only verified in a logged-in Brave session; the Wallet A/B lifecycle and exhausted retry-safety fixture are now executed against Studionet. A conclusive validator judgment, real MetaMask coverage and the remaining negative-path fixtures remain open.
