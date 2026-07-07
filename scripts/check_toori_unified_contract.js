const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const webRootCandidates = [
  path.resolve(root, "..", "Web-Torriserviciosya-nueva"),
  path.resolve("E:", "Usuario", "Web-Torriserviciosya-nueva"),
  path.resolve(
    root,
    "..",
    "Users",
    "LENOVO",
    ".openclaw",
    "workspace",
    "external",
    "Web-Torriserviciosya-nueva",
  ),
];

const requiredAppFiles = [
  "TOORI_UNIFIED_CONTRACT.md",
  "lib/tooriBridge.ts",
  "types/tooriBridge.ts",
  "components/tooriBridge/PedidosMicaSection.tsx",
];

const requiredEndpointNames = [
  "sync-prestador.php",
  "pedidos-disponibles.php",
  "responder-pedido.php",
  "estado-pedido.php",
];

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${message}`);
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

console.log("Toori unified contract check\n");

for (const file of requiredAppFiles) {
  assert(exists(file), `App file exists: ${file}`);
}

const appJson = JSON.parse(
  fs.readFileSync(path.join(root, "app.json"), "utf8"),
);
assert(
  appJson?.expo?.extra?.tooriBridge?.baseUrl ===
    "https://tooriserviciosya.com/api/app",
  "app.json exposes tooriBridge.baseUrl",
);

const bridgeSource = fs.readFileSync(
  path.join(root, "lib/tooriBridge.ts"),
  "utf8",
);
for (const endpoint of requiredEndpointNames) {
  assert(bridgeSource.includes(endpoint), `App bridge references ${endpoint}`);
}
assert(
  bridgeSource.includes("supabase.auth.getSession"),
  "App bridge tries Supabase Auth session before fallback token",
);

const guessedWebRoot =
  webRootCandidates.find((candidate) => fs.existsSync(candidate)) ?? null;
if (!guessedWebRoot) {
  console.warn(
    "⚠️ Web repo not found from this checkout; skipped endpoint existence check.",
  );
} else {
  for (const endpoint of requiredEndpointNames) {
    assert(
      fs.existsSync(path.join(guessedWebRoot, "api", "app", endpoint)),
      `Web endpoint exists: api/app/${endpoint}`,
    );
  }
  const authSource = fs.readFileSync(
    path.join(guessedWebRoot, "api", "app", "app-auth.php"),
    "utf8",
  );
  assert(
    authSource.includes("app_bridge_validate_supabase_user_token"),
    "Web auth validates Supabase Auth bearer tokens",
  );
  assert(
    authSource.includes("TOORI_APP_SYNC_TOKEN"),
    "Web auth supports shared sync token fallback",
  );

  const pedidosSource = fs.readFileSync(
    path.join(guessedWebRoot, "api", "app", "pedidos-disponibles.php"),
    "utf8",
  );
  assert(
    pedidosSource.includes("mica_app") &&
      pedidosSource.includes("modo_agente") &&
      pedidosSource.includes("app_cliente_id"),
    "Web pedidos endpoint supports MICA app requests and hides own requests",
  );
}

if (process.exitCode) {
  console.error("\nToori unified contract check FAILED.");
  process.exit(process.exitCode);
}

console.log("\nToori unified contract check OK.");
