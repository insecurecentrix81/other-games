// utils.js

// Clamp a number between min and max
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Linear interpolate value
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Convert clock time like 540 -> "09:00"
export function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
}

// Block arrow/space/tab scrolling behavior
export function preventScrollingKeys() {
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab', 'w', 'a', 's', 'd'];
  window.addEventListener('keydown', (e) => {
    if (keys.includes(e.key)) {
      e.preventDefault();
    }
  });
}
