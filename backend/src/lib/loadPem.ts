import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Read PEM from env value or a file path (relative to backend/ unless absolute). */
export function loadPem(inlineEnv: string | undefined, fileEnv: string | undefined, defaultRelativeFile?: string): string {
  const inline = inlineEnv?.replace(/\\n/g, "\n").trim();
  if (inline) return inline;

  const filePath = fileEnv?.trim() || defaultRelativeFile;
  if (!filePath) return "";

  const resolved = path.isAbsolute(filePath) ? filePath : path.join(backendRoot, filePath);
  if (!fs.existsSync(resolved)) return "";
  return fs.readFileSync(resolved, "utf8").trim();
}
