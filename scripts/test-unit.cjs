const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const output = fs.mkdtempSync(path.join(os.tmpdir(), "transpo24-admin-tests-"));
const suites = {
  auth: ["auth/session.test.ts"],
  api: ["api/provider.test.ts"],
  "web-push": ["web-push/shared.test.ts", "web-push/client.test.ts"],
};
try {
  const selected = process.argv[2];
  if (selected && !suites[selected]) throw new Error("Unknown test suite");
  const files = selected ? suites[selected] : Object.values(suites).flat();
  const compile = spawnSync(process.execPath, [
    require.resolve("typescript/bin/tsc"), "--module", "nodenext", "--moduleResolution", "nodenext",
    "--target", "es2022", "--lib", "dom,es2022", "--strict", "--esModuleInterop", "--skipLibCheck",
    "--noEmit", "false", "--rootDir", "src/lib", "--outDir", output,
    ...files.map(file => `src/lib/${file}`),
  ], { cwd: root, stdio: "inherit" });
  if (compile.error) throw compile.error;
  if (compile.status !== 0) process.exitCode = compile.status ?? 1;
  else {
    const result = spawnSync(process.execPath, ["--test", ...files.map(file => path.join(output, file.replace(/\.ts$/, ".js")))], {
      cwd: root, stdio: "inherit",
      env: { ...process.env, NODE_PATH: path.join(root, "node_modules") },
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  }
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}
