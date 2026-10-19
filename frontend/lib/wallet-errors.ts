export function walletError(cause: unknown): string {
  const error = cause as { code?: number | string; message?: string } | null;
  if (Number(error?.code) === 4001) return "Request rejected in your wallet. Nothing was submitted.";
  if (Number(error?.code) === 4902) return "Studionet is not configured in this wallet yet.";
  if (Number(error?.code) === -32002) return "A wallet request is already open. Check your wallet extension.";
  if (Number(error?.code) === 4100) return "This site is not authorized. Reconnect through your wallet.";
  if (typeof error?.message === "string" && error.message.trim()) return error.message.slice(0, 280);
  return "Wallet request could not complete. Check your extension and try again.";
}
export function chainNumber(raw: unknown): number {
  if (typeof raw !== "string" || !/^0x[0-9a-f]+$/i.test(raw)) throw new Error("Wallet returned an invalid chain identifier.");
  return parseInt(raw, 16);
}
export function validAccount(raw: unknown): raw is string {
  return typeof raw === "string" && /^0x[a-f0-9]{40}$/i.test(raw) && !/^0x0{40}$/i.test(raw);
}
