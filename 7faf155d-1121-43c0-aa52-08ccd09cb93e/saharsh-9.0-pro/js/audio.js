/**
 * js/audio.js
 * 
 * Manages Web Audio API context.
 * Handles loading, playback, pitch shifting (playbackRate), and precise timing.
 */

window.AudioManager = (function() {
    let audioCtx = null;
    let audioBuffer = null;
    let sourceNode = null;
    let gainNode = null;
    
    // Playback state
    let startTime = 0;
    let pauseTime = 0;
    let isPlaying = false;
    let playbackRate = 1.0; // 1.0 = Normal, 1.5 = DT, 0.75 = HT

    function init() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    async function load(url) {
        if (!audioCtx) init();

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Audio fetch failed');
            const arrayBuffer = await response.arrayBuffer();
            audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            return true;
        } catch (e) {
            console.warn("Audio Load Error (Running in fallback mode):", e);
            audioBuffer = null;
            return false;
        }
    }

    function play(offsetMs = 0) {
        if (!audioCtx) init();
        if (isPlaying) stop();

        isPlaying = true;

        // Fallback Mode (No Audio File)
        if (!audioBuffer) {
            // Use performance.now() as the clock source
            startTime = performance.now() - (offsetMs / playbackRate);
            return;
        }

        // Standard Mode
        sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.playbackRate.value = playbackRate;

        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.5;

        sourceNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const startOffset = Math.max(0, offsetMs / 1000);
        startTime = audioCtx.currentTime - (startOffset / playbackRate);
        sourceNode.start(0, startOffset);
    }

    function stop() {
        if (sourceNode) {
            try {
                sourceNode.stop();
            } catch (e) { }
            sourceNode.disconnect();
            sourceNode = null;
        }
        isPlaying = false;
    }

    function pause() {
        if (!isPlaying) return;
        pauseTime = getPosition();
        stop();
    }

    function setRate(rate) {
        playbackRate = rate;
        
        // Update live source if exists
        if (isPlaying && sourceNode) {
            sourceNode.playbackRate.value = rate;
            const currentPos = getPosition();
            startTime = audioCtx.currentTime - (currentPos / 1000 / rate);
        } 
        // Update fallback timer
        else if (isPlaying && !audioBuffer) {
            const currentPos = getPosition();
            startTime = performance.now() - (currentPos / rate);
        }
    }

    function getPosition() {
        if (!isPlaying) return pauseTime;
        
        // Fallback Clock
        if (!audioBuffer) {
            return (performance.now() - startTime) * playbackRate;
        }

        // Web Audio Clock
        return (audioCtx.currentTime - startTime) * playbackRate * 1000;
    }
    
    function getDuration() {
        // Return placeholder duration (e.g. 5 mins) if no audio, or 0
        // Game loop handles end via hit objects, so 0 is fine, but progress ring might need a value.
        // Let's return a safe large number if fallback, or 0.
        return audioBuffer ? (audioBuffer.duration * 1000) : 300000;
    }

    return {
        init,
        load,
        play,
        stop,
        pause,
        setRate,
        getPosition,
        getDuration,
        getContext: () => audioCtx
    };
})();
