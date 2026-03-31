/**
 * Plugin Loader Extension
 *
 * Reads PI_PLUGINS env var and dynamically loads extensions
 * from <agentDir>/plugins/<n>/index.ts (or <n>.ts)
 *
 * Uses getAgentDir() so it respects PI_CODING_AGENT_DIR.
 *
 * Usage:
 *   PI_PLUGINS=multi-team-chat pi
 *   PI_PLUGINS=multi-team-chat,code-review pi
 *
 * Shell alias:
 *   alias pi-team='PI_PLUGINS=multi-team-chat pi'
 *
 * Install:
 *   cp plugin-loader.ts <your-agent-dir>/extensions/
 *   mkdir -p <your-agent-dir>/plugins
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getAgentDir } from "@mariozechner/pi-coding-agent";
import * as path from "node:path";
import * as fs from "node:fs";

export default function pluginLoader(pi: ExtensionAPI) {
  const PLUGINS_DIR = path.join(getAgentDir(), "plugins");

  const raw = process.env.PI_PLUGINS;
  if (!raw) return;

  const pluginNames = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (pluginNames.length === 0) return;

  const loaded: string[] = [];
  const failed: string[] = [];

  for (const name of pluginNames) {
    const pluginDir = path.join(PLUGINS_DIR, name);
    const indexTs = path.join(pluginDir, "index.ts");
    const singleTs = pluginDir + ".ts";

    let pluginPath: string | null = null;
    if (fs.existsSync(indexTs)) pluginPath = indexTs;
    else if (fs.existsSync(singleTs)) pluginPath = singleTs;

    if (!pluginPath) {
      console.error(`[plugin-loader] not found: ${name}`);
      console.error(`  tried: ${indexTs}`);
      console.error(`    and: ${singleTs}`);
      failed.push(name);
      continue;
    }

    try {
      const plugin = require(pluginPath);
      const init = plugin.default || plugin;

      if (typeof init !== "function") {
        console.error(`[plugin-loader] ${name}: export is ${typeof init}, not a function`);
        failed.push(name);
        continue;
      }

      init(pi);
      loaded.push(name);
      console.error(`[plugin-loader] loaded: ${name}`);
    } catch (err: any) {
      console.error(`[plugin-loader] ${name}: ${err.message}`);
      failed.push(name);
    }
  }

  pi.on("session_start", async (_event, ctx) => {
    if (loaded.length > 0) {
      ctx.ui.notify(`Plugins: ${loaded.join(", ")}`, "info");
    }
    if (failed.length > 0) {
      ctx.ui.notify(`Plugins failed: ${failed.join(", ")}`, "error");
    }
  });
}
