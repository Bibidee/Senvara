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
| Hosted exact-head GitHub Actions run | **PASS** | Runs 9 and 10 passed on `ac2227afc8a2b93a5d730912e16c9a3b546f1011` and `6e7f351804a7f8c65086eb7bb938d69b29f7f611`; Direct Mode, frontend production audit, build, Linux Chromium/Playwright and client checks passed. GitHub emitted only Node.js 20 action and Ubuntu image migration notices. Run 8 also passed on the preceding lifecycle-documentation head. |
| Hosted preview read-only browser sweep | **PASS; read-only** | Brave session reached `/`, `/open/`, `/method/` and `/workbench/`; no browser console warnings/errors observed. Wallet writes were not attempted. |
| Hosted real Rabby wallet session | **PASS; signed lifecycle** | Wallet A/B connection and switching were exercised on Studionet 61999; proposal, response and two evaluation retries were signed and each receipt was independently reconciled. |

## Executed against Studionet

| Check | Result | Evidence boundary |
|---|---|---|
| Contract deployment | **FINALIZED** | `0x011be7340538a7279ffd600408218cb7736a375031dd52c0d06e975edb3fa02d`; one consensus round, 5/5 validator votes `AGREE` |
| Deployed source readback | **PASS; exact SHA-256 match** | 19,552 bytes; `33385d0283d67cd7c13f0cdafe79ba06c3466a20a35356032afe7c9d32fc797c` matches `contracts/senvara.py` |
| ABI/schema and version readback | **PASS** | `evaluate(number:int, request_nonce:string)`; `get_version() = 0.1.0`; `get_total() = 0` |
| Live two-wallet lifecycle, record `#1` | **PASS; canonical unresolved outcome** | Wallet A `0x4a7d…32f5` proposed and Wallet B `0xff20…9b54` responded. Proposal `0x00f36bee64d3c5f3507b7f65f1b6c805e8d917c95c5dcf5fd36cf74c55081d7e` and response `0xbd45604b8700e8bec6f81f6e3b8ea6be729f838a4f02e37131772963af8d2438` finalized and read back. Both frozen sources are on signed GitHub commit `272a0a003e875c95902aa6f39c03458f26e4798c`. |
| Live validator evaluation and retry accounting | **PASS; no false verdict** | Evaluation attempt 1 `0x7106ba897365d5b4336ca5cb0f7e8fca0fa06f9b60bf053b3299c3b02b8f17a1` and fresh-nonce attempt 2 `0xd3b577ca7eebf8f6ddbf2a6b4a81fa4840e45f75663b664faa785d6c83e46aba` both finalized. Canonical state is `attempts 2/3`, `last_reason = JUDGMENT_UNAVAILABLE`, with no `DECIDED` outcome; unavailable evidence was not converted into a favorable or adverse judgment. |

## Not executed

GenVM lint, live conclusive validator evidence, real MetaMask, account-change/network-change assertions in MetaMask, axe-specific automation and manual mobile-device verification remain open. Real Rabby connection/disconnect/reconnect/injected selection/reload and the signed Wallet A/B lifecycle passed. The two live evaluation attempts finalized as `JUDGMENT_UNAVAILABLE`; a third retry was not submitted. MetaMask was unavailable. The local browser harness is a pass; its fake providers are not real wallet extensions and its local RPC-failure route is intentionally synthetic.

These are release gates, not passing results. The explicitly authorized contract deployment was verified above; a Vercel preview was prepared and read-only route navigation was checked, but no frontend production setting or production promotion was changed.

## Test coverage added or hardened

- Selected EIP-1193 provider is the provider receiving `eth_sendTransaction`.
- The transaction guard persists hashes and blocks exact duplicate intent.
- Finality is separated from canonical application-state verification.
- Malformed signed-commit fields and non-finite provider JSON remain non-conclusive.
- Canonical dossiers and observations are validated before display/reconciliation.
- Evaluation requests carry a unique 64-hex request nonce; committed attempts record `last_attempt_by`, and exact nonce replay is rejected.
- Transaction reconciliation requires the expected state transition, actor, attempt number and recent canonical timestamp; browser storage failure blocks signing rather than dropping the duplicate-action guard.
<!-- GitHub-verified lifecycle fixture revision. -->
