# Proddatur Pulse — owner operations

The public website never exposes the spreadsheet. Use the Google account that owns the private spreadsheet.

## One-time setup after updating Apps Script

1. Open the private Proddatur Pulse Google Sheet.
2. Open Extensions → Apps Script. Replace the editor code with `apps-script/Code.gs` from this repository.
3. Confirm `CONFIG.SPREADSHEET_ID` matches this spreadsheet. The current repository value is the existing project spreadsheet ID.
4. Save. Run `setupSheet` once and authorize it.
5. Confirm these tabs exist: `Registrations`, `Requests`, `Dashboard`.
6. Deploy → Manage deployments → Edit the existing Web App deployment → select **New version** → Deploy. Keep Execute as owner and access Anyone. If the deployment URL changes, update `APPS_SCRIPT_URL` in `index.html` and `REQUEST_ENDPOINT` in `privacy.html`.

## Daily workflow

- **Dashboard:** headline counts and demand summaries by interest, area, willingness-to-pay range and timeline. Formula results update as new rows arrive.
- **Registrations:** one registration per normalized Indian mobile number. Filter by interest, area and timeline. Do not share this tab.
- **Requests:** questions, suggestions, access/correction/deletion requests and opt-out requests. These do not create registrations and are not blocked by the duplicate-registration rule.
- Review each request. Verify control of the registered number before disclosing, correcting or deleting personal data. Change Status from `New` to `In progress` or `Resolved` after handling it.
- For a deletion request, locate the matching registration by normalized mobile number, delete the relevant row or remove/anonymize the requested fields, and record completion in the Requests status. Keep only information that must be retained for a documented legal or operational reason.

## Security

- Keep spreadsheet sharing restricted to the owner and trusted operators who genuinely need access.
- Never put the spreadsheet URL, registration records, verification secrets or admin credentials in public website code.
- The intake endpoint is public by design. Script locking prevents simultaneous duplicate registration writes; it is not CAPTCHA, OTP or robust rate limiting.
- Review Apps Script execution logs and quotas periodically.
