/**
 * constants.js
 * Core game constants for osu! clone - timing windows, scoring, playfield dimensions, and mods
 * No dependencies - must be loaded first in the module chain
 */

// Playfield dimensions (osu! standard coordinate system)
export const OSU_PLAYFIELD = {
    WIDTH: 512,
    HEIGHT: 384,
    CENTER_X: 256,
    CENTER_Y: 192
};

// Hit timing windows base values in milliseconds
export const TIMING_WINDOWS = {
    PERFECT_300: 80,
    GOOD_100: 140,
    MEH_50: 200
};

// Score values for different hit results
export const SCORE_VALUES = {
    300: 300,
    100: 100,
    50: 50,
    miss: 0,
    SLIDER_TICK: 10,
    SLIDER_REPEAT: 30,
    SPINNER_SPIN: 100,
    SPINNER_BONUS: 1000
};

// Health changes for different hit results
export const HEALTH_CHANGES = {
    300: 5,
    100: 2,
    50: 1,
    miss: -8,
    SLIDER_TICK: 1,
    SLIDER_BREAK: -5,
    SPINNER_SPIN: 1
};

// Mod flag bitmasks (matching osu! format)
export const MOD_FLAGS = {
    NONE: 0,
    NO_FAIL: 1,
    EASY: 2,
    HIDDEN: 8,
    HARD_ROCK: 16,
    DOUBLE_TIME: 64,
    RELAX: 128,
    HALF_TIME: 256,
    FLASHLIGHT: 1024,
    AUTOPLAY: 2048,
    AUTOPILOT: 8192
};

// Score multipliers for each mod
export const MOD_MULTIPLIERS = {
    [MOD_FLAGS.NONE]: 1.0,
    [MOD_FLAGS.NO_FAIL]: 0.5,
    [MOD_FLAGS.EASY]: 0.5,
    [MOD_FLAGS.HIDDEN]: 1.06,
    [MOD_FLAGS.HARD_ROCK]: 1.06,
    [MOD_FLAGS.DOUBLE_TIME]: 1.12,
    [MOD_FLAGS.RELAX]: 0,
    [MOD_FLAGS.HALF_TIME]: 0.3,
    [MOD_FLAGS.FLASHLIGHT]: 1.12,
    [MOD_FLAGS.AUTOPLAY]: 1.0,
    [MOD_FLAGS.AUTOPILOT]: 0
};

// Mod definitions with metadata
export const MOD_DEFINITIONS = [
    { id: 'NF', name: 'No Fail', flag: MOD_FLAGS.NO_FAIL, multiplier: 0.5, incompatible: ['AT', 'RX', 'AP'] },
    { id: 'EZ', name: 'Easy', flag: MOD_FLAGS.EASY, multiplier: 0.5, incompatible: ['HR'] },
    { id: 'HD', name: 'Hidden', flag: MOD_FLAGS.HIDDEN, multiplier: 1.06, incompatible: [] },
    { id: 'HR', name: 'Hard Rock', flag: MOD_FLAGS.HARD_ROCK, multiplier: 1.06, incompatible: ['EZ'] },
    { id: 'DT', name: 'Double Time', flag: MOD_FLAGS.DOUBLE_TIME, multiplier: 1.12, incompatible: ['HT'] },
    { id: 'HT', name: 'Half Time', flag: MOD_FLAGS.HALF_TIME, multiplier: 0.3, incompatible: ['DT'] },
    { id: 'FL', name: 'Flashlight', flag: MOD_FLAGS.FLASHLIGHT, multiplier: 1.12, incompatible: [] },
    { id: 'RX', name: 'Relax', flag: MOD_FLAGS.RELAX, multiplier: 0, incompatible: ['AT', 'AP', 'NF'] },
    { id: 'AP', name: 'Autopilot', flag: MOD_FLAGS.AUTOPILOT, multiplier: 0, incompatible: ['AT', 'RX', 'NF'] },
    { id: 'AT', name: 'Auto', flag: MOD_FLAGS.AUTOPLAY, multiplier: 1.0, incompatible: ['RX', 'AP', 'NF'] }
];

// Grade thresholds and requirements
export const GRADES = {
    SS: { minAccuracy: 100, min300Ratio: 1.0, allowMiss: false },
    S: { minAccuracy: 93.17, min300Ratio: 0.9, max50Ratio: 0.01, allowMiss: false },
    A: { minAccuracy: 80, min300Ratio: 0.8, allowMiss: true },
    B: { minAccuracy: 70, min300Ratio: 0.7, allowMiss: true },
    C: { minAccuracy: 60, min300Ratio: 0.6, allowMiss: true },
    D: { minAccuracy: 0, min300Ratio: 0, allowMiss: true }
};

// Hit object type flags from .osu file format
export const HIT_OBJECT_TYPES = {
    CIRCLE: 1,
    SLIDER: 2,
    NEW_COMBO: 4,
    SPINNER: 8
};

// Slider curve types
export const CURVE_TYPES = {
    LINEAR: 'L',
    PERFECT: 'P',
    BEZIER: 'B',
    CATMULL: 'C'
};

// Default combo colors (used when beatmap doesn't specify)
export const DEFAULT_COMBO_COLORS = [
    '#FF5555', // Red
    '#55FF55', // Green
    '#5555FF', // Blue
    '#FFFF55'  // Yellow
];

// Gameplay timing and behavior constants
export const GAMEPLAY = {
    STACK_LENIENCY: 0.7,
    LEAD_IN_TIME: 2000,
    FADE_IN_DURATION: 400,
    HIT_BURST_DURATION: 600,
    APPROACH_CIRCLE_START_SCALE: 4,
    SLIDER_FOLLOW_RADIUS_MULTIPLIER: 2.4,
    SPINNER_REQUIRED_ROTATIONS: 3,
    HP_DRAIN_RATE: 0.5,
    COMBO_BREAK_HEALTH_PENALTY: 10,
    COUNTDOWN_DURATION: 3000,
    SKIP_INTRO_THRESHOLD: 5000,
    AUDIO_OFFSET_DEFAULT: 0
};

// Visual effect constants
export const EFFECTS = {
    CURSOR_TRAIL_LENGTH: 20,
    CURSOR_TRAIL_LIFETIME: 200,
    HIT_PARTICLE_COUNT: 8,
    HIT_PARTICLE_LIFETIME: 600,
    COMBO_POPUP_DURATION: 400
};

/**
 * Calculate timing windows based on Overall Difficulty (OD)
 * Lower OD = larger timing windows (easier), higher OD = smaller windows (harder)
 * @param {number} od - Overall Difficulty (0-10, can exceed with mods)
 * @returns {Object} - Object containing hit windows in milliseconds
 */
export function calculateTimingWindows(od) {
    // Clamp OD to prevent extreme values
    const clampedOD = Math.max(0, Math.min(11, od));
    
    return {
        hitWindow300: 80 - 6 * clampedOD,
        hitWindow100: 140 - 8 * clampedOD,
        hitWindow50: 200 - 10 * clampedOD
    };
}

/**
 * Calculate approach time based on Approach Rate (AR)
 * Lower AR = more time to see objects, higher AR = less time
 * @param {number} ar - Approach Rate (0-10, can exceed with mods)
 * @returns {number} - Approach time in milliseconds
 */
export function calculateApproachTime(ar) {
    // Clamp AR to prevent extreme values
    const clampedAR = Math.max(0, Math.min(11, ar));
    
    if (clampedAR < 5) {
        // AR 0-5: 1800ms to 1200ms
        return 1800 - 120 * clampedAR;
    } else {
        // AR 5-10: 1200ms to 450ms
        return 1200 - 150 * (clampedAR - 5);
    }
}

/**
 * Calculate circle radius based on Circle Size (CS)
 * Lower CS = larger circles, higher CS = smaller circles
 * @param {number} cs - Circle Size (0-10)
 * @returns {number} - Circle radius in osu! pixels
 */
export function calculateCircleRadius(cs) {
    // Clamp CS to valid range
    const clampedCS = Math.max(0, Math.min(10, cs));
    
    // Standard osu! formula: radius = 54.4 - 4.48 * CS
    return 54.4 - 4.48 * clampedCS;
}

/**
 * Calculate preempt time (when object first becomes visible)
 * This is the same as approach time in standard osu!
 * @param {number} ar - Approach Rate (0-10)
 * @returns {number} - Preempt time in milliseconds
 */
export function calculatePreemptTime(ar) {
    return calculateApproachTime(ar);
}

/**
 * Calculate fade-in time based on AR
 * Objects fade in over this duration after becoming visible
 * @param {number} ar - Approach Rate (0-10)
 * @returns {number} - Fade-in time in milliseconds
 */
export function calculateFadeInTime(ar) {
    const clampedAR = Math.max(0, Math.min(11, ar));
    
    if (clampedAR < 5) {
        return 1200 - 80 * clampedAR;
    } else {
        return 800 - 100 * (clampedAR - 5);
    }
}

/**
 * Determine grade based on accuracy and hit counts
 * @param {number} accuracy - Accuracy percentage (0-100)
 * @param {number} count300 - Number of 300 hits
 * @param {number} count100 - Number of 100 hits
 * @param {number} count50 - Number of 50 hits
 * @param {number} countMiss - Number of misses
 * @param {boolean} isHidden - Whether Hidden mod is active
 * @param {boolean} isFlashlight - Whether Flashlight mod is active
 * @returns {string} - Grade (SS, SSH, S, SH, A, B, C, D)
 */
export function calculateGrade(accuracy, count300, count100, count50, countMiss, isHidden = false, isFlashlight = false) {
    const totalHits = count300 + count100 + count50 + countMiss;
    
    if (totalHits === 0) return 'D';
    
    const ratio300 = count300 / totalHits;
    const ratio50 = count50 / totalHits;
    
    let grade;
    
    // Determine base grade
    if (accuracy >= 100 && countMiss === 0) {
        grade = 'SS';
    } else if (ratio300 > 0.9 && ratio50 <= 0.01 && countMiss === 0) {
        grade = 'S';
    } else if ((ratio300 > 0.8 && countMiss === 0) || ratio300 > 0.9) {
        grade = 'A';
    } else if ((ratio300 > 0.7 && countMiss === 0) || ratio300 > 0.8) {
        grade = 'B';
    } else if (ratio300 > 0.6) {
        grade = 'C';
    } else {
        grade = 'D';
    }
    
    // Add silver (H) suffix for Hidden or Flashlight
    if ((isHidden || isFlashlight) && (grade === 'SS' || grade === 'S')) {
        grade += 'H';
    }
    
    return grade;
}

/**
 * Calculate overall score multiplier from active mods
 * @param {number} mods - Active mod flags (bitfield)
 * @returns {number} - Combined score multiplier
 */
export function calculateModMultiplier(mods) {
    let multiplier = 1.0;
    
    for (const def of MOD_DEFINITIONS) {
        if (mods & def.flag) {
            multiplier *= def.multiplier;
        }
    }
    
    return multiplier;
}

/**
 * Get speed multiplier from mods (DT/HT)
 * @param {number} mods - Active mod flags
 * @returns {number} - Speed multiplier (1.5 for DT, 0.75 for HT, 1.0 otherwise)
 */
export function getSpeedMultiplier(mods) {
    if (mods & MOD_FLAGS.DOUBLE_TIME) return 1.5;
    if (mods & MOD_FLAGS.HALF_TIME) return 0.75;
    return 1.0;
}

/**
 * Check if specific mod is active
 * @param {number} mods - Active mod flags
 * @param {number} flag - Mod flag to check
 * @returns {boolean} - Whether mod is active
 */
export function isModActive(mods, flag) {
    return (mods & flag) !== 0;
}

/**
 * Get color for star rating display
 * @param {number} stars - Star rating
 * @returns {string} - CSS color string
 */
export function getStarRatingColor(stars) {
    if (stars < 2) return '#88B300'; // Green
    if (stars < 2.7) return '#66CCFF'; // Cyan
    if (stars < 4) return '#FFCC22'; // Yellow
    if (stars < 5.3) return '#FF66AA'; // Pink
    if (stars < 6.5) return '#CC66FF'; // Purple
    return '#FF3366'; // Red
}
