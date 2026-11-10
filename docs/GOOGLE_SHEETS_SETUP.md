# Google Sheets setup — Proddatur Pulse

The public website is static on GitHub Pages. Google Apps Script is the public intake endpoint; the Google Sheet is the private data store.

## Existing live project

The spreadsheet ID configured in apps-script/Code.gs is the existing private project spreadsheet ID. Keep the spreadsheet private. The public Apps Script endpoint is configured in index.html and privacy.html.

## Update the Apps Script deployment

1. Open the private Proddatur Pulse spreadsheet using the owner Google account.
2. Open Extensions → Apps Script.
3. Replace the editor code with the current apps-script/Code.gs from this repository.
4. Confirm CONFIG.SPREADSHEET_ID matches the existing private spreadsheet.
5. Save, select setupSheet, and Run it once. Approve the authorization prompt.
6. Confirm three tabs exist: Registrations, Requests and Dashboard. Existing Registrations rows are retained; the setup routine rebuilds the Dashboard tab.
7. Open Deploy → Manage deployments. Edit the existing Web App deployment, choose New version, and deploy.
8. Keep Execute as: Me and Who has access: Anyone. Visitors must be able to submit without Google sign-in.
9. Keep the existing /exec URL if possible. If Google provides a different URL, update the endpoint constant in both index.html and privacy.html.

## Tab purposes

- Registrations: one row per normalized 10-digit Indian mobile number. Duplicate check and append run under a script lock.
- Requests: questions, suggestions, access/correction/deletion requests and optional-update opt-outs. These are separate from registrations and are not rejected as duplicates.
- Dashboard: formula-driven totals and demand summaries by interest, area, willingness-to-pay band and usage timeline.

## Test checklist

1. Submit one adult test registration with a mobile number you control. Confirm one row is added.
2. Submit again with the same number. It must be rejected and no second registration row should appear.
3. Submit a privacy/question request using that already-registered number from privacy.html. It must add a row to Requests, not Registrations.
4. Check Dashboard totals and breakdowns.
5. Open the public site in an incognito window. The private spreadsheet must not be linked or accessible.
6. Check Apps Script Executions if a submission fails.

## Security notes

The endpoint is public by design. The current implementation has validation, a honeypot, formula-injection neutralization and script locking. It does not provide CAPTCHA, OTP or robust IP-based rate limiting. Review Apps Script execution logs and quotas. Never put passwords, OAuth tokens or spreadsheet contents in the public frontend.
