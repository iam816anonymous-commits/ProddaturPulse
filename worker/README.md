# Proddatur Pulse API (Cloudflare Worker + D1)

The Worker receives public interest submissions and exposes owner-authenticated registration management. The GitHub Pages site never receives a GitHub token or database credential.

## 1. Create the D1 database

Install Node.js. From this folder run:

```powershell
npm install --save-dev wrangler
npx wrangler login
npx wrangler d1 create proddatur-pulse
```

Copy the returned database UUID into `wrangler.jsonc`, replacing `REPLACE_WITH_DATABASE_ID`.

Apply the schema:

```powershell
npx wrangler d1 migrations apply proddatur-pulse --remote
```

## 2. Set secrets (never commit these)

Choose a strong unique admin password and generate a random session secret of at least 32 characters. Set them through Wrangler:

```powershell
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```

Enter values only at the prompts. Do not put them in source code, `wrangler.jsonc`, GitHub Pages or chat.

## 3. Deploy the API

```powershell
npx wrangler deploy
```

Copy the deployed Worker URL (for example, `https://proddatur-pulse-api.<your-subdomain>.workers.dev`). In the root `index.html`, replace `PASTE_CLOUDFLARE_WORKER_URL_HERE` with that URL, without a trailing slash, and commit the page change.

The configured allowed origin is `https://iam816anonymous-commits.github.io`. If the Pages hostname changes, update `ALLOWED_ORIGIN` in `wrangler.jsonc` and redeploy.

## API

- `POST /api/register` — public validated registration submission; rate-limited.
- `POST /api/admin/login` — admin password login; returns a short-lived signed bearer token.
- `GET /api/admin/registrations?q=&interest=` — authenticated list/search/filter (latest 500).
- `DELETE /api/admin/registrations/:id` — authenticated deletion.
- `GET /api/admin/export.csv` — authenticated full CSV export.

The browser stores the short-lived token in sessionStorage. The Worker verifies it on every admin request. CORS is restricted to the GitHub Pages origin. D1 is not directly accessible from the browser.

## Important

- Keep secrets out of the repository.
- Registrations are stored in D1, not committed into Git history.
- Add a real privacy contact and privacy notice before public launch.
- Test submissions and admin actions before announcing the form.
- Rotate the admin password and session secret if compromised.
