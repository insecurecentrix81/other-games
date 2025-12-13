/**
 * parser.js
 * Parser for .osu beatmap files - handles all sections including TimingPoints and HitObjects
 * Dependencies: utils.js, constants.js - must be loaded first
 * Exports: parseOsuFile, generateSliderPath, applyModsToBeatmap, getBeatmapInfo
 */

import {
    bezierCurve,
    perfectCircleArc,
    linearPath,
    pathLength,
    trimPathToLength,
    distance
} from './utils.js';

import {
    OSU_PLAYFIELD,
    CURVE_TYPES,
    HIT_OBJECT_TYPES,
    DEFAULT_COMBO_COLORS,
    MOD_FLAGS,
    calculateTimingWindows,
    calculateApproachTime,
    calculateCircleRadius
} from './constants.js';

/**
 * Parse a complete .osu file content
 * @param {string} content - Raw .osu file content
 * @returns {Object} - Parsed beatmap object with all data
 */
export function parseOsuFile(content) {
    const lines = content.split('\n').map(line => line.trim());
    
    // Initialize beatmap with default values
    const beatmap = {
        // Format version
        formatVersion: 14,
        
        // General section
        audioFilename: '',
        audioLeadIn: 0,
        previewTime: -1,
        countdown: 1,
        sampleSet: 'Normal',
        stackLeniency: 0.7,
        mode: 0, // 0 = osu!standard
        letterboxInBreaks: false,
        widescreenStoryboard: false,
        
        // Metadata section
        title: 'Unknown',
        titleUnicode: '',
        artist: 'Unknown',
        artistUnicode: '',
        creator: 'Unknown',
        version: 'Normal',
        source: '',
        tags: [],
        beatmapId: 0,
        beatmapSetId: 0,
        
        // Difficulty section
        hpDrainRate: 5,
        circleSize: 4,
        overallDifficulty: 5,
        approachRate: 5,
        sliderMultiplier: 1.4,
        sliderTickRate: 1,
        
        // Timing points and hit objects
        timingPoints: [],
        hitObjects: [],
        comboColors: [...DEFAULT_COMBO_COLORS],
        
        // Calculated values (populated after parsing)
        effectiveCS: 4,
        effectiveAR: 5,
        effectiveOD: 5,
        effectiveHP: 5,
        circleRadius: 0,
        approachTime: 0,
        hitWindows: null
    };
    
    // Parse format version from first line
    const versionMatch = lines[0]?.match(/osu file format v(\d+)/);
    if (versionMatch) {
        beatmap.formatVersion = parseInt(versionMatch[1]);
    }
    
    // Split into sections
    const sections = splitIntoSections(lines);
    
    // Parse each section
    if (sections['General']) {
        parseGeneralSection(sections['General'], beatmap);
    }
    
    if (sections['Metadata']) {
        parseMetadataSection(sections['Metadata'], beatmap);
    }
    
    if (sections['Difficulty']) {
        parseDifficultySection(sections['Difficulty'], beatmap);
    }
    
    if (sections['Colours']) {
        parseColoursSection(sections['Colours'], beatmap);
    }
    
    if (sections['TimingPoints']) {
        beatmap.timingPoints = parseTimingPoints(sections['TimingPoints']);
    }
    
    if (sections['HitObjects']) {
        beatmap.hitObjects = parseHitObjects(sections['HitObjects'], beatmap);
    }
    
    // Calculate effective values based on base difficulty
    calculateEffectiveValues(beatmap);
    
    // Apply stacking (overlapping circles are offset)
    applyStacking(beatmap);
    
    return beatmap;
}

/**
 * Split file content into sections based on [SectionName] headers
 * @param {Array} lines - Array of lines
 * @returns {Object} - Object with section names as keys and line arrays as values
 */
function splitIntoSections(lines) {
    const sections = {};
    let currentSection = null;
    
    for (const line of lines) {
        // Skip empty lines and comments
        if (!line || line.startsWith('//')) continue;
        
        // Check for section header [SectionName]
        const sectionMatch = line.match(/^\[(\w+)\]$/);
        if (sectionMatch) {
            currentSection = sectionMatch[1];
            sections[currentSection] = [];
            continue;
        }
        
        // Add line to current section
        if (currentSection) {
            sections[currentSection].push(line);
        }
    }
    
    return sections;
}

/**
 * Parse General section
 * @param {Array} lines - Section lines
 * @param {Object} beatmap - Beatmap object to populate
 */
function parseGeneralSection(lines, beatmap) {
    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        
        switch (key) {
            case 'AudioFilename':
                beatmap.audioFilename = value;
                break;
            case 'AudioLeadIn':
                beatmap.audioLeadIn = parseInt(value) || 0;
                break;
            case 'PreviewTime':
                beatmap.previewTime = parseInt(value) || -1;
                break;
            case 'Countdown':
                beatmap.countdown = parseInt(value) || 0;
                break;
            case 'SampleSet':
                beatmap.sampleSet = value || 'Normal';
                break;
            case 'StackLeniency':
                beatmap.stackLeniency = parseFloat(value) || 0.7;
                break;
            case 'Mode':
                beatmap.mode = parseInt(value) || 0;
                break;
            case 'LetterboxInBreaks':
                beatmap.letterboxInBreaks = value === '1';
                break;
            case 'WidescreenStoryboard':
                beatmap.widescreenStoryboard = value === '1';
                break;
        }
    }
}

/**
 * Parse Metadata section
 * @param {Array} lines - Section lines
 * @param {Object} beatmap - Beatmap object to populate
 */
function parseMetadataSection(lines, beatmap) {
    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        
        switch (key) {
            case 'Title':
                beatmap.title = value || 'Unknown';
                break;
            case 'TitleUnicode':
                beatmap.titleUnicode = value || beatmap.title;
                break;
            case 'Artist':
                beatmap.artist = value || 'Unknown';
                break;
            case 'ArtistUnicode':
                beatmap.artistUnicode = value || beatmap.artist;
                break;
            case 'Creator':
                beatmap.creator = value || 'Unknown';
                break;
            case 'Version':
                beatmap.version = value || 'Normal';
                break;
            case 'Source':
                beatmap.source = value;
                break;
            case 'Tags':
                beatmap.tags = value ? value.split(' ').filter(t => t) : [];
                break;
            case 'BeatmapID':
                beatmap.beatmapId = parseInt(value) || 0;
                break;
            case 'BeatmapSetID':
                beatmap.beatmapSetId = parseInt(value) || 0;
                break;
        }
    }
}

/**
 * Parse Difficulty section
 * @param {Array} lines - Section lines
 * @param {Object} beatmap - Beatmap object to populate
 */
function parseDifficultySection(lines, beatmap) {
    let hasAR = false;
    
    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        
        const key = line.substring(0, colonIndex).trim();
        const value = parseFloat(line.substring(colonIndex + 1).trim());
        
        if (isNaN(value)) continue;
        
        switch (key) {
            case 'HPDrainRate':
                beatmap.hpDrainRate = value;
                break;
            case 'CircleSize':
                beatmap.circleSize = value;
                break;
            case 'OverallDifficulty':
                beatmap.overallDifficulty = value;
                break;
            case 'ApproachRate':
                beatmap.approachRate = value;
                hasAR = true;
                break;
            case 'SliderMultiplier':
                beatmap.sliderMultiplier = value || 1.4;
                break;
            case 'SliderTickRate':
                beatmap.sliderTickRate = value || 1;
                break;
        }
    }
    
    // In older beatmap formats, AR defaults to OD
    if (!hasAR) {
        beatmap.approachRate = beatmap.overallDifficulty;
    }
}

/**
 * Parse Colours section
 * @param {Array} lines - Section lines
 * @param {Object} beatmap - Beatmap object to populate
 */
function parseColoursSection(lines, beatmap) {
    const colors = [];
    
    for (const line of lines) {
        // Match Combo1, Combo2, etc.
        const match = line.match(/^Combo(\d+)\s*:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (match) {
            const index = parseInt(match[1]) - 1;
            const r = parseInt(match[2]);
            const g = parseInt(match[3]);
            const b = parseInt(match[4]);
            colors[index] = `rgb(${r},${g},${b})`;
        }
    }
    
    // Fill any gaps and use custom colors if found
    if (colors.length > 0) {
        // Filter out undefined entries
        beatmap.comboColors = colors.filter(c => c !== undefined);
        
        // Ensure we have at least one color
        if (beatmap.comboColors.length === 0) {
            beatmap.comboColors = [...DEFAULT_COMBO_COLORS];
        }
    }
}

/**
 * Parse TimingPoints section
 * @param {Array} lines - Section lines
 * @returns {Array} - Array of timing point objects
 */
function parseTimingPoints(lines) {
    const timingPoints = [];
    
    for (const line of lines) {
        const parts = line.split(',');
        if (parts.length < 2) continue;
        
        const time = parseFloat(parts[0]);
        const beatLength = parseFloat(parts[1]);
        
        // Skip invalid entries
        if (isNaN(time) || isNaN(beatLength)) continue;
        
        const meter = parseInt(parts[2]) || 4;
        const sampleSet = parseInt(parts[3]) || 0;
        const sampleIndex = parseInt(parts[4]) || 0;
        const volume = parseInt(parts[5]) || 100;
        
        // Uninherited (red) vs inherited (green) timing points
        // In older formats, if beatLength is negative, it's inherited
        const uninherited = parts.length > 6 ? parseInt(parts[6]) === 1 : beatLength > 0;
        const effects = parseInt(parts[7]) || 0;
        
        // Calculate slider velocity multiplier
        // For inherited points, beatLength is negative and represents -100/SV
        let sliderVelocityMultiplier = 1;
        if (!uninherited && beatLength < 0) {
            sliderVelocityMultiplier = Math.max(0.1, Math.min(10, -100 / beatLength));
        }
        
        timingPoints.push({
            time,
            beatLength: uninherited ? beatLength : null,
            effectiveBeatLength: beatLength,
            meter,
            sampleSet,
            sampleIndex,
            volume,
            uninherited,
            effects,
            sliderVelocityMultiplier,
            // Kiai mode flag
            isKiai: (effects & 1) !== 0
        });
    }
    
    // Sort by time
    timingPoints.sort((a, b) => a.time - b.time);
    
    // Fill in effective beat length for inherited points
    let lastUninheritedBeatLength = 500; // Default 120 BPM
    for (const tp of timingPoints) {
        if (tp.uninherited) {
            lastUninheritedBeatLength = tp.beatLength;
        }
        tp.effectiveBeatLength = lastUninheritedBeatLength;
    }
    
    return timingPoints;
}

/**
 * Get the timing point active at a specific time
 * @param {Array} timingPoints - Array of timing points
 * @param {number} time - Time in milliseconds
 * @param {boolean} uninheritedOnly - Only return uninherited (red) timing points
 * @returns {Object|null} - Active timing point or null
 */
function getTimingPointAt(timingPoints, time, uninheritedOnly = false) {
    let result = null;
    
    for (const tp of timingPoints) {
        if (tp.time > time) break;
        if (!uninheritedOnly || tp.uninherited) {
            result = tp;
        }
    }
    
    return result;
}

/**
 * Get slider velocity at a specific time
 * @param {Array} timingPoints - Array of timing points
 * @param {number} time - Time in milliseconds
 * @param {number} sliderMultiplier - Base slider multiplier from difficulty
 * @returns {Object} - Object with beatLength and velocity
 */
function getSliderVelocityAt(timingPoints, time, sliderMultiplier) {
    // Find the uninherited timing point for beat length
    const uninheritedPoint = getTimingPointAt(timingPoints, time, true);
    // Find any timing point for SV multiplier
    const currentPoint = getTimingPointAt(timingPoints, time, false);
    
    const beatLength = uninheritedPoint ? uninheritedPoint.beatLength : 500;
    const velocityMultiplier = currentPoint ? currentPoint.sliderVelocityMultiplier : 1;
    
    // Velocity in osu! pixels per millisecond
    // Formula: (sliderMultiplier * 100 * velocityMultiplier) / beatLength
    const velocity = (sliderMultiplier * 100 * velocityMultiplier) / beatLength;
    
    return { beatLength, velocity, velocityMultiplier };
}

/**
 * Parse HitObjects section
 * @param {Array} lines - Section lines
 * @param {Object} beatmap - Beatmap object for timing/SV info
 * @returns {Array} - Array of hit object data
 */
function parseHitObjects(lines, beatmap) {
    const hitObjects = [];
    let comboNumber = 0;
    let comboColorIndex = 0;
    
    for (const line of lines) {
        const parts = line.split(',');
        if (parts.length < 4) continue;
        
        const x = parseInt(parts[0]);
        const y = parseInt(parts[1]);
        const time = parseInt(parts[2]);
        const typeFlags = parseInt(parts[3]);
        const hitSound = parseInt(parts[4]) || 0;
        
        // Skip invalid entries
        if (isNaN(x) || isNaN(y) || isNaN(time) || isNaN(typeFlags)) continue;
        
        // Determine object type from flags
        const isCircle = (typeFlags & HIT_OBJECT_TYPES.CIRCLE) !== 0;
        const isSlider = (typeFlags & HIT_OBJECT_TYPES.SLIDER) !== 0;
        const isSpinner = (typeFlags & HIT_OBJECT_TYPES.SPINNER) !== 0;
        const isNewCombo = (typeFlags & HIT_OBJECT_TYPES.NEW_COMBO) !== 0;
        
        // Handle combo numbering
        if (isNewCombo || hitObjects.length === 0) {
            comboNumber = 1;
            // Extract combo color skip from type flags (bits 4-6)
            const comboColorSkip = (typeFlags >> 4) & 7;
            comboColorIndex = (comboColorIndex + 1 + comboColorSkip) % beatmap.comboColors.length;
        } else {
            comboNumber++;
        }
        
        // Base hit object data
        const hitObject = {
            x,
            y,
            time,
            typeFlags,
            hitSound,
            comboNumber,
            comboColorIndex,
            isNewCombo,
            // Stack offset (applied later)
            stackHeight: 0,
            stackOffsetX: 0,
            stackOffsetY: 0
        };
        
        if (isCircle) {
            hitObject.type = 'circle';
            hitObject.endTime = time;
        } else if (isSlider) {
            hitObject.type = 'slider';
            parseSliderData(hitObject, parts, beatmap);
        } else if (isSpinner) {
            hitObject.type = 'spinner';
            hitObject.endTime = parseInt(parts[5]) || time + 1000;
            // Spinners are always centered
            hitObject.x = OSU_PLAYFIELD.CENTER_X;
            hitObject.y = OSU_PLAYFIELD.CENTER_Y;
            // Spinners don't affect combo
            comboNumber--;
        }
        
        hitObjects.push(hitObject);
    }
    
    return hitObjects;
}

/**
 * Parse slider-specific data
 * @param {Object} hitObject - Hit object to populate
 * @param {Array} parts - CSV parts from the line
 * @param {Object} beatmap - Beatmap for timing info
 */
function parseSliderData(hitObject, parts, beatmap) {
    // Parse curve data: curveType|x:y|x:y|...
    const curveData = parts[5] || '';
    const slides = parseInt(parts[6]) || 1;
    const length = parseFloat(parts[7]) || 100;
    
    // Parse curve type and control points
    const curveParts = curveData.split('|');
    const curveType = curveParts[0] || CURVE_TYPES.BEZIER;
    
    // First control point is the slider start position
    const controlPoints = [{ x: hitObject.x, y: hitObject.y }];
    
    // Parse additional control points
    for (let i = 1; i < curveParts.length; i++) {
        const [px, py] = curveParts[i].split(':').map(Number);
        if (!isNaN(px) && !isNaN(py)) {
            controlPoints.push({ x: px, y: py });
        }
    }
    
    hitObject.curveType = curveType;
    hitObject.controlPoints = controlPoints;
    hitObject.slides = slides;
    hitObject.length = length;
    
    // Generate slider path
    hitObject.curvePoints = generateSliderPath(curveType, controlPoints, length);
    
    // Calculate path length for validation
    hitObject.actualLength = pathLength(hitObject.curvePoints);
    
    // Get slider velocity at this time
    const { beatLength, velocity } = getSliderVelocityAt(
        beatmap.timingPoints,
        hitObject.time,
        beatmap.sliderMultiplier
    );
    
    // Duration for one slide (in milliseconds)
    const slideDuration = length / velocity;
    hitObject.slideDuration = slideDuration;
    hitObject.duration = slideDuration * slides;
    hitObject.endTime = hitObject.time + hitObject.duration;
    
    // Calculate tick times
    hitObject.tickTimes = calculateSliderTicks(
        hitObject.time,
        slideDuration,
        slides,
        beatLength,
        beatmap.sliderTickRate,
        length
    );
    
    // Store end position for each slide
    hitObject.endX = hitObject.curvePoints[hitObject.curvePoints.length - 1].x;
    hitObject.endY = hitObject.curvePoints[hitObject.curvePoints.length - 1].y;
    
    // Parse edge sounds and additions if present
    if (parts[8]) {
        hitObject.edgeSounds = parts[8].split('|').map(s => parseInt(s) || 0);
    }
    if (parts[9]) {
        hitObject.edgeAdditions = parts[9].split('|');
    }
}

/**
 * Generate slider path from curve type and control points
 * @param {string} curveType - Curve type (L, P, B, C)
 * @param {Array} controlPoints - Array of control points [{x, y}, ...]
 * @param {number} targetLength - Target slider length
 * @returns {Array} - Array of points along the slider path
 */
export function generateSliderPath(curveType, controlPoints, targetLength) {
    if (controlPoints.length < 2) {
        return controlPoints.map(p => ({ x: p.x, y: p.y }));
    }
    
    let path = [];
    
    // Split control points by red points (consecutive duplicates indicate segment breaks)
    const segments = splitByRedPoints(controlPoints);
    
    for (const segment of segments) {
        if (segment.length < 2) continue;
        
        let segmentPath;
        
        if (curveType === CURVE_TYPES.LINEAR || segment.length === 2) {
            // Linear: straight lines between points
            segmentPath = linearPath(segment, 0.5);
        } else if (curveType === CURVE_TYPES.PERFECT && segment.length === 3) {
            // Perfect circle arc through exactly 3 points
            segmentPath = perfectCircleArc(segment[0], segment[1], segment[2], 100);
        } else {
            // Bezier or Catmull (treat Catmull as Bezier)
            // Use more segments for longer/complex curves
            const numSegments = Math.max(50, segment.length * 25);
            segmentPath = bezierCurve(segment, numSegments);
        }
        
        // Concatenate path segments
        path = path.concat(segmentPath);
    }
    
    // Remove duplicate consecutive points (from segment joins)
    path = removeDuplicatePoints(path);
    
    // Ensure we have at least 2 points
    if (path.length < 2 && controlPoints.length >= 2) {
        path = [
            { x: controlPoints[0].x, y: controlPoints[0].y },
            { x: controlPoints[controlPoints.length - 1].x, y: controlPoints[controlPoints.length - 1].y }
        ];
    }
    
    // Trim to exact target length
    if (targetLength > 0) {
        path = trimPathToLength(path, targetLength);
    }
    
    return path;
}

/**
 * Split control points by red points (consecutive duplicates)
 * Red points in osu! indicate where one bezier segment ends and another begins
 * @param {Array} points - Array of control points
 * @returns {Array} - Array of segment arrays
 */
function splitByRedPoints(points) {
    const segments = [];
    let currentSegment = [];
    
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        currentSegment.push({ x: point.x, y: point.y });
        
        // Check if next point is a duplicate (red point)
        if (i < points.length - 1) {
            const nextPoint = points[i + 1];
            if (Math.abs(point.x - nextPoint.x) < 0.001 && Math.abs(point.y - nextPoint.y) < 0.001) {
                // Red point found - end current segment, start new one with this point
                if (currentSegment.length >= 2) {
                    segments.push(currentSegment);
                }
                currentSegment = [];
                // The duplicate point will be added in next iteration
            }
        }
    }
    
    // Add final segment
    if (currentSegment.length >= 2) {
        segments.push(currentSegment);
    } else if (currentSegment.length === 1 && segments.length > 0) {
        // Single trailing point - add to last segment
        segments[segments.length - 1].push(currentSegment[0]);
    } else if (currentSegment.length >= 1 && segments.length === 0) {
        // Only have a partial segment - try to use it
        segments.push(currentSegment);
    }
    
    return segments;
}

/**
 * Remove consecutive duplicate points from path
 * @param {Array} points - Array of points
 * @returns {Array} - Cleaned array
 */
function removeDuplicatePoints(points) {
    if (points.length < 2) return points;
    
    const result = [points[0]];
    for (let i = 1; i < points.length; i++) {
        const prev = result[result.length - 1];
        const curr = points[i];
        // Only add if not a duplicate (small epsilon for floating point)
        if (distance(prev, curr) > 0.01) {
            result.push(curr);
        }
    }
    return result;
}

/**
 * Calculate slider tick times
 * @param {number} startTime - Slider start time
 * @param {number} slideDuration - Duration of one slide
 * @param {number} slides - Number of slides (repeats)
 * @param {number} beatLength - Beat length in ms
 * @param {number} tickRate - Tick rate
 * @param {number} sliderLength - Slider length in osu! pixels
 * @returns {Array} - Array of tick objects with time and position info
 */
function calculateSliderTicks(startTime, slideDuration, slides, beatLength, tickRate, sliderLength) {
    const ticks = [];
    const tickSpacing = beatLength / tickRate;
    
    // Don't generate ticks if slider is too short
    if (slideDuration < tickSpacing * 0.5) {
        return ticks;
    }
    
    for (let slide = 0; slide < slides; slide++) {
        const slideStart = startTime + slide * slideDuration;
        const slideEnd = slideStart + slideDuration;
        const isReverse = slide % 2 === 1;
        
        // Generate ticks for this slide
        let tickTime = slideStart + tickSpacing;
        
        while (tickTime < slideEnd - 10) { // -10ms to avoid ticks too close to end
            // Calculate progress along slider for this tick
            const slideProgress = (tickTime - slideStart) / slideDuration;
            const progress = isReverse ? 1 - slideProgress : slideProgress;
            
            ticks.push({
                time: tickTime,
                slide,
                isReverse,
                progress // 0-1 position along slider path
            });
            
            tickTime += tickSpacing;
        }
    }
    
    return ticks;
}

/**
 * Calculate effective difficulty values and derived timing/radius values
 * @param {Object} beatmap - Beatmap object to update
 */
function calculateEffectiveValues(beatmap) {
    // Initially, effective values equal base values
    beatmap.effectiveCS = beatmap.circleSize;
    beatmap.effectiveAR = beatmap.approachRate;
    beatmap.effectiveOD = beatmap.overallDifficulty;
    beatmap.effectiveHP = beatmap.hpDrainRate;
    
    // Calculate derived values
    beatmap.circleRadius = calculateCircleRadius(beatmap.effectiveCS);
    beatmap.approachTime = calculateApproachTime(beatmap.effectiveAR);
    beatmap.hitWindows = calculateTimingWindows(beatmap.effectiveOD);
}

/**
 * Apply stacking algorithm to offset overlapping objects
 * Objects that appear at nearly the same position within a short time are offset
 * @param {Object} beatmap - Beatmap object to modify
 */
function applyStacking(beatmap) {
    const hitObjects = beatmap.hitObjects;
    const stackThreshold = beatmap.approachTime * beatmap.stackLeniency;
    const stackOffset = beatmap.circleRadius / 10;
    
    // Process objects in reverse order
    for (let i = hitObjects.length - 1; i >= 0; i--) {
        const current = hitObjects[i];
        
        // Skip spinners
        if (current.type === 'spinner') continue;
        
        // Look for objects to stack with
        for (let j = i - 1; j >= 0; j--) {
            const other = hitObjects[j];
            
            // Stop if time difference exceeds threshold
            if (current.time - other.endTime > stackThreshold) break;
            
            // Skip spinners
            if (other.type === 'spinner') continue;
            
            // Check for stacking (same position)
            const endX = other.type === 'slider' ? other.endX : other.x;
            const endY = other.type === 'slider' ? other.endY : other.y;
            
            const dist = distance({ x: current.x, y: current.y }, { x: endX, y: endY });
            
            if (dist < 3) { // Stack threshold distance
                current.stackHeight = other.stackHeight + 1;
                break;
            }
            
            // Check slider start
            if (other.type === 'slider') {
                const startDist = distance(
                    { x: current.x, y: current.y },
                    { x: other.x, y: other.y }
                );
                
                if (startDist < 3) {
                    other.stackHeight = current.stackHeight + 1;
                }
            }
        }
    }
    
    // Apply stack offsets
    for (const obj of hitObjects) {
        if (obj.stackHeight > 0) {
            obj.stackOffsetX = -obj.stackHeight * stackOffset;
            obj.stackOffsetY = -obj.stackHeight * stackOffset;
        }
    }
}

/**
 * Apply mod adjustments to beatmap difficulty
 * Creates a new object with modified values, original unchanged
 * @param {Object} beatmap - Beatmap object
 * @param {number} mods - Mod flags
 * @param {number} speedMultiplier - Speed multiplier (for DT/HT AR/OD adjustment)
 * @returns {Object} - Modified beatmap copy
 */
export function applyModsToBeatmap(beatmap, mods, speedMultiplier = 1) {
    // Create shallow copy with modified values
    const modified = {
        ...beatmap,
        hitObjects: beatmap.hitObjects, // Share reference, don't deep copy
        timingPoints: beatmap.timingPoints,
        comboColors: beatmap.comboColors
    };
    
    // Easy mod: reduce all difficulty values
    if (mods & MOD_FLAGS.EASY) {
        modified.effectiveCS = Math.max(0, beatmap.circleSize - 2);
        modified.effectiveAR = Math.max(0, beatmap.approachRate - 2);
        modified.effectiveOD = Math.max(0, beatmap.overallDifficulty - 2);
        modified.effectiveHP = Math.max(0, beatmap.hpDrainRate - 2);
    }
    
    // Hard Rock mod: increase all difficulty values
    if (mods & MOD_FLAGS.HARD_ROCK) {
        modified.effectiveCS = Math.min(10, beatmap.circleSize * 1.3);
        modified.effectiveAR = Math.min(10, beatmap.approachRate * 1.4);
        modified.effectiveOD = Math.min(10, beatmap.overallDifficulty * 1.4);
        modified.effectiveHP = Math.min(10, beatmap.hpDrainRate * 1.4);
    }
    
    // Speed mods (DT/HT) affect AR and OD timing
    if (speedMultiplier !== 1) {
        // Adjust AR: the approach time changes with speed
        const originalPreempt = calculateApproachTime(modified.effectiveAR);
        const adjustedPreempt = originalPreempt / speedMultiplier;
        
        // Convert adjusted preempt back to AR
        if (adjustedPreempt > 1200) {
            modified.effectiveAR = (1800 - adjustedPreempt) / 120;
        } else {
            modified.effectiveAR = 5 + (1200 - adjustedPreempt) / 150;
        }
        modified.effectiveAR = Math.max(0, Math.min(11, modified.effectiveAR));
        
        // Adjust OD: hit windows scale with speed
        const originalWindows = calculateTimingWindows(modified.effectiveOD);
        const adjustedWindow300 = originalWindows.hitWindow300 / speedMultiplier;
        modified.effectiveOD = (80 - adjustedWindow300) / 6;
        modified.effectiveOD = Math.max(0, Math.min(11, modified.effectiveOD));
    }
    
    // Recalculate derived values
    modified.circleRadius = calculateCircleRadius(modified.effectiveCS);
    modified.approachTime = calculateApproachTime(modified.effectiveAR);
    modified.hitWindows = calculateTimingWindows(modified.effectiveOD);
    
    return modified;
}

/**
 * Get beatmap summary info
 * @param {Object} beatmap - Parsed beatmap
 * @returns {Object} - Summary info for display
 */
export function getBeatmapInfo(beatmap) {
    const totalObjects = beatmap.hitObjects.length;
    const circles = beatmap.hitObjects.filter(o => o.type === 'circle').length;
    const sliders = beatmap.hitObjects.filter(o => o.type === 'slider').length;
    const spinners = beatmap.hitObjects.filter(o => o.type === 'spinner').length;
    
    // Calculate duration
    const firstObject = beatmap.hitObjects[0];
    const lastObject = beatmap.hitObjects[beatmap.hitObjects.length - 1];
    const duration = lastObject
        ? (lastObject.endTime || lastObject.time) - (firstObject?.time || 0)
        : 0;
    
    // Calculate BPM from first uninherited timing point
    const uninheritedPoint = beatmap.timingPoints.find(tp => tp.uninherited);
    const bpm = uninheritedPoint
        ? Math.round(60000 / uninheritedPoint.beatLength)
        : 120;
    
    // Calculate max combo
    let maxCombo = circles;
    for (const obj of beatmap.hitObjects) {
        if (obj.type === 'slider') {
            // Slider start + ticks + repeats + end
            maxCombo += 1 + obj.tickTimes.length + obj.slides;
        } else if (obj.type === 'spinner') {
            maxCombo += 1;
        }
    }
    
    return {
        title: beatmap.titleUnicode || beatmap.title,
        artist: beatmap.artistUnicode || beatmap.artist,
        creator: beatmap.creator,
        version: beatmap.version,
        difficulty: {
            cs: beatmap.circleSize,
            ar: beatmap.approachRate,
            od: beatmap.overallDifficulty,
            hp: beatmap.hpDrainRate
        },
        objectCount: {
            total: totalObjects,
            circles,
            sliders,
            spinners
        },
        maxCombo,
        duration,
        bpm
    };
}

/**
 * Flip hit objects vertically (for Hard Rock mod)
 * @param {Array} hitObjects - Array of hit objects
 * @returns {Array} - Array with Y coordinates flipped
 */
export function flipHitObjectsVertically(hitObjects) {
    const flipped = [];
    
    for (const obj of hitObjects) {
        const newObj = { ...obj };
        
        // Flip Y coordinate (osu! playfield is 384 tall)
        newObj.y = OSU_PLAYFIELD.HEIGHT - obj.y;
        
        // Flip stack offset
        if (obj.stackOffsetY) {
            newObj.stackOffsetY = -obj.stackOffsetY;
        }
        
        // Flip slider path and control points
        if (obj.type === 'slider') {
            newObj.controlPoints = obj.controlPoints.map(p => ({
                x: p.x,
                y: OSU_PLAYFIELD.HEIGHT - p.y
            }));
            
            newObj.curvePoints = obj.curvePoints.map(p => ({
                x: p.x,
                y: OSU_PLAYFIELD.HEIGHT - p.y
            }));
            
            newObj.endY = OSU_PLAYFIELD.HEIGHT - obj.endY;
        }
        
        flipped.push(newObj);
    }
    
    return flipped;
}
