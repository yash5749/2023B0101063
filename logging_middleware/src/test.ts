import {
  initializeLogger,
  Log
} from "./logger";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH ?? path.resolve(__dirname, ".env")
});

const testToken = process.env.BEARER_TOKEN;

async function main() {
  if (!testToken) {
    console.error(
      "Set BEARER_TOKEN in your environment or .env file before running the test."
    );
    process.exit(1);
  }

  initializeLogger(testToken);

  const res = await Log(
    "backend",
    "info",
    "service",
    "logger package test successful"
  );

  console.log("Logger response:", res);
}

main().catch((error) => {
  console.error(
    "Logger test failed:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
