# Architecture and Scope

## Product boundary

The only contract controls the documentary review registry. It does not verify deployed code, create money claims, pay a reviewer, grant a score or declare an author's identity. Senvara deliberately addresses documentation claims rather than generalized project-compliance certification.

A proposing wallet opens a question. A single predesignated reviewer may respond by nominating an opposing file. This avoids publicly available challenge slots that can be monopolized cheaply, at the cost of requiring a participant chosen by the proposer. The review is a **paired documentary interpretation** and is **not impartial third-party arbitration**.

## Canonical state

A single GenLayer contract owns `dossiers`, `observations`, `fingerprints`, `total` and `version`. Each dossier is a bounded JSON string under its monotonic numeric ID. The source file paths, repository, full revision, parties and response window are immutable. An evaluation's observation is separately indexed by record ID and attempt number.

The application never writes product status to a web server, queue or external index. `/open/` queries finalized contract records by bounded pagination. `/record/?id=N` reconstructs one record directly. Contract evaluation uses nondeterministic network access and model invocation inside `run_nondet_unsafe`. No storage writes happen inside the leader or validator functions. The frontend uses GenLayerJS for finalized reads and its calldata codec, fetches the consensus contract metadata directly from the configured RPC, and sends the final transaction through the selected EIP-1193 provider; it never swaps or aliases the global `window.ethereum` object.

## Contract surface

| Write | Allowed wallet | Conditions | Effect |
|---|---|---|---|
| `propose` | any direct wallet on 61999 | valid shape, unique exact claim fingerprint, distinct reviewer | freezes the initial record |
| `respond` | nominated reviewer | before response deadline; distinct, safe source path | sets second file; opens 3-day assessment window |
| `decline` | nominated reviewer | unanswered, deadline active | terminal decline |
| `withdraw` | proposer | unanswered | terminal withdrawal |
| `evaluate` | proposer or reviewer | ready, before assessment deadline, attempt budget/cooldown | independently retrieves and evaluates, records final or retryable attempt |
| `close_expired` | any direct wallet | valid outstanding deadline expired | terminal unresolved expiration |

Read methods: `get_version`, `get_total`, `get_dossier`, `get_observation`, `list_dossiers`. All writes are nonpayable. No admin role exists. Contract deployment itself is a privileged release action and is not performed by the frontend.

## Finalized versus tentative information

A wallet request can be rejected before transmission. A transaction can be submitted, in consensus, accepted provisionally, finalized with execution failure, finalized with ambiguous execution metadata or finalized successfully. A successful transaction must then be reconciled against canonical contract state before the frontend claims a product state change.

## No-backend deployment

The Next.js application is configured with `output: 'export'`. There are no Next.js API routes, server actions, authentication services, databases or proxies. `/record/` reads the record number from a client-side query string to remain compatible with static export.

## Known scaling limits

- The global record index grows indefinitely. Pagination is bounded at 20 IDs per call. No owner-specific on-chain index is implemented in V1.
- A record has at most three attempts. Fee costs and source retrieval can vary by validator.
- Binary evidence, cross-repository corroboration, file fragments, arbitrary websites and deployed-behavior proofs are not supported.
- Exactly one named reviewer is chosen at record creation. There is no permissionless challenger market or Sybil-resistant public identity primitive.
