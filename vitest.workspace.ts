import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineWorkspace } from "vitest/config";

import { storybookTest } from "@storybook/experimental-addon-test/vitest-plugin";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// Plain node unit tests (e.g. the crypto service).
const projects = [
  {
    extends: "vite.config.ts",
    test: {
      name: "unit",
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  },
];

// The Storybook test project only works when a .storybook config is present.
// Guard it so the absence of that config doesn't break the whole test runner.
// More info at: https://storybook.js.org/docs/writing-tests/test-addon
if (
  existsSync(path.join(dirname, ".storybook/main.ts")) ||
  existsSync(path.join(dirname, ".storybook/main.js"))
) {
  projects.push({
    extends: "vite.config.ts",
    // @ts-expect-error plugins is valid here; the unit project just omits it
    plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
    test: {
      name: "storybook",
      browser: {
        enabled: true,
        headless: true,
        name: "chromium",
        provider: "playwright",
      },
      setupFiles: [".storybook/vitest.setup.ts"],
    },
  });
}

export default defineWorkspace(projects);
