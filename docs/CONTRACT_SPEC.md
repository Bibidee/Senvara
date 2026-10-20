# Senvara Contract Specification

## Deployment identity

- Historical Intelligent Contract: contracts/senvara.py
- Contract version: 0.1.0
- Network: GenLayer Studionet
- Chain ID: 61999 / 0xf22f
- RPC: https://studio.genlayer.com/api
- Custody: none; all methods are nonpayable

The historical deployed identity is `0x9668263921d88c1deaB8DA5A416a65D562cB4187`, source SHA-256
`33385d0283d67cd7c13f0cdafe79ba06c3466a20a35356032afe7c9d32fc797c`, and version
`0.1.0`. It is preserved unchanged. The reviewed remediation is deployed separately
at `0xF563d381C3ec5BDA61f166Bb1FFf781dE6B81b8C`, version `0.2.0`, source SHA-256
`d56076f0e63d91d449e4a34f55c3d88474dc13af579c5ddbefe05a02c6e503a2`; its exact
readback is recorded in `docs/CANDIDATE_V020_MANIFEST.json`. The active frontend uses
this candidate identity in the explicitly authorized production deployment; the
historical identity remains available only as the preserved compatibility reference.

## Public methods

| Method | Type | Authorization | Effect |
|---|---|---|---|
| propose(assertion, repository, commit_sha, primary_path, reviewer, response_seconds) | write | any direct wallet | Creates one immutable record |
| respond(number, opposing_path, context) | write | nominated reviewer | Adds one distinct file from the same pinned revision |
| decline(number) | write | nominated reviewer | Ends an unanswered record without a verdict |
| withdraw(number) | write | proposer | Ends an unanswered record before response |
| evaluate(number, request_nonce) | write | proposer or reviewer | Runs leader/validator nondeterministic observation; consumes one unique 32-byte request nonce |
| close_expired(number) | write | any direct wallet | Records an elapsed response/review deadline |
| get_version() | view | public | Returns contract version |
| get_total() | view | public | Returns monotonic record count |
| get_dossier(number) | view | public | Returns one canonical JSON record |
| get_observation(number, attempt) | view | public | Returns one committed observation |
| list_dossiers(offset, limit) | view | public | Returns bounded reverse-ID pagination |

## Bounds

Claims are 24–420 characters, source paths are repository-relative and traversal-free, files are at most 8 KiB decoded UTF-8, API responses are at most 30 KiB, response windows are 1–14 days, review windows are 3 days, and semantic evaluation attempts are capped at 3 with a 10-minute retry cooldown. In deployed 0.1.0, every finalized retryable observation consumes an attempt. In candidate 0.2.0, bounded retryable provider/model/citation diagnostics retain nonce replay protection and cooldown state but do not consume a semantic attempt.

## Decision rule

Validators classify each file as SUPPORTS, CONTRADICTS, IRRELEVANT or AMBIGUOUS. The contract derives SUPPORTED, CONTRADICTED, MIXED, INSUFFICIENT; no free-form model verdict is stored. A source/provenance/model failure is RETRYABLE, never a documentary decision.

Every evaluation request carries a 64-hex-character nonce. The deployed contract
stores the nonce with the named participant after a successful evaluation. Candidate
0.2.0 additionally stores `last_attempt_nonce_sha256` for bounded reconciliation;
it stores the nonce fingerprint for both retryable diagnostics and conclusive
evaluations, and rejects the exact replay. The record also stores `last_attempt_by`,
so a frontend cannot reconcile an evaluation against an older attempt by count alone.

The deployed ABI and source readback are recorded in `docs/RELEASE_MANIFEST.json`.
Candidate ABI/source identity is recorded separately in `docs/CANDIDATE_V020_MANIFEST.json`.
