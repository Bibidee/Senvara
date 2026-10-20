# Senvara

**A public documentary claim review, interpreted by independent GenLayer validators.**

Senvara asks a bounded question: *what do two documents in one exact public GitHub revision actually say about a particular software capability?* A proposing wallet records an assertion and one file, then designates a reviewer wallet. The reviewer may select a different file from the same immutable revision. GenLayer validators independently fetch the documents, classify the evidence and agree on the decision-critical source fingerprints and classifications. The contract derives the resulting documentary outcome.

This is **not** a proof that deployed software runs correctly, that code is secure, or that a particular wallet controls the repository. Neither participant is an authenticated independent auditor.

## Current status

**The historical 0.1.0 contract remains preserved, and the reviewed 0.2.0 remediation is now deployed and source-verified on Studionet. The frontend still defaults to the historical identity; release remains blocked pending a fresh hosted conclusive lifecycle, real extension coverage and independent audit.**

The contract behavior model, candidate GenVM Direct Mode tests, client transaction tests, dependency-aware TypeScript check, ESLint, candidate lint/schema validation and production static export run locally. Both deployed identities have exact source, ABI/schema, version and finalized receipt readback. A conclusive hosted judgment, real MetaMask/Rabby extension coverage and a production frontend promotion remain **open release gates**.

## Product loop

1. **Propose:** A wallet freezes one 24–420-character claim, `owner/repo`, a 40-digit commit SHA, the first evidence path, a distinct reviewer wallet and a 1–14 day response deadline.
2. **Respond or decline:** Only the designated wallet can add a different file from the exact same commit, with an optional contextual note. A silent reviewer cannot confer approval. The proposer may withdraw only before a response.
3. **Evaluate:** Once both sources exist, either participant may request an assessment within a 3-day window. GitHub API authenticity, signature metadata, exact file bytes, model citations and independent validator observations all matter.
4. **Resolve:** The result is `SUPPORTED`, `CONTRADICTED`, `MIXED` or `INSUFFICIENT`, referring only to documentary evidence. Retrieval and model/citation failures are retryable, not negative votes. In deployed 0.1.0, every finalized retryable evaluation consumed an attempt; candidate 0.2.0 keeps bounded retry diagnostics and cooldown/replay protection without consuming the three semantic-attempt budget.
5. **Return:** Anyone can read finalized public records without a connected wallet.

## Architecture

```text
Browser / Next.js static export
    ├─ EIP-6963 / injected EIP-1193 wallet (writes only)
    ├─ GenLayerJS public RPC reader and ABI codec
    ├─ selected EIP-1193 provider → eth_sendTransaction (writes)
    └─ Senvara Intelligent Contract on GenLayer Studionet 61999
         ├─ immutable source and role records
         ├─ GitHub API reads and semantic assessment inside nondeterministic blocks
         ├─ independent leader / validator re-observation
         └─ canonical outcomes and attempt records
```

There is **no application backend**, private relay, API route, centralized database, service key, autonomous operator or backend verdict engine. Local browser storage contains transaction *convenience* records only.

## Repository

- `contracts/senvara.py`: one nonpayable GenLayer Intelligent Contract.
- `frontend/app/`: Next.js App Router screens, static-export-compatible `/record/?id=N` route.
- `frontend/components/`: evidence viewer, wallet control and local transaction recovery.
- `frontend/lib/`: canonical reads, signing, validation, request identity and receipt classification.
- `tests/`: isolated Python behavior model and TypeScript client validation tests.
- `tests/test_direct_genvm.py`: executable Direct Mode lifecycle and adversarial tests for the repository's contract.
- `docs/`: architecture, risks, state transitions, evidence integrity and release gates.
- `scripts/preflight.py`: static no-leakage, network, configuration and source-integrity checks.

## Toolchain and network

- **Network:** GenLayer **Studionet**, chain **61999** (`0xf22f`)
- **RPC:** `https://studio.genlayer.com/api`
- **Explorer:** `https://explorer-studio.genlayer.com`
- **CLI:** repository-local `genlayer@0.39.1`, never a machine-global install
- **Frontend:** Next.js 16 App Router, TypeScript, React 19, `genlayer-js@0.9.0`, `viem@2.57.7`
- **No other chain** is supported by the application.

### Verified contract deployment

- **Address:** `0x9668263921d88c1deaB8DA5A416a65D562cB4187`
- **Deployment transaction:** `0x011be7340538a7279ffd600408218cb7736a375031dd52c0d06e975edb3fa02d`
- **Receipt:** `FINALIZED`, one consensus round, 5/5 validator votes `AGREE`
- **Readback:** 19,552 bytes and SHA-256 `33385d0283d67cd7c13f0cdafe79ba06c3466a20a35356032afe7c9d32fc797c`, exactly matching the reviewed local source
- **Interface:** `evaluate(number:int, request_nonce:string)` and `get_version() = 0.1.0`

The frontend is configured for reads and writes against this historical identity on Studionet. Candidate 0.2.0 configuration is opt-in and requires a matching candidate address, expected address, version and source hash; it is not silently mixed with the deployed contract. No production Vercel promotion was made. The earlier preview is protected by Vercel deployment protection, and only read-only route navigation was verified there.

The reviewed 0.2.0 candidate is deployed at `0xF563d381C3ec5BDA61f166Bb1FFf781dE6B81b8C` by transaction `0xeabdd3db0a1648a6a02928161ceb715bddb79718ba0c4353898feeb4a63896f1`. Its decoded source is 25,549 bytes with SHA-256 `d56076f0e63d91d449e4a34f55c3d88474dc13af579c5ddbefe05a02c6e503a2`; readback is recorded in `docs/CANDIDATE_V020_MANIFEST.json`. This does not authorize production promotion or prove a conclusive semantic judgment.

Candidate preview: [senvara-41ex6g1wy-bibidees-projects.vercel.app](https://senvara-41ex6g1wy-bibidees-projects.vercel.app). It is protected, preview-only, and configured with the candidate identity; production remains on the historical default.

## Start locally

```sh
npm install
npm --prefix frontend install
npm run preflight
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix frontend run build
npm run web:dev
```

The preflight command checks source and mock-based model tests; it does not substitute for hosted validation. To test the frontend independently, run `npm --prefix frontend run typecheck`, `npm --prefix frontend run lint` and `npm run web:build` after installing dependencies.

The default frontend identity is the source-verified 0.1.0 deployment. A release candidate must set all candidate identity fields together; otherwise the frontend refuses signed actions rather than mixing ABIs or state:

```sh
# frontend/.env.local
NEXT_PUBLIC_SENVARA_CONTRACT=0x<verified_40_digit_contract_address>
NEXT_PUBLIC_SENVARA_RPC=https://studio.genlayer.com/api
# For an authorized 0.2.0 preview:
NEXT_PUBLIC_SENVARA_V020_CONTRACT=0xF563d381C3ec5BDA61f166Bb1FFf781dE6B81b8C
NEXT_PUBLIC_SENVARA_V020_EXPECTED_ADDRESS=0xF563d381C3ec5BDA61f166Bb1FFf781dE6B81b8C
NEXT_PUBLIC_SENVARA_CONTRACT_VERSION=0.2.0
NEXT_PUBLIC_SENVARA_SOURCE_SHA256=d56076f0e63d91d449e4a34f55c3d88474dc13af579c5ddbefe05a02c6e503a2
```

Use the repository-local versioned CLI via `npx --no-install genlayer --version` after root installation. No deployment or transaction-submission script is included; deployments require a separate reviewed deployment procedure and authorization. The frontend does not temporarily replace `window.ethereum`: it uses the selected EIP-1193 provider for the final `eth_sendTransaction` call, so simultaneous injected wallets remain isolated.

## Test local code without installing packages

For machines with Python 3.11+ and TypeScript's CLI available:

```sh
python -m unittest discover -s tests -p 'test_*.py' -v
mkdir -p .test-dist
tsc --module commonjs --target ES2022 --outDir .test-dist frontend/lib/validation.ts frontend/lib/wallet-errors.ts
node --test tests/client.test.cjs
python scripts/preflight.py
```

The contract behavior harness mocks GenLayer, GitHub and model responses. It checks state and validation invariants in a fast Python model. The executable Direct Mode suite uses `scripts/run-direct-pytest.py` with a Python environment containing `genlayer-py`, `genlayer-test` and `pytest`; it is separate from `npm test` because those optional runtime dependencies are not part of the JavaScript install. `npm test` runs the client suite and Python model suite through a Windows-tolerant interpreter wrapper.

After a production build, serve the static export and run the browser harness with a working Playwright Chromium runtime:

```sh
node scripts/serve-static.cjs 3000
npm run test:browser
```

The harness uses a fake EIP-1193 provider for deterministic wallet-state tests; it never signs or broadcasts a transaction. Real MetaMask/Rabby extension verification remains a separate release gate.

For Direct Mode, use a supported GenLayer test environment and run:

```sh
python -m pip install -r requirements-direct.txt
python scripts/run-direct-pytest.py tests/test_direct_genvm.py -q
```

The current local run passes 8/8 Direct Mode tests, including candidate malformed-output, citation and equivalence cases. This is local GenVM evidence; it does not replace hosted `run_nondet_unsafe` consensus or a live application lifecycle. The browser harness is `tests/browser-smoke.cjs`; it uses deterministic fake EIP-6963 providers and never signs or broadcasts.

## Documentation

Read [Architecture](docs/ARCHITECTURE.md), [Security](docs/SECURITY.md), [Evidence and Trust](docs/EVIDENCE_AND_TRUST.md), [Wallet and Finality](docs/WALLET_AND_FINALITY.md), [Test Matrix](docs/TEST_MATRIX.md) and [Release Gates](docs/RELEASE_GATES.md) before changing the protocol.

## Important limitations

- Public GitHub APIs can be unavailable or return different responses from validators; missing evidence is never a definitive contradiction.
- `verified=true` is GitHub's report about a commit signature, **not** independent on-chain signature verification.
- Two wallet addresses do not prove independence or ownership. Collusion and peer nomination are permitted, but not certified.
- A Git object hash and SHA-256 fingerprint prove observed bytes only, not that the prose is accurate or production software behaves as documented.
- Strictly matching validator excerpts and classifications can cause consensus disagreement. This prioritizes confidence over always reaching a verdict.
- A transaction `ACCEPTED` by the protocol is not a finalized, successful, canonical product result.
