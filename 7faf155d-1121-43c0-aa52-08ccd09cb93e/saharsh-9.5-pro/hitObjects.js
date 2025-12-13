/**
 * hitObjects.js
 * Defines Circle, Slider, and Spinner hit object classes with update logic
 * Dependencies: utils.js (distance, lerp, clamp, isPointInCircle, etc.), constants.js (HIT_RESULTS)
 * Exports: Circle, Slider, Spinner, createHitObjects
 * 
 * Integration Notes:
 * - Used by game.js for gameplay logic
 * - Used by renderer.js for drawing
 * - Uses constants from constants.js for playfield dimensions and hit results
 */

import { distance, clamp, isPointInCircle, lerpPoint, normalizeAngle } from './utils.js';
import { HIT_RESULTS, OSU_PLAYFIELD } from './constants.js';

/** Hit object state enum */
export const HitObjectState = {
    WAITING: 'waiting',     // Not yet visible
    APPROACHING: 'approaching', // Visible, approach circle shrinking
    ACTIVE: 'active',       // Can be hit
    HIT: 'hit',            // Successfully hit
    MISSED: 'missed',      // Missed (too late)
    FINISHED: 'finished'   // Processing complete
};

/**
 * Base class for all hit objects
 */
class HitObject {
    /**
     * @param {number} x - X position in osu! coordinates
     * @param {number} y - Y position in osu! coordinates  
     * @param {number} time - Hit time in milliseconds
     * @param {string} type - Object type ('circle', 'slider', 'spinner')
     */
    constructor(x, y, time, type) {
        this.x = x;
        this.y = y;
        this.time = time;
        this.type = type;
        
        // Combo information
        this.comboNumber = 1;
        this.comboColorIndex = 0;
        this.isNewCombo = false;
        
        // State
        this.state = HitObjectState.WAITING;
        this.hitResult = null;
        this.resultProcessed = false;
        
        // Visual properties (calculated during update)
        this.opacity = 0;
        this.approachScale = 4;
        
        // Timing info (set externally based on AR)
        this.appearTime = 0;
        this.fadeInDuration = 400; // ms
    }

    /**
     * Check if this object is finished and can be cleaned up
     * @returns {boolean}
     */
    isFinished() {
        return this.state === HitObjectState.HIT || 
               this.state === HitObjectState.MISSED ||
               this.state === HitObjectState.FINISHED;
    }

    /**
     * Check if object should be visible at current time
     * @param {number} currentTime 
     * @param {number} approachTime 
     * @returns {boolean}
     */
    isVisible(currentTime, approachTime) {
        return currentTime >= this.time - approachTime && !this.isFinished();
    }

    /**
     * Set appear time based on approach rate
     * @param {number} approachTime - Time before hit when object appears (ms)
     */
    setApproachTime(approachTime) {
        this.appearTime = this.time - approachTime;
    }
}

/**
 * Circle hit object - single tap target
 */
export class Circle extends HitObject {
    constructor(x, y, time) {
        super(x, y, time, 'circle');
    }

    /**
     * Update circle state
     * @param {number} currentTime - Current game time in ms
     * @param {number} approachTime - Approach rate time in ms
     * @param {Object} input - Input state {isActionPressed, isActionJustPressed}
     * @param {Object} cursor - Cursor position {x, y}
     * @param {number} circleRadius - Hit circle radius
     * @param {Object} hitWindows - Timing windows {hitWindow300, hitWindow100, hitWindow50}
     */
    update(currentTime, approachTime, input, cursor, circleRadius, hitWindows) {
        if (this.isFinished()) return;

        // Calculate appear time
        this.appearTime = this.time - approachTime;
        
        // Check if we should be visible yet
        if (currentTime < this.appearTime) {
            this.state = HitObjectState.WAITING;
            this.opacity = 0;
            return;
        }

        // Calculate fade-in opacity (0 to 1 over fadeInDuration)
        const timeSinceAppear = currentTime - this.appearTime;
        this.opacity = clamp(timeSinceAppear / this.fadeInDuration, 0, 1);

        // Calculate approach circle scale (4 -> 1 over approachTime)
        const approachProgress = timeSinceAppear / approachTime;
        this.approachScale = 4 - 3 * clamp(approachProgress, 0, 1);

        // Determine state based on timing
        const timeDiff = currentTime - this.time;
        
        if (timeDiff < -hitWindows.hitWindow50) {
            // Before hit window - approaching
            this.state = HitObjectState.APPROACHING;
        } else if (timeDiff <= hitWindows.hitWindow50) {
            // Within hit window - active
            this.state = HitObjectState.ACTIVE;
            
            // Check for hit
            if (input.isActionJustPressed) {
                if (isPointInCircle(cursor, { x: this.x, y: this.y }, circleRadius)) {
                    // Determine hit quality
                    const absTimeDiff = Math.abs(timeDiff);
                    
                    if (absTimeDiff <= hitWindows.hitWindow300) {
                        this.hitResult = HIT_RESULTS.PERFECT;
                    } else if (absTimeDiff <= hitWindows.hitWindow100) {
                        this.hitResult = HIT_RESULTS.GREAT;
                    } else {
                        this.hitResult = HIT_RESULTS.GOOD;
                    }
                    
                    this.state = HitObjectState.HIT;
                }
            }
        } else {
            // Past hit window - missed
            this.hitResult = HIT_RESULTS.MISS;
            this.state = HitObjectState.MISSED;
        }
    }
}

/**
 * Slider hit object - drag target with path
 */
export class Slider extends HitObject {
    /**
     * @param {number} x - Start X position
     * @param {number} y - Start Y position
     * @param {number} time - Start time in ms
     * @param {Array} curvePoints - Array of {x, y} points defining the slider path
     * @param {number} duration - Total slider duration in ms
     * @param {number} slides - Number of repeats (1 = no repeat, 2 = one repeat, etc.)
     * @param {number} length - Pixel length of the slider
     */
    constructor(x, y, time, curvePoints, duration, slides, length) {
        super(x, y, time, 'slider');
        
        // Slider-specific properties
        this.curvePoints = curvePoints || [{ x, y }];
        this.duration = duration || 1000;
        this.slides = slides || 1;
        this.length = length || 100;
        
        // Calculate end time
        this.endTime = time + duration;
        
        // Slider ball position
        this.ballX = x;
        this.ballY = y;
        this.ballProgress = 0;
        
        // Tracking state
        this.sliderStartHit = false;
        this.sliderFollowing = false;
        this.ticksHit = 0;
        this.ticksMissed = 0;
        this.tickTimes = [];
        this.ticksProcessed = new Set();
        
        // End position
        this.endX = curvePoints.length > 0 ? curvePoints[curvePoints.length - 1].x : x;
        this.endY = curvePoints.length > 0 ? curvePoints[curvePoints.length - 1].y : y;
        
        // Follow circle radius (larger than hit circle for leniency)
        this.followRadiusMultiplier = 2.4;
    }

    /**
     * Get point on slider at given progress (0-1 for one slide)
     * @param {number} progress - Progress along slider (0-1)
     * @returns {{x: number, y: number}}
     */
    getPointAtProgress(progress) {
        if (!this.curvePoints || this.curvePoints.length === 0) {
            return { x: this.x, y: this.y };
        }
        
        if (this.curvePoints.length === 1) {
            return { x: this.curvePoints[0].x, y: this.curvePoints[0].y };
        }
        
        // Clamp progress
        const t = clamp(progress, 0, 1);
        
        // Find the segment we're on
        const totalPoints = this.curvePoints.length;
        const scaledT = t * (totalPoints - 1);
        const index = Math.floor(scaledT);
        const localT = scaledT - index;
        
        if (index >= totalPoints - 1) {
            return { 
                x: this.curvePoints[totalPoints - 1].x, 
                y: this.curvePoints[totalPoints - 1].y 
            };
        }
        
        // Interpolate between points
        return lerpPoint(this.curvePoints[index], this.curvePoints[index + 1], localT);
    }

    /**
     * Update slider state
     */
    update(currentTime, approachTime, input, cursor, circleRadius, hitWindows) {
        if (this.isFinished()) return;

        this.appearTime = this.time - approachTime;
        
        // Not visible yet
        if (currentTime < this.appearTime) {
            this.state = HitObjectState.WAITING;
            this.opacity = 0;
            return;
        }

        // Calculate fade-in
        const timeSinceAppear = currentTime - this.appearTime;
        this.opacity = clamp(timeSinceAppear / this.fadeInDuration, 0, 1);
        
        // Approach circle (only before slider starts)
        if (currentTime < this.time) {
            const approachProgress = timeSinceAppear / approachTime;
            this.approachScale = 4 - 3 * clamp(approachProgress, 0, 1);
        } else {
            this.approachScale = 1;
        }

        const timeDiff = currentTime - this.time;
        const followRadius = circleRadius * this.followRadiusMultiplier;

        // Before slider starts
        if (timeDiff < -hitWindows.hitWindow50) {
            this.state = HitObjectState.APPROACHING;
            return;
        }

        // Check for slider start hit (within hit window)
        if (!this.sliderStartHit && timeDiff <= hitWindows.hitWindow50) {
            if (input.isActionJustPressed || input.isActionPressed) {
                if (isPointInCircle(cursor, { x: this.x, y: this.y }, circleRadius)) {
                    this.sliderStartHit = true;
                    this.sliderFollowing = true;
                }
            }
        }

        // During slider body
        if (currentTime >= this.time && currentTime < this.endTime) {
            this.state = HitObjectState.ACTIVE;
            
            // Calculate ball position
            const sliderProgress = (currentTime - this.time) / this.duration;
            
            // Handle repeats (ping-pong)
            let effectiveProgress = (sliderProgress * this.slides) % 2;
            if (effectiveProgress > 1) {
                effectiveProgress = 2 - effectiveProgress; // Reverse direction
            }
            
            this.ballProgress = effectiveProgress;
            const ballPos = this.getPointAtProgress(effectiveProgress);
            this.ballX = ballPos.x;
            this.ballY = ballPos.y;

            // Check if cursor is following the ball
            if (input.isActionPressed) {
                this.sliderFollowing = isPointInCircle(cursor, { x: this.ballX, y: this.ballY }, followRadius);
            } else {
                this.sliderFollowing = false;
            }

            // Process slider ticks
            for (let i = 0; i < this.tickTimes.length; i++) {
                const tickTime = this.tickTimes[i];
                if (!this.ticksProcessed.has(i) && currentTime >= tickTime) {
                    this.ticksProcessed.add(i);
                    if (this.sliderFollowing) {
                        this.ticksHit++;
                    } else {
                        this.ticksMissed++;
                    }
                }
            }
        }

        // Slider ended
        if (currentTime >= this.endTime) {
            // Determine final result
            this.calculateResult(circleRadius, cursor, input.isActionPressed);
            this.state = HitObjectState.FINISHED;
        }
        
        // Missed start (too late)
        if (!this.sliderStartHit && timeDiff > hitWindows.hitWindow50 && this.state !== HitObjectState.FINISHED) {
            // Can still follow the slider even if start was missed
            if (currentTime < this.endTime) {
                this.state = HitObjectState.ACTIVE;
            }
        }
    }

    /**
     * Calculate final slider result based on tracking
     */
    calculateResult(circleRadius, cursor, isHolding) {
        // Check if ended on the end circle
        const endPos = this.getPointAtProgress(this.slides % 2 === 0 ? 0 : 1);
        const endedOnCircle = isHolding && isPointInCircle(cursor, endPos, circleRadius * this.followRadiusMultiplier);
        
        // Calculate total hits
        const totalTicks = this.tickTimes.length;
        const endHits = (this.sliderStartHit ? 1 : 0) + (endedOnCircle ? 1 : 0);
        const totalHits = this.ticksHit + endHits;
        const totalPossible = totalTicks + 2; // ticks + start + end
        
        const hitRatio = totalPossible > 0 ? totalHits / totalPossible : 1;
        
        // Determine result
        if (hitRatio >= 1) {
            this.hitResult = HIT_RESULTS.PERFECT;
        } else if (hitRatio >= 0.5) {
            this.hitResult = HIT_RESULTS.GREAT;
        } else if (hitRatio > 0 || this.sliderStartHit) {
            this.hitResult = HIT_RESULTS.GOOD;
        } else {
            this.hitResult = HIT_RESULTS.MISS;
        }
    }

    /**
     * Set tick times for this slider
     * @param {number} tickRate - Ticks per beat
     * @param {number} beatLength - Length of one beat in ms
     */
    setTickTimes(tickRate, beatLength) {
        this.tickTimes = [];
        
        if (tickRate <= 0 || beatLength <= 0) return;
        
        const tickInterval = beatLength / tickRate;
        const slideDuration = this.duration / this.slides;
        
        for (let slide = 0; slide < this.slides; slide++) {
            const slideStart = this.time + slide * slideDuration;
            let tickTime = slideStart + tickInterval;
            
            while (tickTime < slideStart + slideDuration - 10) { // 10ms buffer
                this.tickTimes.push(tickTime);
                tickTime += tickInterval;
            }
        }
    }
}

/**
 * Spinner hit object - rotation target
 */
export class Spinner extends HitObject {
    /**
     * @param {number} time - Start time in ms
     * @param {number} endTime - End time in ms
     */
    constructor(time, endTime) {
        // Spinners are always centered
        super(OSU_PLAYFIELD.WIDTH / 2, OSU_PLAYFIELD.HEIGHT / 2, time, 'spinner');
        
        this.endTime = endTime;
        this.duration = endTime - time;
        
        // Rotation tracking
        this.rotations = 0;
        this.totalRotation = 0;
        this.lastAngle = null;
        this.rpm = 0;
        this.rpmHistory = [];
        
        // Progress (0-1 for completion)
        this.progress = 0;
        
        // Bonus spins after completion
        this.bonusSpins = 0;
        this.bonusScore = 0;
        
        // Required rotations based on OD (will be set externally)
        this.requiredRotations = 3;
        
        // Visual properties
        this.innerScale = 1;
    }

    /**
     * Update spinner state
     */
    update(currentTime, approachTime, input, cursor, circleRadius, hitWindows) {
        if (this.isFinished()) return;

        // Spinners appear at their start time
        this.appearTime = this.time - 400; // Small lead-in
        
        if (currentTime < this.appearTime) {
            this.state = HitObjectState.WAITING;
            this.opacity = 0;
            return;
        }

        // Fade in
        const timeSinceAppear = currentTime - this.appearTime;
        this.opacity = clamp(timeSinceAppear / 300, 0, 1);

        // Before spinner starts
        if (currentTime < this.time) {
            this.state = HitObjectState.APPROACHING;
            return;
        }

        // During spinner
        if (currentTime < this.endTime) {
            this.state = HitObjectState.ACTIVE;
            
            // Track rotation if clicking
            if (input.isActionPressed) {
                const centerX = this.x;
                const centerY = this.y;
                
                // Calculate angle from center to cursor
                const dx = cursor.x - centerX;
                const dy = cursor.y - centerY;
                const currentAngle = Math.atan2(dy, dx);
                
                if (this.lastAngle !== null) {
                    // Calculate angle difference
                    let angleDiff = currentAngle - this.lastAngle;
                    
                    // Normalize to -PI to PI
                    angleDiff = normalizeAngle(angleDiff);
                    
                    // Add to total rotation
                    this.totalRotation += Math.abs(angleDiff);
                    
                    // Calculate rotations (1 rotation = 2*PI radians)
                    this.rotations = this.totalRotation / (2 * Math.PI);
                    
                    // Calculate RPM based on recent rotation speed
                    const instantRPM = (Math.abs(angleDiff) / (2 * Math.PI)) * 60 * 60; // Rough estimate
                    this.rpmHistory.push(instantRPM);
                    if (this.rpmHistory.length > 10) {
                        this.rpmHistory.shift();
                    }
                    this.rpm = this.rpmHistory.reduce((a, b) => a + b, 0) / this.rpmHistory.length;
                }
                
                this.lastAngle = currentAngle;
            } else {
                this.lastAngle = null;
            }
            
            // Calculate progress
            this.progress = clamp(this.rotations / this.requiredRotations, 0, 1);
            
            // Track bonus spins
            if (this.rotations > this.requiredRotations) {
                this.bonusSpins = Math.floor(this.rotations - this.requiredRotations);
            }
            
            // Visual scaling based on progress
            this.innerScale = 1 - this.progress * 0.8;
        }

        // Spinner ended
        if (currentTime >= this.endTime) {
            // Determine result
            if (this.progress >= 1) {
                this.hitResult = HIT_RESULTS.PERFECT;
            } else if (this.progress >= 0.9) {
                this.hitResult = HIT_RESULTS.GREAT;
            } else if (this.progress >= 0.5) {
                this.hitResult = HIT_RESULTS.GOOD;
            } else {
                this.hitResult = HIT_RESULTS.MISS;
            }
            
            this.state = HitObjectState.FINISHED;
        }
    }

    /**
     * Set required rotations based on OD and duration
     * @param {number} od - Overall difficulty
     */
    setRequiredRotations(od) {
        // Base rotations per second scaled by OD
        const rotationsPerSecond = 3 + (od * 0.5);
        const durationSeconds = this.duration / 1000;
        this.requiredRotations = rotationsPerSecond * durationSeconds;
    }
}

/**
 * Create hit object instances from parsed beatmap data
 * @param {Array} rawObjects - Array of parsed hit object data from parser
 * @param {Object} beatmap - Parsed beatmap with timing info
 * @returns {Array<Circle|Slider|Spinner>}
 */
export function createHitObjects(rawObjects, beatmap) {
    const hitObjects = [];
    
    // Get timing info
    const timingPoints = beatmap.timingPoints || [];
    const sliderMultiplier = beatmap.sliderMultiplier || 1.4;
    const sliderTickRate = beatmap.sliderTickRate || 1;
    
    for (const raw of rawObjects) {
        let obj = null;
        
        if (raw.type === 'circle') {
            obj = new Circle(raw.x, raw.y, raw.time);
        } else if (raw.type === 'slider') {
            // Get timing point for this slider
            const timing = getTimingPointAt(timingPoints, raw.time);
            const beatLength = timing.beatLength || 500;
            const sliderVelocity = timing.sliderVelocity || 1;
            
            // Calculate slider duration
            const pixelsPerBeat = sliderMultiplier * 100 * sliderVelocity;
            const beatsNumber = raw.length / pixelsPerBeat;
            const duration = Math.ceil(beatsNumber * beatLength) * raw.slides;
            
            obj = new Slider(raw.x, raw.y, raw.time, raw.curvePoints, duration, raw.slides, raw.length);
            obj.curveType = raw.curveType;
            obj.controlPoints = raw.controlPoints;
            
            // Set tick times
            obj.setTickTimes(sliderTickRate, beatLength);
        } else if (raw.type === 'spinner') {
            obj = new Spinner(raw.time, raw.endTime);
            obj.setRequiredRotations(beatmap.overallDifficulty || 5);
        }
        
        if (obj) {
            // Copy combo info
            obj.comboNumber = raw.comboNumber || 1;
            obj.comboColorIndex = raw.comboColorIndex || 0;
            obj.isNewCombo = raw.isNewCombo || false;
            
            hitObjects.push(obj);
        }
    }
    
    return hitObjects;
}

/**
 * Get timing point at specific time
 * Uses binary search for efficiency on large timing point arrays
 * @param {Array} timingPoints 
 * @param {number} time 
 * @returns {Object}
 */
function getTimingPointAt(timingPoints, time) {
    if (!timingPoints || timingPoints.length === 0) {
        return { beatLength: 500, sliderVelocity: 1, uninherited: true };
    }
    
    // Find the last timing point before or at the given time
    let result = timingPoints[0];
    let lastUninherited = timingPoints[0];
    
    for (const tp of timingPoints) {
        if (tp.time <= time) {
            result = tp;
            // Track the last uninherited point for beatLength
            if (tp.uninherited) {
                lastUninherited = tp;
            }
        } else {
            break;
        }
    }
    
    // If result is inherited, get beatLength from last uninherited point
    if (!result.uninherited && lastUninherited) {
        result = { ...result, beatLength: lastUninherited.beatLength };
    }
    
    return result;
}

/**
 * Flip hit objects vertically (for Hard Rock mod)
 * @param {Array} hitObjects 
 */
export function flipHitObjectsY(hitObjects) {
    for (const obj of hitObjects) {
        obj.y = OSU_PLAYFIELD.HEIGHT - obj.y;
        
        if (obj.type === 'slider' && obj.curvePoints) {
            for (const point of obj.curvePoints) {
                point.y = OSU_PLAYFIELD.HEIGHT - point.y;
            }
            
            // Also flip end position
            obj.endY = OSU_PLAYFIELD.HEIGHT - obj.endY;
        }
    }
}

export default {
    HitObjectState,
    Circle,
    Slider,
    Spinner,
    createHitObjects,
    flipHitObjectsY
};
