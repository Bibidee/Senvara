# Judgment availability investigation

Status: **0.2.0 remediation deployed and source/ABI verified; historical 0.1.0 remains unchanged. Candidate record #1 has a conclusive hosted judgment, while record #2 independently demonstrates a finalized retryable citation-validation outcome with no semantic decision.**

## Confirmed live evidence

The three existing evaluation transactions were queried read-only from `https://studio.genlayer.com/api`:

| Attempt | Transaction | Final protocol result | Contract observation |
|---|---|---|---|
| 1 | `0x7106ba897365d5b4336ca5cb0f7e8fca0fa06f9b60bf053b3299c3b02b8f17a1` | `FINALIZED`, `MAJORITY_AGREE` | `RETRYABLE / JUDGMENT_UNAVAILABLE` |
| 2 | `0xd3b577ca7eebf8f6ddbf2a6b4a81fa4840e45f75663b664faa785d6c83e46aba` | `FINALIZED`, `MAJORITY_AGREE` | `RETRYABLE / JUDGMENT_UNAVAILABLE` |
| 3 | `0xcea1906872b232bf712d674ef66f7817251d126b60ed044110dd8729ce2dda6f` | `FINALIZED`, `MAJORITY_AGREE` | `RETRYABLE / JUDGMENT_UNAVAILABLE` |

The decoded leader return in each receipt is the bounded retry object with that exact reason. Every completed leader receipt reports `execution_result: SUCCESS`, empty `stderr`, no raw error, no provider error code, and nonzero LLM token accounting. This rules out a confirmed GenVM invocation/provider failure in the receipt data.

Attempts 1 and 2 each contain a completed Gemini validator with `vote: disagree`, `NOTIFY_NONDET_DISAGREEMENT`, empty stderr and no raw error. The other completed validators agreed on the same retryable encoded result. Attempt 3 has no completed validator disagreement: the completed validators agreed on the same retryable result and the remaining validators were cancelled after quorum. Those are protocol-level facts; they do not expose the hidden exception inside the contract's broad catch block.

The requested trace call was also attempted read-only for all three hashes. The RPC returned `Method not found: gen_dbg_traceTransaction`. The CLI receipt helper cannot be used as a read-only tool because it requests a local keystore password. Therefore the underlying per-attempt exception cannot be recovered from this RPC. The deployed contract collapses provider, parsing, schema, classification and citation failures into the same `JUDGMENT_UNAVAILABLE` string, so the individual cause of attempt 3 is **unresolved by available evidence**.

## Exact defect

In deployed `contracts/senvara.py` 0.1.0:

1. `_observe` catches every exception from `gl.nondet.exec_prompt` and `_normalize_llm` and returns the same `JUDGMENT_UNAVAILABLE` reason.
2. `_normalize_llm` requires a dictionary and exact keys, so a supported runtime/provider text representation is rejected before semantic validation.
3. The validator requires `locally_observed == submitted`. That makes model-generated quote wording part of consensus identity even when both validators selected the same classifications and each quote is a valid exact substring of its authenticated source.

The third item is the confirmed systemic consensus fragility supported by the completed-validator disagreements in attempts 1 and 2 and by the deployed source itself. The first item is the confirmed diagnostic loss. The receipts do not prove whether a particular live model returned malformed JSON, a too-short quote, a fabricated quote, or another normalization failure.

## Candidate remediation

`contracts/senvara_v02.py` is the separately deployed and verified 0.2.0 remediation:

- Source SHA-256: `d56076f0e63d91d449e4a34f55c3d88474dc13af579c5ddbefe05a02c6e503a2`
- Source size: `25549` bytes
- `exec_prompt(..., response_format="json")` remains the interface.
- The parser accepts a bounded JSON string, including one JSON markdown fence, while still requiring one object, exact keys, duplicate-key rejection, finite JSON values, supported classifications and strict quote bounds.
- Prompt instructions explicitly prohibit extra keys, commentary, paraphrase, fabricated citations and free-form decisions.
- Retry diagnostics are bounded to `JUDGMENT_EXECUTION_UNAVAILABLE`, `JUDGMENT_MALFORMED_OUTPUT` and `JUDGMENT_CITATION_INVALID`, in addition to the existing provenance reason. No raw model output, exception text or source text is stored on-chain.
- Consensus compares decision-critical classifications, derived decision, signed/source hashes and independently verified source-anchored citations. Different valid quotation spans are accepted; fabricated/short/unanchored citations and conflicting classifications are rejected.

The deployment keeps the public method signatures compatible with 0.1.0 but extends the dossier observation schema with `last_attempt_nonce_sha256` and bounded reason values. The frontend/read validators and release ABI/schema manifest now record that deployed identity. The explicitly authorized production frontend uses the candidate identity; the historical frontend identity remains preserved as a compatibility reference.

## Verification matrix

Executed with GenLayer Direct Mode and the repository's Windows compatibility runner:

| Case | Result |
|---|---|
| Existing 0.1.0 Direct Mode suite | **PASS: 5/5** |
| Candidate 0.2.0 Direct Mode suite | **PASS: 7/7** additional tests, 12/12 total |
| Realistic text JSON with fenced response | **PASS** |
| Malformed JSON category | **PASS: `JUDGMENT_MALFORMED_OUTPUT`** |
| Fabricated/invalid citation category | **PASS: `JUDGMENT_CITATION_INVALID`** |
| Different valid quote spans with same classifications | **PASS: accepted by equivalence helper** |
| Conflicting classifications | **PASS: rejected** |
| Fabricated quote during equivalence | **PASS: rejected** |
| Source hash/citation binding | **PASS in candidate Direct Mode** |
| Live conclusive validator result | **PASS: candidate record #1 finalized `SUPPORTED`; Wallet A proposed, Wallet B responded and evaluated; canonical observation and fingerprints were read back** |
| Live already-decided rejection | **PASS: Wallet A evaluation `0x3389e48ec7c91f7021b3445c3580e9dff4ed30f12a83730e55bdab9bf0fca645` finalized with bounded result `record not eligible for evaluation`; record #1 remained `DECIDED / SUPPORTED / attempts=1`** |

The minimal successful semantic fixture is the candidate Direct Mode test that returns JSON text for `SUPPORTS`/`SUPPORTS` with literal source excerpts. It persists `DECIDED` with `SUPPORTED`; it is a real Direct Mode execution, not a source-only mock assertion. It is not evidence of a hosted Studionet result.

### Fresh hosted record #2

Wallet A proposed record `#2` in transaction `0x879a84c5a690049f2bf1c3be32ea9574dc53bb973ae40ca3e9a3b33097f57709`; Wallet B responded in `0xdf0fc54542c21a5cb1a389cfd6d1ff6679d41f8de30c0c3b7e8dbe032eb34856`; and Wallet B requested assessment in `0x6584fc344ade4055e01947a5d6b54e7d9725351e62bb334aa2931e95a74a49a9`. All three transactions finalized. The assessment receipt reports successful GenVM execution, validator consensus and the bounded return `{"kind":"RETRYABLE","reason":"JUDGMENT_CITATION_INVALID"}`. Canonical state remains `READY_FOR_REVIEW`, `attempts=0`, with no semantic decision. The public RPC does not expose raw model output or a finer citation subcategory, and `gen_dbg_traceTransaction` is unsupported.

## Deployment decision

The deployed contracts remain immutable. Historical v0.1.0 record #1 remains exhausted; candidate v0.2.0 record #1 is terminal `DECIDED / SUPPORTED`, while candidate record #2 remains retryable with no semantic attempt consumed. A contract change is necessary to obtain the improved diagnostics and quote-insensitive equivalence on-chain; frontend configuration alone cannot change validator behavior. No supported runtime-only configuration can remove the deployed exact-observation comparison or its broad exception collapse.

After the verified 0.2.0 deployment, the source preflight, ABI/readback, real Direct Mode, hosted CI, record #1 conclusive lifecycle, record #2 citation-validation outcome, already-decided negative path and exact source-hash/contract-address verification are recorded above. Do not retry record #1 for a semantic judgment or infer a semantic result from a deployment receipt. Unauthorized, exact-replay, stale-action, MetaMask, manual responsive and independent-audit checks remain release work.
