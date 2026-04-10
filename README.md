# claude-fahhh

Plays a **FAHHH** buzzer sound effect when you submit a frustrated prompt in Claude Code (profanity, complaints, rage).

Uses Claude Code's [hooks system](https://docs.anthropic.com/en/docs/claude-code/hooks) to listen for the `UserPromptSubmit` event, reads your prompt, and blasts a game-show-wrong-answer buzzer when you're losing it.

## Install

```bash
npm install -g claude-fahhh
fahhh install
```

Then restart Claude Code.

## Commands

```bash
fahhh install    # Add the hook to Claude Code settings
fahhh uninstall  # Remove the hook
fahhh test       # Play the FAHHH sound to make sure it works
fahhh status     # Check if the hook is installed
```

## What triggers it?

The hook checks your prompt for frustrated signals like:

- Profanity/frustration: "shit", "fuck", "damn", "wtf", "ffs", "smh", "bruh"
- Complaints: "don't work", "doesn't work", "broken", "messed up", "screwed up"
- Rage: "keeps crashing", "still broken", "can't believe", "what the hell"
- Giving up: "hate this", "give up", "done with this"

It uses a scoring system -- a single swear word in a polite question won't trigger it. It needs multiple negative signals and checks for false positives (like "please", "can you help", "how to fix").

## How it works

1. You submit a prompt and Claude Code fires the `UserPromptSubmit` hook
2. The hook reads your prompt text
3. It checks for frustrated vibes
4. If frustrated: **FAHHH**
5. Always allows the prompt through (never blocks you)

## Platform support

- **macOS**: `afplay` (built-in)
- **Linux**: `mpv` / `ffplay` / `paplay`
- **Windows**: PowerShell `Media.SoundPlayer`

## License

MIT
