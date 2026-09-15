let scene, camera, renderer;
let room, monitor;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

const loaderScreen = document.getElementById("loader");
const skipBtn = document.getElementById("skipBtn");

init();
animate();

/* ===================== INIT ===================== */
function init() {

  scene = new THREE.Scene();
  scene.background = new THREE.Color("#050505");

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.set(0, 1.5, 4);

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("scene"),
    antialias: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);

  /* LIGHTS */
  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);

  const point = new THREE.PointLight(0xd4a0a0, 2);
  point.position.set(2, 3, 2);
  scene.add(point);

  /* LOAD ROOM */
  const gltfLoader = new THREE.GLTFLoader();

  gltfLoader.load(
    "models/luxury_room.glb",
    (gltf) => {

      room = gltf.scene;
      scene.add(room);

      // FIND MONITOR (you must name it in Blender "Monitor")
      room.traverse((child) => {
        if (child.name === "Monitor") {
          monitor = child;
        }
      });

      loaderScreen.style.display = "none";
    },
    undefined,
    (err) => {
      console.error("Model failed", err);
    }
  );

  /* EVENTS */
  window.addEventListener("click", onClick);
  window.addEventListener("resize", onResize);

  skipBtn.addEventListener("click", enterSite);
}

/* ===================== CLICK ===================== */
function onClick(event) {

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < intersects.length; i++) {

    if (intersects[i].object.name === "Monitor") {
      enterSite();
    }
  }
}

/* ===================== ENTER TRANSITION ===================== */
function enterSite() {

  // cinematic zoom
  let zoom = 0;

  function animateZoom() {

    zoom += 0.03;

    camera.position.z -= 0.08;
    camera.position.y -= 0.01;

    camera.fov -= 0.8;
    camera.updateProjectionMatrix();

    if (zoom < 60) {
      requestAnimationFrame(animateZoom);
    } else {
      window.location.href = "home.html"; 
      // or your actual portfolio page
    }
  }

  animateZoom();
}

/* ===================== LOOP ===================== */
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

/* ===================== RESIZE ===================== */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}