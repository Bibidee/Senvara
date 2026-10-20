# Authorized Studionet Verification Guide

This document is procedural guidance only. Do not deploy, sign, spend GEN or change production configuration without explicit authorization and manual wallet approval.

## Before authorization

1. Review docs/AUDIT_REPORT.md, docs/SECURITY.md, docs/CONTRACT_SPEC.md and docs/STATE_MACHINE.md.
2. Install dependencies and verify the local toolchain:

    npm install
    npm --prefix frontend install
    npx --no-install genlayer --version
    npm run preflight
    npm --prefix frontend run typecheck
    npm --prefix frontend run lint
    npm --prefix frontend run build

3. Record the contract SHA-256 from npm run check:source. Do not edit the contract after this fingerprint is recorded.

## After explicit deployment authorization

1. Use a disposable, manually controlled Studionet wallet with only the GEN needed for transaction fees.
2. Deploy the exact reviewed source with the repository-local CLI and required RPC:

    npx --no-install genlayer deploy --contract contracts/senvara.py --rpc https://studio.genlayer.com/api

   Review the wallet prompt and approve it manually. Save the returned address and transaction hash.
3. Read back the deployed source and schema; compare them to contracts/senvara.py and the expected public methods:

    npx --no-install genlayer code 0x<address> --rpc https://studio.genlayer.com/api
    npx --no-install genlayer schema 0x<address> --rpc https://studio.genlayer.com/api
    npx --no-install genlayer call 0x<address> get_version --rpc https://studio.genlayer.com/api

4. After source, ABI, version and chain identity match, create `frontend/.env.local` for the historical canonical preview configuration:

    NEXT_PUBLIC_SENVARA_CONTRACT=0x9668263921d88c1deaB8DA5A416a65D562cB4187
    NEXT_PUBLIC_SENVARA_RPC=https://studio.genlayer.com/api

5. Re-run the frontend build. The reviewed candidate identity is now verified at `0xF563d381C3ec5BDA61f166Bb1FFf781dE6B81b8C`; use the candidate identity fields from `frontend/.env.example` only for an explicitly labeled preview. Then execute the two-wallet lifecycle in docs/TEST_MATRIX.md: propose, finalize/read back, respond, finalize/read back, evaluate, verify the observation and test at least one unavailable-evidence retry without weakening safeguards.
6. Test MetaMask and Rabby separately and together: EIP-6963 selection, reconnect after refresh, disconnect, 4902 add/switch, wrong-chain rejection, account/network changes, signature rejection, RPC failure, pending/unknown/finalized/error receipts and duplicate-click guards.
7. Update docs/RELEASE_MANIFEST.json with the exact deployed address, source hash, ABI parity evidence, transaction hashes and hosted test links. Keep release_readiness blocked until every gate is evidenced.

For an assessment transaction, generate a fresh 64-hex request nonce and call `evaluate(number, request_nonce)`. Never reuse a nonce after a submitted or committed attempt. The contract records the evaluator wallet in `last_attempt_by`; frontend reconciliation must verify that actor, attempt number and the changed canonical timestamp before reporting the attempt as accepted.

## Verified deployment record (2026-10-19)

The explicitly authorized deployment was finalized on Studionet 61999:

- **Contract:** `0x9668263921d88c1deaB8DA5A416a65D562cB4187`
- **Deployment transaction:** `0x011be7340538a7279ffd600408218cb7736a375031dd52c0d06e975edb3fa02d`
- **Execution:** `FINALIZED`; one consensus round; 5/5 validator votes `AGREE`
- **Exact source readback:** 19,552 bytes; SHA-256 `33385d0283d67cd7c13f0cdafe79ba06c3466a20a35356032afe7c9d32fc797c`
- **Schema/version readback:** `evaluate(number:int, request_nonce:string)`; `get_version() = 0.1.0`

The historical source readback exactly matches `contracts/senvara.py`. The v0.2.0 source readback exactly matches `contracts/senvara_v02.py` and is recorded in `docs/CANDIDATE_V020_MANIFEST.json`. Frontend environment configuration defaults to the historical canonical deployment; candidate preview configuration remains opt-in and no production promotion was made. The remaining hosted lifecycle gates are tracked in `docs/RELEASE_GATES.md`.
