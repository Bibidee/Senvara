export type RecordStatus =
  | "AWAITING_REVIEWER" | "READY_FOR_REVIEW" | "DECIDED"
  | "WITHDRAWN" | "DECLINED" | "EXPIRED_UNANSWERED"
  | "EXPIRED_UNRESOLVED" | "REVIEW_EXHAUSTED";
export type ReviewDecision = "SUPPORTED" | "CONTRADICTED" | "MIXED" | "INSUFFICIENT" | "";
export type Dossier = {
  id: number; proposer: string; reviewer: string; assertion: string;
  repository: string; commit: string; primary_path: string; opposing_path: string;
  reviewer_note: string; created_at: number; response_deadline: number;
  review_deadline: number; updated_at: number; last_attempt_at: number;
  last_attempt_by: string; last_attempt_nonce_sha256?: string; attempts: number; status: RecordStatus;
  decision: ReviewDecision; last_reason: string;
};
export type Observation = {
  kind: "RETRYABLE" | "EVALUATED"; reason?: string; decision?: ReviewDecision;
  primary?: string; opposing?: string; primary_quote?: string; opposing_quote?: string;
  primary_sha256?: string; opposing_sha256?: string; signed_payload_sha256?: string;
};
export type WalletSession = {
  provider: EIP1193Provider; walletId: string; name: string; account: string;
  chainId: number; epoch: number;
};
export type EIP1193Provider = {
  request: (request: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};
export type WalletOption = { id: string; name: string; rdns: string; icon: string; provider: EIP1193Provider };
export type TxPhase = "SIGNING" | "SUBMITTED" | "ACCEPTED_PROVISIONAL" | "IN_PROGRESS" | "FINALIZED_UNVERIFIED" | "VERIFYING" | "VERIFIED" | "RETRYABLE" | "FAILED" | "UNDETERMINED" | "UNKNOWN" | "REJECTED" | "GUARD_RELEASED";
export type TxReceipt = {
  id: string; action: string; recordId?: number; account: string; walletId: string;
  createdAt: number; hash: string; phase: TxPhase; message: string; argsDigest: string; expectedAttempt?: number;
  chainId: number; contractAddress: string; contractVersion: string; evaluationGuardKey?: string;
  expectedPreviousStatus?: string; expectedPreviousUpdatedAt?: number;
};
