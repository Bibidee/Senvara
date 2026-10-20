import type { Dossier, RecordStatus } from "./types";

export const shortAddress = (value: string) => value ? value.slice(0, 6) + "…" + value.slice(-4) : "";
export const dateLabel = (unix: number) => unix > 0 ? new Date(unix * 1000).toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"}) : "Not set";
export const RETRYABLE_REASONS = new Set([
  "PROVIDER_OR_PROVENANCE_UNAVAILABLE", "JUDGMENT_UNAVAILABLE",
  "PROVENANCE_UNAVAILABLE", "SOURCE_RETRIEVAL_UNAVAILABLE", "JUDGMENT_EXECUTION_UNAVAILABLE",
  "JUDGMENT_MALFORMED_OUTPUT", "JUDGMENT_CITATION_INVALID",
]);
export const STATUS_LABEL: Record<RecordStatus, string> = {
  AWAITING_REVIEWER: "Awaiting reviewer", READY_FOR_REVIEW: "Ready to assess",
  DECIDED: "Decision recorded", WITHDRAWN: "Withdrawn", DECLINED: "Reviewer declined",
  EXPIRED_UNANSWERED: "No reviewer response", EXPIRED_UNRESOLVED: "Review window expired",
  REVIEW_EXHAUSTED: "Review attempts exhausted",
};
export const FINAL_STATES = new Set<RecordStatus>(["DECIDED", "WITHDRAWN", "DECLINED", "EXPIRED_UNANSWERED", "EXPIRED_UNRESOLVED", "REVIEW_EXHAUSTED"]);
export const summary = (record: Dossier) => record.status === "DECIDED" ? record.decision.replaceAll("_", " ").toLowerCase() : STATUS_LABEL[record.status];
export const hasRetryableDiagnostic = (record: Dossier) =>
  record.decision === "" && record.last_attempt_by !== "" && record.last_attempt_at > 0 && RETRYABLE_REASONS.has(record.last_reason);
export const recordOutcomeSummary = (record: Dossier) => {
  if (record.status === "DECIDED") return record.decision.replaceAll("_", " ").toLowerCase();
  if (record.status === "EXPIRED_UNRESOLVED") return hasRetryableDiagnostic(record)
    ? "The review window expired after a retryable assessment diagnostic. No documentary verdict was reached."
    : "The review window expired without a documentary verdict.";
  if (record.status === "EXPIRED_UNANSWERED") return "The reviewer did not respond before the response window closed.";
  if (record.status === "REVIEW_EXHAUSTED") return "All committed assessment attempts were retryable. No documentary verdict was reached.";
  if (record.status === "READY_FOR_REVIEW" && hasRetryableDiagnostic(record)) return "A previous assessment was retryable; no documentary verdict was reached. A fresh eligible assessment may still be requested.";
  if (record.status === "READY_FOR_REVIEW") return "Both files are frozen. An eligible wallet can request validator assessment within the review window.";
  if (record.status === "AWAITING_REVIEWER") return "The designated reviewer must supply the second source before the assessment stage can begin.";
  return "This record has reached a terminal state without an evidentiary decision.";
};
export const repositoryUrl = (record: Dossier, path: string) => `https://github.com/${record.repository}/blob/${record.commit}/${path.split("/").map(encodeURIComponent).join("/")}`;
export const isTimeToExpire = (record: Dossier, clock = Math.floor(Date.now() / 1000)) =>
  (record.status === "AWAITING_REVIEWER" && clock >= record.response_deadline) ||
  (record.status === "READY_FOR_REVIEW" && clock >= record.review_deadline);
