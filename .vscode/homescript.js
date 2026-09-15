
 
document.addEventListener("DOMContentLoaded", () => {

  emailjs.init("5rVtGNS8EdizDtf9j");

  const contactForm = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");
  const formMessage = document.getElementById("formMessage");

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("userName").value.trim();
    const email = document.getElementById("userEmail").value.trim();
    const message = document.getElementById("userMsg").value.trim();

    if (!name || !email || !message) {
      formMessage.textContent = "Please fill in all fields.";
      formMessage.style.display = "block";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "SENDING...";
    formMessage.style.display = "none";

    try {

      // 1️⃣ SEND TO YOU
      await emailjs.send(
        "service_w0y8mi5",
        "template_xncz78l",
        {
          from_name: name,
          from_email: email,
          message: message
        }
      );

      // 2️⃣ AUTO REPLY TO USER
      await emailjs.send(
        "service_w0y8mi5",
        "template_yt5z9ai",
        {
          from_name: name,
          from_email: email,
          message: message
        }
      );

      formMessage.textContent = "✓ Message sent successfully!";
      formMessage.style.color = "#7CFFB2";
      formMessage.style.display = "block";

      contactForm.reset();

    } catch (error) {

      console.error("EmailJS Error:", error);

      formMessage.textContent = "✗ Failed to send message.";
      formMessage.style.color = "#ff6b6b";
      formMessage.style.display = "block";
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "SEND ENQUIRY";
  });







  /* =====================================================
     PARTICLES
  ===================================================== */
  const canvas = document.getElementById('particleCanvas');

  if (canvas) {
  const ctx = canvas.getContext('2d');

  let particles = [];

  function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.5;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (
        this.x < 0 ||
        this.x > canvas.width ||
        this.y < 0 ||
        this.y > canvas.height
      ) {
        this.reset();
      }
    }

    draw() {
      ctx.fillStyle = `rgba(212,160,160,${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  initCanvas();

  for (let i = 0; i < 115; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  animate();
  window.addEventListener('resize', initCanvas);
  }

  /* =====================================================
     CUSTOM CURSOR
  ===================================================== */
  (function initCustomCursor() {
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    if (!cursor || !follower) return;

    let mouseHandler = null;

    function enableCursor() {
      if (mouseHandler) return;

      document.body.style.cursor = 'none';

      mouseHandler = (e) => {
        cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        follower.style.transform = `translate(${e.clientX - 16}px, ${e.clientY - 16}px)`;
      };

      document.addEventListener('mousemove', mouseHandler);
    }

    function disableCursor() {
      if (mouseHandler) {
        document.removeEventListener('mousemove', mouseHandler);
        mouseHandler = null;
      }
      document.body.style.cursor = 'auto';
    }

    function checkSize() {
      if (window.innerWidth > 768) enableCursor();
      else disableCursor();
    }

    checkSize();
    window.addEventListener('resize', checkSize);
  })();

  /* =====================================================
     NAV ACTIVE SECTION
  ===================================================== */
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (pageYOffset >= sectionTop - 200) {
        current = section.getAttribute("id");
      }
    });

    const matchingLink = Array.from(navLinks).find(
      link => link.getAttribute("href") === `#${current}`
    );

    // If we're inside a section that has no nav link of its own (e.g. the
    // Academic Vault section between Skills and Vault), keep whichever
    // link was highlighted last instead of clearing it to nothing.
    if (matchingLink) {
      navLinks.forEach(link => link.classList.remove("active"));
      matchingLink.classList.add("active");
    }
  });

  /* Project card clicks are now handled by pearl-transition.js
     (window.handleProjectClick), shared with the project pages. */




  /* =====================================================
     TECH STACK — SEAMLESS INFINITE AUTO SCROLL
  ===================================================== */
  const techGrid = document.getElementById("techGrid");

  if (techGrid) {
    let autoScroll = true;
    const SPEED = 0.28; // slow, steady drift

    // The track is duplicated once in the HTML (two .tech-track rows back
    // to back) so we can loop by jumping back exactly one track-width —
    // since the content is identical, the jump is invisible.
    function trackWidth() {
      const track = techGrid.querySelector(".tech-track");
      return track ? track.scrollWidth : techGrid.scrollWidth / 2;
    }

    function wrapScroll() {
      const half = trackWidth();
      if (half <= 0) return;
      if (techGrid.scrollLeft >= half) {
        techGrid.scrollLeft -= half;
      } else if (techGrid.scrollLeft < 0) {
        techGrid.scrollLeft += half;
      }
    }

    function autoMove() {
      if (autoScroll) {
        scrollAccum += SPEED;
        if (scrollAccum >= 1) {
          const whole = Math.floor(scrollAccum);
          techGrid.scrollLeft += whole;
          scrollAccum -= whole;
        }
        wrapScroll();
      }
      requestAnimationFrame(autoMove);
    }

    let scrollAccum = 0;
    autoMove();

    let resumeTimer = null;

    function pauseAutoScroll(ms = 2000) {
      autoScroll = false;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => autoScroll = true, ms);
    }

    techGrid.addEventListener('pointerdown', () => pauseAutoScroll(2500));
    techGrid.addEventListener('touchstart', () => pauseAutoScroll(2500), { passive: true });
    techGrid.addEventListener('scroll', () => wrapScroll());
    techGrid.addEventListener('wheel', () => pauseAutoScroll(1500));

    techGrid.addEventListener("mouseenter", () => autoScroll = false);
    techGrid.addEventListener("mouseleave", () => autoScroll = true);

    document.querySelectorAll('.tech-arrow').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.classList.contains('left') ? -1 : 1;
        pauseAutoScroll(2500);
        techGrid.scrollBy({ left: dir * 250, behavior: 'smooth' });
      });
    });
  }

});

/* ================= MOBILE 3D LOGO REVEAL ================= */
// The sticky hero-model is hidden by default on small screens (see homestyles.css)
// until it scrolls into view, so it doesnt block the name on first paint.
document.addEventListener("DOMContentLoaded", () => {
  const heroModel = document.querySelector(".hero-model");
  if (!heroModel) return;

  if (window.innerWidth > 768) {
    heroModel.classList.add("revealed");
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        heroModel.classList.add("revealed");
      }
    });
  }, { threshold: 0.15 });

  observer.observe(heroModel);
});

/* ================= SCROLL REVEAL (about/tech/education/projects/contact) ================= */
document.addEventListener("DOMContentLoaded", () => {
  const revealSelectors = [
    "#about .section-title", "#about .portrait-frame", "#about p",
    "#tech .section-title", ".tech-card",
    "#education .section-title", ".edu-item",
    "#work .section-title", ".project-card",
    "#contact .section-title", ".form-group", "#contact .cv-btn"
  ].join(", ");

  const revealEls = document.querySelectorAll(revealSelectors);
  if (!revealEls.length) return;

  revealEls.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 0.08}s`;
  });

  if (!("IntersectionObserver" in window)) {
    revealEls.forEach(el => el.classList.add("in-view"));
    return;
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

  revealEls.forEach(el => revealObserver.observe(el));
});
