# Registration collection design — Google Sheets

## Decision

Use one public GitHub Pages repository and one private Google spreadsheet. Google Apps Script is the intake endpoint.

- Public frontend: GitHub Pages.
- Intake: Google Apps Script Web App, executing as the spreadsheet owner.
- Storage: owner's private Google Sheet.
- Visitors: anonymous; no Google login.
- Owner: Google account access to the private spreadsheet.

## Data flow

1. Visitor fills in the public form.
2. Browser posts a URL-encoded payload to Apps Script using a hidden iframe form target.
3. Apps Script validates fields, normalizes the mobile number, checks the private sheet under a script lock, and appends one row.
4. If the mobile number already exists, Apps Script rejects the submission and adds no row.
5. Owner reviews records by opening the private Google Sheet.

## Duplicate policy

One row per normalized 10-digit Indian mobile number, permanently. The lock serializes concurrent submissions so simultaneous requests with the same phone cannot both be inserted.

This is not identity verification. A user can bypass it by using a different phone number. SMS OTP would be needed for stronger identity assurance.

## Security boundaries

- Spreadsheet is private and not published to the web.
- Apps Script executes as the owner; visitors do not receive spreadsheet permissions.
- No Google password, API key or OAuth token is shipped to the browser.
- Input is validated and bounded; spreadsheet-formula injection is neutralized.
- A honeypot filters basic bots.
- The endpoint is public by design. Anyone who knows its URL can attempt requests. This design does not provide robust IP-based rate limiting, CAPTCHA or OTP.
- Apps Script and Sheets quotas apply.

## Admin access

The admin data view is Google Sheets itself, protected by Google account permissions. There is no client-side admin password. The public site's owner link is only a shortcut; Google controls access.

## Launch checklist

- Create a private Sheet.
- Paste its ID into `CONFIG.SPREADSHEET_ID`.
- Run `setupSheet` and authorize.
- Deploy Apps Script as Web App: execute as owner, access anyone.
- Paste the `/exec` URL and private Sheet URL into the frontend.
- Test first submission and duplicate rejection before public launch.
- Add privacy contact, retention and deletion policy.
