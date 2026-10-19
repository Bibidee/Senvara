const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "frontend", "out");
const port = Number(process.argv[2] || 3000);
const contentTypes = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8" };

const server = http.createServer((request, response) => {
  let requested;
  try { requested = decodeURIComponent(new URL(request.url || "/", `http://${request.headers.host || "localhost"}`).pathname); }
  catch { response.writeHead(400); response.end("Bad request"); return; }
  const candidate = path.resolve(root, `.${requested}`);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) { response.writeHead(403); response.end("Forbidden"); return; }
  let file = candidate;
  try { if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html"); }
  catch { /* return a normal static 404 below */ }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end("Not found"); return; }
  response.writeHead(200, { "Content-Type": contentTypes[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => console.log(`Serving ${root} at http://127.0.0.1:${port}`));
