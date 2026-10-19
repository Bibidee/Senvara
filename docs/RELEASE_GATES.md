# Release Gates and Documentation Consistency

## Current verdict

**LOCAL IMPLEMENTATION VERIFIED; RELEASE: BLOCKED.**

The contract is deployed to Studionet 61999 and its exact source, ABI schema, version and finalized deployment receipt have been read back. The frontend is configured for that address and a protected Vercel preview is `READY`; no production promotion was made. Do not treat the deployment receipt or local browser harness as proof of the complete application lifecycle or real wallet behavior.

## Mandatory gates

- [x] Resolve package registry access; install exact declared dependencies and generate complete npm lockfiles.
- [x] Successful `frontend` typecheck, ESLint and production static export.
- [x] Pin local GenLayer CLI 0.39.1; prove the repository-installed binary rather than using any global tool.
- [x] Local GenVM Direct Mode lifecycle and adversarial cases on a supported runtime; GenVM lint remains open.
- [ ] Independent third-party security review; the implementation audit and disposition are recorded in `docs/AUDIT_REPORT.md`.
- [x] Confirm Studio endpoint browser CORS/direct RPC support for read and write integration, without inserting a proxy; hosted browser reads and signed Studionet writes succeeded.
- [x] Deploy explicitly approved contract to Studionet 61999 and record source SHA-256 plus deployed-code readback.
- [x] Generate and verify current ABI against exact code and version; frontend canonical preview configuration is recorded.
- [ ] Complete two-wallet hosted lifecycle, including a conclusive verdict and live unauthorized/replay/stale-action rejection. **Partial pass:** Wallet A/B proposal and response, two finalized retryable evaluations, canonical readback and no-false-verdict handling are verified.
- [ ] Complete real MetaMask and Rabby user journeys including simultaneous extensions, rejection, disconnect, switching, reboot/reload and unknown receipt recovery. **Partial pass:** Rabby connection, switching, disconnect/reconnect, injected selection and signed sends passed; MetaMask and several negative wallet paths remain unavailable.
- [ ] Complete the Playwright browser sweep across all routes at desktop, tablet and mobile widths with axe and manual mobile review. **Partial pass:** local Chromium, keyboard, accessibility, responsive and RPC-recovery assertions passed; axe-specific and manual mobile review remain open.
- [x] Local production dependency vulnerability scan (0 vulnerabilities) and documented residual limitations.
- [x] Hosted exact-head CI and hosted production dependency scan (GitHub Actions runs 8, 9 and 10 passed).
- [x] Documentation/prod parity of source, ABI, contract ID, chain 61999, version, frontend environment and CI manifest; the executed lifecycle and transaction matrix are recorded, while conclusive and negative-path gates remain open.
- [x] Cleanup scan for unintentional cross-project identifiers, placeholder deployment values, dangling TODOs and unverified security claims.

## Evidence labels

- **Source verified:** locally inspected or parsed source code only.
- **Model-tested:** mock dependencies exercised, but actual GenVM/SDK/browser runtime not involved.
- **GenVM-tested:** actual Direct Mode recorded with runtime version.
- **Hosted verified:** real finality and canonical readback linked by transaction hashes.
- **Independently audited:** report prepared by a reviewer independent from implementation.
- **Unverified:** reasonable design expectation without sufficient execution evidence.

A green lint/build pipeline by itself does not justify upgrading a source-level result to hosted verified.
