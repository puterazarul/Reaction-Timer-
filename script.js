// ---------- DOM references ----------
const lights   = document.querySelectorAll('.light');
const startBtn = document.getElementById('start-btn');
const message  = document.getElementById('message');

// ---------- State ----------
// 'idle'     : nothing running (or round finished)
// 'sequence' : lights turning red one by one
// 'waiting'  : all red, random delay before lights out
// 'go'       : lights are out, timer is running
let state = 'idle';
let timers = [];          // pending setTimeout IDs, so we can cancel them
let lightsOutTime = 0;    // performance.now() value when lights go out

// ---------- Helpers ----------
function setMessage(text, cssClass = '') {
  message.textContent = text;
  message.className = 'message ' + cssClass;
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function resetLights() {
  lights.forEach(l => l.classList.remove('on'));
}

function finishRound() {
  state = 'idle';
  startBtn.disabled = false;
  startBtn.textContent = 'Try again';
}

// ---------- Game flow ----------
function startRound() {
  clearTimers();
  resetLights();
  state = 'sequence';
  startBtn.disabled = true;
  startBtn.blur();               // so Space doesn't re-trigger the button
  setMessage('Get ready...');

  // Turn lights red one by one, 1 second apart
  lights.forEach((light, i) => {
    timers.push(setTimeout(() => {
      light.classList.add('on');

      // After the 5th light: wait a random 1-3 s, then lights out
      if (i === lights.length - 1) {
        state = 'waiting';
        const delay = 1000 + Math.random() * 2000;
        timers.push(setTimeout(lightsOut, delay));
      }
    }, (i + 1) * 1000));
  });
}

function lightsOut() {
  resetLights();                     // all lights off at the same time
  lightsOutTime = performance.now(); // start the stopwatch
  state = 'go';
  setMessage('GO!');
}

// Called on any click or Space press
function handleReaction() {
  if (state === 'sequence' || state === 'waiting') {
    // Reacted too early
    clearTimers();
    resetLights();
    setMessage('JUMP START!', 'error');
    finishRound();
  } else if (state === 'go') {
    // Stop the stopwatch
    const reactionMs = performance.now() - lightsOutTime;
    setMessage(`Reaction time: ${reactionMs.toFixed(0)} ms`, 'result');
    finishRound();
  }
  // state === 'idle': ignore input
}

// ---------- Event listeners ----------
startBtn.addEventListener('click', startRound);

// Click/tap anywhere except the Start button. pointerdown fires slightly
// earlier than click, which gives a more accurate time.
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#start-btn')) return;
  handleReaction();
});

// Spacebar
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || e.repeat) return;
  if (state === 'idle') return;      // let Space work normally on the button
  e.preventDefault();                // stop page scrolling
  handleReaction();
});
