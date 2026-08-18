const http = require("http");
const fs = require("fs");
const path = require("path");
const { getDashboardData } = require("./backend/marketService");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const FRONTEND = path.join(ROOT, "frontend");

function sendJson(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(body, null, 2));
}

function contentType(filePath) {
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  return "application/octet-stream";
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": contentType(filePath) });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/dashboard" || url.pathname === "/api/market") {
    try {
      const data = await getDashboardData({ force: url.searchParams.get("force") === "1" });
      sendJson(res, 200, data);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    serveFile(res, path.join(FRONTEND, "index.html"));
    return;
  }

  const requested = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
  const candidate = path.join(FRONTEND, requested);
  if (candidate.startsWith(FRONTEND)) {
    serveFile(res, candidate);
    return;
  }

  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`US Market Intelligence Dashboard: http://localhost:${PORT}`);
});
