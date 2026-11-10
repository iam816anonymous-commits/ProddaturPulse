# Proddatur Pulse

A one-page local interest-registration site for testing demand in Proddatur.

## Files
- `index.html` — responsive public landing page and interest form.
- `useless/README.md` — placeholder for a future registration-storage mechanism.

## Current submission behaviour — prototype only

The previous Google Apps Script / Google Sheets backend has been removed.

The form currently validates the visitor's input and downloads a TXT copy **to that visitor's own device**. It does not send the registration to the site owner and does not create a file in this repository.

## Why the GitHub folder is not connected directly

GitHub Pages is static hosting. Browser JavaScript cannot safely commit files into this repository. Doing so would require a privileged GitHub credential, and putting that credential in the public page would expose the repository to abuse.

Also, this repository is public. Any real TXT file committed under `useless/` would be readable by everyone, including names and mobile numbers. Do not put real visitor data there.

A secure owner-only collection system requires a trusted server-side component (for example, a self-hosted server) or a backend provider. Until one is configured, do not advertise the form as an active registration collector.

## Privacy and launch checklist
- Add a real contact email and privacy notice before publishing.
- Collect only information needed for the stated purpose.
- Keep contact details private and honour deletion/opt-out requests.
- Do not sell or share contact details without separate permission.
- This is an expression-of-interest survey, not a booking, payment or guarantee of service.
