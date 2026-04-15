/**
 * guidanceEngine.js — SafeLine Guidance Simulation Engine
 *
 * Accepts a full ticket object (containing waypoints, instructions, totalDistance)
 * instead of a destination string. This decouples the engine from static PATHS
 * and supports dynamically generated routes from pathGenerator.js.
 *
 * Simulation features:
 *  1. Gradually decreasing distance with noise + sinusoidal speed variation
 *  2. Direction stability buffering (anti-jitter)
 *  3. Micro-delay (280–500ms) before applying instructions
 *  4. Predictive pre-turn announcements (prepare messages)
 *  5. Smart voice via speakIfChanged (no repetition)
 *  6. Occasional system status messages
 *  7. Minor imperfection injection (micro-corrections)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { speakIfChanged, speak, announceArrival }    from './audioGuide.js';
import { SYSTEM_MESSAGES, MICRO_CORRECTIONS }        from './navigationPaths.js';

// ── Constants ────────────────────────────────────────────────────────────────
const UPDATE_INTERVAL_MS     = 750;
const STABILITY_THRESHOLD    = 2;
const MICRO_DELAY_BASE_MS    = 280;
const MICRO_DELAY_JITTER_MS  = 220;
const BASE_SPEED             = 0.42;
const SPEED_VARIANCE         = 0.18;
const NOISE_AMPLITUDE        = 0.09;
const PREPARE_TRIGGER_DIST   = 4.0;
const SYS_MSG_PROBABILITY    = 0.06;
const CORRECTION_PROBABILITY = 0.04;
const CORRECTION_DURATION_MS = 3200;

// ── Direction → icon map ─────────────────────────────────────────────────────
export const DIRECTION_ICONS = {
  straight:     '↑',
  slight_left:  '↖',
  slight_right: '↗',
  left:         '←',
  right:        '→',
};

// ── Initial state ────────────────────────────────────────────────────────────
const makeInitialState = (totalDistance) => ({
  distance:           totalDistance,
  direction:          'straight',
  instruction:        'Acquiring signal…',
  prepareInstruction: null,
  systemMessage:      null,
  microCorrection:    null,
  reached:            false,
});

// ── Hook ─────────────────────────────────────────────────────────────────────
/**
 * useGuidanceEngine(ticket)
 *
 * @param {object} ticket — full ticket object from generateTicket()
 *   Must have: { destination, colorName, instructions, totalDistance }
 */
export function useGuidanceEngine(ticket) {
  // Support both old (string) and new (object) API
  const pathData = (ticket && typeof ticket === 'object') ? ticket : null;

  const [guidance, setGuidance] = useState(
    makeInitialState(pathData?.totalDistance ?? 30)
  );

  const distRef         = useRef(pathData?.totalDistance ?? 30);
  const candidateDir    = useRef('straight');
  const candidateCount  = useRef(0);
  const lastInstText    = useRef('');
  const pendingTimer    = useRef(null);
  const sysMsgTimer     = useRef(null);
  const correctionTimer = useRef(null);
  const alive           = useRef(true);

  const patch = useCallback((updates) => {
    if (!alive.current) return;
    setGuidance((prev) => ({ ...prev, ...updates }));
  }, []);

  const showSysMsg = useCallback((msg) => {
    patch({ systemMessage: msg });
    clearTimeout(sysMsgTimer.current);
    sysMsgTimer.current = setTimeout(() => patch({ systemMessage: null }), 2800);
  }, [patch]);

  const showCorrection = useCallback((msg) => {
    patch({ microCorrection: msg });
    clearTimeout(correctionTimer.current);
    correctionTimer.current = setTimeout(
      () => patch({ microCorrection: null }), CORRECTION_DURATION_MS
    );
  }, [patch]);

  const applyInstruction = useCallback((text, direction) => {
    if (text === lastInstText.current) return;
    clearTimeout(pendingTimer.current);
    const delay = MICRO_DELAY_BASE_MS + Math.floor(Math.random() * MICRO_DELAY_JITTER_MS);
    pendingTimer.current = setTimeout(() => {
      if (!alive.current) return;
      lastInstText.current = text;
      patch({ instruction: text, direction });
      speakIfChanged(text);
    }, delay);
  }, [patch]);

  useEffect(() => {
    if (!pathData) return;
    alive.current = true;

    const destination = pathData.destination ?? 'your destination';
    const colorName   = pathData.colorName   ?? 'green';

    // Initial voice announcement
    setTimeout(() => speak(
      `Ticket confirmed. Follow the glowing ${colorName} line to ${destination}.`
    ), 700);

    // System messages
    const t1 = setTimeout(() => showSysMsg('Path aligned'),      2200);
    const t2 = setTimeout(() => showSysMsg('Navigation active'), 6500);

    // Set first instruction
    const t3 = setTimeout(() => {
      const first = pathData.instructions?.[0];
      if (first) {
        patch({ instruction: first.text, direction: 'straight' });
        lastInstText.current = first.text;
      }
    }, 1400);

    const interval = setInterval(() => {
      if (!alive.current) return;

      // ── Distance simulation ──────────────────────────────────────────────
      const wave  = 0.80 + Math.sin(Date.now() * 0.0009) * 0.28; // sinusoidal speed variation
      const speed = (BASE_SPEED + Math.random() * SPEED_VARIANCE) * wave;
      const noise = (Math.random() - 0.5) * 2 * NOISE_AMPLITUDE;
      distRef.current = Math.max(0, distRef.current - speed + noise);
      const dist = distRef.current;

      // ── Find active instruction ──────────────────────────────────────────
      const instructions = pathData.instructions ?? [];
      let activeInst = instructions[0];
      let activeIdx  = 0;
      for (let i = 0; i < instructions.length; i++) {
        if (dist <= instructions[i].atDistance) {
          activeInst = instructions[i];
          activeIdx  = i;
        }
      }

      // ── Direction stability buffer (anti-jitter) ─────────────────────────
      const candidate = activeInst?.direction ?? 'straight';
      if (candidate === candidateDir.current) {
        candidateCount.current++;
      } else {
        candidateDir.current  = candidate;
        candidateCount.current = 1;
      }
      if (candidateCount.current >= STABILITY_THRESHOLD && activeInst) {
        applyInstruction(activeInst.text, candidate);
      }

      // ── Predictive prepare message ───────────────────────────────────────
      let prepare = null;
      const nextIdx = activeIdx + 1;
      if (nextIdx < instructions.length) {
        const nextInst   = instructions[nextIdx];
        const distToNext = dist - nextInst.atDistance;
        if (distToNext >= 0 && distToNext <= PREPARE_TRIGGER_DIST && nextInst.prepare) {
          prepare = nextInst.prepare;
        }
      }

      // ── Occasional system messages ───────────────────────────────────────
      if (Math.random() < SYS_MSG_PROBABILITY) {
        showSysMsg(SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)]);
      }

      // ── Minor imperfection injection ─────────────────────────────────────
      if (Math.random() < CORRECTION_PROBABILITY) {
        showCorrection(MICRO_CORRECTIONS[Math.floor(Math.random() * MICRO_CORRECTIONS.length)]);
      }

      // ── Batch state update ───────────────────────────────────────────────
      patch({ distance: dist, prepareInstruction: prepare });

      // ── Arrival ──────────────────────────────────────────────────────────
      if (dist <= 0.5) {
        clearInterval(interval);
        alive.current = false;
        patch({
          distance: 0, reached: true,
          instruction: `You have arrived at ${destination}!`,
          direction: 'straight', prepareInstruction: null,
        });
        announceArrival(destination);
      }
    }, UPDATE_INTERVAL_MS);

    return () => {
      alive.current = false;
      clearInterval(interval);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(pendingTimer.current);
      clearTimeout(sysMsgTimer.current);
      clearTimeout(correctionTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — ticket is stable

  return {
    guidance,
    directionIcon: DIRECTION_ICONS[guidance.direction] ?? '↑',
  };
}
