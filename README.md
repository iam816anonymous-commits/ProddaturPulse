# Proddatur Pulse

A one-page local interest-registration site for testing demand in Proddatur before launching a service or community.

## Files
- `index.html` — responsive public landing page and registration form.
- `backend/Code.gs` — Google Apps Script endpoint that stores registrations in a private Google Sheet.

## Connect registration storage
1. Create a Google Sheet in your Google account.
2. Open **Extensions → Apps Script**.
3. Paste `backend/Code.gs` into the script editor and save.
4. Select **Deploy → New deployment → Web app**.
5. Set **Execute as: Me** and **Who has access: Anyone**, then deploy.
6. Copy the Web App URL.
7. In `index.html`, replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.
8. Commit the updated `index.html`.
9. Submit a test registration and confirm the row appears in the Sheet.

The public form is not connected until the URL is added. Keep the Sheet private. The initial public page is static and can be hosted through GitHub Pages once the repository is configured.

## Privacy and launch checklist
- Add a real contact email and a clear privacy notice before publishing.
- Use the submitted data only for the purposes disclosed on the form.
- The separate marketing-updates checkbox is optional and unchecked by default.
- Restrict spreadsheet access; do not publish or expose it.
- Honour opt-out and deletion requests.
- Do not sell or share contact details with third parties without separate permission.
- This is an interest survey, not a booking, payment, rental listing or guarantee that a service exists.
