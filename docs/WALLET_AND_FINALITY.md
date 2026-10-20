# Wallet, Browser State and Finality

## Connection

The wallet chooser responds to `eip6963:announceProvider`, requests announcements and falls back to `window.ethereum`. Only an explicit click sends `eth_requestAccounts`. The browser tracks the selected provider object, wallet label, address, chain ID and session epoch. Address and network changes invalidate the prior epoch. A write rechecks the active session, `eth_accounts` and `eth_chainId` immediately before invoking the GenLayer SDK.

The selected wallet preference is stored only as a provider identifier so an already-authorized wallet can reconnect silently after refresh; restoration calls `eth_accounts`, never `eth_requestAccounts`. The app-local disconnect clears that preference and discards its session. Browser extensions generally cannot be ungranted by a dApp; users revoke their permission from the extension itself. Public reads never require a signing wallet.

Before the final `eth_sendTransaction`, the selected provider, account, and Studionet
chain are rechecked after calldata preparation. Transaction recovery state must be
persisted before signing; if browser storage is unavailable, the app refuses to sign.

## Network handling

Only Studionet chain 61999 (`0xf22f`) is allowed for writes. The app first requests `wallet_switchEthereumChain`. It attempts `wallet_addEthereumChain` only on error code 4902 and verifies `eth_chainId` after the operation. Signature rejection code 4001 and in-progress request code -32002 are surfaced clearly.

## Transaction lifecycle

| Phase | Frontend promise |
|---|---|
| `SIGNING` | wallet request initiated, no hash returned |
| `SUBMITTED` | hash returned, persisted locally; no protocol outcome inferred |
| `IN_PROGRESS` | consensus not terminal |
| `ACCEPTED_PROVISIONAL` | acceptance is explicitly not finality |
| `FINALIZED_UNVERIFIED` | protocol finalized but receipt execution or canonical readback is insufficient |
| `VERIFYING` | successful execution reported; canonical state is being checked |
| `VERIFIED` | finalized execution and matching contract state observed |
| `FAILED` | explicit canceled or reverted execution |
| `UNDETERMINED` | consensus has not reached a conclusive result |
| `UNKNOWN` | RPC or wallet failed to provide a safely classified result |
| `REJECTED` | wallet explicitly rejected before broadcast |
| `GUARD_RELEASED` | user explicitly cleared the local write guard with risk acknowledgement; no network result inferred |

The transaction list is stored under a versioned browser-local key. The digest-based action guard is written before the wallet prompt; after a crash in `SIGNING` or unknown no-hash response, the guard remains. Users must not send a new transaction until wallet and network state are reconciled. A guarded manual release action is provided for unsigned unknown submissions and finalized execution failures, with explicit warning that clearing local storage cannot prove absence of an earlier broadcast. **This is not a substitute for provider-level wallet recovery.**

Canonical verification validates the exact submitted action tuple where the contract exposes it and requires an evaluator attempt count to advance. Concurrent action ordering and provider-specific receipt shapes still require hosted runtime tests before release. Neither local history nor an explorer hyperlink makes a product claim true.

## Browser test matrix to execute before launch

The required extension matrix is: MetaMask and Rabby; no wallet, one wallet, multiple wallets, initially connected, disconnected, wrong network, 4902 add chain, switch denied, signature rejected, account change before signing, account change during popup, network change during popup, two rapid clicks, reload before hash, reload after hash, unknown status, delayed finality, execution failure, successful canonical readback, source 403 and mobile viewport. The repository's local harness uses fake EIP-6963 providers. Real Rabby evidence now includes the candidate lifecycle, account switching, silent reload recovery and one finalized rejection against an already-decided record; the remaining extension matrix is still a release gate unless separately evidenced.
