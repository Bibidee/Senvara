"""Offline source guard. A clean result does not prove runtime or deployment security."""
from pathlib import Path
import hashlib
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
contract = root / "contracts/senvara.py"
frontend = root / "frontend"
messages = []

manifest = json.loads((root / "package.json").read_text())
web = json.loads((frontend / "package.json").read_text())
if manifest.get("devDependencies", {}).get("genlayer") != "0.39.1":
    messages.append("Local GenLayer CLI must remain pinned at 0.39.1")
if web.get("dependencies", {}).get("genlayer-js") != "0.9.0":
    messages.append("Pinned frontend SDK differs from verified source baseline")
if "output: \"export\"" not in (frontend / "next.config.ts").read_text():
    messages.append("Next.js must be statically exported; no app backend allowed")
if "61999" not in contract.read_text() or "61999" not in (frontend / "lib/constants.ts").read_text():
    messages.append("Studionet chain 61999 is missing")
if "0xf22f" not in (frontend / "lib/constants.ts").read_text():
    messages.append("Studionet hexadecimal chain ID is missing")
if "from genlayer import" not in contract.read_text() or "run_nondet_unsafe" not in contract.read_text():
    messages.append("Intelligent Contract requires actual GenLayer consensus interface")
if "@gl.public.write.payable" in contract.read_text():
    messages.append("Unexpected custody/payable method in noncustodial V1")
if list((frontend / "app").rglob("route.ts")) or list((frontend / "app").rglob("route.js")):
    messages.append("API/server route discovered in backendless application")
# Applied to product code and release docs only, not cached/generated outputs.
for path in [root / "README.md", *sorted((root / "docs").glob("*.md")),
             *sorted((root / "contracts").glob("*.py")),
             *sorted((frontend / "app").rglob("*.tsx")),
             *sorted((frontend / "components").rglob("*.tsx")),
             *sorted((frontend / "lib").glob("*.ts"))]:
    text = path.read_text(encoding="utf-8")
    if re.search(r"\b(?:TEMPLATE_BRAND|OLD_PROJECT_NAME|COPIED_PROJECT_NAME)\b", text):
        messages.append("Unresolved placeholder brand in " + str(path.relative_to(root)))
    if re.search(r"(?i)(private[_ -]?key\s*[:=]|seed[_ -]?phrase\s*[:=])", text):
        messages.append("Potential credential field in " + str(path.relative_to(root)))
sha256 = hashlib.sha256(contract.read_bytes()).hexdigest()
print("Senvara contract source SHA-256:", sha256)
print("Contract bytes:", contract.stat().st_size)
print("Network: Studionet 61999 | repository-local CLI: 0.39.1 | static frontend: yes")
if messages:
    for msg in sorted(set(messages)):
        print("FAIL:", msg, file=sys.stderr)
    sys.exit(1)
print("Offline source checks: PASS (runtime, browser and deployment unverified)")
