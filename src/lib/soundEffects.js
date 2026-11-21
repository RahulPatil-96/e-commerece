/**
 * Web Audio API Tactile Sound Engine
 * Provides subtle acoustic feedback (hover, click, cart addition).
 * Disabled by default. Enabled via user toggle.
 */

// Track whether the user has made at least one interaction.
// Web Audio API requires a prior user gesture on Safari / iOS.
let _userHasInteracted = false;
if (typeof window !== 'undefined') {
  const markInteracted = () => { _userHasInteracted = true; };
  window.addEventListener('click', markInteracted, { once: true });
  window.addEventListener('keydown', markInteracted, { once: true });
  window.addEventListener('touchstart', markInteracted, { once: true, passive: true });
}

let soundEnabled = false;
let audioContext;

if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    _userHasInteracted = true;
    const target = event.target instanceof Element
      ? event.target.closest('button, a, [role="button"], input[type="submit"]')
      : null;
    if (target) playSound('click');
  });

  document.addEventListener('pointerover', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest('button, a, [role="button"]')
      : null;
    const previous = event.relatedTarget instanceof Element
      ? event.relatedTarget.closest('button, a, [role="button"]')
      : null;
    if (target && target !== previous) playSound('hover');
  });
}

export const toggleSound = () => {
  soundEnabled = !soundEnabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('swipe_sound_enabled', soundEnabled ? 'true' : 'false');
  }
  return soundEnabled;
};

export const isSoundEnabled = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('swipe_sound_enabled') === 'true';
  }
  return false;
};

export const playSound = (type = 'click') => {
  if (!isSoundEnabled()) return;
  if (!_userHasInteracted) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext = audioContext || new AudioCtx();
    const ctx = audioContext;
    if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'hover') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch (err) {
    // Ignore audio context errors gracefully
  }
};
