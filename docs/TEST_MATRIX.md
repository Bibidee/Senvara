# Verification Matrix

The checklist uses **executed** only for checks actually run against the current source in the local working environment. Mocked, source-only and hosted evidence remain distinct.

| Area | Local evidence | Live or full test required | Status |
|---|---|---|---|
| Proposal roles, full SHA and identity parsing | Python model tests + 8-test GenVM Direct Mode suite | 61999 lifecycle | Local tests executed; hosted open |
| Immutable response and cancellation | Python model tests | Wallet A/B replay on chain | Local tests executed |
| Duplicate fingerprint and pagination | Python model tests | Chain source/storage compatibility | Local tests executed |
| Provider outage, unsigned revision, blob mismatch | Python mocks | Real GitHub provider 403/404/429 and signed revision | Local tests executed |
| Independent validator and semantic vector | Python leader/validator model + Direct Mode fixtures | Live consensus | Local tests executed; hosted open |
| Judgment availability remediation | Candidate 0.2.0 Direct Mode: realistic text JSON, malformed-output/citation diagnostics, exact-source citation checks and quote-insensitive decision equivalence | Fresh hosted 0.2.0 lifecycle and conclusive finalized result | **Hosted PASS:** record #1 finalized `SUPPORTED`; evaluation `0xa067be9406c12f2d009484a0157c5ba84f3bc70f7ec47ef80cc8baf786c17553` |
| Malicious quote, disagreement, cooldown and exhaustion | Python mocks | GenVM hosted negative fixtures, deadline transitions | Local tests executed |
| TypeScript proposal, wallet primitives and receipt reconciliation | Node tests after TypeScript transpile | Full TS compilation and browser E2E | Local tests executed |
| Wallet provider selection and direct selected-provider send | Node transaction mock plus local Playwright fake EIP-6963 providers, including authorized-session restoration after reload | Real MetaMask and Rabby extension sessions, including approval, selected-provider sends, account switching and reload recovery | **Hosted Rabby partial PASS:** production connection, reconnect, provider selection, selected-provider lifecycle sends, account switching, two consecutive silent reload recoveries and one finalized already-decided rejection verified; MetaMask was unavailable, and reboot, unknown-receipt, unauthorized, exact-replay and stale-action cases remain open |
| Unknown transaction, late finality and deduplication | Node transaction mock | Hosted finality and provider failure tests | Local mock executed; hosted not executed |
| Next.js static export build | Dependency-aware production build | Hosted deployment smoke test | Local build executed |
| Mobile and accessibility | Responsive source review + Playwright harness at 390/1440px with axe-core 4.14.0 | Playwright + axe + keyboard + manual mobile | **Automated PASS:** all five routes at 390px and 1440px have zero axe violations, plus keyboard/focus and overflow checks; tablet-width and manual mobile review remain open |
| Studionet deployment/source parity | Historical 0.1.0 and candidate 0.2.0 finalized receipts, exact decoded source comparison, schema/version readback | Two-wallet application lifecycle, explorer-linked evidence and hosted record transactions | **PASS:** candidate record #1 Wallet A/B lifecycle and conclusive judgment verified on chain |
| GitHub Actions exact-head CI | Workflow source added and locally inspected | Hosted workflow on exact pushed commit | **PASS:** push run `39416229941` on `4be09df8160d7cf62cb2d02fd313085aafff4bd4`; [push run](https://github.com/Bibidee/Senvara/actions/runs/39416229941) |
| Dependency and artifact reproducibility | npm lockfiles, production audit and static build | Hosted exact-head reproducibility and mapping of prior full-install findings | Hosted production audit/build passed; prior five-high full-install report was not reproduced in this environment and remains a mapping item |

## Negative-path test obligations

Run hosted tests for malformed GitHub JSON (including duplicate keys), invalid repository identity, missing path, blob hash mismatch, unsigned commits, dynamically rate-limited public APIs, quote hallucination, prompt injection, semantic disagreement, invalid nested source paths, truncated model output, duplicate creation, unknown execution status, equal reviewer/proposer accounts, stale transaction attempt, every deadline boundary, callback/order races where applicable and wrong-chain writes. The already-decided rejection path is hosted-verified separately: transaction `0x3389e48ec7c91f7021b3445c3580e9dff4ed30f12a83730e55bdab9bf0fca645` finalized with `record not eligible for evaluation`, and record #1 remained `DECIDED / SUPPORTED / attempts=1`. This does not substitute for the still-open unauthorized, exact-replay or stale-action cases.

## Minimum two-wallet hosted demo

1. Fund two disposable Studionet wallets as appropriate for transaction fees only.
2. Proposer creates a new record using an accessible signed public GitHub commit and a short UTF-8 source file.
3. Check transaction was finalized successfully and exact `get_dossier` state matches the submitted fields.
4. Reviewer from the other wallet binds a separate source file, checks finality and canonical state.
5. Participant requests semantic review and records leader/validator consensus, stable hashes and final result.
6. Independently read both source fingerprints, signed-payload fingerprint, judgment categories and decision.
7. Execute a separate inconclusive/provider-unavailable fixture, if provider access permits, without weakening safeguards. **Historical v0.1.0 evidence:** three finalized retryable observations recorded `JUDGMENT_UNAVAILABLE`; the third exhausted the review budget and no false decision was emitted. **Candidate 0.2.0 local evidence:** retryable diagnostics do not consume the semantic budget. A separate hosted unavailable-evidence fixture remains unexecuted.
8. Verify unauthorized writes, replay, expiry, reload recovery, wallet switching and mobile UI.
9. Pin source SHA-256, CLI version, exact-head CI URL, deployment address, all transactions and production deployment identity in the release manifest.

The deployment/source readback rows are recorded in `docs/RELEASE_MANIFEST.json` and `docs/CANDIDATE_V020_MANIFEST.json`. The candidate hosted lifecycle is recorded in the candidate manifest with all three transaction hashes, finality, canonical dossier state and observation fingerprints; the hosted already-decided rejection is recorded with its finalized error result and unchanged post-state. The production deployment is also recorded there. The local browser row is executed against a static export with fake providers; hosted route navigation was previously read-only verified. Real Rabby evidence now covers connection, reconnect, provider selection, the candidate lifecycle sends, account switching, two consecutive silent reload recoveries after an explicit reconnect and the already-decided rejection path. MetaMask coverage, reboot/unknown-receipt recovery, unauthorized/exact-replay/stale-action cases and the remaining negative-path fixtures remain open.
