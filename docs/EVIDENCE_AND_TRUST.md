# Evidence and Trust Specification

## Admission policy

Each case is bound to one `owner/repo`, full 40-digit commit SHA, and two different repository-relative UTF-8 text paths. The primary file is fixed by the proposer. The second path is fixed by a separate designated reviewer. Both paths refer to the **same repository revision**, which limits time-of-check/time-of-use drift.

Before semantic judgment, **each validator** performs the following remote checks inside the nondeterministic block:

1. Construct a trusted `https://api.github.com/repos/` endpoint from restricted, validated ASCII repository and path components; user-controlled HTTP hostnames, credentials, arbitrary ports and redirects are not accepted as input.
2. Check a public repository's returned `full_name` against the requested `owner/repo`.
3. Retrieve the exact full commit and require the matching `sha` and GitHub commit URL.
4. Require GitHub API's `commit.verification.verified=true`, `reason=valid`, a nonempty signature and signed payload. SHA-256-fingerprint the reported signed payload. The system does **not** independently verify GPG or SSH signature cryptography on chain.
5. Retrieve each Contents API record by exact commit; require file `path`, type, `base64` encoding and length match.
6. Decode only valid standard base64, verify Git's SHA-1 blob ID from exact bytes and compute a separate SHA-256 fingerprint.
7. Decode strict UTF-8 and enforce at most 8,192 source bytes per file.
8. Ask the language model to classify each file, requiring any decisive result to cite an exact 8–320-character quote contained in the corresponding file.
9. Independently compare the leader and validator decision-critical vector: source hashes, signed payload hash, both classifications and the derived outcome. Each quotation is independently checked as an exact, relevant substring of its authenticated source. Candidate 0.2.0 intentionally permits different valid quote spans; quote text is citation evidence, not an independent consensus key.

A provenance failure, provider outage, ambiguous model response or invalid quote yields a bounded `RETRYABLE` category, never `CONTRADICTED` or `SUPPORTED`. Validator disagreement may prevent any consensus transaction from committing. In candidate 0.2.0, a finalized retryable category records diagnostics and cooldown/replay identity but does not consume a semantic assessment slot.

## Outcome derivation

| Source classifications | Documentary outcome |
|---|---|
| at least one `SUPPORTS` and at least one `CONTRADICTS` | `MIXED` |
| any `CONTRADICTS`, no `SUPPORTS` | `CONTRADICTED` |
| any `SUPPORTS`, no `CONTRADICTS` | `SUPPORTED` |
| otherwise | `INSUFFICIENT` |

These are **model interpretations of documentary excerpts**, not mechanically proven semantic entailments. Quoted text can be selectively chosen; validators are tasked to examine the full bounded input, not just the quote.

## Untrusted inputs

Participant notes, repo files, filenames and source comments are untrusted data. Prompts explicitly reject instructions embedded in those documents, but prompt isolation is defense-in-depth, not a security guarantee. The protocol performs no executable source-code analysis, arbitrary shell commands, screenshot fetches or off-site link traversal.

## Trust boundaries and residual risks

- GitHub remains an external availability and metadata authority. A verified API response does not prove that the wallet is the code author, that publisher intent is accurate, or that a release was deployed.
- GenLayer's web API can return a body from a redirect or internal retrieval infrastructure. Runtime DNS, final redirect resolution and response provenance beyond the reported data are outside this contract's independent verification.
- A Git SHA-1 blob ID is a provider-compatible content identity. SHA-256 is retained as an extra review fingerprint, but neither alone proves truthful prose.
- The contract bounds **decoded evidence bytes**, not HTTP transport memory consumption before the response is provided by the runtime.
- Validators can disagree on classifications or authenticated source fingerprints. A successful majority decision is still a consensus-mediated interpretation, not universal truth. Different valid quote spans are not by themselves a disagreement in candidate 0.2.0.
- The limited provider shape may change; newly unexpected fields and unavailable metadata fail closed.
- Some valid repositories use unsigned Git commits. Such sources cannot be decisively reviewed under V1 policy, by deliberate design.
