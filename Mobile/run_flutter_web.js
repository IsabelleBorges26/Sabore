const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const appDir = path.join(__dirname, "sabore_app");
const backendScript = path.join(__dirname, "start_backend_mobile.js");
let backend;
let flutter;
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  if (flutter && !flutter.killed) flutter.kill();
  if (backend && !backend.killed) backend.kill();
  process.exitCode = exitCode;
}

function waitForApi(timeoutMs = 45000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      if (stopping) return reject(new Error("Execução cancelada."));
      if (Date.now() - startedAt >= timeoutMs) {
        return reject(new Error("A API local não iniciou na porta 3000."));
      }

      const request = http.get(
        "http://127.0.0.1:3000/estatisticas/publicas",
        { timeout: 2500 },
        (response) => {
          response.resume();
          resolve();
        },
      );

      request.on("error", () => setTimeout(check, 1000));
      request.on("timeout", () => {
        request.destroy();
        setTimeout(check, 1000);
      });
    };

    check();
  });
}

function startBackend() {
  backend = spawn(process.execPath, [backendScript], {
    cwd: rootDir,
    stdio: "inherit",
  });
  backend.on("error", (error) => {
  console.error("Não foi possível iniciar o backend Saboré:", error.message);
  stop(1);
});

  backend.on("exit", (code) => {
  if (!stopping && code !== 0) {
    console.error(`O backend encerrou com código ${code}.`);
    stop(code || 1);
  }
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

waitForApi(1500)
  .catch(() => {
    startBackend();
    return waitForApi();
  })
  .then(() => {
    if (stopping) return;
    const command = process.platform === "win32" ? "flutter.bat" : "flutter";
    flutter = spawn(command, ["run", "-d", "chrome"], {
      cwd: appDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    flutter.on("error", (error) => {
      console.error("Não foi possível iniciar o Flutter Web:", error.message);
      stop(1);
    });
    flutter.on("exit", (code) => stop(code || 0));
  })
  .catch((error) => {
    console.error(error.message);
    stop(1);
  });
