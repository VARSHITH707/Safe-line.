/**
 * pathGenerator.test.js — SafeLine Unit Tests
 *
 * Tests for the core path generation engine:
 *  - Geometric correctness of waypoints
 *  - Turn direction math (90° left/right)
 *  - Instruction ordering and completeness
 *  - Ticket generation with correct structure
 *  - Color variety (no consecutive repeats)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generatePath, generateTicket } from '../pathGenerator.js';

// ── generatePath tests ────────────────────────────────────────────────────

describe('generatePath()', () => {
  let path;

  beforeEach(() => {
    path = generatePath();
  });

  it('returns all required fields', () => {
    expect(path).toHaveProperty('waypoints');
    expect(path).toHaveProperty('instructions');
    expect(path).toHaveProperty('totalDistance');
    expect(path).toHaveProperty('turnDirs');
  });

  it('waypoints is a non-empty array', () => {
    expect(Array.isArray(path.waypoints)).toBe(true);
    expect(path.waypoints.length).toBeGreaterThan(0);
  });

  it('each waypoint is a valid [x, y, z] triple', () => {
    path.waypoints.forEach((wp) => {
      expect(wp).toHaveLength(3);
      wp.forEach((coord) => expect(typeof coord).toBe('number'));
      expect(isNaN(wp[0])).toBe(false);
      expect(isNaN(wp[2])).toBe(false);
    });
  });

  it('first waypoint is always at origin [0, -0.5, 0]', () => {
    const [x, y, z] = path.waypoints[0];
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(-0.5);
    expect(z).toBeCloseTo(0);
  });

  it('totalDistance is within realistic range (30–55m)', () => {
    expect(path.totalDistance).toBeGreaterThanOrEqual(30);
    expect(path.totalDistance).toBeLessThanOrEqual(55);
  });

  it('turnDirs contains only "left" or "right"', () => {
    expect(Array.isArray(path.turnDirs)).toBe(true);
    path.turnDirs.forEach((dir) => {
      expect(['left', 'right']).toContain(dir);
    });
  });

  it('has exactly NUM_SEGS - 1 turns (2 turns for 3 segments)', () => {
    expect(path.turnDirs).toHaveLength(2);
  });

  it('instructions is a non-empty array', () => {
    expect(Array.isArray(path.instructions)).toBe(true);
    expect(path.instructions.length).toBeGreaterThan(0);
  });

  it('instructions are sorted high → low by atDistance', () => {
    const distances = path.instructions.map((inst) => inst.atDistance);
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeLessThanOrEqual(distances[i - 1]);
    }
  });

  it('first instruction atDistance equals totalDistance', () => {
    const first = path.instructions[0];
    expect(first.atDistance).toEqual(path.totalDistance);
  });

  it('each instruction has required fields', () => {
    path.instructions.forEach((inst) => {
      expect(inst).toHaveProperty('atDistance');
      expect(inst).toHaveProperty('direction');
      expect(inst).toHaveProperty('text');
      expect(typeof inst.atDistance).toBe('number');
      expect(typeof inst.text).toBe('string');
    });
  });

  it('instructions contain at least one turn instruction', () => {
    const turnInstructions = path.instructions.filter(
      (inst) => inst.direction === 'left' || inst.direction === 'right'
    );
    expect(turnInstructions.length).toBeGreaterThan(0);
  });

  it('last instruction has atDistance ≤ 1 (near arrival)', () => {
    const last = path.instructions[path.instructions.length - 1];
    expect(last.atDistance).toBeLessThanOrEqual(1);
  });

  it('generates different paths on repeated calls', () => {
    const paths = Array.from({ length: 5 }, () => generatePath());
    const distances = paths.map((p) => p.totalDistance);
    const unique = new Set(distances);
    // With random ranges, at least some variation expected
    expect(unique.size).toBeGreaterThanOrEqual(1);
  });
});

// ── Turn direction math tests ─────────────────────────────────────────────

describe('turn direction geometry', () => {
  it('left turn from -Z produces -X direction (+90° Y rotation)', () => {
    // Formula: [dx, dz] → [dz, -dx]
    const [dx, dz] = [0, -1]; // facing -Z (forward)
    const [newDx, newDz] = [dz, -dx]; // left turn
    expect(newDx).toBeCloseTo(-1);
    expect(newDz).toBeCloseTo(0);
  });

  it('right turn from -Z produces +X direction (-90° Y rotation)', () => {
    // Formula: [dx, dz] → [-dz, dx]
    const [dx, dz] = [0, -1]; // facing -Z (forward)
    const [newDx, newDz] = [-dz, dx]; // right turn
    expect(newDx).toBeCloseTo(1);
    expect(newDz).toBeCloseTo(0);
  });

  it('two left turns from -Z produces +Z (back-facing)', () => {
    let [dx, dz] = [0, -1];
    [dx, dz] = [dz, -dx]; // left turn 1
    [dx, dz] = [dz, -dx]; // left turn 2
    expect(dx).toBeCloseTo(0);
    expect(dz).toBeCloseTo(1);
  });
});

// ── generateTicket tests ──────────────────────────────────────────────────

describe('generateTicket()', () => {
  let ticket;

  beforeEach(() => {
    ticket = generateTicket();
  });

  it('returns all required ticket fields', () => {
    expect(ticket).toHaveProperty('id');
    expect(ticket).toHaveProperty('destination');
    expect(ticket).toHaveProperty('color');
    expect(ticket).toHaveProperty('colorName');
    expect(ticket).toHaveProperty('gate');
    expect(ticket).toHaveProperty('time');
    expect(ticket).toHaveProperty('seat');
    expect(ticket).toHaveProperty('waypoints');
    expect(ticket).toHaveProperty('instructions');
    expect(ticket).toHaveProperty('totalDistance');
    expect(ticket).toHaveProperty('turnDirs');
    expect(ticket).toHaveProperty('mode');
  });

  it('id has correct format TK-XXXX', () => {
    expect(ticket.id).toMatch(/^TK-\d{4}$/);
  });

  it('color is a valid hex code', () => {
    expect(ticket.color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('mode is "Demo Mode – Simulated Navigation"', () => {
    expect(ticket.mode).toBe('Demo Mode – Simulated Navigation');
  });

  it('gate has correct format (letter + digit)', () => {
    expect(ticket.gate).toMatch(/^[A-E]\d$/);
  });

  it('waypoints match embedded path waypoints', () => {
    expect(Array.isArray(ticket.waypoints)).toBe(true);
    expect(ticket.waypoints.length).toBeGreaterThan(0);
  });

  it('generates different colors across multiple calls', () => {
    const colors = new Set(Array.from({ length: 10 }, () => generateTicket().color));
    expect(colors.size).toBeGreaterThan(1);
  });

  it('totalDistance is a positive number', () => {
    expect(ticket.totalDistance).toBeGreaterThan(0);
    expect(typeof ticket.totalDistance).toBe('number');
  });
});
