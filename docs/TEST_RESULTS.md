# Senvara Verification Record

**Date:** 2026-10-20
**Build state:** v0.2.0 remediation deployed and source/ABI verified; historical 0.1.0 preserved; release blocked
**Network target:** GenLayer Studionet 61999 exclusively

## Executed locally on the remediation branch

| Command | Result | Evidence boundary |
|---|---|---|
| `npx --no-install genlayer --version` | **0.39.1** | Repository-local CLI resolution; no hosted transaction |
| `node scripts/run-python.cjs -m unittest discover -s tests -p 'test_*.py' -v` | **35/35 passed** | Python model and candidate behavior tests; mocked GitHub/model/GenLayer dependencies |
| `python scripts/run-direct-pytest.py tests/test_direct_genvm.py -q` | **8/8 passed** | Actual installed GenVM Direct Mode under isolated Python 3.12; 5 historical compatibility tests plus 3 candidate tests. The runner does not execute hosted `run_nondet_unsafe` consensus. |
| `genvm-lint check contracts/senvara_v02.py --json` | **PASS** | GenVM linter 0.11.0; 3 checks and 11 public methods validated |
| `npm run test:client` | **28/28 passed** | Transpiled client/transaction logic with mocked SDK/provider/RPC, including candidate dossier states, retryable finality, cooldown, nonce/actor mismatch, stale writes and expiration transitions; not a real wallet or chain |
| `npm run check:source` | **PASS** | Historical source integrity and backendless/configuration guards |
| `npm run verify:deployment` | **PASS** | Historical address, chain, RPC, version, source hash/size and manifest parity |
| `npm run verify:candidate` | **PASS** | Candidate 0.2.0 source hash/size, ABI markers, frontend identity and historical preservation |
| `node scripts/verify-deployed-v020.cjs` | **PASS** | Read-only Studionet receipt, five validator votes, GenVM execution success, decoded exact source, ABI schema and historical identity manifest |
| `npm --prefix frontend run typecheck` | **PASS** | Dependency-aware TypeScript check |
| `npm --prefix frontend run lint` | **PASS** | ESLint core, React/hooks and JSX accessibility rules |
| `npm --prefix frontend run build` | **PASS** | Next.js 16.4.2 Webpack static export; 7 routes prerendered |
| `npm run test:browser` | **PASS** | Fresh static export on Chromium; routes, 390/1440px responsive layout, keyboard traversal, RPC retry recovery, fake EIP-6963 provider discovery/rejection/network switching, account changes and passive authorized-session restoration after reload. It never signs or broadcasts. |
| Protected Vercel candidate preview browser sweep | **PASS** | Deployment `dpl_D5ZZ7D8JgTugswyhWWxQVLWqrGoU`; `/`, `/method/`, `/open/`, `/workbench/` at 390x844 and 1440x900; no failed requests or console errors. [Preview](https://senvara-41ex6g1wy-bibidees-projects.vercel.app) |
| `npm audit --omit=dev --audit-level=high` (frontend) | **PASS** | Production dependency tree reported 0 vulnerabilities |
| `npm audit --omit=dev --audit-level=high` (repository) | **PASS** | Production dependency tree reported 0 vulnerabilities |
| `npm audit --audit-level=high` (repository full install) | **6 findings; release limitation documented** | Four moderate and two critical development-tool findings are transitive through the pinned GenLayer CLI; the forced npm fix would replace the required CLI with an incompatible `0.0.35` major downgrade |
| GitHub Actions `Source quality` run `39402924924` | **PASS** | Linux runner verified exact commit `4fd08b81bdd6b8280042cd9426e1bfaccd85cf56`; Direct Mode, GenVM lint, production audit, typecheck, lint, static build, Chromium `--with-deps`, browser smoke and client tests all passed. [Push run](https://github.com/Bibidee/Senvara/actions/runs/39402924924) |

## Candidate remediation evidence

| Case | Result |
|---|---|
| Realistic JSON text with one permitted fenced response | **PASS** |
| Malformed output | **PASS; `JUDGMENT_MALFORMED_OUTPUT`** |
| Invalid or irrelevant citation | **PASS; `JUDGMENT_CITATION_INVALID`** |
| Provider/provenance/source retrieval categories | **PASS; bounded and distinct** |
| Different valid quote spans with same classifications | **PASS; accepted by candidate equivalence** |
| Conflicting classifications or source fingerprints | **PASS; rejected without state write** |
| Retryable diagnostic accounting | **PASS; nonce/cooldown recorded, semantic `attempts` remains 0** |
| Conclusive semantic fixture | **PASS locally; candidate reaches `DECIDED`/`SUPPORTED` in Direct Mode** |
| Hosted conclusive validator judgment | **PASS;** candidate record `#1` finalized with `SUPPORTED` after Wallet A proposal, Wallet B response and Wallet B evaluation; all three transactions were reconciled to canonical state |

The conclusive fixture is an actual candidate Direct Mode execution with model-like JSON text and literal source excerpts. It is not a hosted Studionet result and does not prove external LLM/provider reliability.

### Hosted candidate lifecycle (Studionet 61999)

| Step | Transaction | Final state |
|---|---|---|
| Wallet A proposes | `0x003cb9d95ca902ddb23b18360abbaf9e7ef13d617b7c93f838e3361d97f08b71` | `FINALIZED`, `MAJORITY_AGREE`; dossier `#1` `AWAITING_REVIEWER` |
| Wallet B responds | `0x8d742581322cb6ec5561d63c8d4777df4064aa56b53c4f23023551d8c61c3e8f` | `FINALIZED`, `MAJORITY_AGREE`; dossier `#1` `READY_FOR_REVIEW` |
| Wallet B evaluates | `0xa067be9406c12f2d009484a0157c5ba84f3bc70f7ec47ef80cc8baf786c17553` | `FINALIZED`, `MAJORITY_AGREE`; dossier `#1` `DECIDED` / `SUPPORTED` |

Canonical observation readback: `kind=EVALUATED`, `primary=SUPPORTS`, `opposing=SUPPORTS`, `attempts=1`, `last_attempt_by=0xff203bb65942f50cb81a8af98c5f5bd9d8a79b54`, `last_reason=""`, nonce fingerprint `73b2202c15b98b4b448c096ea9d5dca2c5055ccf81bf0fe4d1ef13b7d4b345e6`, signed-payload fingerprint `c97518376d4714921d633ec60cdca2f7a0cbf520f646d1c34c1e84814f280927`. The production record page displayed `DECISION RECORDED / SUPPORTED` and marked all three transactions verified.

## Historical Studionet evidence (v0.1.0; unchanged)

| Check | Result | Evidence boundary |
|---|---|---|
| Contract deployment | **FINALIZED** | `0x011be7340538a7279ffd600408218cb7736a375031dd52c0d06e975edb3fa02d`; one consensus round, 5/5 validator votes `AGREE` |
| Deployed source readback | **PASS; exact SHA-256 match** | 19,552 bytes; `33385d0283d67cd7c13f0cdafe79ba06c3466a20a35356032afe7c9d32fc797c` matches `contracts/senvara.py` |
| ABI/schema and version readback | **PASS** | `evaluate(number:int, request_nonce:string)`; `get_version() = 0.1.0`; `get_total() = 0` at verification |
| Live two-wallet lifecycle, record `#1` | **PASS; canonical unresolved outcome** | Wallet A proposed and Wallet B responded; both frozen sources were read back on the recorded signed GitHub revision |
| Live validator evaluations | **FINALIZED but `JUDGMENT_UNAVAILABLE`** | Attempts 1–3 finalized; canonical state is `attempts 3/3`, `last_reason = JUDGMENT_UNAVAILABLE`, `REVIEW_ATTEMPTS_EXHAUSTED`; no conclusive decision |

Evaluation transactions: `0x7106ba897365d5b4336ca5cb0f7e8fca0fa06f9b60bf053b3299c3b02b8f17a1`, `0xd3b577ca7eebf8f6ddbf2a6b4a81fa4840e45f75663b664faa785d6c83e46aba`, and `0xcea1906872b232bf712d674ef66f7817251d126b60ed044110dd8729ce2dda6f`. The live result is evidence of safe non-decision, not evidence that the semantic pipeline succeeded.

## Browser, hosted and security boundaries

- The local browser harness is a fake-provider test and must not be described as MetaMask/Rabby extension validation or a signed lifecycle.
- The protected candidate Vercel preview is read-only route/browser evidence only; it does not authorize production promotion or prove wallet signing.
- Real Rabby testing is **partial**: connection, disconnect/reconnect, provider selection and account switching were observed in the production browser session, but a full-page reload returned the app to `Connect wallet` and required reconnecting; silent reload recovery therefore failed. MetaMask was not available in the browser extension inventory, so no MetaMask test is claimed. Hosted unauthorized/replay/stale-action rejection and independent security review remain open. The exact-head CI run is [39402924924](https://github.com/Bibidee/Senvara/actions/runs/39402924924) on commit `4fd08b81bdd6b8280042cd9426e1bfaccd85cf56`.
- The wallet context now stores stable provider metadata and retries read-only `eth_accounts`/`eth_chainId` restoration for a bounded interval after extension discovery. This improves reload recovery when the extension is slow to announce or hydrate, without opening a signing prompt; the local browser harness verifies the authorized-session reload path. The production Rabby session must be rechecked after the frontend is deployed.
- The current local full-install audit is reproducible and no longer an unexplained Vercel-only report: the six findings are confined to the development CLI dependency graph; the frontend and repository production audits are clean. This is not treated as a production-runtime vulnerability, but it remains a supply-chain limitation.
- The trace RPC method `gen_dbg_traceTransaction` was unavailable for the historical evaluations, so the exact hidden exception inside v0.1.0's broad catch remains unresolved.
- The candidate deployment now has a conclusive finalized result, but submission readiness remains blocked by the open negative-path, MetaMask, Rabby reload-recovery, accessibility/mobile and independent-audit gates.
