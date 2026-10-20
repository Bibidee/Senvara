# Release Gates and Documentation Consistency

## Current verdict

**V0.2.0 DEPLOYMENT VERIFIED; RELEASE: BLOCKED.**

The historical 0.1.0 contract is preserved on Studionet 61999. Reviewed 0.2.0 is deployed at `0xF563d381C3ec5BDA61f166Bb1FFf781dE6B81b8C`, with exact decoded source, ABI schema, version and finalized deployment receipt readback recorded in `docs/CANDIDATE_V020_MANIFEST.json`. The frontend is deployed to production at `https://senvara.vercel.app` with the v0.2.0 identity and Studionet configuration. Do not treat deployment receipt or local browser harness as proof of the complete application lifecycle or real wallet behavior.

## Mandatory gates

- [x] Resolve package registry access; install exact declared dependencies and generate complete npm lockfiles.
- [x] Successful `frontend` typecheck, ESLint and production static export.
- [x] Pin local GenLayer CLI 0.39.1; prove the repository-installed binary rather than using any global tool.
- [x] Local GenVM Direct Mode lifecycle and adversarial candidate cases on a supported runtime; candidate GenVM lint/schema validation passes.
- [ ] Independent third-party security review; the implementation audit and disposition are recorded in `docs/AUDIT_REPORT.md`.
- [x] Confirm candidate Studio endpoint browser CORS/direct RPC support for the new ABI, without inserting a proxy. Read-only RPC/schema/version evidence and the hosted candidate write/lifecycle pass on Studionet 61999.
- [x] Candidate Vercel preview is **READY** at [senvara-41ex6g1wy-bibidees-projects.vercel.app](https://senvara-41ex6g1wy-bibidees-projects.vercel.app); protected browser route checks pass at 390px and 1440px with no failed requests or console errors. This is a preview-only read/navigation check.
- [x] Deploy explicitly approved contract to Studionet 61999 and record source SHA-256 plus deployed-code readback.
- [x] Generate and verify historical ABI against exact deployed code and version; candidate ABI signatures and frontend identity checks are recorded separately.
- [ ] Complete a fresh candidate two-wallet hosted lifecycle, including a conclusive verdict and live unauthorized/replay/stale-action rejection. **Happy path PASS:** Wallet A proposed, Wallet B responded, and Wallet B evaluated candidate record `#1`; all three finalized transactions and canonical `SUPPORTED` state are recorded in `docs/CANDIDATE_V020_MANIFEST.json`. Unauthorized/replay/stale-action rejection remains open. **Historical partial pass:** Wallet A/B proposal and response, three finalized retryable evaluations, canonical exhausted-state readback and no-false-verdict handling are verified for 0.1.0.
- [ ] Complete real MetaMask and Rabby user journeys including simultaneous extensions, rejection, disconnect, switching, reboot/reload and unknown receipt recovery. **Rabby reload recovery now passes for the tested flow:** after one explicit reconnect, two consecutive production reloads silently restored Wallet B and preserved the canonical record. MetaMask was not installed in the tested browser, and reboot, unknown-receipt and hosted negative-write coverage remain open.
- [ ] Complete the Playwright browser sweep across all routes at desktop, tablet and mobile widths with axe and manual mobile review. Local Chromium route, keyboard, responsive, fake-provider and RPC-recovery checks are the current evidence; axe integration and manual mobile review remain open.
- [x] Resolve repeated judgment unavailability with a conclusive hosted result. Candidate record `#1` on 0.2.0 finalized `SUPPORTED` with `primary=SUPPORTS`, `opposing=SUPPORTS`, `attempts=1`, bounded diagnostics and verified source fingerprints. Historical v0.1.0 remains preserved with its exhausted `JUDGMENT_UNAVAILABLE` record.
- [x] Local production dependency vulnerability scan (0 vulnerabilities) and documented residual limitations. Full repository install audit is reproducible with six transitive development-tool findings in the pinned GenLayer CLI; the forced fix would downgrade the required CLI and was not applied.
- [x] Hosted exact-head CI and hosted production dependency scan: [push run 39405716042](https://github.com/Bibidee/Senvara/actions/runs/39405716042) on commit `b428ba6549abaf970139465740bffb52f385fcdb`. This certifies branch checks, not a live semantic judgment.
- [x] Documentation/prod parity of source, ABI, contract ID, chain 61999, version, frontend environment and CI manifest; the executed lifecycle and transaction matrix are recorded, while conclusive and negative-path gates remain open.
- [x] Cleanup scan for unintentional cross-project identifiers, placeholder deployment values, dangling TODOs and stale candidate/historical identity claims.

## Evidence labels

- **Source verified:** locally inspected or parsed source code only.
- **Model-tested:** mock dependencies exercised, but actual GenVM/SDK/browser runtime not involved.
- **GenVM-tested:** actual Direct Mode recorded with runtime version.
- **Hosted verified:** real finality and canonical readback linked by transaction hashes.
- **Independently audited:** report prepared by a reviewer independent from implementation.
- **Unverified:** reasonable design expectation without sufficient execution evidence.

A green lint/build pipeline by itself does not justify upgrading a source-level result to hosted verified.
