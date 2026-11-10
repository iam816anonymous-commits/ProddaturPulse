# Registration collection design — Proddatur Pulse

## Architecture

- Public frontend: GitHub Pages.
- Intake: Google Apps Script Web App, executing as the spreadsheet owner.
- Storage: owner's private Google Sheet.
- Visitors: no Google login required.
- Owner: Google account access to the private spreadsheet.

## Registration flow

1. Visitor selects interests and submits the adult-only form.
2. Browser sends a URL-encoded JSON payload to Apps Script through a hidden iframe.
3. Apps Script validates the payload and normalizes the 10-digit mobile number.
4. A script lock serializes the duplicate check and append.
5. Duplicate mobile numbers are rejected; no second registration row is written.

## Questions and privacy requests

1. Visitor uses the separate request form on privacy.html.
2. Request includes mobile number, request type and message.
3. Apps Script writes it to the private Requests tab.
4. It does not create a registration and does not run the duplicate-registration check.
5. Owner verifies control of the number before disclosing, correcting or deleting data.

## Private owner operations

- Registrations: source records.
- Requests: questions, suggestions, access/correction/deletion requests and optional-update opt-outs.
- Dashboard: formula-driven totals and demand summaries by interest, area, willingness to pay and usage timeline.

## Duplicate policy

One registration per normalized 10-digit Indian mobile number. This is not identity verification; a different number can bypass it. OTP would be required for stronger assurance.

## Security boundaries

- Spreadsheet remains private and is not linked from the public website.
- Spreadsheet ID is stored in Apps Script Script Properties, not committed to public source code.
- Apps Script executes as owner; visitors do not receive spreadsheet permissions.
- Input is bounded and validated; formula injection is neutralized.
- Honeypot filters basic bots; locking protects concurrent duplicate registration writes.
- No CAPTCHA, OTP or robust IP-based rate limiting is provided. Apps Script and Sheets quotas apply.
