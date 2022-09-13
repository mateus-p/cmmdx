#!/usr/bin/env node

import main from "./main.mjs";
import CustomConsole from "./cons.mjs";

const logger = new CustomConsole();

try {
  main();
} catch (err) {
  logger.error(err as Error);
  process.exit(1);
}

