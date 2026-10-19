// Run the repository's Python checks across Windows installations where the
// Microsoft Store alias may shadow a real interpreter on PATH.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {spawnSync} = require("node:child_process");

const args = process.argv.slice(2);
const candidates = [];
if (process.env.SENVARA_PYTHON) candidates.push([process.env.SENVARA_PYTHON, []]);
if (process.platform === "win32") {
  const roots = [process.env.USERPROFILE && path.join(process.env.USERPROFILE, "AppData", "Local"), process.env.LOCALAPPDATA, process.env.ProgramFiles, process.env.ProgramW6432].filter(Boolean);
  for (const root of roots) {
    const base = path.join(root, "Programs", "Python");
    if (!fs.existsSync(base)) continue;
    for (const entry of fs.readdirSync(base).filter(name => /^Python\d+/.test(name)).sort().reverse()) {
      candidates.push([path.join(base, entry, "python.exe"), []]);
    }
  }
  candidates.push(["py", ["-3"]]);
}
candidates.push(["python", []]);

for (const [command, prefix] of candidates) {
  const result = spawnSync(command, [...prefix, ...args], {stdio: "inherit"});
  if (!result.error) process.exit(result.status ?? 1);
}

console.error(`Python 3 was not found. Set SENVARA_PYTHON to the interpreter used for release checks (for example ${os.platform() === "win32" ? "C:\\Python313\\python.exe" : "/usr/bin/python3"}).`);
process.exit(1);
