# claude-code-fahhhh

Plays a **FAHHHH** buzzer sound effect when Claude Code gives you a negative response (errors, refusals, "I can't do that", failures).

Uses Claude Code's [hooks system](https://docs.anthropic.com/en/docs/claude-code/hooks) to listen for the `Stop` event, reads the transcript, and blasts a game-show-wrong-answer buzzer when things go south.

## Install

```bash
npm install -g claude-code-fahhhh
fahhhh install
```

Then restart Claude Code.

## Commands

```bash
fahhhh install    # Add the hook to Claude Code settings
fahhhh uninstall  # Remove the hook
fahhhh test       # Play the FAHHHH sound to make sure it works
fahhhh status     # Check if the hook is installed
```

## What triggers it?

The hook checks the assistant's response for negative signals like:

- "I can't", "I'm unable", "unfortunately"
- "error", "failed", "failure"
- "not found", "permission denied", "timed out"
- "refused", "denied", "blocked"

It uses a scoring system — a single "error" in a response about fixing an error won't trigger it. It needs multiple negative signals and checks for false positives (like "here's how to fix the error").

## How it works

1. Claude Code finishes a response and fires the `Stop` hook
2. The hook reads the conversation transcript
3. It checks the last assistant message for negative vibes
4. If negative: **FAHHHH**
5. Always approves the stop (never blocks Claude)

## Platform support

- **macOS**: `afplay` (built-in)
- **Linux**: `aplay` / `paplay` / `pw-play`
- **Windows**: PowerShell `Media.SoundPlayer`

## License

MIT
