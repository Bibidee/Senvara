# Verification Matrix

The checklist uses **executed** only for checks actually run against the current source in the local working environment. Mocked, source-only and hosted evidence remain distinct.

| Area | Local evidence | Live or full test required | Status |
|---|---|---|---|
| Proposal roles, full SHA and identity parsing | Python model tests + 8-test GenVM Direct Mode suite | 61999 lifecycle | Local tests executed; hosted open |
| Immutable response and cancellation | Python model tests | Wallet A/B replay on chain | Local tests executed |
| Duplicate fingerprint and pagination | Python model tests | Chain source/storage compatibility | Local tests executed |
| Provider outage, unsigned revision, blob mismatch | Python mocks | Real GitHub provider 403/404/429 and signed revision | Local tests executed |
| Independent validator and semantic vector | Python leader/validator model + Direct Mode fixtures | Live consensus | Local tests executed; hosted open |
| Judgment availability remediation | Candidate 0.2.0 Direct Mode: realistic text JSON, malformed-output/citation diagnostics, exact-source citation checks and quote-insensitive decision equivalence | Fresh hosted 0.2.0 lifecycle and conclusive finalized result | Candidate deployment/source/ABI verified; hosted conclusive result open |
| Malicious quote, disagreement, cooldown and exhaustion | Python mocks | GenVM hosted negative fixtures, deadline transitions | Local tests executed |
| TypeScript proposal, wallet primitives and receipt reconciliation | Node tests after TypeScript transpile | Full TS compilation and browser E2E | Local tests executed |
| Wallet provider selection and direct selected-provider send | Node transaction mock plus local Playwright fake EIP-6963 providers | Real MetaMask and Rabby extension sessions, including approval and selected-provider sends | Local fake-provider coverage; real extension evidence is not part of this branch's local run |
| Unknown transaction, late finality and deduplication | Node transaction mock | Hosted finality and provider failure tests | Local mock executed; hosted not executed |
| Next.js static export build | Dependency-aware production build | Hosted deployment smoke test | Local build executed |
| Mobile and accessibility | Responsive source review + Playwright harness at 390/1440px | Playwright + axe + keyboard + manual mobile | Local route, keyboard, fake-provider and RPC-recovery checks are executed; no axe package is wired into the current harness, and manual mobile review remains open |
| Studionet deployment/source parity | Historical 0.1.0 and candidate 0.2.0 finalized receipts, exact decoded source comparison, schema/version readback | Two-wallet application lifecycle, explorer-linked evidence and hosted record transactions | Both deployments verified; candidate Wallet A/B lifecycle and conclusive judgment remain open |
| GitHub Actions exact-head CI | Workflow source added and locally inspected | Hosted workflow on exact pushed commit | **PASS:** push run `39346268942` and PR run `39346261337` on `4189258e3dff1df7a14347dd43b29133e78690b4`; [push run](https://github.com/Bibidee/Senvara/actions/runs/39346268942) |
| Dependency and artifact reproducibility | npm lockfiles, production audit and static build | Hosted exact-head reproducibility and mapping of prior full-install findings | Hosted production audit/build passed; prior five-high full-install report was not reproduced in this environment and remains a mapping item |

## Negative-path test obligations

Run hosted tests for malformed GitHub JSON (including duplicate keys), invalid repository identity, missing path, blob hash mismatch, unsigned commits, dynamically rate-limited public APIs, quote hallucination, prompt injection, semantic disagreement, invalid nested source paths, truncated model output, duplicate creation, unknown execution status, equal reviewer/proposer accounts, stale transaction attempt, every deadline boundary, callback/order races where applicable and wrong-chain writes.

## Minimum two-wallet hosted demo

1. Fund two disposable Studionet wallets as appropriate for transaction fees only.
2. Proposer creates a new record using an accessible signed public GitHub commit and a short UTF-8 source file.
3. Check transaction was finalized successfully and exact `get_dossier` state matches the submitted fields.
4. Reviewer from the other wallet binds a separate source file, checks finality and canonical state.
5. Participant requests semantic review and records leader/validator consensus, stable hashes and final result.
6. Independently read both source fingerprints, signed-payload fingerprint, judgment categories and decision.
7. Execute a separate inconclusive/provider-unavailable fixture, if provider access permits, without weakening safeguards. **Historical v0.1.0 evidence:** three finalized retryable observations recorded `JUDGMENT_UNAVAILABLE`; the third exhausted the review budget and no false decision was emitted. **Candidate 0.2.0 local evidence:** retryable diagnostics do not consume the semantic budget.
8. Verify unauthorized writes, replay, expiry, reload recovery, wallet switching and mobile UI.
9. Pin source SHA-256, CLI version, exact-head CI URL, deployment address, all transactions and production deployment identity in the release manifest.

The deployment/source readback rows are recorded in `docs/RELEASE_MANIFEST.json` and `docs/CANDIDATE_V020_MANIFEST.json`. The local browser row is executed against a static export with fake providers; hosted preview navigation was previously read-only verified. The historical Wallet A/B lifecycle and exhausted retry-safety fixture remain evidence for v0.1.0 only. A candidate conclusive validator judgment, real MetaMask coverage and the remaining negative-path fixtures remain open.
