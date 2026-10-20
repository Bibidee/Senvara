const fs = require("node:fs");
const crypto = require("node:crypto");

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(`${root}/docs/CANDIDATE_V020_MANIFEST.json`, "utf8"));
const sourcePath = `${root}/${manifest.contract_path}`;
const source = fs.readFileSync(sourcePath);
const text = source.toString("utf8");
const sha256 = crypto.createHash("sha256").update(source).digest("hex");

function fail(message) { throw new Error(`candidate verification failed: ${message}`); }
function expect(condition, message) { if (!condition) fail(message); }

expect(manifest.candidate_version === "0.2.0", "manifest version is not 0.2.0");
expect(["UNDEPLOYED_CANDIDATE", "DEPLOYED_VERIFIED"].includes(manifest.status), "candidate status is invalid");
expect(manifest.network?.chain_id === 61999 && manifest.network.rpc === "https://studio.genlayer.com/api", "candidate network is not Studionet 61999");
if (manifest.status === "UNDEPLOYED_CANDIDATE") {
  expect(manifest.contract_address === null && manifest.deployment_transaction === null, "undeployed candidate contains deployment identity");
} else {
  expect(/^0x[0-9a-f]{40}$/i.test(manifest.contract_address), "deployed candidate address is invalid");
  expect(/^0x[0-9a-f]{64}$/i.test(manifest.deployment_transaction), "deployed candidate transaction is invalid");
}
expect(sha256 === manifest.source_sha256, `source SHA-256 is ${sha256}, not manifest value`);
expect(source.length === manifest.source_size_bytes, `source size is ${source.length}, not manifest value`);
expect(text.includes('VERSION = "0.2.0"'), "candidate source version marker is missing");
expect(text.includes("run_nondet_unsafe"), "candidate does not use the required GenVM consensus interface");

const methodPatterns = [
  /def propose\(self, assertion: str, repository: str, commit_sha: str, primary_path: str,\s*reviewer: str, response_seconds: u256\)/,
  /def respond\(self, number: u256, opposing_path: str, context: str\)/,
  /def decline\(self, number: u256\)/,
  /def withdraw\(self, number: u256\)/,
  /def close_expired\(self, number: u256\)/,
  /def evaluate\(self, number: u256, request_nonce: str\)/,
  /def get_version\(self\) -> str/,
  /def get_total\(self\) -> u256/,
  /def get_dossier\(self, number: u256\) -> str/,
  /def get_observation\(self, number: u256, attempt: u256\) -> str/,
  /def list_dossiers\(self, offset: u256, limit: u256\) -> str/,
];
for (const pattern of methodPatterns) expect(pattern.test(text), `public method missing: ${pattern}`);

const constants = fs.readFileSync(`${root}/frontend/lib/constants.ts`, "utf8");
expect(constants.includes(`CANDIDATE_SOURCE_SHA256 = "${manifest.source_sha256}"`), "frontend candidate source identity differs");
expect(constants.includes(`CANDIDATE_EXPECTED_ADDRESS = "${manifest.contract_address}"`), "frontend candidate expected address differs");
expect(constants.includes(`CANDIDATE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SENVARA_V020_CONTRACT || CANDIDATE_EXPECTED_ADDRESS`), "frontend candidate override is not pinned");
expect(constants.includes("HISTORICAL_CONTRACT_ADDRESS = \"0x9668263921d88c1deaB8DA5A416a65D562cB4187\""), "historical address identity was removed");
expect(constants.includes("CHAIN_ID = 61999") && constants.includes("https://studio.genlayer.com/api"), "frontend network identity differs");
expect(manifest.historical_deployment_preserved === true, "historical preservation flag is absent");
expect(manifest.public_abi_schema && Object.keys(manifest.public_abi_schema).length === manifest.public_abi.length, "full candidate ABI schema is absent");

console.log(`candidate verification: PASS (${manifest.candidate_version}, ${source.length} bytes, ${sha256})`);
