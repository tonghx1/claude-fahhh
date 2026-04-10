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
  return hook.hooks?.some((h) => h.command?.includes("claude-fahhh"));
}

function install() {
  const settings = readSettings();

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.UserPromptSubmit) settings.hooks.UserPromptSubmit = [];

  // Check if already installed
  if (settings.hooks.UserPromptSubmit.some(isOurHook)) {
    console.log("FAHHH is already installed!");
    return;
  }

  settings.hooks.UserPromptSubmit.push(HOOK_ENTRY);
  writeSettings(settings);

  console.log(
    [
      "",
      " ███████  █████  ██   ██ ██   ██ ██   ██",
      " ██      ██   ██ ██   ██ ██   ██ ██   ██",
      " █████   ███████ ███████ ███████ ███████",
      " ██      ██   ██ ██   ██ ██   ██ ██   ██",
      " ██      ██   ██ ██   ██ ██   ██ ██   ██",
      "",
      "  Installed! Restart Claude Code to activate.",
      "",
      "  The FAHHH buzzer will play when you submit",
      "  a frustrated prompt (profanity, complaints, rage).",
      "",
      "  To uninstall: fahhh uninstall",
      "",
    ].join("\n")
  );
}

function uninstall() {
  const settings = readSettings();

  if (!settings.hooks?.UserPromptSubmit) {
    console.log("FAHHH is not installed.");
    return;
  }

  const before = settings.hooks.UserPromptSubmit.length;
  settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit.filter((h) => !isOurHook(h));
  const after = settings.hooks.UserPromptSubmit.length;

  if (settings.hooks.UserPromptSubmit.length === 0) delete settings.hooks.UserPromptSubmit;
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;

  writeSettings(settings);

  if (before !== after) {
    console.log("FAHHH uninstalled. Restart Claude Code to take effect.");
  } else {
    console.log("FAHHH was not installed.");
  }
}

function test() {
  console.log("Playing FAHHH sound...");
  const soundPath = path.join(__dirname, "..", "lib", "fahhh.mp3");
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
    console.log("Did you hear the FAHHH?");
  } catch (e) {
    console.error("Could not play sound:", e.message);
  }
}

function status() {
  const settings = readSettings();
  const installed = settings.hooks?.UserPromptSubmit?.some(isOurHook);
  console.log(installed ? "FAHHH is installed and active." : "FAHHH is not installed. Run: fahhh install");
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
Usage: fahhh <command>

Commands:
  install     Add the FAHHH hook to Claude Code
  uninstall   Remove the FAHHH hook
  test        Play the FAHHH sound to test it
  status      Check if FAHHH is installed
`);
}
