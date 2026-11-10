# Proddatur Pulse

A public Proddatur interest-registration website with a private owner dashboard.

## Architecture

- `index.html` — public landing page, registration form and owner dashboard at `#admin`.
- `worker/src/index.js` — Cloudflare Worker API. Public visitors can submit; owner routes require a signed session.
- `worker/migrations/0001_initial.sql` — D1 database schema.
- `worker/wrangler.jsonc` — Worker and D1 binding configuration.
- `worker/README.md` — deployment and secret setup instructions.

## Current deployment status

The application code is committed, but live collection is **not active until the Cloudflare Worker and D1 database are provisioned and deployed**. The website intentionally does not pretend to save registrations while the API URL is unset.

Follow [the Worker setup guide](worker/README.md). After deployment, replace `PASTE_CLOUDFLARE_WORKER_URL_HERE` in `index.html` with your Worker URL and commit the change.

## Owner dashboard

Open the same website with `#admin` appended to the URL. Sign in using the password configured as the Worker secret `ADMIN_PASSWORD`. The dashboard supports searching, interest filtering, deleting individual registrations and downloading a CSV export.

## Security and privacy

- Never commit Cloudflare secrets, admin passwords, session secrets or real registration data.
- The D1 database is accessed only through the Worker; the browser has no direct database credentials.
- Admin API requests require a signed, expiring bearer token.
- Public submissions are validated and rate-limited.
- CORS is restricted to the GitHub Pages origin configured in the Worker.
- Add a real privacy contact and privacy notice before launch. Collect only necessary information and honour deletion/opt-out requests.
