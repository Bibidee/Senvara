const fs = require("node:fs");
const crypto = require("node:crypto");

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(`${root}/docs/CANDIDATE_V020_MANIFEST.json`, "utf8"));
const rpc = manifest.network.rpc;

function fail(message) { throw new Error(`deployed v0.2.0 verification failed: ${message}`); }
function expect(condition, message) { if (!condition) fail(message); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

async function request(method, params) {
  const response = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  const body = await response.json();
  if (body.error) fail(`${method}: ${body.error.message || JSON.stringify(body.error)}`);
  return body.result;
}

async function main() {
  expect(manifest.status === "DEPLOYED_VERIFIED", "candidate is not marked DEPLOYED_VERIFIED");
  expect(manifest.network.chain_id === 61999 && rpc === "https://studio.genlayer.com/api", "network identity differs");
  expect(/^0x[0-9a-f]{40}$/i.test(manifest.contract_address), "contract address is invalid");
  expect(/^0x[0-9a-f]{64}$/i.test(manifest.deployment_transaction), "deployment transaction is invalid");

  const localSource = fs.readFileSync(`${root}/${manifest.contract_path}`);
  expect(sha256(localSource) === manifest.source_sha256, "local source SHA-256 differs from manifest");
  expect(localSource.length === manifest.source_size_bytes, "local source size differs from manifest");

  const deployedBase64 = await request("gen_getContractCode", [manifest.contract_address]);
  const deployedSource = Buffer.from(deployedBase64, "base64");
  expect(deployedSource.equals(localSource), "decoded deployed source differs from local source");

  const schema = await request("gen_getContractSchema", [manifest.contract_address]);
  const methodNames = Object.keys(schema.methods || {}).sort();
  const expectedMethodNames = manifest.public_abi.map((entry) => entry.slice(0, entry.indexOf("("))).sort();
  expect(JSON.stringify(methodNames) === JSON.stringify(expectedMethodNames), "deployed ABI method set differs from manifest");
  expect(manifest.public_abi_schema && typeof manifest.public_abi_schema === "object", "full ABI schema is missing from manifest");
  const comparable = (value) => ({
    params: value.params || [],
    kwparams: value.kwparams || {},
    readonly: value.readonly === true,
    ret: value.ret,
    payable: value.payable === true,
  });
  for (const methodName of expectedMethodNames) {
    const actual = schema.methods[methodName];
    const expected = manifest.public_abi_schema[methodName];
    expect(actual && expected, `ABI schema entry is missing for ${methodName}`);
    expect(JSON.stringify(comparable(actual)) === JSON.stringify(comparable(expected)), `deployed ABI schema differs for ${methodName}`);
  }
  expect(schema.methods.evaluate?.params?.[1]?.[0] === "request_nonce", "evaluate nonce parameter is missing");

  const transaction = await request("eth_getTransactionByHash", [manifest.deployment_transaction]);
  expect(transaction?.to_address?.toLowerCase() === manifest.contract_address.toLowerCase(), "deployment transaction target differs");
  expect(transaction.status === "FINALIZED", `deployment status is ${transaction.status}`);
  expect(transaction.result_name === "MAJORITY_AGREE", `deployment consensus is ${transaction.result_name}`);
  expect(transaction.last_round?.votes_committed === "5" && transaction.last_round?.votes_revealed === "5", "deployment votes are incomplete");
  expect(transaction.last_round.validator_votes_name.every((vote) => vote === "AGREE"), "deployment contains a non-AGREE validator vote");
  expect(transaction.consensus_history?.consensus_results?.[0]?.leader_result?.[0]?.genvm_result?.error_code == null, "leader deployment reported a GenVM error");

  const receipt = await request("eth_getTransactionReceipt", [manifest.deployment_transaction]);
  expect(receipt?.status === "0x1", `EVM receipt status is ${receipt?.status}`);

  console.log(`deployed v0.2.0 verification: PASS (${manifest.contract_address}, ${manifest.source_size_bytes} bytes, ${manifest.source_sha256})`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
