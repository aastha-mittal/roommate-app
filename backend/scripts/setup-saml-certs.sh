#!/usr/bin/env bash
# Generate SP certs and fetch CMU IdP signing certificate for local SAML.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p certs

if [[ ! -f certs/sp-key.pem ]]; then
  openssl req -x509 -newkey rsa:2048 \
    -keyout certs/sp-key.pem -out certs/sp-cert.pem \
    -days 3650 -nodes -subj "/CN=Roommate Match Dev SP/O=CMU/C=US"
  echo "Created certs/sp-key.pem and certs/sp-cert.pem"
fi

curl -sS "https://login.cmu.edu/idp/shibboleth" -o /tmp/cmu-idp-metadata.xml
python3 <<'PY'
import re, textwrap, pathlib
xml = pathlib.Path("/tmp/cmu-idp-metadata.xml").read_text()
m = re.search(r"<ds:X509Certificate>([^<]+)</ds:X509Certificate>", xml)
if not m:
    raise SystemExit("Could not find IdP certificate in CMU metadata")
b64 = re.sub(r"\s+", "", m.group(1))
pem = (
    "-----BEGIN CERTIFICATE-----\n"
    + "\n".join(textwrap.wrap(b64, 64))
    + "\n-----END CERTIFICATE-----\n"
)
pathlib.Path("certs/cmu-idp.pem").write_text(pem)
print("Wrote certs/cmu-idp.pem")
PY

echo "Done. Set CMU_SAML_ENABLED=true in backend/.env and restart the API."
