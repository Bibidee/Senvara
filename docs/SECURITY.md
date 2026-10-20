# Threat Model and Security Invariants

## Assets

Canonical claims, participant roles, frozen source identities, evidence integrity fingerprints, review attempt accounting, output classifications, deadlines, wallet intent and canonical transaction state.

## Adversaries

A malicious proposer, reviewer, stranger wallet, compromised external document author, hostile GitHub response, disagreeing or unreliable validator/model, malicious browser extension and replaying user agent. A selected reviewer can collude with a proposer, and V1 has no identity oracle to prove otherwise.

## Contract invariants

1. Only direct Studionet 61999 wallet invocation is supported. Sender must equal transaction origin; this purposely does not support smart contract wallets or arbitrary contract callers.
2. Proposer and reviewer addresses must differ. It is possible for one human to control both addresses; the app does not claim otherwise.
3. Immutable anchors never change after `propose`. The opposing file and note can only be supplied once by the designated reviewer.
4. An exact proposal tuple is registered once. Duplicate attempts revert even if the previous record was withdrawn; changing the revision or reviewer produces a distinct tuple.
5. Any wallet may expire a genuinely elapsed window; only participants may request semantic assessments or exhaust the limited attempt budget.
6. Source path must not contain traversal segments, URL encoding or arbitrary authority components.
7. No evaluated state can be stored unless a valid, independently matching structured leader and validator observation returns successfully.
8. An unavailable provider, unsigned or mismatched provenance, malformed JSON, oversized file or invalid model quote cannot become an affirmative or negative documentary decision.
9. A failed or disagreeing consensus invocation must not be treated as a committed review attempt. This behavior depends on correct GenVM transaction rollback semantics and must be verified in hosted testing. Candidate 0.2.0 additionally avoids consuming the semantic budget for a finalized, bounded retryable diagnostic; only a conclusive observation advances `attempts`.
10. Each committed evaluation requires a fresh 64-hex request nonce scoped to the dossier, sender and nonce. The successful attempt records `last_attempt_by`, so an exact signed request cannot be replayed as a second assessment.
11. The deployed 0.1.0 contract permits three committed observations with a ten-minute cooldown, plus a three-day evaluation window. Candidate 0.2.0 permits three conclusive semantic attempts; retryable diagnostics retain cooldown and nonce replay protection without exhausting that semantic budget. End state is unresolved if conclusive attempts are exhausted or the review window closes.
12. No native GEN value is intentionally accepted or dispatched. All methods are nonpayable. Unsupported unsolicited transfers are a network-level behavior outside this contract's custody promises.
13. Contract status is authoritative; browser local storage is neither verdict nor proof of completed transaction execution.

## Frontend safeguards

- EIP-6963 injected-provider discovery with fallback to a single `window.ethereum` provider.
- Explicit account request on user action only; no passive signature popup.
- 4902-only `wallet_addEthereumChain` fallback and re-read of the resulting chain ID.
- Wallet account/chain event listeners, epoch-bound signing and pre-signature `eth_accounts`/`eth_chainId` revalidation.
- Active in-app disconnect is deliberately not represented as permission revocation from the extension.
- Signed writes require the configured real contract address; preview mode disables writes entirely.
- Intent digest + persisted local action lock + in-tab mutex prohibit silent duplicate write broadcasts.
- Local transaction record stores the submitted hash when returned, and unresolved hashes are never automatically resubmitted.
- Evaluation intent and action arguments are persisted before signing; if browser storage is unavailable, the app refuses to sign so the duplicate-action guard cannot silently disappear.
- Application success requires successful finalized execution and canonical state reconciliation, not a submitted or accepted transaction alone.

## Open vulnerabilities and release blockers

- **Hosted GenVM support:** The local Direct Mode suite covers lifecycle, retry, replay and hostile-output paths, but full compatibility for signed GitHub metadata, SHA-1 blob verification, structured model output and hosted storage/rollback remains unproven on Studionet.
- **Validator GitHub access:** Public unauthenticated GitHub API rate limiting and opaque validator fetch failures can prevent otherwise valid reviews.
- **Model robustness:** Candidate equivalence is less sensitive to valid quote-span variation, but conservative lexical relevance is not semantic entailment and has not yet been evaluated against malicious live documents or a measured semantic benchmark.
- **Wallet interoperability:** The local Playwright harness exercises fake EIP-6963 MetaMask/Rabby-shaped providers, rejection, account change, disconnect and network switching. Hosted preview testing completed a real Rabby connection on 61999, app disconnect/reconnect, injected-provider selection and silent reload. MetaMask was unavailable; real account/network-change handling and selected-provider signed sends remain open.
- **Unknown transaction recovery:** Local signing guards intentionally remain blocked after an ambiguous submission with no known hash. A manual, risk-acknowledged local guard release is available only for unknown no-hash outcomes and finalized execution failures; it cannot prove the absence of an earlier broadcast. Automatic replay is forbidden.
- **Release identity:** The reviewed 0.1.0 contract is deployed at `0x9668263921d88c1deaB8DA5A416a65D562cB4187`; exact source readback, ABI schema, version and finalized deployment receipt are recorded in `docs/RELEASE_MANIFEST.json`. Candidate 0.2.0 is undeployed and separately fingerprinted in `docs/CANDIDATE_V020_MANIFEST.json`. No submission-ready production claim is justified until the candidate is authorized, deployed and verified through a fresh hosted lifecycle.
- **Dependencies:** The frontend production tree and the repository production tree both report zero vulnerabilities. A current full-install audit reports six development-tool findings (four moderate, two critical) in the pinned GenLayer CLI's `vitest`/`tinypool` and `dockerode`/nested `uuid` tree. `npm audit fix --force` proposes replacing the required CLI with `genlayer@0.0.35`, which is an unsafe breaking change; the findings are not shipped by the static frontend, but remain an open CI/build supply-chain limitation until the upstream CLI publishes a compatible fixed dependency graph.

## Security posture

**Locally hardened and verified / not security certified.** The mock-based tests and local build provide reproducible source-level evidence, not proof of hosted consensus, runtime compatibility or wallet-extension safety. No economic custody is included in the V1 design.
