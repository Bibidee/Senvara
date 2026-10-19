"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CHAIN_ID, NETWORK_PARAMS } from "@/lib/constants";
import { chainNumber, validAccount, walletError } from "@/lib/wallet-errors";
import type { EIP1193Provider, WalletOption, WalletSession } from "@/lib/types";

type ContextType = {
  wallets: WalletOption[]; session: WalletSession | null; connecting: string;
  error: string; clearError: () => void; connect: (id: string) => Promise<void>;
  disconnect: () => void; switchNetwork: () => Promise<void>;
  assertCurrent: (captured: WalletSession) => Promise<void>;
};
const WalletContext = createContext<ContextType | null>(null);
const uniqueId = (name: string) => name.toLowerCase().replace(/[^a-z0-9.:-]/g, "-");
const WALLET_PREFERENCE_KEY = "senvara.wallet.preference.v1";
const readWalletPreference = () => {try {return window.localStorage.getItem(WALLET_PREFERENCE_KEY)} catch {return null}};
const writeWalletPreference = (value: string | null) => {try {if(value) window.localStorage.setItem(WALLET_PREFERENCE_KEY,value);else window.localStorage.removeItem(WALLET_PREFERENCE_KEY)} catch {/* local recovery state is optional */}};

export function WalletProvider({children}: {children: ReactNode}) {
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [connecting, setConnecting] = useState("");
  const [error, setError] = useState("");
  const registry = useRef(new Map<string, WalletOption>());
  const sessionRef = useRef<WalletSession | null>(null);
  const epoch = useRef(0);
  const requestInProgress = useRef(false);
  const restoreInProgress = useRef(new Set<string>());

  const update = useCallback((value: WalletSession | null) => {
    sessionRef.current = value;
    setSession(value);
  }, []);
  useEffect(() => {
    const restore = async (candidate: WalletOption) => {
      if (restoreInProgress.current.has(candidate.id) || sessionRef.current) return;
      if (readWalletPreference() !== candidate.id) return;
      restoreInProgress.current.add(candidate.id);
      try {
        const rawAccounts = await candidate.provider.request({method:"eth_accounts"});
        const account = Array.isArray(rawAccounts) ? rawAccounts[0] : undefined;
        if (!validAccount(account) || sessionRef.current) return;
        const chainId = chainNumber(await candidate.provider.request({method:"eth_chainId"}));
        epoch.current += 1;
        update({provider:candidate.provider, walletId:candidate.id, name:candidate.name,
          account:account.toLowerCase(), chainId, epoch:epoch.current});
      } catch {
        // Passive restoration must never open a wallet prompt or block the app.
      } finally {
        restoreInProgress.current.delete(candidate.id);
      }
    };
    const register = (incoming: WalletOption) => {
      const existing = [...registry.current.values()].find(w => w.provider === incoming.provider);
      if (existing) return;
      const id = registry.current.has(incoming.id) ? incoming.id + "-" + registry.current.size : incoming.id;
      const candidate = {...incoming, id};
      registry.current.set(id, candidate);
      setWallets([...registry.current.values()]);
      void restore(candidate);
    };
    const discover = (event: Event) => {
      const detail = (event as CustomEvent).detail as { info?: {uuid?: string; name?: string; rdns?: string; icon?: string}; provider?: EIP1193Provider } | undefined;
      if (!detail?.provider || typeof detail.provider.request !== "function") return;
      register({id: uniqueId(detail.info?.uuid || detail.info?.rdns || detail.info?.name || "injected"),
        name: detail.info?.name?.slice(0, 80) || "Browser wallet", rdns: detail.info?.rdns || "",
        icon: detail.info?.icon || "", provider: detail.provider});
    };
    window.addEventListener("eip6963:announceProvider", discover);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const registerLegacy = () => {
      const injected = (window as Window & {ethereum?: EIP1193Provider}).ethereum;
      const providers = (injected as (EIP1193Provider & {providers?: EIP1193Provider[]}) | undefined)?.providers;
      if (Array.isArray(providers) && providers.length > 1) {
        providers.forEach((provider, index) => {
          if (provider) register({id:`injected-${index + 1}`, name:`Injected wallet ${index + 1}`, rdns:"", icon:"", provider});
        });
      } else if (injected?.request) register({id:"injected", name:"Injected wallet", rdns:"", icon:"", provider:injected});
    };
    registerLegacy();
    // Some extensions inject after hydration without EIP-6963 announcements.
    window.addEventListener("ethereum#initialized",registerLegacy);
    const fallbackTimer=window.setTimeout(registerLegacy,1200);
    return () => {
      window.removeEventListener("eip6963:announceProvider", discover);
      window.removeEventListener("ethereum#initialized",registerLegacy);
      window.clearTimeout(fallbackTimer);
    };
  }, [update]);

  // The active provider is the only one subscribed to account and chain changes.
  useEffect(() => {
    if (!session) return;
    const provider = session.provider;
    let live = true;
    const onAccounts = (accounts: unknown) => {
      const current=sessionRef.current;
      if (!live || !current || current.provider !== provider) return;
      epoch.current += 1;
      const account = Array.isArray(accounts) ? accounts[0] : undefined;
      if (!validAccount(account)) { update(null); setError("Wallet disconnected or locked. Connect again to write."); return; }
      update({...current, account: account.toLowerCase(), epoch: epoch.current});
    };
    const onChain = (raw: unknown) => {
      const current=sessionRef.current;
      if (!live || !current || current.provider !== provider) return;
      epoch.current += 1;
      try { update({...current, chainId: chainNumber(raw), epoch: epoch.current}); }
      catch { update(null); setError("Wallet returned an invalid chain. Reconnect to continue."); }
    };
    provider.on?.("accountsChanged", onAccounts);
    provider.on?.("chainChanged", onChain);
    return () => {live=false;provider.removeListener?.("accountsChanged", onAccounts);provider.removeListener?.("chainChanged", onChain);};
  }, [session, update]);

  const connect = async (id: string) => {
    if (requestInProgress.current) {setError("Another connection request is open."); return;}
    const chosen = registry.current.get(id);
    if (!chosen) {setError("Select a detected wallet first.");return;}
    requestInProgress.current = true;
    setConnecting(id);setError("");
    try {
      const rawAccounts = await chosen.provider.request({method:"eth_requestAccounts"});
      const account = Array.isArray(rawAccounts) ? rawAccounts[0] : undefined;
      if (!validAccount(account)) throw new Error("No authorized account returned by this wallet.");
      const chainId = chainNumber(await chosen.provider.request({method:"eth_chainId"}));
      epoch.current += 1;
      update({provider:chosen.provider, walletId:id, name:chosen.name, account:account.toLowerCase(), chainId, epoch:epoch.current});
      writeWalletPreference(id);
    } catch(cause) {setError(walletError(cause));}
    finally {setConnecting("");requestInProgress.current=false;}
  };
  const disconnect = () => {
    epoch.current += 1;
    update(null);setError("");
    writeWalletPreference(null);
    // EIP-1193 generally cannot revoke extension permissions. This is app-local.
  };
  const switchNetwork = async () => {
    const selected = sessionRef.current;
    if (!selected) {setError("Connect your wallet first.");return;}
    setError("");
    try {
      try {await selected.provider.request({method:"wallet_switchEthereumChain", params:[{chainId:NETWORK_PARAMS[0].chainId}]});}
      catch(cause) {
        if (Number((cause as {code?:number})?.code) !== 4902) throw cause;
        await selected.provider.request({method:"wallet_addEthereumChain", params:NETWORK_PARAMS});
        await selected.provider.request({method:"wallet_switchEthereumChain", params:[{chainId:NETWORK_PARAMS[0].chainId}]});
      }
      const chainId = chainNumber(await selected.provider.request({method:"eth_chainId"}));
      if (chainId !== CHAIN_ID) throw new Error("The wallet did not switch to Studionet 61999.");
      const current=sessionRef.current;
      const accounts = await selected.provider.request({method:"eth_accounts"});
      if (!current || current.provider !== selected.provider || current.account !== String(Array.isArray(accounts) ? accounts[0] : "").toLowerCase()) throw new Error("Wallet changed during network switching.");
      epoch.current += 1;
      update({...current, chainId, epoch:epoch.current});
    } catch(cause) {setError(walletError(cause));}
  };
  const assertCurrent = async (captured: WalletSession) => {
    const active = sessionRef.current;
    if (!active || active.provider !== captured.provider || active.account !== captured.account || active.epoch !== captured.epoch) {
      throw new Error("Wallet or account changed. Review the action and begin again.");
    }
    const accounts = await captured.provider.request({method:"eth_accounts"});
    if (!Array.isArray(accounts) || String(accounts[0]).toLowerCase() !== captured.account) throw new Error("Wallet account changed before signing.");
    const chainId = chainNumber(await captured.provider.request({method:"eth_chainId"}));
    if (chainId !== CHAIN_ID) throw new Error("Switch to GenLayer Studionet 61999 before signing.");
    const latest = sessionRef.current;
    if (!latest || latest.provider !== captured.provider || latest.account !== captured.account || latest.epoch !== captured.epoch) {
      throw new Error("Wallet or account changed while preparing the signature. Review the action and begin again.");
    }
  };
  return <WalletContext.Provider value={{wallets,session,connecting,error,clearError:()=>setError(""),connect,disconnect,switchNetwork,assertCurrent}}>{children}</WalletContext.Provider>;
}
export function useWallet() {const wallet=useContext(WalletContext);if(!wallet) throw new Error("Wallet provider unavailable");return wallet;}
