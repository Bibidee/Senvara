# Senvara Contract Specification

## Deployment identity

- Intelligent Contract: contracts/senvara.py
- Contract version: 0.1.0
- Network: GenLayer Studionet
- Chain ID: 61999 / 0xf22f
- RPC: https://studio.genlayer.com/api
- Custody: none; all methods are nonpayable

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

Claims are 24–420 characters, source paths are repository-relative and traversal-free, files are at most 8 KiB decoded UTF-8, API responses are at most 30 KiB, response windows are 1–14 days, review windows are 3 days, and evaluation attempts are capped at 3 with a 10-minute retry cooldown.

## Decision rule

Validators classify each file as SUPPORTS, CONTRADICTS, IRRELEVANT or AMBIGUOUS. The contract derives SUPPORTED, CONTRADICTED, MIXED, INSUFFICIENT; no free-form model verdict is stored. A source/provenance/model failure is RETRYABLE, never a documentary decision.

Every evaluation request carries a 64-hex-character nonce. A successful retryable or
conclusive evaluation stores the nonce with the named participant and rejects that
exact replay. The record also stores `last_attempt_by`, so a frontend cannot reconcile
an evaluation against an older attempt by count alone.

The deployed ABI and source readback must be generated and compared to this exact source after an authorized deployment. No address is currently configured.
