# Google Sheets setup — Proddatur Pulse

The website is static on GitHub Pages. Google Apps Script is the public intake endpoint; the Google Sheet is the private data store.

## Duplicate policy

**One registration per normalized 10-digit Indian mobile number, permanently.** A repeated submission using the same number is rejected and no second row is added. The check runs under a script lock, so simultaneous duplicate requests cannot both pass. Different numbers are treated as different people; this is not identity verification.

## 1. Create the private spreadsheet

1. Sign in to the Google account that should own the registrations.
2. Create a Google Sheet named **Proddatur Pulse Registrations**.
3. Keep its sharing setting restricted. Do not publish it to the web and do not enable link sharing.
4. Copy the spreadsheet ID from its URL: the text between `/d/` and `/edit`.

## 2. Create the Apps Script

1. In the spreadsheet, open **Extensions → Apps Script**.
2. Replace the editor contents with `apps-script/Code.gs` from this repository.
3. In `CONFIG.SPREADSHEET_ID`, replace the placeholder with your spreadsheet ID.
4. Save the project.
5. Run `setupSheet` once from the editor and approve the Google authorization prompt. This creates the Registrations tab and headers.

## 3. Deploy the anonymous intake endpoint

1. Select **Deploy → New deployment**.
2. Choose **Web app**.
3. Set **Execute as: Me**.
4. Set **Who has access: Anyone**.
5. Deploy and complete any Google authorization prompts.
6. Copy the Web app URL ending in `/exec`.

Visitors do not sign into Google. The web app runs with the owner's authorization and appends submissions to the private spreadsheet.

## 4. Connect GitHub Pages

1. Open `index.html` in the GitHub repository.
2. Replace `PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with the deployed `/exec` URL.
3. Replace `PASTE_PRIVATE_GOOGLE_SHEET_URL_HERE` with the spreadsheet URL. The footer owner link is only a shortcut; Google still requires an authorized account to open it.
4. Commit the change and wait for GitHub Pages to publish.

## 5. Test before sharing

- Submit one test registration using a mobile number you control.
- Confirm exactly one row appears in the private sheet.
- Submit again with the same number. The page must show the duplicate warning and the sheet row count must not increase.
- Submit using a different valid number and confirm a second row appears.
- Open the owner spreadsheet link in an incognito window. It must ask for Google sign-in / deny access to an account without permission.

## Security and operating limits

- The public endpoint is anonymous. Anyone who obtains its URL can attempt submissions. The honeypot and validation reduce basic abuse but do not provide strong bot protection or an IP-based rate limit.
- Duplicate prevention is based on mobile number, not name. A person can bypass it with another number; SMS OTP would be required for stronger identity assurance.
- Do not put personal data in GitHub. Registrations are written to Google Sheets only.
- Do not make the spreadsheet public or publish it to the web.
- Add a real privacy contact and retention/deletion policy before collecting real data.
- Apps Script quotas and Google policy limits apply. This is suitable for a small local interest survey, not a high-volume production intake system.

## Owner access

There is no fake password stored in public website code. Open the private Google Sheet; Google authenticates access using your account. The owner link does not grant access to anyone else.
