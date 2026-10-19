import type { Dossier, RecordStatus } from "./types";

export const shortAddress = (value: string) => value ? value.slice(0, 6) + "…" + value.slice(-4) : "";
export const dateLabel = (unix: number) => unix > 0 ? new Date(unix * 1000).toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"}) : "Not set";
export const STATUS_LABEL: Record<RecordStatus, string> = {
  AWAITING_REVIEWER: "Awaiting reviewer", READY_FOR_REVIEW: "Ready to assess",
  DECIDED: "Decision recorded", WITHDRAWN: "Withdrawn", DECLINED: "Reviewer declined",
  EXPIRED_UNANSWERED: "No reviewer response", EXPIRED_UNRESOLVED: "Review window expired",
  REVIEW_EXHAUSTED: "Review attempts exhausted",
};
export const FINAL_STATES = new Set<RecordStatus>(["DECIDED", "WITHDRAWN", "DECLINED", "EXPIRED_UNANSWERED", "EXPIRED_UNRESOLVED", "REVIEW_EXHAUSTED"]);
export const summary = (record: Dossier) => record.status === "DECIDED" ? record.decision.replaceAll("_", " ").toLowerCase() : STATUS_LABEL[record.status];
export const repositoryUrl = (record: Dossier, path: string) => `https://github.com/${record.repository}/blob/${record.commit}/${path.split("/").map(encodeURIComponent).join("/")}`;
export const isTimeToExpire = (record: Dossier, clock = Math.floor(Date.now() / 1000)) =>
  (record.status === "AWAITING_REVIEWER" && clock >= record.response_deadline) ||
  (record.status === "READY_FOR_REVIEW" && clock >= record.review_deadline);
