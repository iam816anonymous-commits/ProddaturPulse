# Proddatur Pulse — Registration Collection Architecture

## Decision summary

GitHub Pages can host the public form and the same-page admin interface, but it cannot itself receive anonymous submissions or run a server-side receiver. GitHub documents Pages as static-file hosting and explicitly says it does not support server-side languages such as Python, PHP or Ruby.

Therefore, a secure anonymous registration inbox cannot be implemented using GitHub Pages and GitHub repository APIs alone.

## Requirements

- Visitors can submit without a GitHub account.
- Public site remains on GitHub Pages.
- Admin login and registrations appear on the same page.
- Registration details are private and are never committed as plaintext.
- Prefer no paid services and no external backend provider.
- Owner can view, search, delete and export registrations.

## Research findings

### 1. GitHub Pages is not a form-processing backend

Pages publishes static files. It does not execute a server-side application to accept POST requests, authenticate administrators, or persist visitor submissions.

Reference: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

### 2. GitHub repository writes require authentication

The GitHub Contents API requires a token with repository Contents write permission. A token embedded in public JavaScript is extractable by every visitor and must not be used.

Reference: https://docs.github.com/en/rest/repos/contents

### 3. GitHub Actions is not an anonymous submission endpoint

The workflow-dispatch API requires authentication with Actions write permission. A public browser cannot safely hold that credential.

Reference: https://docs.github.com/en/rest/actions/workflows

### 4. Encryption is useful but does not provide transport or storage

The browser Web Crypto API supports public-key encryption and authenticated AES-GCM encryption. Encryption can ensure the receiver and GitHub only see ciphertext, but a receiver is still needed to accept and store it. AES-GCM IVs must be unique for each encryption under the same key.

References:
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
- https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams

## Options assessment

| Option | Anonymous visitors | GitHub Pages frontend | Private durable inbox | Additional receiver |
|---|---:|---:|---:|---:|
| GitHub Pages + browser storage | Yes | Yes | No; per-device only | No |
| GitHub Pages + direct GitHub API | No safe anonymous write | Yes | No safe credential model | Token would be exposed |
| GitHub Pages + Actions dispatch | No safe anonymous trigger | Yes | Possible only after authenticated trigger | Requires authenticated trigger |
| GitHub Pages + self-hosted Windows receiver | Yes | Yes | Yes, local SQLite | Owner's PC must be online and reachable |
| GitHub Pages + hosted receiver | Yes | Yes | Yes | Yes, third-party or own hosted server |

## Recommended architecture if avoiding backend vendors

Use a small Windows-native Python receiver (FastAPI) with SQLite. Keep the public page and admin UI on GitHub Pages. Encrypt each registration in the browser before sending it to the receiver.

Important operational constraint: the Windows PC must remain online and publicly reachable over HTTPS. If the ISP uses CGNAT or blocks inbound connections, a tunnel or public host is required. That would introduce an external dependency. Without public reachability, remote visitors cannot submit to the PC.

### Data flow

1. Admin generates an encryption key pair locally.
2. Public encryption key is embedded in the GitHub Pages site; private decryption key stays with the owner and is never committed.
3. Visitor completes the form. Browser creates a fresh random AES-256 key and 96-bit random IV, encrypts the JSON with AES-GCM, then wraps the AES key using the admin's RSA-OAEP public key.
4. Browser sends only ciphertext, wrapped key, IV and non-sensitive envelope metadata to the receiver over HTTPS.
5. Receiver validates request size and envelope format, applies rate limits, and stores the encrypted envelope in SQLite. It does not need the decryption key.
6. Owner opens the same page's admin panel, authenticates with the receiver, downloads encrypted envelopes, and decrypts locally with the private key.
7. Admin can search and export decrypted records in the browser. Delete operations remove the encrypted record from SQLite.

### Security requirements

- Never put a GitHub token, private key, admin password, or decryption secret in public JavaScript.
- Do not store real registrations in a public repository, even encrypted, unless the owner accepts that ciphertext metadata and backups remain visible.
- Use HTTPS; no plaintext fallback.
- Use AES-GCM with a fresh random 96-bit IV per record and RSA-OAEP/SHA-256 to wrap the per-record AES key.
- Keep the private key offline or in a password-protected local key file; back it up securely.
- Use server-side admin authentication, secure HttpOnly cookies, CSRF protection, rate limiting, input validation, and request-size limits.
- Add a clear privacy notice, contact details, retention period, and deletion process before launch.
- Do not claim the admin login protects records if authorization is only implemented in front-end JavaScript.

## Deployment status and next action

The repository currently contains an undeployed Cloudflare Worker + D1 implementation from an earlier direction. It is not active. This design does not authorize deploying it.

Before implementation, choose one operational model:
- Self-hosted Windows receiver (no backend vendor, but requires the PC to be reachable from the public internet); or
- A hosted receiver (simpler reliability, but adds an external provider).

There is no secure third option using GitHub Pages alone for anonymous submissions.
