const card = document.querySelector(".timer-card");
const display = document.getElementById("timerDisplay");
const message = document.getElementById("timerMessage");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const hoursInput = document.getElementById("customHours");
const minutesInput = document.getElementById("customMinutes");
const secondsInput = document.getElementById("customSeconds");
const setCustomBtn = document.getElementById("setCustomBtn");
const presetButtons = document.querySelectorAll(".timer-presets .pill");

const MAX_SECONDS = 99 * 3600 + 59 * 60 + 59; // 99:59:59

let totalSeconds = 0;   // length of the chosen timer
let remaining = 0;      // seconds left
let endTime = null;     // timestamp when the timer should finish
let intervalId = null;
let audioCtx = null;

function pad(n) {
    return n.toString().padStart(2, "0");
}

function format(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return pad(h) + ":" + pad(m) + ":" + pad(s);
}

// Turns 5400 into "1 hr 30 min" for the status message
function describe(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h) parts.push(h + " hr");
    if (m) parts.push(m + " min");
    if (s) parts.push(s + " sec");
    return parts.join(" ");
}

function render() {
    display.textContent = format(remaining);
    document.title = intervalId ? format(remaining) + " - Recipe Box" : "Recipe Box";
}

function setTimer(seconds) {
    stop();
    totalSeconds = Math.min(seconds, MAX_SECONDS);
    remaining = totalSeconds;
    card.classList.remove("running", "done");
    message.textContent = describe(totalSeconds) + " timer ready.";
    startPauseBtn.textContent = "Start";
    startPauseBtn.disabled = false;
    resetBtn.disabled = false;
    render();
}

function tick() {
    // Based on the clock, so it stays accurate even if the tab is in the background
    remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    render();
    if (remaining === 0) finish();
}

function start() {
    if (remaining <= 0) return;
    // Create the audio context on a click so browsers allow sound later
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    endTime = Date.now() + remaining * 1000;
    intervalId = setInterval(tick, 250);
    card.classList.add("running");
    card.classList.remove("done");
    message.textContent = "Cooking in progress...";
    startPauseBtn.textContent = "Pause";
}

function stop() {
    clearInterval(intervalId);
    intervalId = null;
}

function pause() {
    stop();
    card.classList.remove("running");
    message.textContent = "Paused.";
    startPauseBtn.textContent = "Resume";
    render();
}

function reset() {
    stop();
    remaining = totalSeconds;
    card.classList.remove("running", "done");
    message.textContent = "Timer reset.";
    startPauseBtn.textContent = "Start";
    startPauseBtn.disabled = totalSeconds === 0;
    render();
}

function finish() {
    stop();
    card.classList.remove("running");
    card.classList.add("done");
    message.textContent = "Time's up! 🍳";
    startPauseBtn.textContent = "Start";
    document.title = "Time's up! - Recipe Box";
    beep();
}

function beep() {
    if (!audioCtx) return;
    // Three short beeps
    for (let i = 0; i < 3; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const t = audioCtx.currentTime + i * 0.4;
        osc.start(t);
        osc.stop(t + 0.2);
    }
}

function clearCustomInputs() {
    hoursInput.value = "";
    minutesInput.value = "";
    secondsInput.value = "";
}

function setFromCustom() {
    const h = Math.max(0, Number(hoursInput.value) || 0);
    const m = Math.max(0, Number(minutesInput.value) || 0);
    const s = Math.max(0, Number(secondsInput.value) || 0);
    const total = Math.floor(h) * 3600 + Math.floor(m) * 60 + Math.floor(s);

    presetButtons.forEach(b => b.classList.remove("active"));

    if (total <= 0) {
        message.textContent = "Enter at least 1 second.";
        return;
    }
    setTimer(total);
}

// Preset buttons (data-minutes -> seconds)
presetButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        presetButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        clearCustomInputs();
        setTimer(Number(btn.dataset.minutes) * 60);
    });
});

// Custom time: click Set or press Enter in any box
setCustomBtn.addEventListener("click", setFromCustom);
[hoursInput, minutesInput, secondsInput].forEach(function (input) {
    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") setFromCustom();
    });
});

startPauseBtn.addEventListener("click", function () {
    if (intervalId) {
        pause();
    } else {
        start();
    }
});

resetBtn.addEventListener("click", reset);