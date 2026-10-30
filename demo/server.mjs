#!/usr/bin/env node
/**
 * Duo lab server. No dependencies.
 *
 *   node server.mjs [port]
 *
 * - Serves ./public on 0.0.0.0 so a phone on the LAN can open it.
 * - Also serves HTTPS on port + 1 when certs/lab.pem exists (made by mkcert),
 *   so the phone gets a secure context without a third-party tunnel.
 * - POST /report appends the JSON body to reports.jsonl and writes latest.json.
 * - GET /version returns a stamp that changes whenever a file under ./public
 *   changes. The page polls it and reloads, so the phone follows every edit.
 *   Polling, not SSE, because the Cloudflare tunnel buffers event streams.
 */

import { createServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFile, appendFile, writeFile } from 'node:fs/promises';
import { watch, existsSync, readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, 'public');
const port = Number(process.argv[2] ?? 8499);
const httpsPort = 8443;
const cert = join(here, 'certs', 'lab.pem');
const key = join(here, 'certs', 'lab-key.pem');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

let version = Date.now();
let seq = 0;

watch(pub, { recursive: true }, () => { version = Date.now(); });

// Rebuild public/fold.css with a one-shot Tailwind build whenever the plugin,
// the input CSS or a page changes. The CLI's own watcher misses the symlinked plugin.
const plugin = join(here, '..', 'index.css');
const input = join(here, 'src', 'fold.css');
const cli = join(here, 'node_modules', '.bin', 'tailwindcss');
let building;
function build() {
  clearTimeout(building);
  building = setTimeout(() => execFile(cli, ['-i', input, '-o', join(pub, 'fold.css')], (err, _out, stderr) => {
    console.log(err ? `tailwind build failed: ${stderr}` : 'tailwind rebuilt fold.css');
  }), 100);
}
if (existsSync(cli)) {
  build(); // first build at start
  // Watch folders, not files: an editor save replaces the file and ends a file watch.
  watch(dirname(input), build);
  if (existsSync(plugin)) watch(dirname(plugin), (_event, name) => { if (name === 'index.css') build(); });
  watch(pub, (_event, name) => { if (name?.endsWith('.html')) build(); });
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  if (url.pathname !== '/version') console.log(`${req.socket.encrypted ? 'https' : 'http'} ${req.socket.remoteAddress} ${req.method} ${req.url}`);

  if (req.method === 'POST' && url.pathname === '/report') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const data = { n: ++seq, at: new Date().toISOString(), ip: req.socket.remoteAddress, ...JSON.parse(body) };
      await appendFile(join(here, 'reports.jsonl'), JSON.stringify(data) + '\n');
      await writeFile(join(here, 'latest.json'), JSON.stringify(data, null, 2));
      console.log(`#${data.n} ${data.label ?? ''} ${data.viewport?.innerWidth}x${data.viewport?.innerHeight} fit=${data.fit}`);
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ n: data.n }));
    } catch (e) {
      res.writeHead(400).end(String(e));
    }
    return;
  }

  if (url.pathname === '/version') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify({ version }));
    return;
  }

  const path = normalize(url.pathname === '/' ? '/index.html' : url.pathname);
  try {
    const file = await readFile(join(pub, path));
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(file);
  } catch {
    res.writeHead(404).end('not found');
  }
}

const ips = Object.values(networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);

createServer(handle).listen(port, '0.0.0.0', () => {
  console.log(`Duo lab on ${ips.map(ip => `http://${ip}:${port}`).join('  ')}`);
});

if (existsSync(cert) && existsSync(key)) {
  createHttpsServer({ cert: readFileSync(cert), key: readFileSync(key) }, handle)
    .on('tlsClientError', (e, socket) => console.log(`tls error ${socket.remoteAddress}: ${e.message}`))
    .listen(httpsPort, '0.0.0.0', () => {
    console.log(`Duo lab on ${ips.map(ip => `https://${ip}:${httpsPort}`).join('  ')}`);
  });
}
