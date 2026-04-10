#!/usr/bin/env node

// Claude Code "UserPromptSubmit" hook — plays FAHHH buzzer on frustrated user prompts

const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const NEGATIVE_PATTERNS = [
  /\bshit\b/i,
  /\bfuck(?:ing|ed|s)?\b/i,
  /\bdamn(?:it)?\b/i,
  /\bwtf\b/i,
  /\bffs\b/i,
  /\bsmh\b/i,
  /\bbruh\b/i,
  /\bbro\b.*\b(?:broken|work|fail|crash|wrong|bad|suck)/i,
  /\bdon'?t\s+work/i,
  /\bdoesn'?t\s+work/i,
  /\bwon'?t\s+work/i,
  /\bnot\s+working\b/i,
  /\bbroken\b/i,
  /\bmessed\s+up\b/i,
  /\bscrewed\s+up\b/i,
  /\bkeeps?\s+crashing\b/i,
  /\bstill\s+broken\b/i,
  /\bcan'?t\s+believe\b/i,
  /\bare\s+you\s+kidding\b/i,
  /\bwhat\s+the\s+hell\b/i,
  /\bwhy\s+is\s+this\b/i,
  /\bhate\s+this\b/i,
  /\bgive\s+up\b/i,
  /\bdone\s+with\s+this\b/i,
];

// Words/phrases that indicate the user is NOT frustrated
// (e.g., asking for help politely, seeking explanation)
const FALSE_POSITIVE_DAMPENERS = [
  /\bhow\s+to\s+fix\b/i,
  /\bcan\s+you\s+help\b/i,
  /\bplease\b/i,
  /\bthanks\b/i,
  /\bwhat\s+does\b.*\bmean\b/i,
  /\bexplain\b/i,
  /\bhow\s+do\s+I\b/i,
];

function isNegativePrompt(text) {
  if (!text || text.length < 5) return false;

  // Only check the first ~500 chars — the sentiment is usually up front
  const snippet = text.slice(0, 500);

  let negativeHits = 0;
  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(snippet)) negativeHits++;
  }

  let positiveHits = 0;
  for (const pattern of FALSE_POSITIVE_DAMPENERS) {
    if (pattern.test(snippet)) positiveHits++;
  }

  // Need at least 2 negative signals and more negatives than positives
  return negativeHits >= 2 && negativeHits > positiveHits;
}

function playSound() {
  const soundFile = path.join(__dirname, "fahhh.mp3");
  if (!fs.existsSync(soundFile)) return;

  const platform = process.platform;
  if (platform === "darwin") {
    execFile("afplay", [soundFile], { timeout: 5000 }, () => {});
  } else if (platform === "linux") {
    // Try mpv, then ffplay, then paplay
    execFile("mpv", ["--no-video", soundFile], { timeout: 5000 }, (err) => {
      if (err) {
        execFile("ffplay", ["-nodisp", "-autoexit", soundFile], { timeout: 5000 }, (err2) => {
          if (err2) {
            execFile("paplay", [soundFile], { timeout: 5000 }, () => {});
          }
        });
      }
    });
  } else if (platform === "win32") {
    const cmd = `Add-Type -AssemblyName presentationCore; $p = New-Object System.Windows.Media.MediaPlayer; $p.Open('${soundFile}'); $p.Play(); Start-Sleep -Seconds 3`;
    execFile("powershell", ["-c", cmd], { timeout: 5000 }, () => {});
  }
}

async function main() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let data;
  try {
    data = JSON.parse(input);
  } catch {
    // Malformed input — allow and bail
    process.stdout.write(JSON.stringify({ result: "allow" }));
    return;
  }

  const prompt = data.prompt;
  if (prompt && isNegativePrompt(prompt)) {
    playSound();
  }

  // Always allow — we're just a sound effect, never block
  process.stdout.write(JSON.stringify({ result: "allow" }));
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ result: "allow" }));
});
