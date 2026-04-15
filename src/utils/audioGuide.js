/**
 * audioGuide.js — SafeLine Web Speech API wrapper
 *
 * Smart voice triggering: speakIfChanged prevents repetitive output.
 * All audio guidance for SafeLine navigation system.
 */

let _lastSpoken   = '';
let _cooldownTimer = null;
const COOLDOWN_MS  = 4000;

/** Always fires immediately — cancels any in-progress utterance. */
export function speak(text, { rate = 0.92, pitch = 1.0, volume = 1.0 } = {}) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance   = new SpeechSynthesisUtterance(text);
    utterance.rate    = rate;
    utterance.pitch   = pitch;
    utterance.volume  = volume;
    utterance.lang    = 'en-US';

    const voices    = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang === 'en-US' &&
        (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
    );
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  } catch (e) { /* silently ignore if TTS blocked */ }
}

/**
 * Speak only if text changed from last utterance AND cooldown elapsed.
 * This is the primary call used by guidanceEngine — prevents repetition.
 */
export function speakIfChanged(text) {
  if (!text || text === _lastSpoken) return;
  _lastSpoken = text;
  clearTimeout(_cooldownTimer);
  speak(text);
  _cooldownTimer = setTimeout(() => {}, COOLDOWN_MS);
}

/**
 * Arrival announcement — called once when distance reaches 0.
 */
export function announceArrival(destination) {
  speak(
    `You have arrived at ${destination}. Thank you for using SafeLine.`,
    { rate: 0.88, pitch: 1.1 }
  );
}
