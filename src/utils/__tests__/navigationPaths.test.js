/**
 * navigationPaths.test.js — SafeLine Constants Tests
 */

import { describe, it, expect } from 'vitest';
import { SYSTEM_MESSAGES, MICRO_CORRECTIONS } from '../navigationPaths.js';

describe('SYSTEM_MESSAGES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(SYSTEM_MESSAGES)).toBe(true);
    expect(SYSTEM_MESSAGES.length).toBeGreaterThan(0);
  });

  it('all entries are non-empty strings', () => {
    SYSTEM_MESSAGES.forEach((msg) => {
      expect(typeof msg).toBe('string');
      expect(msg.trim().length).toBeGreaterThan(0);
    });
  });

  it('contains expected navigation messages', () => {
    expect(SYSTEM_MESSAGES).toContain('Path aligned');
    expect(SYSTEM_MESSAGES).toContain('Navigation active');
  });
});

describe('MICRO_CORRECTIONS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(MICRO_CORRECTIONS)).toBe(true);
    expect(MICRO_CORRECTIONS.length).toBeGreaterThan(0);
  });

  it('all corrections are non-empty strings', () => {
    MICRO_CORRECTIONS.forEach((msg) => {
      expect(typeof msg).toBe('string');
      expect(msg.trim().length).toBeGreaterThan(0);
    });
  });

  it('corrections include directional guidance', () => {
    const combined = MICRO_CORRECTIONS.join(' ');
    expect(combined.toLowerCase()).toMatch(/left|right|center/);
  });
});
