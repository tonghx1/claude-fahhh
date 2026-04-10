#!/usr/bin/env node

// Claude Code "Stop" hook — plays FAHHHH buzzer on negative responses

const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const NEGATIVE_PATTERNS = [
  /\bi(?:'m| am) (?:not able|unable)\b/i,
  /\bi can(?:'t|not)\b/i,
  /\bi(?:'m| am) sorry,? (?:but |i )/i,
  /\bunfortunately\b/i,
  /\bI (?:don't|do not) (?:have|know|think)\b/i,
  /\berror(?:ed|s)?\b/i,
  /\bfailed\b/i,
  /\bfailure\b/i,
  /\bnot (?:possible|supported|available|allowed|permitted)\b/i,
  /\brefuse[ds]?\b/i,
  /\bdenied\b/i,
  /\bblocked\b/i,
  /\bcould(?:n't| not) (?:find|locate|access|open|read|write)\b/i,
  /\bno (?:such|matching|results?\b)/i,
  /\bdoes(?:n't| not) exist\b/i,
  /\btimed? ?out\b/i,
  /\bpermission denied\b/i,
  /\bnot found\b/i,
];

// Words/phrases that indicate it's not actually a negative response
// (e.g., Claude is explaining how to fix an error, not reporting one)
const FALSE_POSITIVE_DAMPENERS = [
  /\bhere(?:'s| is) (?:how|what|the)\b/i,
  /\bto fix\b/i,
  /\bsolution\b/i,
  /\bsuccessfully\b/i,
  /\bdone\b/i,
  /\bcompleted?\b/i,
  /\bcreated?\b/i,
  /\bupdated?\b/i,
];

function isNegativeResponse(text) {
  if (!text || text.length < 10) return false;

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

function getLastAssistantMessage(transcriptPath) {
  try {
    const content = fs.readFileSync(transcriptPath, "utf-8").trim();
    const lines = content.split("\n");

    // Walk backwards to find the last assistant message
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.role === "assistant") {
          // Extract text from content blocks
          if (typeof entry.content === "string") return entry.content;
          if (Array.isArray(entry.content)) {
            return entry.content
              .filter((b) => b.type === "text")
              .map((b) => b.text)
              .join("\n");
          }
        }
      } catch {
        continue;
      }
    }
  } catch {
    // Can't read transcript — not a reason to block
  }
  return "";
}

function playSound() {
  const soundFile = path.join(__dirname, "fahhhh.mp3");
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
    // Malformed input — approve and bail
    process.stdout.write(JSON.stringify({ decision: "approve" }));
    return;
  }

  const transcriptPath = data.transcript_path;
  if (transcriptPath) {
    const message = getLastAssistantMessage(transcriptPath);
    if (isNegativeResponse(message)) {
      playSound();
    }
  }

  // Always approve — we're just a sound effect, never block
  process.stdout.write(JSON.stringify({ decision: "approve" }));
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ decision: "approve" }));
});
