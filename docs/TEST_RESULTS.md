# Senvara Verification Record

**Date:** 2026-10-19
**Build state:** locally implemented; contract deployed and source-verified; release blocked
**Network target:** GenLayer Studionet 61999 exclusively

## Executed locally

| Command | Result | Evidence boundary |
|---|---|---|
| `npx --no-install genlayer --version` | **0.39.1** | Repository-local CLI resolution; no GenVM run |
| `npm run test:client` | **17/17 passed** | Transpiled client logic with mocked SDK/provider/RPC; not real wallet or chain |
| `npm run test:contract` | **30/30 passed** | Python behavior model with mocked GenLayer/GitHub/model; not hosted Studionet |
| `python scripts/run-direct-pytest.py tests/test_direct_genvm.py -q` | **5/5 passed** | GenVM Direct Mode using the pinned optional runtime in `requirements-direct.txt` (`genlayer-py 0.16.3`, `genlayer-test 0.29.2`, `pytest 8.4.2`); not hosted Studionet |
| `npm run check:source` | **PASS** | Static source/network/backendless/custody guard |
| `npm run preflight` | **PASS** | Source guard plus the two local suites |
| `npm --prefix frontend run typecheck` | **PASS** | Dependency-aware TypeScript check |
| `npm --prefix frontend run lint` | **PASS** | ESLint core plus React, hooks and JSX accessibility rules; the vulnerable Next ESLint wrapper was removed |
| `npm --prefix frontend run build` | **PASS** | Next.js 16.4.2 Webpack static export; 7 routes prerendered |
| `npm audit --audit-level=high` (frontend) | **PASS** | 0 vulnerabilities after removing the vulnerable Next ESLint development-toolchain wrapper; production audit remains 0 |
| `npm ci` and `npm --prefix frontend ci` | **PASS** | Both generated lockfiles reproduce clean installs; npm emitted only dependency deprecation warnings |
| `npm run verify:deployment` | **PASS** | Local source, manifest, frontend env and chain constants match the canonical deployment |
| `npm run test:browser` | **PASS** | Playwright Chromium 151; routes, 390/1440px layout, visible control/field labels, public read, RPC retry recovery, keyboard traversal and fake EIP-6963 provider assertions |
| Hosted exact-head GitHub Actions run | **PASS** | Run 5 on `74568a1fe2ffc81f6c01a3d10e2101ad64f2ff51`; Direct Mode, full frontend audit, build, Linux Chromium/Playwright and client checks passed. |
| Hosted preview read-only browser sweep | **PASS; read-only** | Brave session reached `/`, `/open/`, `/method/` and `/workbench/`; no browser console warnings/errors observed. Wallet writes were not attempted. |
| Hosted real Rabby wallet session | **PASS; no writes** | Connected on Studionet 61999, app disconnect cleared the session, reconnect and injected-provider selection succeeded, and reload silently restored the account. |

## Executed against Studionet

| Check | Result | Evidence boundary |
|---|---|---|
| Contract deployment | **FINALIZED** | `0x011be7340538a7279ffd600408218cb7736a375031dd52c0d06e975edb3fa02d`; one consensus round, 5/5 validator votes `AGREE` |
| Deployed source readback | **PASS; exact SHA-256 match** | 19,552 bytes; `33385d0283d67cd7c13f0cdafe79ba06c3466a20a35356032afe7c9d32fc797c` matches `contracts/senvara.py` |
| ABI/schema and version readback | **PASS** | `evaluate(number:int, request_nonce:string)`; `get_version() = 0.1.0`; `get_total() = 0` |

## Not executed

GenVM lint, live GitHub validator retrieval, the two-wallet Studionet application lifecycle, real MetaMask, account-change/network-change and signed transaction journeys, axe-specific automation and manual mobile-device verification remain open. Real Rabby connection/disconnect/reconnect/injected selection/reload passed without signing. MetaMask was unavailable. The local browser harness is a pass; its fake providers are not real wallet extensions and its local RPC-failure route is intentionally synthetic.

These are release gates, not passing results. The explicitly authorized contract deployment was verified above; a Vercel preview was prepared and read-only route navigation was checked, but no frontend production setting or production promotion was changed.

## Test coverage added or hardened

- Selected EIP-1193 provider is the provider receiving `eth_sendTransaction`.
- The transaction guard persists hashes and blocks exact duplicate intent.
- Finality is separated from canonical application-state verification.
- Malformed signed-commit fields and non-finite provider JSON remain non-conclusive.
- Canonical dossiers and observations are validated before display/reconciliation.
- Evaluation requests carry a unique 64-hex request nonce; committed attempts record `last_attempt_by`, and exact nonce replay is rejected.
- Transaction reconciliation requires the expected state transition, actor, attempt number and recent canonical timestamp; browser storage failure blocks signing rather than dropping the duplicate-action guard.
