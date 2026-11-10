# Proddatur Pulse

Public Proddatur interest survey hosted on GitHub Pages. Anonymous visitors can submit without a Google account. Submissions are stored in the owner's private Google Sheet through Google Apps Script.

## Architecture

- `index.html` — public landing page and interest form.
- `apps-script/Code.gs` — Google Apps Script intake endpoint.
- `apps-script/appsscript.json` — Apps Script runtime manifest.
- `docs/GOOGLE_SHEETS_SETUP.md` — setup, deployment and testing guide.
- Google Sheet — private registration store, owned by the site operator.

## Duplicate prevention

One registration per normalized 10-digit Indian mobile number. A repeated number is rejected, and the sheet is not given a second row. The duplicate check and append run under a script lock to prevent concurrent duplicate inserts. This is not identity verification; another phone number can bypass the rule.

## Setup

Follow [the Google Sheets setup guide](docs/GOOGLE_SHEETS_SETUP.md). Deploy Apps Script as a Web App that executes as the owner and is accessible to anyone. Keep the spreadsheet itself private.

## Important

The site is not ready to collect real registrations until the owner completes Apps Script authorization/deployment and adds the `/exec` URL and private Sheet URL to `index.html`. Never put a Google password, OAuth token or spreadsheet data in this repository.
