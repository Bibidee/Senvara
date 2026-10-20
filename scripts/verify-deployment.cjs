const fs = require("node:fs");
const crypto = require("node:crypto");

const expected = {
  chainId: 61999,
  address: "0x9668263921d88c1deaB8DA5A416a65D562cB4187",
  rpc: "https://studio.genlayer.com/api",
  version: "0.1.0",
  sourceSha256: "33385d0283d67cd7c13f0cdafe79ba06c3466a20a35356032afe7c9d32fc797c",
  sourceBytes: 19552,
};

function fail(message) {
  throw new Error(`deployment consistency check failed: ${message}`);
}

function readEnv(path) {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(fs.readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean).map(line => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1)];
  }));
}

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(`${root}/docs/RELEASE_MANIFEST.json`, "utf8"));
const source = fs.readFileSync(`${root}/contracts/senvara.py`);
const sourceSha256 = crypto.createHash("sha256").update(source).digest("hex");
if (source.length !== expected.sourceBytes || sourceSha256 !== expected.sourceSha256) fail("local contract source fingerprint differs from canonical deployment");
if (manifest.chain_id !== expected.chainId || manifest.contract_address !== expected.address || manifest.rpc !== expected.rpc) fail("release manifest identity differs from canonical deployment");
if (manifest.contract_sha256 !== expected.sourceSha256 || manifest.contract_size_bytes !== expected.sourceBytes || manifest.version !== expected.version) fail("release manifest source/version differs from canonical deployment");
if (manifest.deployed_source_parity !== "EXACT_SHA256_MATCH" || manifest.deployment_receipt?.status !== "FINALIZED") fail("manifest does not record finalized exact source parity");
if (manifest.deployed_contract_readback?.schema_evaluate !== "evaluate(number:int, request_nonce:string)" || manifest.deployed_contract_readback?.get_version !== expected.version) fail("manifest ABI/version readback is stale");

const constants = fs.readFileSync(`${root}/frontend/lib/constants.ts`, "utf8");
if (!constants.includes(`export const CHAIN_ID = ${expected.chainId};`) || !constants.includes(`export const CHAIN_HEX = "0xf22f";`) || !constants.includes(`https://studio.genlayer.com/api`)) fail("frontend chain constants are stale");
for (const envPath of [`${root}/frontend/.env.historical.example`]) {
  const env = readEnv(envPath);
  if (Object.keys(env).length && (env.NEXT_PUBLIC_SENVARA_CONTRACT !== expected.address || env.NEXT_PUBLIC_SENVARA_RPC !== expected.rpc || env.NEXT_PUBLIC_SENVARA_CONTRACT_VERSION !== expected.version || env.NEXT_PUBLIC_SENVARA_SOURCE_SHA256 !== expected.sourceSha256)) fail(`${envPath} is stale`);
}

console.log(`deployment consistency: PASS (${expected.address}, Studionet ${expected.chainId}, ${expected.sourceBytes} bytes, ${expected.sourceSha256})`);
