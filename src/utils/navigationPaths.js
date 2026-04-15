/**
 * navigationPaths.js — SafeLine Constants
 *
 * NOTE: Static named PATHS have been replaced by the dynamic pathGenerator.
 * This file now only exports message pools used by the guidance engine.
 */

// Occasional system status messages (shown as ephemeral flashes in overlay)
export const SYSTEM_MESSAGES = [
  'Path aligned',
  'Optimizing route…',
  'Recalculating path…',
  'Signal stable',
  'Navigation active',
  'Route confirmed',
  'Sensor calibrated',
  'SafeLine v1.0 active',
];

// Minor imperfection corrections (brief, realistic micro-corrections)
export const MICRO_CORRECTIONS = [
  'Adjust slightly right',
  'Adjust slightly left',
  'Re-centering path',
  'Minor correction applied',
  'Reacquiring signal…',
];
