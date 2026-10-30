# Demo and measurement lab

A page that shows every variant, and a small server that records what a device reports. No dependencies except Tailwind.

```bash
npm run demo            # from the repo root
```

Open `http://localhost:8499/fold.html`. The server also serves `index.html`, a page that reports sizes, safe areas and media query results.

- Each page POSTs a snapshot to `/report`. The server appends it to `demo/reports.jsonl` (git-ignored, contains device IP and user agent).
- Saving `index.css` or a page rebuilds the CSS and reloads open pages.
- The server listens on `0.0.0.0` so a phone on your network can open it. Use it on a trusted network only.

## HTTPS for a real phone

Safari treats `http://localhost` as a secure context, but a LAN address needs HTTPS for the fold APIs. Make a local certificate with [mkcert](https://github.com/FiloSottile/mkcert):

```bash
mkdir demo/certs && cd demo/certs
mkcert -cert-file lab.pem -key-file lab-key.pem localhost 127.0.0.1 <your-mac>.local
```

The server then also serves HTTPS on port 8443. Install the mkcert root certificate on the phone and turn on full trust for it. Never share `rootCA-key.pem`.
