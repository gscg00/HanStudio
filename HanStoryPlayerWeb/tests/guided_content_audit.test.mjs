import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "..");

test("todos los cursos guiados conservan integridad estructural y pedagógica básica", () => {
  const output = execFileSync(
    process.execPath,
    [path.join(webRoot, "scripts", "audit_guided_courses.mjs")],
    { cwd: webRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  const report = JSON.parse(output);

  assert.equal(report.summary.errors, 0);
  assert.equal(report.stats.courses, 10);
  assert.ok(report.stats.lessons >= 3900);
  assert.ok(report.stats.activities >= 65000);
  assert.ok(report.stats.audioReferences >= 120000);
});
