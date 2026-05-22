import { JWT_SECRET } from "../config.js";
import { loadPem } from "../lib/loadPem.js";

export { JWT_SECRET };

const CMU_IDP =
  process.env.CMU_SAML_IDP_ENTITY_ID?.trim() || "https://login.cmu.edu/idp/shibboleth";

const DEFAULT_API_BASE =
  process.env.CMU_SAML_API_BASE?.trim() ||
  `http://localhost:${process.env.PORT ?? "3001"}`;

export const authConfig = {
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "7d",
  frontendUrl: (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, ""),
  /** CMU Web Login (Shibboleth) — requires IT registration + certs in env or backend/certs/ */
  cmuSaml: {
    enabled: process.env.CMU_SAML_ENABLED === "true",
    entityId:
      process.env.CMU_SAML_ENTITY_ID?.trim() || `${DEFAULT_API_BASE.replace(/\/$/, "")}/shibboleth`,
    idpEntityId: CMU_IDP,
    entryPoint:
      process.env.CMU_SAML_ENTRY_POINT?.trim() ||
      "https://login.cmu.edu/idp/profile/SAML2/Redirect/SSO",
    callbackUrl:
      process.env.CMU_SAML_CALLBACK_URL?.trim() ||
      `${DEFAULT_API_BASE.replace(/\/$/, "")}/api/auth/cmu/callback`,
    privateKey: loadPem(
      process.env.CMU_SAML_PRIVATE_KEY,
      process.env.CMU_SAML_PRIVATE_KEY_FILE,
      "certs/sp-key.pem"
    ),
    publicCert: loadPem(
      process.env.CMU_SAML_PUBLIC_CERT,
      process.env.CMU_SAML_PUBLIC_CERT_FILE,
      "certs/sp-cert.pem"
    ),
    idpCert: loadPem(
      process.env.CMU_SAML_IDP_CERT,
      process.env.CMU_SAML_IDP_CERT_FILE,
      "certs/cmu-idp.pem"
    ),
  },
  /** Local email/password only when explicitly enabled (dev / demos) */
  devPasswordLogin: process.env.AUTH_DEV_PASSWORD === "true",
};

export function isCmuSamlConfigured(): boolean {
  const s = authConfig.cmuSaml;
  return Boolean(
    s.enabled &&
      s.entityId &&
      s.callbackUrl &&
      s.privateKey &&
      s.publicCert
  );
}
