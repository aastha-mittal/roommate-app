# Register Roommate Match with CMU IT (required for real login)

Local SAML is **configured** once `CMU_SAML_ENABLED=true` and `backend/certs/` exist. CMU’s IdP will still **reject** logins until your Service Provider is registered.

## 1. Generate certs (if needed)

```bash
cd backend && npm run saml:setup
```

## 2. SP metadata URL

With the API running:

**http://localhost:3001/api/auth/cmu/metadata**

(Production: `https://YOUR-API-HOST/api/auth/cmu/metadata`)

## 3. Email CMU Shibboleth team

Send to **shibboleth-team@andrew.cmu.edu** (cc **it-help@cmu.edu** if needed):

---

**Subject:** SAML Service Provider registration — Roommate Match

Hello,

We are requesting registration of a SAML 2.0 Service Provider for **Roommate Match**, a CMU student roommate matching application.

| Field | Value |
|--------|--------|
| **Entity ID** | `http://localhost:3001/shibboleth` (dev) — replace with production URL when deployed |
| **ACS URL** | `http://localhost:3001/api/auth/cmu/callback` (dev) |
| **Metadata** | Attached or: `{API_BASE}/api/auth/cmu/metadata` |
| **Contact** | [your name] — [your @andrew.cmu.edu] |

**Attributes needed:** `mail` or `eppn`, `givenName`, `sn` (for display name).

**Audience:** CMU students (`@andrew.cmu.edu` / `@cmu.edu`).

For production we will provide HTTPS entity ID and callback on our deployed host.

Thank you,  
[Your name]

---

## 4. After IT approves

Update production `.env`:

```env
CMU_SAML_ENABLED=true
CMU_SAML_ENTITY_ID=https://api.yourdomain.cmu.edu/shibboleth
CMU_SAML_CALLBACK_URL=https://api.yourdomain.cmu.edu/api/auth/cmu/callback
FRONTEND_URL=https://yourdomain.cmu.edu
```

Use production TLS certs in `certs/` or env PEM vars.

## 5. Verify

1. `GET http://localhost:3001/api/auth/config` → `"cmuSsoEnabled": true`
2. Click **Sign in with CMU** → redirect to `login.cmu.edu`
3. After CMU login → redirect to `http://localhost:5173/auth/callback?token=...`

If CMU shows an error before login, SP registration is still pending.
