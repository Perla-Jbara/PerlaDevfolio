import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ================= AUDIO HANDSHAKE ROUTINES ================= */
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSynthTone(freq, type, duration, gainAmt) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(gainAmt, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e){}
}

function soundTick() { playSynthTone(900, 'sine', 0.02, 0.01); }
function soundHeavyClunk() {
  playSynthTone(55, 'triangle', 0.5, 0.25);
  playSynthTone(110, 'sine', 0.2, 0.1);
}
function soundSuccess() {
  playSynthTone(523.25, 'sine', 0.08, 0.04);
  setTimeout(() => playSynthTone(1046.50, 'sine', 0.2, 0.04), 70);
}

document.addEventListener("click", () => initAudio(), { once: false });

/* ================= AMBIENT SPACE FILL ================= */
const space = document.getElementById("ambient-particles");
for (let i = 0; i < 25; i++) {
  const dot = document.createElement("div");
  dot.className = "p";
  dot.style.left = Math.random() * 100 + "vw";
  dot.style.animationDuration = (5 + Math.random() * 4) + "s";
  dot.style.animationDelay = "-" + (Math.random() * 5) + "s";
  space.appendChild(dot);
}

/* ================= HUD EXECUTION ================= */
const statusPanel = document.getElementById("status");
const counterDisplay = document.getElementById("counter");
const accessBanner = document.getElementById("access-banner");
const loadingArc = document.getElementById("loading-arc");
const seamLaser = document.getElementById("seam-laser");

const logs = [
  "SYS // CORE INITIALIZATION",
  "PEARL v4.0 // CONNECTED",
  "DECRYPT // HANDSHAKE SUCCESSFUL",
  "COMPUTE // INJECTING GRAPH ARRAYS"
];

let logIdx = 0;

function printLog() {
  if (logIdx >= logs.length) return;
  const div = document.createElement("div");
  div.className = "line";
  div.textContent = `> ${logs[logIdx]}`;
  statusPanel.appendChild(div);
  setTimeout(() => div.classList.add("show"), 30);
  soundTick();
  logIdx++;
  setTimeout(printLog, 450);
}

let pct = 0;
let doorsTriggered = false;

if (loadingArc) {
  loadingArc.style.strokeDasharray = 816;
  loadingArc.style.strokeDashoffset = 816;
}

const progressTimer = setInterval(() => {
  if (pct >= 100) {
    clearInterval(progressTimer);
    return;
  }

  pct++;
  counterDisplay.textContent = `${String(pct).padStart(2, '0')}%`;

  if (loadingArc) {
    loadingArc.style.strokeDashoffset = 816 - (816 * pct) / 100;
  }

  if (pct > 50) {
    let intensity = (pct - 50) / 50;

    if (seamLaser) {
      seamLaser.style.filter =
        `drop-shadow(0 0 ${6 + intensity * 18}px rgba(240, 150, 150, ${0.75 + intensity * 0.25}))`;
      seamLaser.style.strokeWidth = `${3 + intensity * 2}px`;
    }

    if (loadingArc) {
      loadingArc.style.filter =
        `drop-shadow(0 0 ${4 + intensity * 12}px var(--rose-glow))`;
    }
  }

  if (pct >= 75 && !doorsTriggered) {
    doorsTriggered = true;
    handleAuthorizationSuccess();
  }
}, 24);

function handleAuthorizationSuccess() {
  accessBanner.classList.add("granted");
  soundSuccess();

  setTimeout(() => {
    soundHeavyClunk();
    triggerMechanicalShift();
  }, 200);
}

function triggerMechanicalShift() {
  const vault = document.getElementById("vault");
  vault.classList.add("open");
  document.body.classList.add("vault-open");

  initThreeEngine();
  setTimeout(initiatePearlTransition, 2800);
}

/* ================= THREE.JS SCENE ================= */
let scene, camera, renderer, activeObject;

function initThreeEngine() {
  try {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById("three-canvas"),
      alpha: true,
      antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /* ================= FIXED LIGHTING ONLY ================= */

    // Warm rose key light (primary identity glow)
    const keyLight = new THREE.PointLight(0xd4a0a0, 5, 70);
    keyLight.position.set(2.5, 2, 3);
    scene.add(keyLight);

    // Soft pink fill light (prevents harsh darkness)
    const fillLight = new THREE.DirectionalLight(0xffc1d6, 1.1);
    fillLight.position.set(-3, 1.5, 2);
    scene.add(fillLight);

    // Cool contrast light (makes pink pop visually)
    const coolLight = new THREE.PointLight(0x8fbcd4, 1.0, 80);
    coolLight.position.set(-2, -2, 4);
    scene.add(coolLight);

    // Subtle ambient (DO NOT FLATTEN SCENE)
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    /* ===================================================== */

    const loader = new GLTFLoader();

    loader.load(
      "images/models/logo.glb",
      (gltf) => {
        activeObject = gltf.scene;

        const box = new THREE.Box3().setFromObject(activeObject);
        const center = box.getCenter(new THREE.Vector3());

        activeObject.position.x += (activeObject.position.x - center.x);
        activeObject.position.y += (activeObject.position.y - center.y);
        activeObject.position.z += (activeObject.position.z - center.z);

        adjustActiveObjectScale();
        scene.add(activeObject);
      },
      undefined,
      (error) => {
        outputHUDError("GLTF PATH MATCH EXCEPTION: Check model path.");
      }
    );

    window.addEventListener("resize", onResize);
    animateThree();

  } catch (e) {
    outputHUDError("RUNTIME ERROR: " + e.message);
  }
}

/* ================= SCALE ================= */
function adjustActiveObjectScale() {
  if (!activeObject) return;
  const w = window.innerWidth;

  if (w < 480) activeObject.scale.set(0.8, 0.8, 0.8);
  else if (w < 768) activeObject.scale.set(1, 1, 1);
  else if (w < 1400) activeObject.scale.set(1.5, 1.5, 1.5);
  else activeObject.scale.set(2, 2, 2);
}

/* ================= HELPERS ================= */
function outputHUDError(msg) {
  console.error(msg);
  const div = document.createElement("div");
  div.className = "line error-log";
  div.textContent = `> ${msg}`;
  statusPanel.appendChild(div);
  setTimeout(() => div.classList.add("show"), 30);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  adjustActiveObjectScale();
}

function animateThree() {
  requestAnimationFrame(animateThree);

  if (activeObject) {
    activeObject.rotation.y += 0.008;
    activeObject.rotation.x += 0.003;
  }

  renderer.render(scene, camera);
}

/* ================= PEARL TRANSITION ================= */
const pearlCanvas = document.getElementById("pearls-canvas");
const pCtx = pearlCanvas.getContext("2d");
let particles = [];
let active = false;
let spawnRate = 0.2;

function initiatePearlTransition() {
  pearlCanvas.width = window.innerWidth;
  pearlCanvas.height = window.innerHeight;
  active = true;

  animatePearls();

  setTimeout(() => {
    document.body.classList.add("pull-up");
  }, 2400);

  setTimeout(() => {
    window.location.href = "home.html";
  }, 3900);
}

function animatePearls() {
  if (!active) return;
  requestAnimationFrame(animatePearls);

  pCtx.clearRect(0, 0, pearlCanvas.width, pearlCanvas.height);

  if (spawnRate < 22) spawnRate += 0.09;

  if (Math.random() < 0.15 * spawnRate) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 10,
      radius: Math.random() * 1.6 + 0.6,
      speedY: -(Math.random() * 4 + 2.5),
      wobbleSpeed: Math.random() * 0.06,
      wobbleRange: Math.random() * 1.2,
      phase: Math.random() * Math.PI
    });
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];

    p.y += p.speedY;
    p.phase += p.wobbleSpeed;
    p.x += Math.sin(p.phase) * p.wobbleRange;

    if (p.y < -20) {
      particles.splice(i, 1);
      continue;
    }

    let grad = pCtx.createRadialGradient(
      p.x - p.radius * 0.2,
      p.y - p.radius * 0.2,
      0,
      p.x,
      p.y,
      p.radius
    );

    grad.addColorStop(0, "#fff");
    grad.addColorStop(0.3, "#fff4f4");
    grad.addColorStop(1, "#cca6a6");

    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    pCtx.fillStyle = grad;
    pCtx.shadowColor = "rgba(255,255,255,0.4)";
    pCtx.shadowBlur = 4;
    pCtx.fill();
  }
}

setTimeout(printLog, 500);