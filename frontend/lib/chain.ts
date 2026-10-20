import { abi, createClient } from "genlayer-js";
import { simulator } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { encodeFunctionData } from "viem";
import { CANDIDATE_CONTRACT_VERSION, CHAIN_ID, CONFIGURED, CONTRACT_ADDRESS, CONTRACT_VERSION, HISTORICAL_CONTRACT_ADDRESS, HISTORICAL_CONTRACT_VERSION, RPC } from "./constants";
import { parseJsonString, validPath } from "./validation";
import { STATUS_LABEL } from "./format";
import type { Dossier, EIP1193Provider, Observation, TxPhase } from "./types";

type Result = Record<string, unknown>;
const MAX_PAGE = 20;
const CATEGORIES = new Set(["SUPPORTS", "CONTRADICTS", "IRRELEVANT", "AMBIGUOUS"]);
const DECISIONS = new Set(["SUPPORTED", "CONTRADICTED", "MIXED", "INSUFFICIENT"]);
const RETRYABLE_REASONS = new Set([
  "PROVIDER_OR_PROVENANCE_UNAVAILABLE", "JUDGMENT_UNAVAILABLE",
  "PROVENANCE_UNAVAILABLE", "SOURCE_RETRIEVAL_UNAVAILABLE", "JUDGMENT_EXECUTION_UNAVAILABLE",
  "JUDGMENT_MALFORMED_OUTPUT", "JUDGMENT_CITATION_INVALID",
]);
const OPPOSING_STATES = new Set(["READY_FOR_REVIEW", "DECIDED", "EXPIRED_UNRESOLVED", "REVIEW_EXHAUSTED"]);
const READ_ONLY_ACCOUNT = {address: "0x0000000000000000000000000000000000000000"} as never;
const RPC_CHAIN = {...simulator, name: "GenLayer Studionet", id: CHAIN_ID,
  rpcUrls:{default:{http:[RPC]}}} as never;
const CONSENSUS_VALIDATORS = 5;
const CONSENSUS_ROTATIONS = 3;

type ConsensusContract = {address: string; abi: readonly unknown[]};
const genlayerAbi = abi as unknown as {
  calldata: {encode: (value: unknown) => Uint8Array};
  transactions: {serialize: (value: unknown[]) => `0x${string}`};
};

function configured(): `0x${string}` {
  if (!CONFIGURED) throw new Error("The Senvara contract is not configured with a verified release identity.");
  return CONTRACT_ADDRESS as `0x${string}`;
}
function reader() {return createClient({chain:RPC_CHAIN, endpoint:RPC, account:READ_ONLY_ACCOUNT});}
function readerAt(address:string) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address) || /^0x0{40}$/i.test(address)) throw new Error("The requested contract identity is invalid.");
  return createClient({chain:RPC_CHAIN, endpoint:RPC, account:READ_ONLY_ACCOUNT});
}

async function rpcRequest<T>(method: string, params: unknown[] = []): Promise<T> {
  const response = await fetch(RPC, {method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({jsonrpc:"2.0", id:Date.now(), method, params})});
  if (!response.ok) throw new Error(`GenLayer RPC returned HTTP ${response.status}.`);
  const payload = await response.json() as {result?: T; error?: {message?: string}};
  if (payload.error) throw new Error(payload.error.message || "GenLayer RPC request failed.");
  if (payload.result === undefined) throw new Error("GenLayer RPC returned no result.");
  return payload.result;
}

export async function readContract<T>(method: string, args: unknown[] = []): Promise<T> {
  const result = await reader().readContract({address:configured() as never, functionName:method, args:args as never[], stateStatus:TransactionStatus.FINALIZED});
  return result as T;
}
/** Explicit historical read path; it cannot accidentally read the active candidate. */
export async function readHistoricalContract<T>(method: string, args: unknown[] = []): Promise<T> {
  const result = await readerAt(HISTORICAL_CONTRACT_ADDRESS).readContract({address:HISTORICAL_CONTRACT_ADDRESS as never, functionName:method, args:args as never[], stateStatus:TransactionStatus.FINALIZED});
  return result as T;
}

function timestamp(value: unknown, label: string, allowZero = true): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || (allowZero ? value < 0 : value < 1)) throw new Error(`Canonical ${label} is invalid.`);
}

function derivedDecision(primary: string, opposing: string) {
  if (primary === "SUPPORTS" && opposing === "CONTRADICTS" || primary === "CONTRADICTS" && opposing === "SUPPORTS") return "MIXED";
  if (primary === "CONTRADICTS" || opposing === "CONTRADICTS") return "CONTRADICTED";
  if (primary === "SUPPORTS" || opposing === "SUPPORTS") return "SUPPORTED";
  return "INSUFFICIENT";
}

export function validateDossier(rec: Dossier, id: number, contractVersion = CONTRACT_VERSION): Dossier {
  if (!rec || typeof rec !== "object" || rec.id !== id || !Object.hasOwn(STATUS_LABEL, rec.status)) throw new Error("Canonical record has an invalid identity or status.");
  if (typeof rec.assertion !== "string" || rec.assertion.trim() !== rec.assertion || rec.assertion.length < 24 || rec.assertion.length > 420 || rec.assertion.includes("\0")) throw new Error("Canonical record has an invalid assertion.");
  if (typeof rec.repository !== "string" || !/^[a-z0-9-]{1,39}\/[a-z0-9_.-]{1,100}$/.test(rec.repository) || rec.repository.includes("..")) throw new Error("Canonical record has an invalid repository.");
  if (typeof rec.commit !== "string" || !/^[a-f0-9]{40}$/.test(rec.commit)) throw new Error("Canonical record has an invalid revision.");
  if (!/^0x[a-f0-9]{40}$/.test(rec.proposer) || !/^0x[a-f0-9]{40}$/.test(rec.reviewer) || rec.proposer === rec.reviewer) throw new Error("Canonical record has invalid participant wallets.");
  if (typeof rec.primary_path !== "string" || typeof rec.opposing_path !== "string") throw new Error("Canonical evidence paths are malformed.");
  validPath(rec.primary_path);
  if (rec.opposing_path) {validPath(rec.opposing_path);if (rec.opposing_path === rec.primary_path) throw new Error("Canonical evidence paths are not distinct.");}
  if (typeof rec.reviewer_note !== "string" || rec.reviewer_note.length > 300 || rec.reviewer_note.includes("\0")) throw new Error("Canonical reviewer note is malformed.");
  if (typeof rec.last_attempt_by !== "string" || (rec.last_attempt_by !== "" && !/^0x[a-f0-9]{40}$/.test(rec.last_attempt_by))) throw new Error("Canonical evaluator identity is malformed.");
  if (rec.last_attempt_by && ![rec.proposer, rec.reviewer].includes(rec.last_attempt_by)) throw new Error("Canonical evaluator is not a named participant.");
  const hasNonceFingerprint = Object.hasOwn(rec, "last_attempt_nonce_sha256");
  const candidateSchema = contractVersion === CANDIDATE_CONTRACT_VERSION;
  if (candidateSchema && !hasNonceFingerprint) throw new Error("Candidate record is missing its evaluation nonce fingerprint field.");
  if (!candidateSchema && contractVersion !== HISTORICAL_CONTRACT_VERSION) throw new Error("Canonical contract version is unsupported.");
  if (!candidateSchema && hasNonceFingerprint) throw new Error("Historical record has an unexpected candidate-only nonce fingerprint field.");
  const nonceFingerprint = hasNonceFingerprint ? rec.last_attempt_nonce_sha256 : undefined;
  if (candidateSchema && (typeof nonceFingerprint !== "string" || (nonceFingerprint !== "" && !/^[a-f0-9]{64}$/.test(nonceFingerprint)))) throw new Error("Canonical evaluation nonce fingerprint is malformed.");
  if (!Number.isSafeInteger(rec.attempts) || rec.attempts < 0 || rec.attempts > 3) throw new Error("Canonical attempt count is invalid.");
  const noEvaluation = rec.status !== "DECIDED" && rec.decision === "" && rec.attempts === 0 && rec.last_attempt_by === "" && rec.last_attempt_at === 0 && rec.last_reason === "" && (!candidateSchema || nonceFingerprint === "");
  const retryableCandidate = candidateSchema && rec.attempts === 0 && rec.status === "READY_FOR_REVIEW" && rec.last_attempt_by !== "" &&
    rec.last_attempt_at > 0 && RETRYABLE_REASONS.has(rec.last_reason) && typeof nonceFingerprint === "string" && nonceFingerprint !== "";
  const conclusiveCandidate = candidateSchema && rec.attempts > 0 && rec.status === "DECIDED" && rec.last_attempt_by !== "" &&
    rec.last_attempt_at > 0 && rec.last_reason === "" && typeof nonceFingerprint === "string" && nonceFingerprint !== "";
  const historicalConclusive = !candidateSchema && rec.attempts > 0 && rec.status === "DECIDED" && rec.last_attempt_by !== "" &&
    rec.last_attempt_at > 0 && rec.last_reason === "";
  const historicalRetryable = !candidateSchema && rec.attempts > 0 &&
    (rec.status === "READY_FOR_REVIEW" || rec.status === "REVIEW_EXHAUSTED") && rec.last_attempt_by !== "" &&
    rec.last_attempt_at > 0 && RETRYABLE_REASONS.has(rec.last_reason);
  if (!noEvaluation && !retryableCandidate && !conclusiveCandidate && !historicalConclusive && !historicalRetryable) throw new Error("Canonical attempt identity is inconsistent.");
  if (rec.status === "DECIDED" ? !DECISIONS.has(rec.decision) : rec.decision !== "") throw new Error("Canonical decision does not match record status.");
  if (OPPOSING_STATES.has(rec.status) !== Boolean(rec.opposing_path)) throw new Error("Canonical source state is inconsistent.");
  timestamp(rec.created_at, "creation time", false);timestamp(rec.response_deadline, "response deadline", false);timestamp(rec.review_deadline, "review deadline");timestamp(rec.updated_at, "update time", false);timestamp(rec.last_attempt_at, "last attempt time");
  if (rec.response_deadline < rec.created_at || rec.updated_at < rec.created_at || (rec.last_attempt_at && rec.last_attempt_at < rec.created_at) || (rec.last_attempt_at && rec.updated_at < rec.last_attempt_at)) throw new Error("Canonical record timeline is inconsistent.");
  if (rec.status === "AWAITING_REVIEWER" && rec.review_deadline !== 0 || rec.status !== "AWAITING_REVIEWER" && rec.status !== "WITHDRAWN" && rec.status !== "DECLINED" && rec.status !== "EXPIRED_UNANSWERED" && rec.review_deadline === 0) throw new Error("Canonical review deadline is inconsistent.");
  if (typeof rec.last_reason !== "string" || rec.last_reason.length > 100) throw new Error("Canonical diagnostic is malformed.");
  return rec;
}

export async function totalRecords(): Promise<number> {
  const value = Number(await readContract("get_total"));
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Contract returned an invalid record count.");
  return value;
}
export async function dossierById(id: number): Promise<Dossier> {
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Invalid record identifier.");
  const rec = parseJsonString<Dossier>(await readContract("get_dossier", [BigInt(id)]));
  return validateDossier(rec, id);
}
export async function observationById(id: number, attempt: number): Promise<Observation> {
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(attempt) || attempt < 1 || attempt > 3) throw new Error("Invalid observation identifier.");
  const observation = parseJsonString<Observation>(await readContract("get_observation", [BigInt(id), BigInt(attempt)]));
  if (!observation || (observation.kind !== "RETRYABLE" && observation.kind !== "EVALUATED")) throw new Error("Canonical observation has an invalid kind.");
  if (observation.kind === "RETRYABLE") {
    if (typeof observation.reason !== "string" || !RETRYABLE_REASONS.has(observation.reason)) throw new Error("Canonical retry reason is invalid.");
    return observation;
  }
  if (typeof observation.primary !== "string" || !CATEGORIES.has(observation.primary) || typeof observation.opposing !== "string" || !CATEGORIES.has(observation.opposing) || observation.decision !== derivedDecision(observation.primary, observation.opposing)) throw new Error("Canonical observation classifications are inconsistent.");
  for (const [category, quote] of [[observation.primary, observation.primary_quote], [observation.opposing, observation.opposing_quote]] as const) {
    if (typeof quote !== "string" || quote.length > 320 || (CATEGORIES.has(category) && ["SUPPORTS", "CONTRADICTS"].includes(category) && quote.length < 8) || (!["SUPPORTS", "CONTRADICTS"].includes(category) && quote !== "")) throw new Error("Canonical observation citation is invalid.");
  }
  for (const hash of [observation.primary_sha256, observation.opposing_sha256, observation.signed_payload_sha256]) if (typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash)) throw new Error("Canonical observation fingerprint is invalid.");
  return observation;
}
export async function listDossiers(offset=0, limit=12) {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PAGE) throw new Error("Invalid page request.");
  const page = parseJsonString<{total:number;ids:number[]}>(await readContract("list_dossiers", [BigInt(offset),BigInt(limit)]));
  if (!Number.isSafeInteger(page.total) || page.total<0 || !Array.isArray(page.ids) || page.ids.length>limit ||
      page.ids.some((id,i)=>!Number.isSafeInteger(id)||id<1||id>page.total||(i>0&&id>=page.ids[i-1]))) throw new Error("Invalid list response.");
  return page;
}
export async function writeContract(method: string, args: unknown[], account: string, provider: EIP1193Provider, beforeSend?: () => Promise<void>): Promise<string> {
  if (!provider || typeof provider.request !== "function") throw new Error("The selected wallet provider is unavailable.");
  if (!/^0x[0-9a-fA-F]{40}$/.test(account) || /^0x0{40}$/i.test(account)) throw new Error("The selected wallet account is invalid.");
  const consensus = await rpcRequest<ConsensusContract>("sim_getConsensusContract", ["ConsensusMain"]);
  if (!consensus || typeof consensus.address !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(consensus.address) || !Array.isArray(consensus.abi)) {
    throw new Error("GenLayer did not return a usable consensus contract.");
  }
  const callObject = args.length ? {method, args} : {method};
  const contractData = genlayerAbi.calldata.encode(callObject);
  const serializedData = genlayerAbi.transactions.serialize([contractData, false]);
  const encode = encodeFunctionData as unknown as (input: {abi: readonly unknown[]; functionName: string; args: readonly unknown[]}) => `0x${string}`;
  const data = encode({
    abi: consensus.abi as never,
    functionName: "addTransaction",
    args: [account, configured(), CONSENSUS_VALIDATORS, CONSENSUS_ROTATIONS, serializedData],
  });
  if (beforeSend) await beforeSend();
  const hash = await provider.request({method:"eth_sendTransaction", params:[{
    from:account, to:consensus.address, data, value:"0x0",
  }]});
  const value = String(hash);
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) throw new Error("Unexpected transaction identifier from GenLayer. Verify the wallet activity before retrying.");
  return value;
}
function record(value: unknown): Result {return value && typeof value==="object"?value as Result:{};}
function receiptExecution(raw: Result) {
  const receipts = record(raw.consensus_data).leader_receipt;
  const leader = Array.isArray(receipts)?record(receipts[0]):record(receipts);
  const explicit = raw.txExecutionResultName;
  const run = leader.execution_result;
  const error = leader.error;
  const result = record(leader.result);
  const status = result.status;
  if (error || (typeof status === "string" && status!=="return")) return "ERROR";
  if (run === "ERROR" || explicit === "FINISHED_WITH_ERROR") return "ERROR";
  if (run === "SUCCESS" || explicit === "FINISHED_WITH_RETURN") return "SUCCESS";
  return "UNKNOWN";
}
export function classifyTransaction(rawInput: unknown): {phase:TxPhase;description:string} {
  const raw=record(rawInput);
  const status = String(raw.statusName || raw.status_name || raw.status || "UNKNOWN").toUpperCase();
  const execution=receiptExecution(raw);
  if (status.includes("UNDETERMINED") || status.includes("DISAGREE") || status.includes("TIMEOUT")) return {phase:"UNDETERMINED",description:"Consensus did not establish a final result. Do not resend automatically."};
  if (status==="CANCELLED" || status==="CANCELED") return {phase:"FAILED",description:"The protocol canceled the transaction."};
  if (status==="FINALIZED" || status==="7") {
    if (execution==="ERROR") return {phase:"FAILED",description:"Finalized, but contract execution failed."};
    if (execution==="SUCCESS") return {phase:"VERIFYING",description:"Finalized successfully. Checking canonical contract state."};
    return {phase:"FINALIZED_UNVERIFIED",description:"Finalized without enough execution evidence. No success is claimed."};
  }
  if (status==="ACCEPTED" || status===String(TransactionStatus.ACCEPTED).toUpperCase()) return {phase:"ACCEPTED_PROVISIONAL",description:"Accepted provisionally, not yet final."};
  if (["PENDING","PROPOSING","COMMITTING","REVEALING","SUBMITTED"].includes(status)) return {phase:"IN_PROGRESS",description:"Consensus and execution are pending."};
  return {phase:"UNKNOWN",description:"Cannot classify the current protocol response. Keep the hash for recovery."};
}
export async function transactionState(hash:string) {
  const raw=await reader().getTransaction({hash:hash as never});
  return classifyTransaction(raw);
}
