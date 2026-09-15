/* ============================================================
   PERLA JBARA · PORTFOLIO — script.js
   WebGL Shader BG · Custom Cursor · Scroll Reveals · Interactions
   ============================================================ */

/* ─── WEBGL SHADER BACKGROUND ─────────────────────────────── */
(function initShader() {
  const canvas = document.getElementById('shader-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.style.display = 'none'; return; }

  // Vertex
  const vsSource = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  // Fragment — rose-petal smoke waves
  const fsSource = `
    precision highp float;
    uniform float u_time;
    uniform vec2  u_res;
    uniform vec2  u_mouse;

    // Simplex-ish noise
    vec3 mod289(vec3 x) { return x - floor(x*(1./289.))*289.; }
    vec2 mod289(vec2 x) { return x - floor(x*(1./289.))*289.; }
    vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.,0.) : vec2(0.,1.);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.,i1.y,1.)) + i.x + vec3(0.,i1.x,1.));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.);
      m = m*m; m = m*m;
      vec3 x = 2.*fract(p * C.www) - 1.;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
      vec3 g;
      g.x = a0.x*x0.x + h.x*x0.y;
      g.yz = a0.yz*x12.xz + h.yz*x12.yw;
      return 130.*dot(m,g);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      uv.y = 1.0 - uv.y;

      vec2 mouse = u_mouse / u_res;
      float t = u_time * 0.18;

      // Layered noise for organic smoke
      float n1 = snoise(uv * 2.2 + vec2(t * 0.4, t * 0.3));
      float n2 = snoise(uv * 4.1 + vec2(-t * 0.25, t * 0.5) + n1 * 0.3);
      float n3 = snoise(uv * 8.0 + vec2(t * 0.15, -t * 0.2) + n2 * 0.2);
      float n  = n1 * 0.55 + n2 * 0.3 + n3 * 0.15;

      // Mouse influence — subtle pull
      vec2  md  = uv - mouse;
      float md2 = dot(md, md);
      float mInfluence = exp(-md2 * 3.5) * 0.12;
      n += mInfluence * snoise(uv * 6.0 + u_time * 0.3);

      // Color palette: deep obsidian → rose dust → gold whisper
      vec3 col0 = vec3(0.032, 0.022, 0.035);   // near-black
      vec3 col1 = vec3(0.22, 0.12, 0.14);       // deep rose
      vec3 col2 = vec3(0.48, 0.28, 0.30);       // blush
      vec3 col3 = vec3(0.62, 0.45, 0.30);       // gold whisper

      float t01 = smoothstep(-0.6, 0.1, n);
      float t12 = smoothstep(-0.05, 0.5, n);
      float t23 = smoothstep(0.3, 0.85, n);

      vec3 color = mix(col0, col1, t01);
      color = mix(color, col2, t12 * 0.6);
      color = mix(color, col3, t23 * 0.25);

      // Vignette
      float vig = 1.0 - smoothstep(0.35, 1.2, length((uv - 0.5) * 1.6));
      color *= vig;

      // Very subtle scanline shimmer
      float scan = sin(uv.y * u_res.y * 1.5) * 0.008;
      color += scan;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Shader error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compileShader(vsSource, gl.VERTEX_SHADER);
  const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const posLoc   = gl.getAttribLocation(prog, 'a_pos');
  const timeLoc  = gl.getUniformLocation(prog, 'u_time');
  const resLoc   = gl.getUniformLocation(prog, 'u_res');
  const mouseLoc = gl.getUniformLocation(prog, 'u_mouse');

  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  let startTime = performance.now();
  let animActive = true;

  function render() {
    if (!animActive) return;
    const t = (performance.now() - startTime) / 1000;
    gl.uniform1f(timeLoc, t);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.uniform2f(mouseLoc, mouseX, canvas.height - mouseY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  render();

  // Expose toggle
  window._shaderToggle = (on) => { animActive = on; if (on) render(); };
})();


/* ─── CUSTOM CURSOR ────────────────────────────────────────── */
(function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let cx = -100, cy = -100;
  let rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    dot.style.left = cx + 'px';
    dot.style.top  = cy + 'px';
  });

  (function tickRing() {
    rx += (cx - rx) * 0.12;
    ry += (cy - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(tickRing);
  })();

  // Hover states
  document.querySelectorAll('a, button, .tech-pill, .project-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      dot.style.width  = '14px';
      dot.style.height = '14px';
    });
    el.addEventListener('mouseleave', () => {
      dot.style.width  = '8px';
      dot.style.height = '8px';
    });
  });
})();


/* ─── TYPING EFFECT ────────────────────────────────────────── */
(function initTyping() {
  const el = document.getElementById('typing-text');
  if (!el) return;
  const phrases = [
    'Software Developer',
    'Master\'s Student',
    'Mobile Engineer',
    'UI Enthusiast',
  ];
  let pIdx = 0, cIdx = 0, deleting = false;

  function tick() {
    const phrase = phrases[pIdx];
    if (!deleting) {
      el.textContent = phrase.slice(0, ++cIdx);
      if (cIdx === phrase.length) { deleting = true; setTimeout(tick, 2200); return; }
      setTimeout(tick, 80);
    } else {
      el.textContent = phrase.slice(0, --cIdx);
      if (cIdx === 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; }
      setTimeout(tick, 42);
    }
  }
  tick();
})();


/* ─── SCROLL REVEALS ──────────────────────────────────────── */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
})();


/* ─── MOBILE DRAWER ───────────────────────────────────────── */
(function initDrawer() {
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');
  if (!burger || !drawer) return;

  const links = drawer.querySelectorAll('a');
  let open = false;

  function openDrawer() {
    open = true;
    drawer.style.left = '0';
    burger.setAttribute('aria-expanded', 'true');
    burger.children[0].style.transform = 'rotate(45deg) translateY(10px)';
    burger.children[1].style.opacity   = '0';
    burger.children[2].style.transform = 'rotate(-45deg) translateY(-10px)';
    links.forEach((l, i) => {
      setTimeout(() => {
        l.style.opacity   = '1';
        l.style.transform = 'translateX(0)';
      }, 120 + i * 80);
    });
  }

  function closeDrawer() {
    open = false;
    drawer.style.left = '-100%';
    burger.setAttribute('aria-expanded', 'false');
    burger.children[0].style.transform = '';
    burger.children[1].style.opacity   = '1';
    burger.children[2].style.transform = '';
    links.forEach(l => {
      l.style.opacity   = '0';
      l.style.transform = 'translateX(-30px)';
    });
  }

  burger.addEventListener('click', () => open ? closeDrawer() : openDrawer());
  links.forEach(l => l.addEventListener('click', closeDrawer));
})();


/* ─── PROJECT CARD OPEN ANIMATION ────────────────────────── */
(function initProjects() {
  document.querySelectorAll('.project-card[data-link]').forEach(card => {
    const href = card.getAttribute('data-link');

    function go() {
      card.style.transition = 'transform 0.5s cubic-bezier(0.77,0,0.18,1), opacity 0.4s';
      card.style.transform  = 'scale(0.96)';
      card.style.opacity    = '0';
      setTimeout(() => { window.location.href = href; }, 450);
    }

    card.addEventListener('click', go);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });

    // 3D tilt
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / r.width;
      const dy = (e.clientY - r.top  - r.height / 2) / r.height;
      card.style.transform = `perspective(800px) rotateX(${(-dy * 5).toFixed(2)}deg) rotateY(${(dx * 7).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();


/* ─── MOTION TOGGLE ───────────────────────────────────────── */
(function initMotionToggle() {
  const btn = document.getElementById('motionToggle');
  if (!btn) return;
  let on = true;
  btn.addEventListener('click', () => {
    on = !on;
    btn.textContent = on ? 'Disable Motion' : 'Enable Motion';
    // Pause/resume CSS animations
    document.documentElement.style.setProperty(
      '--motion-duration', on ? '' : '0.001ms'
    );
    if (window._shaderToggle) window._shaderToggle(on);
  });
})();



// Sparkles
// const canvas = document.getElementById("sparkles");
// const ctx = canvas.getContext("2d");
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

// let stars = [];
// for (let i = 0; i < 80; i++) {
//   stars.push({
//     x: Math.random() * canvas.width,
//     y: Math.random() * canvas.height,
//     size: Math.random() * 2 + 1,
//     speed: Math.random() * 0.3 + 0.1
//   });
// }

// function animate() {
//   ctx.clearRect(0, 0, canvas.width, canvas.height);
//   stars.forEach(s => {
//     ctx.fillStyle = "rgba(244,114,182,.8)";
//     ctx.beginPath();
//     ctx.moveTo(s.x,s.y);
//     ctx.lineTo(s.x+s.size,s.y+s.size);
//     ctx.lineTo(s.x,s.y+s.size*2);
//     ctx.lineTo(s.x-s.size,s.y+s.size);
//     ctx.closePath();
//     ctx.fill();
//     s.y += s.speed;
//     if (s.y > canvas.height) s.y = 0;
//   });
//   requestAnimationFrame(animate);
// }
// animate();

// // Tab switching
// const tabs = document.querySelectorAll('.tab');
// const contents = document.querySelectorAll('.tab-content');
// const githubLink = document.getElementById('github-link');
// tabs.forEach(tab=>{
//   tab.addEventListener('click',()=>{
//     tabs.forEach(t=>t.classList.remove('active'));
//     contents.forEach(c=>c.classList.remove('active'));
//     tab.classList.add('active');
//     document.getElementById(tab.dataset.target).classList.add('active');
//     githubLink.href = tab.dataset.target==='mobile'?document.getElementById('mobile-github').href:document.getElementById('web-github').href;
//   });
// });
// githubLink.href = document.getElementById('mobile-github').href;

// // Gallery modal
// const modal=document.getElementById("imageModal");
// const modalImg=document.getElementById("modalImg");
// document.querySelectorAll(".gallery-card img").forEach(img=>{
//   img.addEventListener("click",()=>{
//     modal.style.display="flex";
//     modalImg.src=img.src;
//   });
// });
// modal.addEventListener("click",()=>{modal.style.display="none";});

// // Drawer
// const burger=document.getElementById("burger");
// const drawer=document.getElementById("drawer");
// const links=drawer.querySelectorAll('a');
// let open=false;
// const tl=gsap.timeline({paused:true});
// tl.to(drawer,{left:0,duration:.5,ease:"power3.out"})
//   .to(links,{opacity:1,x:0,duration:.6,stagger:.15,ease:"power3.out"},"-=0.3");
// burger.addEventListener('click',()=>{
//   open=!open;
//   if(open){tl.play();burger.children[0].style.transform='rotate(45deg) translateY(10px)';burger.children[1].style.opacity='0';burger.children[2].style.transform='rotate(-45deg) translateY(-10px)';}
//   else{tl.reverse();burger.children[0].style.transform='';burger.children[1].style.opacity='1';burger.children[2].style.transform='';}
// });
// links.forEach(link=>link.addEventListener('click',()=>{open=false;tl.reverse();burger.children[0].style.transform='';burger.children[1].style.opacity='1';burger.children[2].style.transform='';}));

// // Scroll animations
// gsap.registerPlugin(ScrollTrigger);
// gsap.utils.toArray("section").forEach(section=>{
//   gsap.from(section,{opacity:0,y:80,duration:1,scrollTrigger:{trigger:section,start:"top 80%"}});
// });