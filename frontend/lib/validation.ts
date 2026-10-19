export function prepareProposal(input: {
  assertion: string; repository: string; commit: string; primary: string;
  reviewer: string; days: number;
}): { args: [string, string, string, string, string, bigint] } {
  const assertion = input.assertion.trim();
  if (assertion.length < 24 || assertion.length > 420) throw new Error("The claim must be 24 to 420 characters.");
  const repository = input.repository.trim().toLowerCase();
  if (!/^[a-z0-9-]{1,39}\/[a-z0-9_.-]{1,100}$/.test(repository) || repository.includes("..")) throw new Error("Enter a GitHub repository as owner/name.");
  const commit = input.commit.trim().toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("A full 40-character Git commit is required.");
  const primary = validPath(input.primary);
  const reviewer = input.reviewer.trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(reviewer) || /^0x0{40}$/.test(reviewer)) throw new Error("Enter a valid reviewer wallet address.");
  if (!Number.isInteger(input.days) || input.days < 1 || input.days > 14) throw new Error("Choose a response window between 1 and 14 days.");
  return { args: [assertion, repository, commit, primary, reviewer, BigInt(input.days * 86400)] };
}
export function validPath(value: string): string {
  if (value !== value.trim() || value.length > 180 || !/^[A-Za-z0-9._/-]+$/.test(value) || value.startsWith("/") || value.split("/").length > 8 || value.split("/").some(s => ["", ".", ".."].includes(s))) {
    throw new Error("Enter a repository-relative file path without traversal or URL characters.");
  }
  return value;
}
export function parseJsonString<T>(value: unknown): T {
  if (typeof value !== "string") throw new Error("Contract returned a non-text record.");
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Contract response has the wrong shape.");
  return parsed as T;
}
