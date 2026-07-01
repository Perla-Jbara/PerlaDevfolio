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

    /* ================= HUD EXECUTION SYSTEM ================= */
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
    if(loadingArc) {
      loadingArc.style.strokeDasharray = 816;
      loadingArc.style.strokeDashoffset = 816;
    }

    const progressTimer = setInterval(() => {
      if (pct >= 100) {
        clearInterval(progressTimer);
      } else {
        pct++;
        counterDisplay.textContent = `${String(pct).padStart(2, '0')}%`;
        if(loadingArc) loadingArc.style.strokeDashoffset = 816 - (816 * pct) / 100;

        if (pct > 50) {
          let intensity = (pct - 50) / 50;
          if (seamLaser) {
            seamLaser.style.filter = `drop-shadow(0 0 ${6 + intensity * 18}px rgba(240, 150, 150, ${0.75 + intensity * 0.25}))`;
            seamLaser.style.strokeWidth = `${3 + intensity * 2}px`;
          }
          if (loadingArc) {
            loadingArc.style.filter = `drop-shadow(0 0 ${4 + intensity * 12}px var(--rose-glow))`;
          }
        }

        if (pct >= 75 && !doorsTriggered) {
          doorsTriggered = true;
          handleAuthorizationSuccess();
        }
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

    /* ================= THREE.JS BACKGROUND SCENE ================= */
    let scene, camera, renderer, activeObject;

    function initThreeEngine() {
      try {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 5;

        renderer = new THREE.WebGLRenderer({
          canvas: document.getElementById("three-canvas"),
          alpha: true,
          antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const glowLight = new THREE.PointLight(0xd4a0a0, 8, 30);
        glowLight.position.set(0, 0, 2);
        scene.add(glowLight);

        scene.add(new THREE.AmbientLight(0xffffff, 0.4));

        // Instantiate official module loader safely
        const loader = new GLTFLoader();
        
        loader.load("images/models/logo.glb", 
          (gltf) => {
            activeObject = gltf.scene;
            
            // Center model bounding metrics inside canvas view
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
            outputHUDError("GLTF PATH MATCH EXCEPTION: Double check your local folder directory mapping layout.");
          }
        );

        window.addEventListener('resize', onResize);
        animateThree();

      } catch (globalEngineError) {
        outputHUDError("RUNTIME INTERCEPT: " + globalEngineError.message);
      }
    }

    // Dynamic scale calculations based on device width
    function adjustActiveObjectScale() {
      if (!activeObject) return;
      const width = window.innerWidth;
      
      if (width < 480) {
        // Mobile Phones
        activeObject.scale.set(0.8, 0.8, 0.8);
      } else if (width < 768) {
        // Tablets
        activeObject.scale.set(1.0, 1.0, 1.0);
      } else if (width < 1400) {
        // Laptops / Small Desktops
        activeObject.scale.set(1.5, 1.5, 1.5);
      } else {
        // Ultra-wide / Large Displays
        activeObject.scale.set(2.0, 2.0, 2.0);
      }
    }

    function outputHUDError(message) {
      console.error(message);
      const errDiv = document.createElement("div");
      errDiv.className = "line error-log";
      errDiv.textContent = `> ${message}`;
      statusPanel.appendChild(errDiv);
      setTimeout(() => errDiv.classList.add("show"), 30);
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      adjustActiveObjectScale(); // Re-trigger layout calculations
    }

    function animateThree() {
      requestAnimationFrame(animateThree);
      if (activeObject) {
        activeObject.rotation.y += 0.008;
        activeObject.rotation.x += 0.003;
      }
      renderer.render(scene, camera);
    }

    /* ================= SHIMMER MICRO-PEARLS ESCALATION ================= */
    const pearlCanvas = document.getElementById("pearls-canvas");
    const pCtx = pearlCanvas.getContext("2d");
    let transitionParticles = [];
    let transitionActive = false;
    let spawnRate = 0.2; 

    function initiatePearlTransition() {
      pearlCanvas.width = window.innerWidth;
      pearlCanvas.height = window.innerHeight;
      transitionActive = true;
      
      animatePearls();
      
      setTimeout(() => {
        document.body.classList.add("pull-up");
      }, 2400);

      setTimeout(() => {
        window.location.href = "home.html";
      }, 3900);
    }

    function animatePearls() {
      if(!transitionActive) return;
      requestAnimationFrame(animatePearls);
      pCtx.clearRect(0, 0, pearlCanvas.width, pearlCanvas.height);

      if (spawnRate < 22) spawnRate += 0.09;

      if (Math.random() < 0.15 * spawnRate) {
        transitionParticles.push({
          x: Math.random() * window.innerWidth,
          y: window.innerHeight + 10,
          radius: Math.random() * 1.6 + 0.6, 
          speedY: -(Math.random() * 4 + 2.5),
          wobbleSpeed: Math.random() * 0.06,
          wobbleRange: Math.random() * 1.2,
          phase: Math.random() * Math.PI
        });
      }

      for(let i = transitionParticles.length - 1; i >= 0; i--) {
        let pt = transitionParticles[i];
        pt.y += pt.speedY;
        pt.phase += pt.wobbleSpeed;
        pt.x += Math.sin(pt.phase) * pt.wobbleRange;

        if (pt.y < -20) {
          transitionParticles.splice(i, 1);
          continue;
        }

        let grad = pCtx.createRadialGradient(pt.x - pt.radius*0.2, pt.y - pt.radius*0.2, 0, pt.x, pt.y, pt.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#fff4f4');
        grad.addColorStop(1, '#cca6a6');

        pCtx.beginPath();
        pCtx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        pCtx.fillStyle = grad;
        pCtx.shadowColor = "rgba(255,255,255,0.4)";
        pCtx.shadowBlur = 4;
        pCtx.fill();
      }
    }

    setTimeout(printLog, 500);
