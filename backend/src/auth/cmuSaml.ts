import { SAML, type SamlConfig, ValidateInResponseTo } from "@node-saml/node-saml";
import { authConfig, isCmuSamlConfigured } from "../config/auth.js";

const CMU_EMAIL = /@(cmu|andrew\.cmu)\.edu$/i;

export function createSamlClient(): SAML {
  if (!isCmuSamlConfigured()) {
    throw new Error("CMU SAML is not configured");
  }
  const s = authConfig.cmuSaml;
  const config = {
    callbackUrl: s.callbackUrl,
    entryPoint: s.entryPoint,
    issuer: s.entityId,
    idpIssuer: s.idpEntityId,
    identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: false,
    signatureAlgorithm: "sha256",
    privateKey: s.privateKey,
    publicCert: s.publicCert,
    idpCert: s.idpCert || s.publicCert,
    validateInResponseTo: ValidateInResponseTo.never,
    disableRequestedAuthnContext: true,
  } satisfies SamlConfig;
  return new SAML(config);
}

export function extractCmuIdentity(profile: Record<string, unknown>): {
  email: string;
  andrewId: string | null;
  displayName: string | null;
} {
  const mail =
    pickString(profile, "mail") ||
    pickString(profile, "email") ||
    pickString(profile, "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress");

  const eppn =
    pickString(profile, "eppn") ||
    pickString(profile, "eduPersonPrincipalName") ||
    pickString(profile, "urn:oid:1.3.6.1.4.1.5923.1.1.1.6");

  let email = (mail || eppn || "").toLowerCase().trim();
  if (email && !email.includes("@") && eppn?.includes("@")) {
    email = eppn.toLowerCase();
  }
  if (email && !email.includes("@")) {
    email = `${email}@andrew.cmu.edu`;
  }

  if (!CMU_EMAIL.test(email)) {
    throw new Error("CMU login must use a @cmu.edu or @andrew.cmu.edu account");
  }

  const andrewId = eppn?.includes("@") ? eppn.split("@")[0]! : email.split("@")[0]!;
  const given = pickString(profile, "givenName") || pickString(profile, "givenname");
  const sn = pickString(profile, "sn") || pickString(profile, "surname");
  const displayName = [given, sn].filter(Boolean).join(" ").trim() || null;

  return { email, andrewId, displayName };
}

function pickString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim();
  return null;
}
