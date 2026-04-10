#!/usr/bin/env node

// Generates a "FAHHHH" game-show-buzzer WAV file
// Classic wrong-answer descending buzzer tone

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;
const DURATION = 1.4; // seconds
const NUM_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;

function generateBuzzerSamples() {
  const samples = new Int16Array(NUM_SAMPLES);

  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / DURATION;

    // Descending frequency: 420Hz -> 180Hz (classic fail buzzer)
    const freq = 420 - 240 * progress;

    // Main tone (square-ish wave for that harsh buzzer quality)
    const phase = 2 * Math.PI * freq * t;
    let sample = Math.sin(phase); // fundamental
    sample += 0.5 * Math.sin(2 * phase); // 2nd harmonic
    sample += 0.3 * Math.sin(3 * phase); // 3rd harmonic
    sample += 0.15 * Math.sin(5 * phase); // 5th harmonic (adds grit)

    // Soft clipping for that buzzer distortion
    sample = Math.tanh(sample * 1.2);

    // Envelope: quick attack, sustain, fade out at end
    let envelope = 1.0;
    if (t < 0.02) {
      envelope = t / 0.02; // 20ms attack
    } else if (t > DURATION - 0.3) {
      envelope = (DURATION - t) / 0.3; // 300ms fade out
    }

    // Add a wobble/vibrato for extra "sadness"
    const vibrato = 1.0 + 0.02 * Math.sin(2 * Math.PI * 6 * t);
    sample *= vibrato;

    // Three descending "wah" pulses overlaid
    const pulseRate = 2.5; // pulses per second
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(Math.PI * pulseRate * t));
    sample *= pulse;

    sample *= envelope * 0.85;

    // Convert to 16-bit PCM
    samples[i] = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
  }

  return samples;
}

function writeWav(filePath, samples) {
  const dataSize = samples.length * (BITS_PER_SAMPLE / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(NUM_CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8), 28); // byte rate
  buffer.writeUInt16LE(NUM_CHANNELS * (BITS_PER_SAMPLE / 8), 32); // block align
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

const outputPath = path.join(__dirname, "fahhhh.wav");
const samples = generateBuzzerSamples();
writeWav(outputPath, samples);
console.log(`Generated FAHHHH sound: ${outputPath}`);
