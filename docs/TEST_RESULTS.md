# Senvara Verification Record

**Date:** 2026-10-20
**Build state:** v0.2.0 remediation implemented locally; historical 0.1.0 deployed contract preserved; release blocked
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
| `npm --prefix frontend run typecheck` | **PASS** | Dependency-aware TypeScript check |
| `npm --prefix frontend run lint` | **PASS** | ESLint core, React/hooks and JSX accessibility rules |
| `npm --prefix frontend run build` | **PASS** | Next.js 16.4.2 Webpack static export; 7 routes prerendered |
| `npm run test:browser` | **PASS** | Fresh static export on Chromium; routes, 390/1440px responsive layout, keyboard traversal, RPC retry recovery and fake EIP-6963 provider assertions. It never signs or broadcasts. |
| `npm audit --omit=dev --audit-level=high` (frontend) | **PASS** | Production dependency tree reported 0 vulnerabilities |
| `npm audit --omit=dev --audit-level=high` (repository) | **PASS** | Production dependency tree reported 0 vulnerabilities |
| `npm audit --audit-level=high` (repository full install) | **6 findings; release limitation documented** | Four moderate and two critical development-tool findings are transitive through the pinned GenLayer CLI; the forced npm fix would replace the required CLI with an incompatible `0.0.35` major downgrade |
| GitHub Actions `Source quality` run `39341092548` | **PASS** | Linux runner verified commit `a05b00a28675b67c281f93941148707fbc040fec`; Direct Mode, GenVM lint, production audit, typecheck, lint, static build, Chromium `--with-deps`, browser smoke and client tests all passed. [Run](https://github.com/Bibidee/Senvara/actions/runs/39341092548) |

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
| Hosted conclusive validator judgment | **NOT EXECUTED; no new deployment or live transaction authorized** |

The conclusive fixture is an actual candidate Direct Mode execution with model-like JSON text and literal source excerpts. It is not a hosted Studionet result and does not prove external LLM/provider reliability.

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
- The earlier protected Vercel preview and read-only route checks do not authorize a new deployment or production promotion.
- Real MetaMask extension testing, account/network-change testing in real extensions, a fresh candidate hosted lifecycle, independent security review and hosted exact-head CI remain open.
- The current local full-install audit is reproducible and no longer an unexplained Vercel-only report: the six findings are confined to the development CLI dependency graph; the frontend and repository production audits are clean. This is not treated as a production-runtime vulnerability, but it remains a supply-chain limitation.
- The trace RPC method `gen_dbg_traceTransaction` was unavailable for the historical evaluations, so the exact hidden exception inside v0.1.0's broad catch remains unresolved.
- No claim of submission readiness is justified until a newly authorized 0.2.0 deployment produces a conclusive finalized result and the complete negative-path matrix is evidenced.
