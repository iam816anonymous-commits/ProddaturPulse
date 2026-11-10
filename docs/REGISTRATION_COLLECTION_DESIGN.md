# Proddatur Pulse — Anonymous Registration Collection Research & Design

**Status:** Research complete; no deployment or production data collection enabled.

## Executive conclusion

The desired combination is:

- GitHub Pages hosts the public Proddatur Pulse website.
- Visitors submit anonymously (no GitHub account).
- The visitor's browser encrypts personal details before transmission.
- Encrypted records are stored in a GitHub repository.
- The owner unlocks an admin area on the same website and decrypts/views registrations.
- No GitHub credential, private key, or admin password is exposed to visitors.

**GitHub can be the durable storage destination, but GitHub alone cannot be the anonymous receiving endpoint.** A small trusted receiver must accept the public submission and perform the authenticated GitHub write. There is no supported GitHub Pages feature that removes this requirement.

This is a platform boundary, not a missing JavaScript trick.

## Primary sources reviewed

1. GitHub Pages overview: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
2. Creating a Pages site and server-side language limitation: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
3. GitHub Contents API: https://docs.github.com/en/rest/repos/contents
4. GitHub Actions workflow API: https://docs.github.com/en/rest/actions/workflows
5. GitHub workflow trigger events: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
6. GitHub issue API: https://docs.github.com/en/rest/issues/issues
7. GitHub REST API authentication: https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api
8. Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
9. SubtleCrypto encryption: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
10. AES-GCM parameters: https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams

## Findings

### 1. GitHub Pages is static hosting

GitHub Pages takes HTML, CSS and JavaScript from a repository and publishes them. GitHub explicitly states that Pages does not support server-side languages such as PHP, Ruby or Python. It does not provide a form-processing runtime, server-side session authentication, or a database API for visitor submissions.

A same-page login/dashboard can be built as a user interface, but a static page cannot securely enforce the password or retrieve private submissions without a separate trusted service.

### 2. GitHub repository writes are authenticated

The GitHub Contents API's create/update operation requires repository Contents write permission. Fine-grained tokens need Contents: write. The token must be sent in the Authorization header.

A public website's JavaScript is downloadable by every visitor. Any token placed in HTML, JavaScript, a public configuration file, or browser storage can be extracted and abused. Obfuscation, minification, password prompts and encryption do not make a public token secret.

### 3. GitHub Actions does not provide a public anonymous POST endpoint

The workflow-dispatch API requires authentication and Actions: write permission. Repository-dispatch is also an authenticated API operation. A workflow can write to the repository using its built-in GITHUB_TOKEN after a legitimate trigger, but that does not solve how an anonymous visitor securely triggers it.

Allowing arbitrary untrusted events to reach a privileged workflow is also a security risk. A workflow must not treat visitor-supplied input as trusted code or expose repository secrets to untrusted pull-request code.

### 4. GitHub Issues are not an anonymous form endpoint

The REST create-issue API requires the appropriate authenticated repository permission (Issues: write for fine-grained tokens). Directly calling it from a public page would again require exposing a credential. Asking visitors to sign into GitHub would violate the anonymous-submission requirement and add substantial friction.

### 5. Encryption solves confidentiality, not delivery or authorization

Web Crypto can encrypt form data in the visitor's browser. A sound envelope design is:

- Generate a fresh random AES-256-GCM key for each registration.
- Generate a fresh 96-bit IV for each encryption.
- Encrypt the complete registration JSON using AES-GCM.
- Wrap the AES key using the owner's RSA-OAEP/SHA-256 public key.
- Send only ciphertext, IV, wrapped key and non-sensitive envelope metadata to the receiver.
- Keep the RSA private key outside the public repository and outside the receiver.

This means the receiver and GitHub storage do not need to see plaintext names or phone numbers. But the browser still needs a reachable endpoint that accepts the envelope, and the endpoint still needs authorization to write to GitHub.

### 6. A public repository is not private storage

Even if each record is encrypted, a public repository exposes ciphertext, record count, timestamps, commit activity and other metadata. Git commit history may retain old versions after a file is deleted from the latest tree. For personal registration data, use a separate **private** storage repository if GitHub is selected. Keep the GitHub Pages website repository public if required.

Encryption is defense-in-depth; it does not make public storage equivalent to private storage.

## Approaches tested against the requirements

| Approach | Anonymous visitor | Stores centrally | GitHub destination | Secure without extra receiver |
|---|---:|---:|---:|---:|
| GitHub Pages + localStorage / IndexedDB | Yes | No; per visitor device only | No | Yes, but does not meet collection goal |
| GitHub Pages + encrypted download | Yes | No; visitor must send file manually | No | Yes, but not automatic |
| Browser directly calls Contents API | Yes in theory | Yes | Yes | No; requires secret write token |
| Browser directly dispatches Actions workflow | Yes in theory | Potentially | Yes | No; requires authenticated Actions permission |
| Browser creates GitHub Issue | Not without GitHub sign-in | Yes | Yes | No; authenticated Issues write permission |
| Self-hosted receiver writes to GitHub | Yes | Yes | Yes | No; receiver must be online and reachable |
| Hosted receiver writes to GitHub | Yes | Yes | Yes | No; receiver is an external runtime |

## Feasible design: GitHub as encrypted storage, small receiver as the write gateway

This is the closest match to the requirements and preserves GitHub as the data destination.

### Components

1. **Public frontend:** Existing GitHub Pages site, including public form and admin interface on the same page.
2. **Encryption:** Browser-side Web Crypto; only encrypted envelopes leave the browser.
3. **Receiver:** Minimal HTTPS endpoint. It validates envelope size/format, rate-limits submissions and writes ciphertext to a separate private GitHub repository using a narrowly scoped GitHub App installation token or fine-grained credential.
4. **Private storage repository:** One encrypted record per file, e.g. `inbox/2026/11/<random-id>.json`. Never store plaintext personal details or the decryption key here.
5. **Admin:** Same page authenticates with the receiver, reads the encrypted records, and decrypts locally using the owner's private key. Search and CSV export happen in the browser after decryption.

### Security controls

- Do not put a GitHub token, GitHub App private key, admin password or RSA private key in public JavaScript.
- Use a private storage repository, not the public Pages repository, for the encrypted inbox.
- Grant the receiver access only to the single storage repository and only the minimum Contents permission required.
- Keep the GitHub App private key/installation credentials exclusively on the receiver.
- Encrypt before upload; receiver stores opaque ciphertext only.
- Use TLS, strict request-size limits, schema validation, rate limits, abuse controls and generic error responses.
- Admin authentication must be checked by the receiver, not just by hiding an HTML section.
- Keep decryption private key out of GitHub and back it up securely.
- Deleting the latest copy from GitHub does not necessarily erase old ciphertext from Git history. Define retention and repository cleanup before collecting real personal data.
- Add privacy notice, contact information, retention period and deletion process before launch.

### Receiver hosting choices

**A. Self-host on the owner's Windows PC**
- No backend vendor.
- PC must be powered on and reachable from the public internet over HTTPS.
- CGNAT, ISP port restrictions, router configuration and dynamic IP can make this impractical.
- A tunnel would reintroduce an external dependency.

**B. Hosted minimal receiver**
- More reliable for visitors and simpler to operate.
- Requires an external runtime/provider, even though GitHub remains the database/storage destination.
- The receiver can be designed so it never sees plaintext registration fields.

## What cannot be done

There is no secure design that simultaneously uses only GitHub Pages + GitHub APIs, accepts anonymous public submissions, writes to a private repository, and keeps all credentials secret. Any proposal claiming otherwise ultimately hides a token in public code, requires visitor GitHub login, relies on per-device storage, or introduces an intermediary under another name.

## Current repository state

The repository still contains an earlier Cloudflare Worker + D1 implementation under `worker/`, plus Cloudflare-specific instructions in the root README and API wiring in `index.html`. That implementation has not been deployed and is not the chosen design. It must be removed/replaced only after the receiver hosting choice is made; do not leave misleading Cloudflare instructions in the final product.

## Recommendation

Keep GitHub Pages for the website and a **separate private GitHub repository for encrypted registration records**. Use a tiny receiver as the only authenticated write gateway. This meets anonymous submission and GitHub storage while keeping plaintext away from GitHub and the receiver.

If absolutely no receiver or external runtime is allowed, stop the project at a static prototype: there is no automatic, central, anonymous collection path. Do not collect real personal data with a fake front-end password.

**Research result:** architecture is defined; implementation and deployment are intentionally pending a receiver hosting decision.
