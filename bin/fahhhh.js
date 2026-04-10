#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const HOOK_COMMAND = `node ${path.join(__dirname, "..", "lib", "hook.js")}`;

const HOOK_ENTRY = {
  matcher: "",
  hooks: [
    {
      type: "command",
      command: HOOK_COMMAND,
      timeout: 10,
    },
  ],
};

function getSettingsPath() {
  return path.join(os.homedir(), ".claude", "settings.json");
}

function readSettings() {
  const settingsPath = getSettingsPath();
  if (fs.existsSync(settingsPath)) {
    return JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  }
  return {};
}

function writeSettings(settings) {
  const settingsPath = getSettingsPath();
  const dir = path.dirname(settingsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}

function isOurHook(hook) {
  return hook.hooks?.some((h) => h.command?.includes("claude-code-fahhhh"));
}

function install() {
  const settings = readSettings();

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.Stop) settings.hooks.Stop = [];

  // Check if already installed
  if (settings.hooks.Stop.some(isOurHook)) {
    console.log("FAHHHH is already installed!");
    return;
  }

  settings.hooks.Stop.push(HOOK_ENTRY);
  writeSettings(settings);

  console.log(`
  ____  _   _  _ _  _ _  _
 |  __|| | | || | || | || |
 | |__ | |_| || |_|| |_|| |_
 |  __||  _  ||  _||  _||  _|
 | |   | | | || | | | |  | |
 |_|   |_| |_||_| |_|   |_|

  Installed! Restart Claude Code to activate.

  The FAHHHH buzzer will play when Claude gives
  a negative response (errors, refusals, failures).

  To uninstall: fahhhh uninstall
`);
}

function uninstall() {
  const settings = readSettings();

  if (!settings.hooks?.Stop) {
    console.log("FAHHHH is not installed.");
    return;
  }

  const before = settings.hooks.Stop.length;
  settings.hooks.Stop = settings.hooks.Stop.filter((h) => !isOurHook(h));
  const after = settings.hooks.Stop.length;

  if (settings.hooks.Stop.length === 0) delete settings.hooks.Stop;
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;

  writeSettings(settings);

  if (before !== after) {
    console.log("FAHHHH uninstalled. Restart Claude Code to take effect.");
  } else {
    console.log("FAHHHH was not installed.");
  }
}

function test() {
  console.log("Playing FAHHHH sound...");
  const soundPath = path.join(__dirname, "..", "lib", "fahhhh.wav");
  if (!fs.existsSync(soundPath)) {
    console.log("Sound file not found. Generating...");
    require("../lib/generate-sound");
  }

  const { execFileSync } = require("child_process");
  try {
    if (process.platform === "darwin") {
      execFileSync("afplay", [soundPath]);
    } else if (process.platform === "linux") {
      try {
        execFileSync("aplay", [soundPath]);
      } catch {
        execFileSync("paplay", [soundPath]);
      }
    } else if (process.platform === "win32") {
      execFileSync("powershell", [
        "-c",
        `(New-Object Media.SoundPlayer '${soundPath}').PlaySync()`,
      ]);
    }
    console.log("Did you hear the FAHHHH?");
  } catch (e) {
    console.error("Could not play sound:", e.message);
  }
}

function status() {
  const settings = readSettings();
  const installed = settings.hooks?.Stop?.some(isOurHook);
  console.log(installed ? "FAHHHH is installed and active." : "FAHHHH is not installed. Run: fahhhh install");
}

// CLI
const command = process.argv[2];

switch (command) {
  case "install":
    install();
    break;
  case "uninstall":
  case "remove":
    uninstall();
    break;
  case "test":
    test();
    break;
  case "status":
    status();
    break;
  default:
    console.log(`
Usage: fahhhh <command>

Commands:
  install     Add the FAHHHH hook to Claude Code
  uninstall   Remove the FAHHHH hook
  test        Play the FAHHHH sound to test it
  status      Check if FAHHHH is installed
`);
}
