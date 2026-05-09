#!/usr/bin/env node

import("../dist/cli.js").catch((err) => {
  console.error("Failed to load token-receipts CLI:", err);
  process.exit(1);
});
