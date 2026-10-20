export const CHAIN_ID = 61999;
export const CHAIN_HEX = "0xf22f";
export const RPC = process.env.NEXT_PUBLIC_SENVARA_RPC || "https://studio.genlayer.com/api";
export const HISTORICAL_CONTRACT_ADDRESS = "0x9668263921d88c1deaB8DA5A416a65D562cB4187";
export const HISTORICAL_CONTRACT_VERSION = "0.1.0";
export const HISTORICAL_SOURCE_SHA256 = "33385d0283d67cd7c13f0cdafe79ba06c3466a20a35356032afe7c9d32fc797c";
export const CANDIDATE_CONTRACT_VERSION = "0.2.0";
export const CANDIDATE_SOURCE_SHA256 = "d56076f0e63d91d449e4a34f55c3d88474dc13af579c5ddbefe05a02c6e503a2";
export const CANDIDATE_EXPECTED_ADDRESS = "0xF563d381C3ec5BDA61f166Bb1FFf781dE6B81b8C";

// The reviewed v0.2.0 deployment is the active release. The historical
// deployment remains available through an explicit, fully pinned environment
// tuple for compatibility checks; an address alone can never select it.
export const CANDIDATE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SENVARA_V020_CONTRACT || CANDIDATE_EXPECTED_ADDRESS;
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SENVARA_CONTRACT || CANDIDATE_CONTRACT_ADDRESS;
export const CONTRACT_VERSION = process.env.NEXT_PUBLIC_SENVARA_CONTRACT_VERSION || CANDIDATE_CONTRACT_VERSION;
export const CONTRACT_SOURCE_SHA256 = process.env.NEXT_PUBLIC_SENVARA_SOURCE_SHA256 || CANDIDATE_SOURCE_SHA256;
export const EXPLORER = "https://explorer-studio.genlayer.com";
const validAddress = (value:string) => /^0x[0-9a-fA-F]{40}$/.test(value) && !/^0x0{40}$/i.test(value);
const historicalIdentity = CONTRACT_VERSION === HISTORICAL_CONTRACT_VERSION &&
  CONTRACT_ADDRESS.toLowerCase() === HISTORICAL_CONTRACT_ADDRESS.toLowerCase() && CONTRACT_SOURCE_SHA256 === HISTORICAL_SOURCE_SHA256;
const candidateIdentity = CONTRACT_VERSION === CANDIDATE_CONTRACT_VERSION &&
  validAddress(CANDIDATE_CONTRACT_ADDRESS) && validAddress(CANDIDATE_EXPECTED_ADDRESS) &&
  CANDIDATE_CONTRACT_ADDRESS.toLowerCase() === CANDIDATE_EXPECTED_ADDRESS.toLowerCase() &&
  CONTRACT_ADDRESS.toLowerCase() === CANDIDATE_EXPECTED_ADDRESS.toLowerCase() && CONTRACT_SOURCE_SHA256 === CANDIDATE_SOURCE_SHA256;
export const CONFIGURED = validAddress(CONTRACT_ADDRESS) && (historicalIdentity || candidateIdentity);
export const CONTRACT_IDENTITY = Object.freeze({chainId: CHAIN_ID, address: CONTRACT_ADDRESS.toLowerCase(), version: CONTRACT_VERSION, sourceSha256: CONTRACT_SOURCE_SHA256});
export const HISTORICAL_IDENTITY = Object.freeze({chainId: CHAIN_ID, address: HISTORICAL_CONTRACT_ADDRESS.toLowerCase(), version: HISTORICAL_CONTRACT_VERSION, sourceSha256: HISTORICAL_SOURCE_SHA256});
export const NETWORK_PARAMS = [{
  chainId: CHAIN_HEX,
  chainName: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: [RPC],
  blockExplorerUrls: [EXPLORER],
}];
export const TX_PREFIX = "senvara.tx.v1.";
export const INTENT_PREFIX = "senvara.intent.v1.";
export const EVALUATION_GUARD_PREFIX = "senvara.evaluate.v1.";
