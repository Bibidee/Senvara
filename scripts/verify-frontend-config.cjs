const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("esbuild");

const root = process.cwd();
const sourcePath = path.join(root, "frontend", "lib", "constants.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = transformSync(source, { loader: "ts", format: "cjs", platform: "node" }).code;

const HISTORICAL = {
  address: "0x9668263921d88c1deaB8DA5A416a65D562cB4187",
  version: "0.1.0",
  source: "33385d0283d67cd7c13f0cdafe79ba06c3466a20a35356032afe7c9d32fc797c",
};
const CANDIDATE = {
  address: "0xF563d381C3ec5BDA61f166Bb1FFf781dE6B81b8C",
  version: "0.2.0",
  source: "d56076f0e63d91d449e4a34f55c3d88474dc13af579c5ddbefe05a02c6e503a2",
};

function fail(message) {
  throw new Error(`frontend configuration verification failed: ${message}`);
}

function load(env) {
  const module = { exports: {} };
  const processShim = { env: { ...env } };
  new Function("require", "module", "exports", "process", compiled)(require, module, module.exports, processShim);
  return module.exports;
}

function expect(condition, message) {
  if (!condition) fail(message);
}

const common = { NEXT_PUBLIC_SENVARA_RPC: "https://studio.genlayer.com/api" };
const candidateEnv = {
  ...common,
  NEXT_PUBLIC_SENVARA_CONTRACT: CANDIDATE.address,
  NEXT_PUBLIC_SENVARA_CONTRACT_VERSION: CANDIDATE.version,
  NEXT_PUBLIC_SENVARA_SOURCE_SHA256: CANDIDATE.source,
  NEXT_PUBLIC_SENVARA_V020_CONTRACT: CANDIDATE.address,
};
const historicalEnv = {
  ...common,
  NEXT_PUBLIC_SENVARA_CONTRACT: HISTORICAL.address,
  NEXT_PUBLIC_SENVARA_CONTRACT_VERSION: HISTORICAL.version,
  NEXT_PUBLIC_SENVARA_SOURCE_SHA256: HISTORICAL.source,
};

const defaultConfig = load({});
expect(defaultConfig.CONFIGURED === true, "default build is not configured");
expect(defaultConfig.CONTRACT_ADDRESS.toLowerCase() === CANDIDATE.address.toLowerCase(), "default address is not the active candidate");
expect(defaultConfig.CONTRACT_VERSION === CANDIDATE.version && defaultConfig.CONTRACT_SOURCE_SHA256 === CANDIDATE.source, "default version/source is not the active candidate");

const candidateConfig = load(candidateEnv);
expect(candidateConfig.CONFIGURED === true, "explicit candidate tuple was rejected");
expect(candidateConfig.CONTRACT_IDENTITY.address === CANDIDATE.address.toLowerCase(), "candidate identity address is not canonical");

const historicalConfig = load(historicalEnv);
expect(historicalConfig.CONFIGURED === true, "historical compatibility tuple was rejected");
expect(historicalConfig.CONTRACT_IDENTITY.address === HISTORICAL.address.toLowerCase(), "historical identity address is not preserved");

for (const [label, env] of [
  ["wrong active address", { ...candidateEnv, NEXT_PUBLIC_SENVARA_CONTRACT: "0x1111111111111111111111111111111111111111" }],
  ["wrong candidate address", { ...candidateEnv, NEXT_PUBLIC_SENVARA_V020_CONTRACT: "0x2222222222222222222222222222222222222222" }],
  ["wrong version", { ...candidateEnv, NEXT_PUBLIC_SENVARA_CONTRACT_VERSION: "0.1.0" }],
  ["wrong source fingerprint", { ...candidateEnv, NEXT_PUBLIC_SENVARA_SOURCE_SHA256: HISTORICAL.source }],
  ["mixed historical tuple", { ...candidateEnv, NEXT_PUBLIC_SENVARA_CONTRACT: HISTORICAL.address }],
]) {
  expect(load(env).CONFIGURED === false, `${label} was accepted`);
}

console.log("frontend configuration: PASS (active v0.2.0, preserved v0.1.0, mismatch rejection matrix)");
