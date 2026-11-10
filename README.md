# Proddatur Pulse

Public local demand-discovery survey for Proddatur, Andhra Pradesh. Hosted on GitHub Pages; anonymous submissions are stored in the owner's private Google Sheet through Google Apps Script.

## Main files
- index.html — public landing page and adult-only interest registration.
- privacy.html — privacy policy and independent question/privacy request form.
- apps-script/Code.gs — registration intake, separate request intake and private owner dashboard setup.
- sitemap.xml and robots.txt — search discovery.
- docs/OWNER_OPERATIONS.md — private owner workflow.
- docs/GOOGLE_SHEETS_SETUP.md — Apps Script deployment and setup.

## Data handling
- One registration per normalized 10-digit Indian mobile number. Duplicate check and append run under a script lock.
- Questions and privacy requests are written to a separate Requests tab. They do not create registrations and are not blocked by the duplicate rule.
- Public site does not expose or link to the private spreadsheet.
- Registration is for adults aged 18 and above.

## Owner setup
Replace the Apps Script editor code with apps-script/Code.gs, confirm the configured spreadsheet ID, run setupSheet once, then edit the existing Web App deployment and deploy a new version. This creates/prepares Registrations, Requests and Dashboard tabs. Follow docs/OWNER_OPERATIONS.md.

## Security limitations
The endpoint is public by design. Script locking protects concurrent duplicate registration writes; it is not CAPTCHA, OTP or robust rate limiting. Keep spreadsheet access restricted. Never publish registration data or verification secrets.

## Google indexing
Submit https://iam816anonymous-commits.github.io/ProddaturPulse/sitemap.xml in Google Search Console after verifying the URL-prefix property. Sitemap submission is a discovery hint, not a guarantee of indexing.
