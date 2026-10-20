# Release Gates and Documentation Consistency

## Current verdict

**LOCAL IMPLEMENTATION VERIFIED; RELEASE: BLOCKED.**

The historical 0.1.0 contract is deployed to Studionet 61999 and its exact source, ABI schema, version and finalized deployment receipt have been read back. The frontend defaults to that exact identity. Candidate 0.2.0 is separately fingerprinted and remains undeployed. A protected Vercel preview exists from earlier work; no production promotion was made. Do not treat the deployment receipt or local browser harness as proof of the complete application lifecycle or real wallet behavior.

## Mandatory gates

- [x] Resolve package registry access; install exact declared dependencies and generate complete npm lockfiles.
- [x] Successful `frontend` typecheck, ESLint and production static export.
- [x] Pin local GenLayer CLI 0.39.1; prove the repository-installed binary rather than using any global tool.
- [x] Local GenVM Direct Mode lifecycle and adversarial candidate cases on a supported runtime; candidate GenVM lint/schema validation passes.
- [ ] Independent third-party security review; the implementation audit and disposition are recorded in `docs/AUDIT_REPORT.md`.
- [ ] Confirm candidate Studio endpoint browser CORS/direct RPC support for the new ABI, without inserting a proxy. Historical read/write evidence applies only to deployed 0.1.0.
- [x] Deploy explicitly approved contract to Studionet 61999 and record source SHA-256 plus deployed-code readback.
- [x] Generate and verify historical ABI against exact deployed code and version; candidate ABI signatures and frontend identity checks are recorded separately.
- [ ] Complete a fresh candidate two-wallet hosted lifecycle, including a conclusive verdict and live unauthorized/replay/stale-action rejection. **Historical partial pass:** Wallet A/B proposal and response, three finalized retryable evaluations, canonical exhausted-state readback and no-false-verdict handling are verified for 0.1.0.
- [ ] Complete real MetaMask and Rabby user journeys including simultaneous extensions, rejection, disconnect, switching, reboot/reload and unknown receipt recovery. The local harness uses fake providers; real extension evidence is outstanding for this branch.
- [ ] Complete the Playwright browser sweep across all routes at desktop, tablet and mobile widths with axe and manual mobile review. Local Chromium route, keyboard, responsive, fake-provider and RPC-recovery checks are the current evidence; axe integration and manual mobile review remain open.
- [ ] Resolve repeated judgment unavailability with a conclusive hosted result. **Candidate prepared:** 0.2.0 Direct Mode and candidate lint pass with bounded diagnostics, citation-aware equivalence and non-exhausting retry diagnostics; the deployed 0.1.0 contract remains unchanged and no replacement deployment was made.
- [x] Local production dependency vulnerability scan (0 vulnerabilities) and documented residual limitations. Full repository install audit is reproducible with six transitive development-tool findings in the pinned GenLayer CLI; the forced fix would downgrade the required CLI and was not applied.
- [x] Hosted exact-head CI and hosted production dependency scan for this remediation branch: [push run 39345753441](https://github.com/Bibidee/Senvara/actions/runs/39345753441) and [PR run 39345749672](https://github.com/Bibidee/Senvara/actions/runs/39345749672), both on commit `478f098aa002c6abef0b655eb11bbbd207ec5955`. This certifies the branch checks, not a deployed candidate or live semantic judgment.
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
