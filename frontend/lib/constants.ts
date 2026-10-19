export const CHAIN_ID = 61999;
export const CHAIN_HEX = "0xf22f";
export const RPC = process.env.NEXT_PUBLIC_SENVARA_RPC || "https://studio.genlayer.com/api";
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SENVARA_CONTRACT || "";
export const EXPLORER = "https://explorer-studio.genlayer.com";
export const CONFIGURED = /^0x[0-9a-fA-F]{40}$/.test(CONTRACT_ADDRESS) && !/^0x0{40}$/i.test(CONTRACT_ADDRESS);
export const NETWORK_PARAMS = [{
  chainId: CHAIN_HEX,
  chainName: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: [RPC],
  blockExplorerUrls: [EXPLORER],
}];
export const TX_PREFIX = "senvara.tx.v1.";
export const INTENT_PREFIX = "senvara.intent.v1.";
