/**
 * JWT secret: required in production. Local dev falls back so login/register work without .env.
 */
const fromEnv = process.env.JWT_SECRET?.trim();

export const JWT_SECRET =
  fromEnv ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "roommate-dev-jwt-secret-change-in-production");

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is missing. Add it to backend/.env (see .env.example). Required in production."
  );
}
