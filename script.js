/* ETE // RITUAL.MEMORY.DATACENTER — 3D
   A data center that holds not data but ritual memory: footage of
   funerals, mourning traditions and burial rites from across the world.
   Each geometric form is a digital tomb. Outside: click a tomb to focus.
   Inside (pointer-lock FPS): walk the chamber, the footage plays.
*/

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/* ---------------- DATA ----------------
   interior: which interior environment is generated on ENTER.
   videos:   footage played inside the chamber (web-compressed mp4s).
*/
const PRIMS = [
  { id:"01", kind:"pendant",    title:"PENDANT.PROTOCOL",  interior:"organic",
    meta:"01 / ground-tombs · return to the earth",
    body:"A stalactite of stacked rings that hangs from the rail and breathes. Burial: to make the dead reconnect with the ground, so plants grow from him and worms feed — so other life goes on. Roots crawl downward, a symbiont spreading under the floor where we mourn. Ancient, ritual, subterranean.",
    tag:"∎ BURIAL", videos:["videos/relational-fan-01.mp4"] },
  { id:"02", kind:"fan",        title:"RELATIONAL.FAN",    interior:"fan",
    meta:"02 / processions · the social body of mourning",
    body:"Sun-rayed analytic of relations: every line a tie between distributed mourners, converging on one death. The fan opens and radiates from a single point — the community that gathers around the deceased. Funeral processions, collective vigils, grief spread through a whole town.",
    tag:"∎ PROCESSION", videos:["videos/relational-fan-02.mp4"] },
  { id:"03", kind:"rack",       title:"GOVERNANCE.RACK",   interior:"rack",
    meta:"03 / institution · death regulated",
    body:"The rack of identical slots is death regulated by the state. State funerals, military honours, the furling of the flag, salutes, rigid choreography. War cemeteries with endless rows of identical stones — the grid of crosses. The slots empty from the middle and re-stack on top, endlessly.",
    tag:"∎ STATE", videos:["videos/relational-fan-03.mp4"] },
  { id:"04", kind:"well",       title:"EXTRACTION.WELL",   interior:"well",
    meta:"04 / the vertical axis · exhumation",
    body:"A well that descends below the line: the axis toward the earth and the afterlife. It works as an extractor — re-exhumations and secondary burials — a conduit between the surface of the living and the underground of the dead. Beads of light fall into the shaft.",
    tag:"∎ EXHUME", videos:["videos/relational-fan-04.mp4"] },
  { id:"05", kind:"mesh",       title:"VIGIL.MESH",        interior:"fan",
    meta:"05 / the web of the bereaved",
    body:"A polygonal canopy of relations. Every vertex a mourner, every edge a tie to the dead. The mesh holds the network of grief together, refusing to name a single centre.",
    tag:"∎ VIGIL", videos:[] },
  { id:"06", kind:"dome",       title:"MEMORY.DOME",       interior:"chamber",
    meta:"06 / containment · the vault of the remembered",
    body:"A hemispheric vault that stores what fears loss. To archive is a human gesture, made out of the dread of death. Smooth outside, hollow within, waiting for a guardian who never comes.",
    tag:"∎ MEMORY", videos:[] },
  { id:"07", kind:"dataspires", title:"SIGNAL.SPIRES",     interior:"chamber",
    meta:"07 / the towers that call the dead",
    body:"A bundle of thin verticals. Bells, minarets, mourning towers — the signal that announces a death to those still breathing. The taller the spire, the further the grief travels.",
    tag:"∎ SIGNAL", videos:[] },
  { id:"08", kind:"ziggurat",   title:"OFFERING.ZIGGURAT", interior:"crypt",
    meta:"08 / stepped tomb · the rite of ascent",
    body:"A terraced tomb of receding plateaus. Each step a rite, each rite narrower than the last, climbing toward a place the body cannot follow. Crowned by an obelisk that listens.",
    tag:"∎ OFFERING", videos:[] },
  { id:"09", kind:"datastack",  title:"STRATA.ARCHIVE",    interior:"crypt",
    meta:"09 / sediment · layers of the buried",
    body:"Vertical strata of memory, floor beneath floor. Generations pressed into sediment. The machine registers each death by its metadata — date, place, cause — and never once understands it.",
    tag:"∎ STRATA", videos:[] },
  { id:"10", kind:"windfarm",   title:"SCATTER.FARM",      interior:"fan",
    meta:"10 / the rite of dispersal",
    body:"Masts turning in the open. Sky burials, ashes scattered to wind and water, bodies given back to the elements. The lightest of the rites and the hardest to hold.",
    tag:"∎ SCATTER", videos:[] },
  { id:"11", kind:"box",        title:"OSSUARY.DEPOT",     interior:"rack",
    meta:"11 / the container of bones",
    body:"A box. An ossuary. It holds everything the landscape has decided not to display: bones, urns, relics kept active by maintenance rather than mourning. Open on appointment.",
    tag:"∎ OSSUARY", videos:[] },
  { id:"12", kind:"fan",        title:"TERMINAL.FAN",      interior:"fan",
    meta:"12 / the last procession",
    body:"Closing radial. The ear of the land listens. The archive does not end; it loops back to the first tomb, ready to outlast everyone who built it — a testament for the machines and the modelled people still to come.",
    tag:"∎ TESTAMENT", videos:[] },
];

const SPACING = 4.7;
PRIMS.forEach((p, i) => { p.x = i * SPACING; p.y = 0; p.z = 0; });
const TRACK_LEN = (PRIMS.length - 1) * SPACING;

/* ---------------- PARAMS ---------------- */
const PARAMS = {
  bloomStrength: 0.40,
  bloomRadius: 0.42,
  bloomThreshold: 0.28,
  camEase: 0.08,
  idleFloat: 0.08,
  idleSpin: 1.40,
  focusBounce: 0.40,
  ringHue: 209,
  fogNear: 30,
  autoOrbit: true,
};
const DEFAULTS = { ...PARAMS };

const bounceState = { idx: -1, t: 1 };

/* ---------------- DOM ---------------- */
const canvas = document.getElementById("stage");
const panel = document.getElementById("panel");
const panelId = document.getElementById("panel-id");
const panelTitle = document.getElementById("panel-title");
const panelMeta = document.getElementById("panel-meta");
const panelBody = document.getElementById("panel-body");
const panelTag  = document.getElementById("panel-tag");
const panelClose = document.getElementById("panel-close");
const coordEl = document.getElementById("coord");
const nodeIdxEl = document.getElementById("node-idx");
const clockEl = document.getElementById("clock");
const miniCursor = document.getElementById("mini-cursor");
// interior / FPS DOM
const enterBtn = document.getElementById("enter-btn");
const crosshairEl = document.getElementById("crosshair");
const interiorHud = document.getElementById("interior-hud");
const ihudTitle = document.getElementById("ihud-title");
const ihudMeta = document.getElementById("ihud-meta");
const lockOverlay = document.getElementById("lock-overlay");
const lockKicker = document.getElementById("lock-kicker");
const lockTitle = document.getElementById("lock-title");
const lockBody = document.getElementById("lock-body");
const lockResume = document.getElementById("lock-resume");
const lockExit = document.getElementById("lock-exit");
const fanRaysCanvas = document.getElementById("fan-rays");
const fanCtx = fanRaysCanvas.getContext("2d");
const cursorEl = document.getElementById("cursor");
const ripplesEl = document.getElementById("ripples");
const paramsEl = document.getElementById("params");
const paramsBody = document.getElementById("params-body");
const paramsToggle = document.getElementById("params-toggle");

/* ---------------- THREE ---------------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.Fog(0xffffff, 35, 160);

// labels go in a separate scene so bloom doesn't touch them
const labelScene = new THREE.Scene();
const labelEntries = []; // { sprite, nodeIdx, baseY }

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);
camera.position.set(0, 1.8, 10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

let composer, bloomPass;
let interiorComposer, interiorBloom, interiorRenderPass;
function setupPost(){
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(1,1), 0.28, 0.7, 0.55);
  bloomPass.threshold = PARAMS.bloomThreshold;
  bloomPass.strength = PARAMS.bloomStrength;
  bloomPass.radius = PARAMS.bloomRadius;
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // interior: its own composer so the white chambers get a soft gloom
  interiorComposer = new EffectComposer(renderer);
  interiorRenderPass = new RenderPass(interiorScene, camera);
  interiorComposer.addPass(interiorRenderPass);
  interiorBloom = new UnrealBloomPass(new THREE.Vector2(1,1), 0.55, 0.85, 0.72);
  interiorComposer.addPass(interiorBloom);
  interiorComposer.addPass(new OutputPass());
}

function resize(){
  const w = canvas.clientWidth || (canvas.parentElement && canvas.parentElement.clientWidth) || window.innerWidth;
  const h = canvas.clientHeight || (canvas.parentElement && canvas.parentElement.clientHeight) || window.innerHeight;
  renderer.setSize(w, h, false);
  if (composer) composer.setSize(w, h);
  if (interiorComposer) interiorComposer.setSize(w, h);
  if (fanRaysCanvas){ fanRaysCanvas.width = w; fanRaysCanvas.height = h; fanAnchors = null; }
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

/* lights */
const hemi = new THREE.HemisphereLight(0xfff4e0, 0x6a6a64, 0.55);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff1d8, 1.35);
sun.position.set(18, 22, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
sun.shadow.bias = -0.0005;
scene.add(sun);

// rim / back light for silhouettes
const rim = new THREE.DirectionalLight(0x9bb4ff, 0.55);
rim.position.set(-12, 8, -14);
scene.add(rim);

// soft fill from camera side
const fill = new THREE.DirectionalLight(0xffffff, 0.25);
fill.position.set(0, 6, 18);
scene.add(fill);

// subtle ambient floor bounce
const ambient = new THREE.AmbientLight(0xffffff, 0.18);
scene.add(ambient);

/* ground */
/* invisible shadow catcher (no visible floor) */
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(600, 200),
  new THREE.ShadowMaterial({ opacity: 0.32 })
);
shadowPlane.rotation.x = -Math.PI/2;
shadowPlane.position.y = 0;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

/* baseline rail (the white horizontal slab in reference) */
/* ---------------- LIGHT DOT TRAIL ---------------- */
function makeDotTexture(){
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.00, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.55, "rgba(255,255,255,0.25)");
  grad.addColorStop(1.00, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,128,128);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}
const dotTex = makeDotTexture();
const dotEntries = [];
const DOT_COUNT = 60;
const DOT_Y = 0.45;
const DOT_X_START = -2;
const DOT_X_END = (PRIMS.length - 1) * SPACING + 2;
const DOT_SPAN = DOT_X_END - DOT_X_START;
for (let i=0;i<DOT_COUNT;i++){
  const t = i / DOT_COUNT;
  const x = DOT_X_START + t * DOT_SPAN;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dotTex, transparent: true,
    depthWrite: false,
    color: 0xffffff,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.85
  }));
  const baseScale = 0.18 + Math.random()*0.08;
  sprite.scale.set(baseScale, baseScale, 1);
  sprite.position.set(x, DOT_Y, 0);
  sprite.userData = {
    baseScale,
    phase: i * 0.42,
    offset: t * DOT_SPAN
  };
  scene.add(sprite);
  dotEntries.push(sprite);
}

const rail = new THREE.Mesh(
  new THREE.BoxGeometry(TRACK_LEN + 12, 0.25, 1.4),
  new THREE.MeshStandardMaterial({ color: 0xd2d2cd, roughness: 0.55, metalness: 0.05 })
);
rail.position.set(TRACK_LEN/2, 0.125, 0);
rail.castShadow = true;
rail.receiveShadow = true;
scene.add(rail);

/* ---------------- MATERIALS ---------------- */
const matWhite = new THREE.MeshPhysicalMaterial({
  color: 0xe6e6e3, roughness: 0.22, metalness: 0.05,
  clearcoat: 0.9, clearcoatRoughness: 0.12,
  reflectivity: 0.65, sheen: 0.2, sheenColor: 0xe6e6e3
});
const matPaper = new THREE.MeshPhysicalMaterial({
  color: 0xdedcd6, roughness: 0.35, metalness: 0.02,
  clearcoat: 0.6, clearcoatRoughness: 0.18
});
const matInk   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.1 });
const matAcid  = new THREE.MeshStandardMaterial({ color: 0xc8ff00, roughness: 0.4, metalness: 0.0, emissive: 0x222200, emissiveIntensity: 0.2 });
const matLine  = new THREE.LineBasicMaterial({ color: 0x2a2a28, transparent: true, opacity: 0.55 });
const matEdge  = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7 });

/* ---------------- PRIMITIVES ---------------- */
const nodesGroup = new THREE.Group();
scene.add(nodesGroup);

function addEdges(mesh){
  const e = new THREE.EdgesGeometry(mesh.geometry, 25);
  const line = new THREE.LineSegments(e, matEdge);
  mesh.add(line);
}

function buildDome(p){
  const g = new THREE.Group();
  const R = 1.35;
  const centerY = R + 0.3;
  // sliced full sphere: stack of thin disc-cylinders with small gaps
  const slices = 16;
  const sliceThick = (2 * R) / slices * 0.78;  // 78% material, 22% gap
  for (let i=0;i<slices;i++){
    const t = (i + 0.5) / slices;            // 0..1
    const yLocal = -R + t * 2 * R;            // -R..+R within sphere
    const rad = Math.sqrt(Math.max(0.0001, R*R - yLocal*yLocal));
    const sliceMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6e6e3, roughness: 0.22, metalness: 0.05,
      clearcoat: 0.9, clearcoatRoughness: 0.12
    });
    const slice = new THREE.Mesh(
      new THREE.CylinderGeometry(rad, rad, sliceThick, 48),
      sliceMat
    );
    slice.position.y = centerY + yLocal;
    slice.castShadow = true; slice.receiveShadow = true;
    g.add(slice);
    // edge ring on top of each slice for definition
    const topPts = [];
    for (let j=0;j<=48;j++){
      const a = (j/48)*Math.PI*2;
      topPts.push(new THREE.Vector3(Math.cos(a)*rad, sliceThick/2 + 0.001, Math.sin(a)*rad));
    }
    const topRing = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(topPts),
      new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.5 })
    );
    topRing.position.copy(slice.position);
    g.add(topRing);
  }
  // base plinth slab
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(R*2.2, 0.18, R*2.2),
    new THREE.MeshPhysicalMaterial({ color: 0xd2d2cd, roughness: 0.5, clearcoat: 0.3 })
  );
  plinth.position.y = 0.13;
  plinth.receiveShadow = true; plinth.castShadow = true;
  g.add(plinth);
  // top antenna
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8),
    matInk
  );
  antenna.position.y = centerY + R + 0.22;
  g.add(antenna);
  const antBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 8),
    matInk
  );
  antBall.position.y = centerY + R + 0.5;
  g.add(antBall);
  return g;
}

function buildFan(p){
  const g = new THREE.Group();
  const r = 1.45;
  const rays = 32;
  // top thin slab
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.18, 0.18),
    matInk
  );
  slab.position.y = 0.3;
  g.add(slab);
  // rays as line segments fanning downward into the ground? No — sit above.
  // Build a half-disc above baseline using thin radial planes
  const rayGeo = new THREE.PlaneGeometry(r, 0.04);
  const rayMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6e6e3, roughness: 0.3, metalness: 0.02,
    clearcoat: 0.4, side: THREE.DoubleSide,
    transparent: true, opacity: 0.95
  });
  for (let i=0;i<rays;i++){
    const t = i/(rays-1);
    const ang = Math.PI * t; // 0..π (upper half)
    const ray = new THREE.Mesh(rayGeo, rayMat);
    ray.position.set(
      Math.cos(Math.PI - ang) * r/2,
      0.3 + Math.sin(ang) * r/2,
      0
    );
    ray.rotation.z = ang - Math.PI/2;
    ray.castShadow = true;
    g.add(ray);
  }
  // outline arc
  const pts = [];
  for (let i=0;i<=64;i++){
    const a = Math.PI * (i/64);
    pts.push(new THREE.Vector3(Math.cos(Math.PI - a)*r, 0.3 + Math.sin(a)*r, 0));
  }
  const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);
  g.add(new THREE.Line(arcGeo, matEdge));
  return g;
}

function buildColumns(p){
  const g = new THREE.Group();
  const w = 2.0, d = 0.9;
  // top slab
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.25, d),
    matPaper
  );
  slab.position.y = 2.0;
  slab.castShadow = true; slab.receiveShadow = true;
  g.add(slab);
  addEdges(slab);
  // columns
  const cols = 11;
  for (let i=0;i<cols;i++){
    const cx = -w/2 + (i+0.5)*(w/cols);
    const colMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 1.9, 0.08),
      matInk
    );
    colMesh.position.set(cx, 1.0, 0);
    colMesh.castShadow = true;
    g.add(colMesh);
  }
  // base plinth
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(w+0.4, 0.12, d+0.4),
    matPaper
  );
  plinth.position.y = 0.18;
  plinth.receiveShadow = true;
  g.add(plinth);
  return g;
}

function buildSphere(p){
  const g = new THREE.Group();
  const r = 0.75;
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(r, 64, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0xe6e6e3, roughness: 0.15, metalness: 0.1,
      clearcoat: 1.0, clearcoatRoughness: 0.06,
      reflectivity: 0.8
    })
  );
  sphere.position.y = r + 0.25;
  sphere.castShadow = true; sphere.receiveShadow = true;
  g.add(sphere);
  // accountable pixel (small black dot)
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 12),
    matInk
  );
  dot.position.set(r*0.6, r + 0.25 + r*0.25, r*0.5);
  g.add(dot);
  // pedestal
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.55, 0.25, 24),
    matPaper
  );
  ped.position.y = 0.12;
  ped.receiveShadow = true;
  g.add(ped);
  return g;
}

function buildDot(p){
  const g = new THREE.Group();
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 12),
    matInk
  );
  dot.position.y = 0.6;
  dot.castShadow = true;
  g.add(dot);
  // thin stake
  const stake = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8),
    matInk
  );
  stake.position.y = 0.3;
  g.add(stake);
  return g;
}

function buildBox(p){
  const g = new THREE.Group();
  const w = 1.7, h = 1.1, d = 1.1;
  // main box
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    matPaper
  );
  box.position.y = 0.25 + h/2;
  box.castShadow = true; box.receiveShadow = true;
  g.add(box);
  addEdges(box);
  // offset upper box (rotated)
  const upper = new THREE.Mesh(
    new THREE.BoxGeometry(w*0.75, h*0.6, d*0.75),
    new THREE.MeshPhysicalMaterial({ color: 0xdcdcd9, roughness: 0.32, clearcoat: 0.5 })
  );
  upper.position.set(w*0.08, 0.25 + h + h*0.3, -d*0.05);
  upper.rotation.y = Math.PI/14;
  upper.castShadow = true;
  g.add(upper);
  addEdges(upper);
  // tiny cube on top
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.25, 0.25),
    matInk
  );
  cube.position.set(-w*0.18, 0.25 + h + h*0.6 + 0.13, d*0.18);
  g.add(cube);
  // hatching strips on top
  for (let i=0;i<6;i++){
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.4, 0.02, 0.04),
      matInk
    );
    strip.position.set(0, 0.25 + h + 0.012, -d/2 + 0.2 + i*(d-0.4)/5);
    g.add(strip);
  }
  // door panel on front
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(w*0.4, h*0.6),
    new THREE.MeshBasicMaterial({ color: 0x222222 })
  );
  door.position.set(0, 0.25 + h*0.45, d/2 + 0.001);
  g.add(door);
  return g;
}

/* ---- new layered / variant primitives ---- */
const LAYER_TINTS = [0xffffff, 0xf2eef0, 0xece6ea, 0xe6e0e8, 0xe0dae6, 0xdcd6e0, 0xd6cfdc, 0xd0c8d6];

function buildDatastack(p){
  const g = new THREE.Group();
  const w = 1.7, d = 1.1;
  const SUBDIV = 3;
  const GAP = 0.015;
  // above-rail layers (light → mid)
  const aboveBase = [
    { h: 0.7,  color: 0xeaeae7 },
    { h: 0.35, color: 0xe2e2df },
    { h: 0.45, color: 0xdcdcd9 },
    { h: 0.55, color: 0xd4d4d1 },
  ];
  // below-rail layers (mid → darker)
  const belowBase = [
    { h: 0.45, color: 0xcecdc8 },
    { h: 0.35, color: 0xc4c3be },
    { h: 0.55, color: 0xbab9b4 },
  ];
  const expand = (arr) => arr.flatMap(L => {
    const subH = (L.h - (SUBDIV-1)*GAP) / SUBDIV;
    return Array.from({length: SUBDIV}, () => ({ h: subH, color: L.color }));
  });
  const above = expand(aboveBase);
  const below = expand(belowBase);

  const slabMat = (color) => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.4, metalness: 0.0,
    clearcoat: 0.4, clearcoatRoughness: 0.25
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.55 });
  const addSlab = (h, color, yCenter) => {
    const slabGeo = new THREE.BoxGeometry(w, h, d);
    const slab = new THREE.Mesh(slabGeo, slabMat(color));
    slab.position.y = yCenter;
    slab.castShadow = true; slab.receiveShadow = true;
    g.add(slab);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(slabGeo, 25), edgeMat);
    edges.position.copy(slab.position);
    g.add(edges);
  };

  // build upward from rail top
  let yUp = 0.3;
  above.forEach((L, idx) => {
    if (idx > 0) yUp += GAP;
    addSlab(L.h, L.color, yUp + L.h/2);
    yUp += L.h;
  });
  // build downward from rail bottom
  let yDn = -0.05;
  below.forEach((L, idx) => {
    if (idx > 0) yDn -= GAP;
    addSlab(L.h, L.color, yDn - L.h/2);
    yDn -= L.h;
  });

  // antenna up
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), matInk);
  ant.position.y = yUp + 0.4;
  g.add(ant);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), matInk);
  antTip.position.y = yUp + 0.7;
  g.add(antTip);
  // root marker below
  const root = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), matInk);
  root.position.y = yDn - 0.1;
  g.add(root);
  return g;
}

/* pendant / stalactite — hangs from the rail, breathes, grows roots downward */
function buildPendant(p){
  const g = new THREE.Group();
  // body group (breathes / sways as one)
  const body = new THREE.Group();
  g.add(body);
  const segsBase = [
    { h: 0.4, r: 0.55, color: 0xdedcd6 },
    { h: 0.35, r: 0.42, color: 0xd2d2cd },
    { h: 0.5,  r: 0.3,  color: 0xc6c6c0 },
    { h: 0.6,  r: 0.16, color: 0xbab9b4 },
  ];
  const SUBDIV = 3;
  const GAP = 0.012;
  const segs = segsBase.flatMap((s, idx) => {
    const nextR = segsBase[idx+1] ? segsBase[idx+1].r : s.r * 0.78;
    const subH = (s.h - (SUBDIV-1)*GAP) / SUBDIV;
    return Array.from({length: SUBDIV}, (_, k) => {
      const t0 = k / SUBDIV, t1 = (k+1) / SUBDIV;
      return { h: subH, rTop: s.r*(1-t0)+nextR*t0, rBot: s.r*(1-t1)+nextR*t1, color: s.color };
    });
  });
  let y = -0.05;
  segs.forEach((s, idx) => {
    if (idx > 0) y -= GAP;
    const geo = new THREE.CylinderGeometry(s.rTop, s.rBot, s.h, 18);
    const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
      color: s.color, roughness: 0.4, clearcoat: 0.4
    }));
    mesh.position.y = y - s.h/2;
    mesh.castShadow = true; mesh.receiveShadow = true;
    body.add(mesh);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 25),
      new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.55 })
    );
    edges.position.copy(mesh.position);
    body.add(edges);
    y -= s.h;
  });
  const tipY = y - 0.05;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), matInk);
  tip.position.y = tipY;
  body.add(tip);

  // --- organic roots crawling downward from the tip ---
  const rootPivots = [];
  const NROOTS = 6;
  const rootMat = new THREE.MeshStandardMaterial({ color: 0xbdbbb3, roughness: 0.85, metalness: 0.0 });
  for (let i=0;i<NROOTS;i++){
    const pivot = new THREE.Group();
    pivot.position.y = tipY;
    const seed = i * 1.37;
    const len = 2.6 + (i % 3) * 0.7;     // reach well below
    const spread = 0.5 + (i % 2) * 0.35;
    const dir = (i / NROOTS) * Math.PI * 2;
    const pts = [];
    const SEGS = 10;
    for (let s=0;s<=SEGS;s++){
      const t = s / SEGS;
      const wob = Math.sin(t * Math.PI * 2.2 + seed) * spread * t;
      pts.push(new THREE.Vector3(
        Math.cos(dir) * (spread * t * 0.6 + wob),
        -t * len,
        Math.sin(dir) * (spread * t * 0.6 + wob)
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 28, 0.05, 6, false),
      rootMat
    );
    tube.castShadow = true;
    // taper: scale tip thinner via vertex? keep simple — small radius already
    pivot.add(tube);
    // a few rootlets (thin lines) for fineness
    pivot.userData = { seed, swayAmp: 0.05 + (i%3)*0.03, swaySpeed: 0.5 + (i%4)*0.12, baseLen: len };
    rootPivots.push(pivot);
    g.add(pivot);
  }

  g.userData = { kind:"pendant", body, rootPivots, tipY };
  return g;
}

/* well / inverted dome pit */
function buildWell(p){
  const g = new THREE.Group();
  const r = 1.0;
  // inverted hemisphere (open upward)
  const geo = new THREE.SphereGeometry(r, 40, 24, 0, Math.PI*2, Math.PI/2, Math.PI/2);
  const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
    color: 0xd0d0cb, roughness: 0.35, side: THREE.DoubleSide,
    clearcoat: 0.6, clearcoatRoughness: 0.15
  }));
  mesh.position.y = 0;
  mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh);
  // rim circle
  const rimPts = [];
  for (let i=0;i<=64;i++){
    const a = (i/64)*Math.PI*2;
    rimPts.push(new THREE.Vector3(Math.cos(a)*r, 0.01, Math.sin(a)*r));
  }
  g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(rimPts), matEdge));
  // inner contour rings (depth feel)
  for (let i=1;i<5;i++){
    const rr = r * (1 - i*0.18);
    const y = -i*0.13;
    const pts = [];
    for (let j=0;j<=48;j++){
      const a = (j/48)*Math.PI*2;
      pts.push(new THREE.Vector3(Math.cos(a)*rr, y, Math.sin(a)*rr));
    }
    g.add(new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.4 })
    ));
  }
  // dot at bottom
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), matInk);
  dot.position.y = -r + 0.05;
  g.add(dot);

  // --- beads of light descending into the shaft ---
  const orbs = [];
  const orbTex = makeDotTexture();
  const NORB = 14;
  for (let i=0;i<NORB;i++){
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: orbTex, transparent: true, color: 0xffffff,
      toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    const sc = 0.12 + Math.random()*0.06;
    sp.scale.set(sc, sc, 1);
    // start spread above the rim, fall into the pit
    const ang = Math.random()*Math.PI*2;
    const rad = Math.random() * r * 0.7;
    sp.position.set(Math.cos(ang)*rad, 1.2 + Math.random()*2.0, Math.sin(ang)*rad);
    sp.userData = {
      baseScale: sc,
      speed: 0.5 + Math.random()*0.7,
      topY: 1.2 + Math.random()*1.2,
      bottomY: -r - 1.4,
      ang, rad
    };
    g.add(sp);
    orbs.push(sp);
  }
  g.userData = { kind:"well", orbs, wellR: r };
  return g;
}

function buildMesh(p){
  const g = new THREE.Group();
  const r = 1.56;
  // icosahedron-ish wireframe canopy
  const geo = new THREE.IcosahedronGeometry(r, 1);
  const skin = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color: 0xe6e6e3, roughness: 0.5, metalness: 0.0,
      transparent: true, opacity: 0.45,
      clearcoat: 0.3
    })
  );
  skin.position.y = r + 0.25;
  skin.castShadow = true;
  g.add(skin);
  // edges
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 1),
    new THREE.LineBasicMaterial({ color: 0x1a1a1a })
  );
  edges.position.copy(skin.position);
  g.add(edges);
  // vertex dots
  const pts = geo.attributes.position;
  const dotGeo = new THREE.SphereGeometry(0.05, 8, 6);
  const seen = new Set();
  for (let i=0;i<pts.count;i++){
    const x = pts.getX(i), y = pts.getY(i), z = pts.getZ(i);
    const k = `${x.toFixed(2)}|${y.toFixed(2)}|${z.toFixed(2)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const dot = new THREE.Mesh(dotGeo, matInk);
    dot.position.set(x, y + skin.position.y, z);
    g.add(dot);
  }
  return g;
}

function buildChipArray(p){
  const g = new THREE.Group();
  const cols = 5, rows = 4;
  const cellW = 0.32, cellD = 0.32, gap = 0.08;
  const totalW = cols * cellW + (cols-1) * gap;
  const totalD = rows * cellD + (rows-1) * gap;
  // base plate
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(totalW + 0.3, 0.08, totalD + 0.3),
    new THREE.MeshPhysicalMaterial({
      color: 0xdedcd6, roughness: 0.5, metalness: 0.05,
      clearcoat: 0.3
    })
  );
  base.position.y = 0.18;
  base.receiveShadow = true; base.castShadow = true;
  g.add(base);
  // chips
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(cellW, 0.18 + Math.random()*0.25, cellD),
        new THREE.MeshPhysicalMaterial({
          color: 0xe6e6e3, roughness: 0.35, metalness: 0.15,
          clearcoat: 0.6
        })
      );
      const x = -totalW/2 + c*(cellW+gap) + cellW/2;
      const z = -totalD/2 + r*(cellD+gap) + cellD/2;
      cube.position.set(x, 0.22 + cube.geometry.parameters.height/2, z);
      cube.castShadow = true;
      g.add(cube);
      // dark contact pin
      if ((r+c) % 2 === 0){
        const pin = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.02, 0.06),
          matInk
        );
        pin.position.set(x, 0.22 + cube.geometry.parameters.height + 0.012, z);
        g.add(pin);
      }
    }
  }
  return g;
}

function buildDataspires(p){
  const g = new THREE.Group();
  const n = 9;
  const w = 1.5;
  // base plate
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.2, 0.1, 0.6),
    new THREE.MeshPhysicalMaterial({
      color: 0xdedcd6, roughness: 0.6, clearcoat: 0.3
    })
  );
  base.position.y = 0.2;
  base.receiveShadow = true;
  g.add(base);
  for (let i=0;i<n;i++){
    const t = i/(n-1);
    const h = 1.0 + Math.sin(i*1.7)*0.5 + (i%3)*0.2;
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, h, 8),
      matWhite
    );
    tower.position.set(-w/2 + t*w, 0.25 + h/2, 0);
    tower.castShadow = true;
    g.add(tower);
    // tip ball
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 10, 8),
      matInk
    );
    tip.position.set(tower.position.x, 0.25 + h + 0.05, 0);
    g.add(tip);
  }
  return g;
}

function buildWindfarm(p){
  const g = new THREE.Group();
  const n = 3;
  const spread = 1.0;
  // base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(spread + 0.5, 0.08, 0.8),
    new THREE.MeshPhysicalMaterial({ color: 0xdedcd6, roughness: 0.55 })
  );
  base.position.y = 0.2;
  base.receiveShadow = true;
  g.add(base);
  const blades = [];
  for (let i=0;i<n;i++){
    const t = i/(n-1);
    const x = -spread/2 + t*spread;
    const h = 1.3 + i*0.25;
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.06, h, 10),
      matWhite
    );
    mast.position.set(x, 0.25 + h/2, 0);
    mast.castShadow = true;
    g.add(mast);
    // hub
    const hub = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 8),
      matWhite
    );
    hub.position.set(x, 0.25 + h, 0.06);
    g.add(hub);
    // blades — cross of two thin boxes
    const bladeGroup = new THREE.Group();
    for (let b=0;b<3;b++){
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.55, 0.02),
        matInk
      );
      blade.position.y = 0.27;
      blade.rotation.z = (b/3) * Math.PI * 2;
      bladeGroup.add(blade);
    }
    bladeGroup.position.set(x, 0.25 + h, 0.1);
    g.add(bladeGroup);
    blades.push(bladeGroup);
  }
  g.userData.blades = blades;
  return g;
}

const BUILDERS = {
  dome: buildDome, fan: buildFan, columns: buildColumns,
  sphere: buildSphere, dot: buildDot, box: buildBox,
  datastack: buildDatastack, mesh: buildMesh, chiparray: buildChipArray,
  dataspires: buildDataspires, windfarm: buildWindfarm,
  pendant: buildPendant, well: buildWell,
  ziggurat: buildZiggurat, rack: buildRack
};

function buildZiggurat(p){
  const g = new THREE.Group();
  // pyramidal stack with 3× subdivisions per step
  const stepsBase = [
    { w: 2.0, d: 1.4, h: 0.35, color: 0xdcdcd9 },
    { w: 1.7, d: 1.2, h: 0.35, color: 0xe2e2df },
    { w: 1.4, d: 1.0, h: 0.35, color: 0xe6e6e3 },
    { w: 1.1, d: 0.8, h: 0.35, color: 0xeaeae7 },
    { w: 0.8, d: 0.6, h: 0.45, color: 0xeeeeec },
  ];
  const SUBDIV = 3;
  const GAP = 0.015;
  const steps = stepsBase.flatMap(s => {
    const subH = (s.h - (SUBDIV-1)*GAP) / SUBDIV;
    return Array.from({length: SUBDIV}, () => ({ w: s.w, d: s.d, h: subH, color: s.color }));
  });
  let y = 0.3;
  const slabMat = (color) => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.32, metalness: 0.03,
    clearcoat: 0.6, clearcoatRoughness: 0.15
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.55 });
  let prevStep = null;
  steps.forEach((s, idx) => {
    if (idx > 0){
      const sameStep = (prevStep && s.w === prevStep.w);
      y += sameStep ? GAP : 0;
    }
    const geo = new THREE.BoxGeometry(s.w, s.h, s.d);
    const mesh = new THREE.Mesh(geo, slabMat(s.color));
    mesh.position.y = y + s.h/2;
    mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edgeMat);
    edges.position.copy(mesh.position);
    g.add(edges);
    y += s.h;
    prevStep = s;
  });
  // crown obelisk
  const obelisk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.18, 0.55, 6),
    matInk
  );
  obelisk.position.y = y + 0.3;
  g.add(obelisk);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 8),
    matInk
  );
  beacon.position.y = y + 0.65;
  g.add(beacon);
  return g;
}

function buildRack(p){
  const g = new THREE.Group();
  // server-rack stack: 8 thin horizontal trays with vertical posts
  const w = 1.6, d = 1.0;
  const trays = 24;
  const trayH = 0.055;
  const gap = 0.02;
  const totalH = trays * (trayH + gap) + 0.25;
  // 4 corner posts
  const postGeo = new THREE.BoxGeometry(0.08, totalH, 0.08);
  for (let cx of [-w/2+0.05, w/2-0.05]){
    for (let cz of [-d/2+0.05, d/2-0.05]){
      const post = new THREE.Mesh(postGeo, new THREE.MeshPhysicalMaterial({
        color: 0xb0b0ac, roughness: 0.45, metalness: 0.2
      }));
      post.position.set(cx, 0.25 + totalH/2, cz);
      post.castShadow = true;
      g.add(post);
    }
  }
  // trays — each grouped so it can ride a vertical conveyor (restack loop)
  const slotStep = trayH + gap;
  const yBottom = 0.25 + trayH/2 + 0.05;
  const range = trays * slotStep;
  const trayUnits = [];
  const trayGeo = new THREE.BoxGeometry(w-0.12, trayH, d-0.12);
  const ledGeo = new THREE.BoxGeometry(0.04, 0.03, 0.03);
  for (let i=0;i<trays;i++){
    const unit = new THREE.Group();
    const tray = new THREE.Mesh(trayGeo, new THREE.MeshPhysicalMaterial({
      color: 0xe6e6e3, roughness: 0.3, clearcoat: 0.5
    }));
    tray.castShadow = true; tray.receiveShadow = true;
    unit.add(tray);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(trayGeo, 25),
      new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.5 })
    );
    unit.add(edges);
    for (let l=0;l<3;l++){
      const led = new THREE.Mesh(ledGeo, matInk);
      led.position.set(w/2 - 0.12 - l*0.1, 0, d/2 - 0.08);
      unit.add(led);
    }
    unit.position.y = yBottom + i * slotStep;
    unit.userData = { phase0: i * slotStep };
    g.add(unit);
    trayUnits.push(unit);
  }
  // top cap
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(w+0.06, 0.06, d+0.06),
    new THREE.MeshPhysicalMaterial({ color: 0xc8c8c5, roughness: 0.4 })
  );
  cap.position.y = 0.25 + totalH + 0.03;
  cap.castShadow = true;
  g.add(cap);

  g.userData = { kind:"rack", trayUnits, slotStep, yBottom, range, rackW: w, rackD: d };
  return g;
}

const nodeMeshes = []; // for raycasting / focus
const NODE_SCALE = 1.22;

PRIMS.forEach((p, i) => {
  const inner = BUILDERS[p.kind](p);
  inner.scale.setScalar(NODE_SCALE);
  const group = new THREE.Group();
  group.add(inner);
  group.position.set(p.x, 0, 0);
  group.userData = { idx: i, prim: p, inner };
  // invisible hit-box for clicks (in outer-group coords, not scaled)
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 7.0, 4.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.y = 1.0;
  hit.userData = { idx: i, prim: p };
  group.add(hit);
  // ground tag (id number stamp)
  const tagCanvas = makeLabelTexture(`${p.id} · ${p.kind.toUpperCase()}`, `${p.title}`);
  const tag = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.48),
    new THREE.MeshBasicMaterial({ map: tagCanvas, transparent: true })
  );
  tag.rotation.x = -Math.PI/2;
  tag.position.set(0, 0.01, 2.2);
  group.add(tag);

  // floating vertical info sprite — always faces camera, in labelScene (no bloom)
  // varied heights so labels don't overlap visually
  const LABEL_HEIGHTS = [
    6.8, -2.4, 4.2, -4.5,
    5.6, -3.2, 7.2, -2.0,
    4.8, -4.0, 6.2, -3.6,
  ];
  const labelBaseY = LABEL_HEIGHTS[i % LABEL_HEIGHTS.length];
  const isBelow = labelBaseY < 0;

  const floatTex = makeFloatLabel(p);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: floatTex, transparent: true,
    depthWrite: false, depthTest: false,
    toneMapped: false
  }));
  sprite.scale.set(4.8, 2.5, 1);
  sprite.position.set(p.x, labelBaseY, 0);
  labelScene.add(sprite);
  labelEntries.push({ sprite, nodeIdx: i, baseY: labelBaseY, isBelow });

  // tether line from node to label
  const tetherTop = isBelow ? -0.2 : 2.7;
  const tetherBottom = isBelow ? labelBaseY + 1.3 : labelBaseY - 1.3;
  const tetherGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(p.x, tetherTop, 0),
    new THREE.Vector3(p.x, tetherBottom, 0),
  ]);
  const tether = new THREE.Line(tetherGeo, new THREE.LineBasicMaterial({
    color: 0x222222, transparent: true, opacity: 0.55
  }));
  tether.userData.nodeIdx = i;
  labelScene.add(tether);

  nodesGroup.add(group);
  nodeMeshes.push(hit);
});

/* floating sprite info label */
function makeFloatLabel(p){
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 540;
  const ctx = c.getContext("2d");
  // bg card
  ctx.fillStyle = "rgba(250,250,246,0.30)";
  ctx.fillRect(0,0,c.width,c.height);
  // border
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 6;
  ctx.strokeRect(3,3,c.width-6,c.height-6);
  // accent bar top — electric blue
  ctx.fillStyle = "#0055ff";
  ctx.fillRect(3,3,c.width-6,40);
  ctx.fillStyle = "#fafaf6";
  ctx.font = "bold 32px JetBrains Mono, monospace";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`${p.id} · ${p.kind.toUpperCase()}`, 24, 8);
  // title
  ctx.fillStyle = "#111";
  ctx.font = "bold 70px Helvetica Neue, Arial, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(p.title, 28, 70);
  // meta
  ctx.fillStyle = "#7a7a74";
  ctx.font = "30px JetBrains Mono, monospace";
  ctx.fillText(p.meta, 28, 170);
  // tag chip
  ctx.font = "bold 28px JetBrains Mono, monospace";
  const tagW = ctx.measureText(p.tag).width + 36;
  ctx.fillStyle = "#111";
  ctx.fillRect(28, 230, tagW, 50);
  ctx.fillStyle = "#fafaf6";
  ctx.fillText(p.tag, 46, 240);
  // body
  ctx.fillStyle = "#2a2a28";
  ctx.font = "28px Helvetica Neue, Arial, sans-serif";
  const body = p.body.length > 180 ? p.body.slice(0, 177) + "…" : p.body;
  wrapText(ctx, body, 28, 310, c.width-56, 38);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 16;
  return tex;
}
function wrapText(ctx, text, x, y, maxW, lineH){
  const words = text.split(" ");
  let line = "";
  for (const w of words){
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxW){
      ctx.fillText(line, x, y);
      line = w + " ";
      y += lineH;
    } else line = test;
  }
  ctx.fillText(line, x, y);
}

/* canvas-texture label */
function makeLabelTexture(top, bottom){
  const c = document.createElement("canvas");
  c.width = 512; c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fafaf6";
  ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.strokeRect(4,4,c.width-8,c.height-8);
  ctx.fillStyle = "#111";
  ctx.font = "bold 32px JetBrains Mono, monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(top, c.width/2, 44);
  ctx.fillStyle = "#7a7a74";
  ctx.font = "22px JetBrains Mono, monospace";
  ctx.fillText(bottom, c.width/2, 90);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

/* ---------------- CAMERA NAV ---------------- */
const TRACK_CENTER_X = TRACK_LEN / 2;
const OVERVIEW_CAM = new THREE.Vector3(TRACK_CENTER_X, 3.0, 50);
const OVERVIEW_TARGET = new THREE.Vector3(TRACK_CENTER_X, 0.6, 0);

const camState = {
  mode: "overview",   // "overview" | "focused"
  focusIdx: 0,
  target: OVERVIEW_TARGET.clone(),
  desiredPos: OVERVIEW_CAM.clone(),
  freeFly: false,
};

function focusNode(i, opts = {}){
  const { smooth = true, openInfo = false } = opts;
  camState.mode = "focused";
  camState.focusIdx = (i + PRIMS.length) % PRIMS.length;
  const p = PRIMS[camState.focusIdx];
  camState.target.set(p.x, 0.7, 0);
  camState.desiredPos.set(p.x, 1.4, 5.5);
  camState.freeFly = false;
  updateMini();
  nodeIdxEl.textContent = `${String(camState.focusIdx+1).padStart(2,"0")} / ${String(PRIMS.length).padStart(2,"0")}`;
  bounceState.idx = camState.focusIdx;
  bounceState.t = 0;
  // auto-orbit on focus
  PARAMS.autoOrbit = true;
  setBackBtn(true);
  enterBtn.classList.remove("hidden");
  if (!smooth){
    camera.position.copy(camState.desiredPos);
    camera.lookAt(camState.target);
  }
  if (openInfo) openPanel(p);
}

function goOverview(){
  camState.mode = "overview";
  camState.target.copy(OVERVIEW_TARGET);
  camState.desiredPos.copy(OVERVIEW_CAM);
  PARAMS.autoOrbit = false;
  orbit.yaw = 0; orbit.pitch = 0;
  bounceState.idx = -1;
  panel.classList.add("hidden");
  setBackBtn(false);
  enterBtn.classList.add("hidden");
  nodeIdxEl.textContent = `— / ${String(PRIMS.length).padStart(2,"0")}`;
}

function setBackBtn(show){
  const b = document.getElementById("back-btn");
  if (!b) return;
  b.classList.toggle("hidden", !show);
}

function updateMini(){
  const t = camState.focusIdx / (PRIMS.length - 1);
  const w = miniCursor.parentElement.clientWidth - 12;
  miniCursor.style.left = `${6 + t * w}px`;
}

/* ---------------- PANEL ---------------- */
function openPanel(p){
  panelId.textContent = `${p.id} / ${p.kind}`;
  panelTitle.textContent = p.title;
  panelMeta.textContent = p.meta;
  panelBody.textContent = p.body;
  panelTag.textContent = p.tag;
  panel.classList.remove("hidden");
}
panelClose.addEventListener("click", () => panel.classList.add("hidden"));
document.getElementById("back-btn").addEventListener("click", () => goOverview());

/* ============================================================
   INTERIOR — step inside a tomb (pointer-lock FPS)
   ============================================================ */

/* video texture cache */
const videoCache = new Map(); // src -> { el, tex }
function getVideo(src){
  if (videoCache.has(src)) return videoCache.get(src);
  const el = document.createElement("video");
  el.src = src;
  el.loop = true;
  el.muted = true;          // start muted (autoplay policy); unmuted on enter gesture
  el.defaultMuted = true;
  el.playsInline = true;
  el.setAttribute("playsinline", "");
  el.preload = "auto";
  el.crossOrigin = "anonymous";
  // keep a hidden DOM node so browsers decode/autoplay reliably
  el.style.position = "absolute";
  el.style.width = "2px"; el.style.height = "2px";
  el.style.opacity = "0"; el.style.pointerEvents = "none";
  el.style.left = "-10px"; el.style.top = "-10px";
  document.body.appendChild(el);
  const tex = new THREE.VideoTexture(el);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  const entry = { el, tex };
  videoCache.set(src, entry);
  return entry;
}

/* placeholder texture for chambers awaiting footage */
function makePlaceholderTexture(prim){
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const x = c.getContext("2d");
  x.fillStyle = "#0c0c0e"; x.fillRect(0,0,1024,1024);
  // scanlines
  x.fillStyle = "rgba(255,255,255,0.025)";
  for (let y=0;y<1024;y+=4) x.fillRect(0,y,1024,2);
  x.fillStyle = "#3a3a3a";
  x.font = "bold 44px JetBrains Mono, monospace";
  x.textAlign = "center";
  x.fillText("∎ NO SIGNAL", 512, 470);
  x.fillStyle = "#6a6a64";
  x.font = "26px JetBrains Mono, monospace";
  x.fillText(prim.tag.replace("∎ ",""), 512, 530);
  x.fillStyle = "#2a2a2a";
  x.font = "20px JetBrains Mono, monospace";
  x.fillText("FOOTAGE PENDING — RESEARCH ONGOING", 512, 580);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* a framed screen mesh; uses video if src given, else placeholder */
function makeScreen(w, h, src, prim){
  const grp = new THREE.Group();
  let tex, isVideo = false, vEntry = null;
  if (src){ vEntry = getVideo(src); tex = vEntry.tex; isVideo = true; }
  else { tex = makePlaceholderTexture(prim); }
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: true })
  );
  grp.add(screen);
  // dark bezel frames the bright footage against the white room
  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(w + 0.16, h + 0.16),
    new THREE.MeshBasicMaterial({ color: 0x111114 })
  );
  frame.position.z = -0.02;
  grp.add(frame);
  // soft light cast by the screen
  const light = new THREE.PointLight(0xbfcaff, 0.0, 14, 2.0);
  light.position.set(0, 0, 1.2);
  grp.add(light);
  grp.userData = { isVideo, vEntry, screenLight: light };
  return grp;
}

/* interior scene (one active interior at a time) — bright, white, gloomy */
const INT_BG = 0xeceae6;
const interiorScene = new THREE.Scene();
interiorScene.background = new THREE.Color(INT_BG);
interiorScene.fog = new THREE.FogExp2(INT_BG, 0.020);
interiorScene.add(new THREE.AmbientLight(0xffffff, 0.95));
interiorScene.add(new THREE.HemisphereLight(0xffffff, 0xc8c6c0, 0.7));
const interiorKey = new THREE.PointLight(0xffffff, 0.9, 50, 1.4);
interiorKey.position.set(0, 6, 0);
interiorScene.add(interiorKey);
const interiorFill = new THREE.DirectionalLight(0xffffff, 0.5);
interiorFill.position.set(6, 8, 6);
interiorScene.add(interiorFill);

let interiorRoot = null;
let interiorBounds = null;
let interiorScreens = [];   // screen groups w/ video entries
let interiorSpawn = { pos: new THREE.Vector3(0, 1.6, 4), yaw: Math.PI };

// bright stone / plaster palette so the chambers read near-white
const FLOOR_MAT = () => new THREE.MeshStandardMaterial({ color: 0xd8d6d0, roughness: 0.92, metalness: 0.0 });
const WALL_MAT  = () => new THREE.MeshStandardMaterial({ color: 0xe6e4de, roughness: 0.88, metalness: 0.0, side: THREE.BackSide });

function disposeInterior(){
  if (!interiorRoot) return;
  interiorRoot.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material){
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => { if (m.map && m.map.isCanvasTexture) m.map.dispose(); m.dispose(); });
    }
  });
  interiorScene.remove(interiorRoot);
  interiorRoot = null;
  interiorScreens = [];
  fanRays = null;
  interiorAmbiance = null;
  organicBlob = null;
}

/* build a room shell (box) and return helpers */
function roomShell(w, h, d){
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), FLOOR_MAT());
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: 0xeeece8, roughness: 1.0 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = h;
  g.add(ceil);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), WALL_MAT());
  walls.position.y = h/2;
  g.add(walls);
  return g;
}

/* ---- interior variants ---- */
function buildChamberInterior(prim){
  const g = new THREE.Group();
  const W = 12, H = 5, D = 14;
  g.add(roomShell(W, H, D));
  // single large screen on far wall
  const src = prim.videos[0] || null;
  const screen = makeScreen(7.2, 4.0, src, prim);
  screen.position.set(0, 2.3, -D/2 + 0.06);
  g.add(screen); interiorScreens.push(screen);
  // a low plinth / catafalque in the centre
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xceccc6, roughness: 0.85 }));
  plinth.position.set(0, 0.25, 0);
  g.add(plinth);
  interiorBounds = { minX:-W/2+0.6, maxX:W/2-0.6, minZ:-D/2+0.6, maxZ:D/2-0.6 };
  interiorSpawn = { pos: new THREE.Vector3(0, 1.6, D/2 - 2), yaw: Math.PI };
  return g;
}

let fanRays = null;   // reactive converging lines, animated in updateInteriorFx
function buildFanInterior(prim){
  fanRays = null;
  const g = new THREE.Group();
  const R = 13, H = 6.5;
  // circular floor / ceiling / wall (bright)
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 64), FLOOR_MAT());
  floor.rotation.x = -Math.PI/2; g.add(floor);
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(R, 64),
    new THREE.MeshStandardMaterial({ color: 0xeeece8, roughness: 1.0 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; g.add(ceil);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xe6e4de, roughness: 0.9, side: THREE.BackSide }));
  wall.position.y = H/2; g.add(wall);

  // single central video screen — the focal point where ties converge
  const src = prim.videos[0] || null;
  const screen = makeScreen(6.0, 6.0, src, prim);
  const screenCenter = new THREE.Vector3(0, 3.0, -R + 2.2);
  screen.position.copy(screenCenter);
  g.add(screen); interiorScreens.push(screen);

  // converging rays: many lines from points around the room → the screen centre,
  // continuing THROUGH the centre so they cross the middle of the footage
  const rayGroup = new THREE.Group();
  const NR = 26;
  const segments = [];
  const mat = new THREE.LineBasicMaterial({
    color: 0x1a1a1f, transparent: true, opacity: 0.5, toneMapped: false
  });
  for (let i=0;i<NR;i++){
    const a = (i / NR) * Math.PI * 2;
    const rr = R - 0.5;
    const hY = 0.4 + Math.random() * (H - 1.0);
    const from = new THREE.Vector3(Math.cos(a)*rr, hY, Math.sin(a)*rr);
    // overshoot slightly past the centre so lines visibly cross it
    const through = screenCenter.clone().add(
      screenCenter.clone().sub(from).normalize().multiplyScalar(1.3)
    );
    const geo = new THREE.BufferGeometry().setFromPoints([from, through]);
    const line = new THREE.Line(geo, mat.clone());
    line.userData = { from, through, phase: Math.random()*Math.PI*2 };
    rayGroup.add(line);
    segments.push(line);
  }
  g.add(rayGroup);
  // a bright bead pulsing at the convergence point
  const bead = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeDotTexture(), color: 0xffffff, transparent: true,
    toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  bead.scale.set(1.4, 1.4, 1);
  bead.position.copy(screenCenter);
  g.add(bead);

  fanRays = { segments, bead, center: screenCenter };

  interiorBounds = { circleR: R - 1.0 };
  interiorSpawn = { pos: new THREE.Vector3(0, 1.6, R - 3.0), yaw: Math.PI };
  return g;
}

/* animate interior reactive effects (fan rays react to look direction + time) */
const _fanTmp = new THREE.Vector3();
function updateInteriorFx(dt){
  // raymarched metaball walls — shared, slowed time (70% slower)
  if (organicBlob && organicBlob.raymarch){
    const t = performance.now() * 0.001 * 0.30;   // 0.30x => 70% slower motion
    organicBlob.walls.forEach(mat => { mat.uniforms.uTime.value = t; });
  }

  // shared ambiance — descending beads + swaying tendrils
  if (interiorAmbiance){
    const t = performance.now() * 0.001;
    const ext = interiorAmbiance.ext;
    interiorAmbiance.beads.forEach((sp) => {
      const u = sp.userData;
      sp.position.y -= u.speed * dt;
      if (sp.position.y < ext.bottom){
        const [x,z] = ambiancePoint(ext);
        sp.position.set(x, ext.top, z);
      }
      const tw = 0.6 + 0.4*Math.sin(t*2.4 + u.phase);
      sp.material.opacity = 0.45 + tw*0.45;
      const s = u.baseScale * (0.8 + tw*0.4);
      sp.scale.set(s, s, 1);
    });
    interiorAmbiance.tendrils.forEach((pv) => {
      const u = pv.userData;
      pv.rotation.z = Math.sin(t*u.speed + u.seed) * u.amp;
      pv.rotation.x = Math.cos(t*u.speed*0.8 + u.seed) * u.amp;
    });
  }

  if (fanRays && interiorRoot){
    const t = performance.now() * 0.001;
    // gaze factor: how centred the convergence point is in view → rays intensify
    camera.getWorldDirection(_fanTmp);
    const toC = fanRays.center.clone().sub(camera.position).normalize();
    const gaze = THREE.MathUtils.clamp(_fanTmp.dot(toC), 0, 1);
    fanRays.segments.forEach((line) => {
      const u = line.userData;
      const flick = 0.5 + 0.5 * Math.sin(t * 1.8 + u.phase);
      line.material.opacity = 0.18 + flick * 0.32 + gaze * 0.4;
    });
    const pulse = 0.8 + 0.5 * Math.sin(t * 2.2);
    fanRays.bead.scale.setScalar((1.0 + gaze * 0.8) * pulse);
    fanRays.bead.material.opacity = 0.5 + gaze * 0.5;
  }
}

function buildWellInterior(prim){
  const g = new THREE.Group();
  const R = 7, RING_H = 2.2, RINGS = 7;
  // descending shaft: stacked rings going DOWN
  for (let i=0;i<RINGS;i++){
    const y = -i * RING_H;
    // bright at the rim, darkening as the shaft descends into the earth
    const f = Math.max(0, 1 - i * 0.13);
    const shade = new THREE.Color(0xe2e0da).multiplyScalar(0.35 + 0.65 * f);
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, RING_H, 48, 1, true),
      new THREE.MeshStandardMaterial({ color: shade, roughness: 0.95, side: THREE.BackSide })
    );
    ring.position.y = y - RING_H/2 + 0.001;
    g.add(ring);
    // ledge ring
    const ledge = new THREE.Mesh(
      new THREE.TorusGeometry(R-0.05, 0.06, 8, 48),
      new THREE.MeshStandardMaterial({ color: 0x6a6862, roughness: 1 })
    );
    ledge.rotation.x = Math.PI/2; ledge.position.y = y; g.add(ledge);
  }
  // top rim floor (walkable ring around the pit)
  const rim = new THREE.Mesh(new THREE.RingGeometry(R, R+5, 48), FLOOR_MAT());
  rim.rotation.x = -Math.PI/2; rim.position.y = 0.001; g.add(rim);
  // outer wall
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(R+5, R+5, 8, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xe2e0da, roughness: 0.92, side: THREE.BackSide }));
  outer.position.y = 2; g.add(outer);
  // video at the bottom of the well, facing up
  const src = prim.videos[0] || null;
  const bottom = makeScreen(R*1.3, R*1.3, src, prim);
  bottom.rotation.x = -Math.PI/2;
  bottom.position.set(0, -RINGS*RING_H + 0.2, 0);
  g.add(bottom); interiorScreens.push(bottom);
  // faint glow from the depths
  const depth = new THREE.PointLight(0xbcc4d6, 1.6, 34, 1.4);
  depth.position.set(0, -RINGS*RING_H + 2, 0);
  g.add(depth);
  interiorBounds = { ringInner: R + 0.4, ringOuter: R + 4.4 };
  interiorSpawn = { pos: new THREE.Vector3(0, 1.6, R + 2.4), yaw: Math.PI };
  return g;
}

function buildCryptInterior(prim){
  const g = new THREE.Group();
  const W = 16, H = 3.2, D = 10;          // low, wide, underground
  g.add(roomShell(W, H, D));
  // rows of low ground-tombs
  const tombMat = new THREE.MeshStandardMaterial({ color: 0xcac8c0, roughness: 0.95 });
  for (let r=0;r<2;r++){
    for (let c=0;c<5;c++){
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 0.9), tombMat);
      slab.position.set(-6 + c*3, 0.15, -2 + r*4);
      g.add(slab);
      // soil mound hint
      const mound = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 1.0),
        new THREE.MeshStandardMaterial({ color: 0xb0aea4, roughness: 1 }));
      mound.position.set(-6 + c*3, 0.32, -2 + r*4);
      g.add(mound);
    }
  }
  // screen low on the far wall, like looking into the earth
  const src = prim.videos[0] || null;
  const screen = makeScreen(6.5, 3.4, src, prim);
  screen.position.set(0, 1.9, -D/2 + 0.06);
  g.add(screen); interiorScreens.push(screen);
  interiorBounds = { minX:-W/2+0.6, maxX:W/2-0.6, minZ:-D/2+0.6, maxZ:D/2-0.6 };
  interiorSpawn = { pos: new THREE.Vector3(0, 1.6, D/2 - 2), yaw: Math.PI };
  return g;
}

function buildRackInterior(prim){
  const g = new THREE.Group();
  const W = 8, H = 5, D = 22;             // long corridor
  g.add(roomShell(W, H, D));
  // identical niches lining both walls — the grid of crosses
  const nicheMat = new THREE.MeshStandardMaterial({ color: 0xd4d2cc, roughness: 0.9 });
  const cols = 9, rows = 3;
  for (const side of [-1, 1]){
    for (let cc=0; cc<cols; cc++){
      for (let rr=0; rr<rows; rr++){
        const niche = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.9), nicheMat);
        niche.position.set(side * (W/2 - 0.06), 1.1 + rr*1.2, -D/2 + 1.6 + cc*2.2);
        g.add(niche);
        const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7),
          new THREE.MeshStandardMaterial({ color: 0x4a4844 }));
        slot.position.set(side * (W/2 - 0.12), 1.1 + rr*1.2, -D/2 + 1.6 + cc*2.2);
        slot.rotation.y = side < 0 ? Math.PI/2 : -Math.PI/2;
        g.add(slot);
      }
    }
  }
  // screen at the end of the corridor (the state ceremony)
  const src = prim.videos[0] || null;
  const screen = makeScreen(5.4, 3.4, src, prim);
  screen.position.set(0, 2.4, -D/2 + 0.06);
  g.add(screen); interiorScreens.push(screen);
  interiorBounds = { minX:-W/2+0.6, maxX:W/2-0.6, minZ:-D/2+0.6, maxZ:D/2-0.6 };
  interiorSpawn = { pos: new THREE.Vector3(0, 1.6, D/2 - 2), yaw: Math.PI };
  return g;
}

/* ---- breathing organic blob (custom vertex-displacement shader) ---- */
let organicBlob = null;
const BLOB_NOISE_GLSL = `
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0*C.xxx;
  vec3 x2 = x0 - i2 + 2.0*C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0*C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;
const BLOB_VERT = BLOB_NOISE_GLSL + `
uniform float uTime;
varying vec3 vN; varying vec3 vWP; varying float vD;
float fbm(vec3 p){
  float a = 0.5, f = 0.0;
  for(int i=0;i<4;i++){ f += a*snoise(p); p = p*2.02 + 1.7; a *= 0.5; }
  return f;
}
void main(){
  float t = uTime;
  vec3 dir = normalize(position);
  // domain-warped fbm → flowing, veiny living surface
  vec3 q = dir*1.7 + vec3(0.0, t*0.16, 0.0);
  vec3 warp = vec3(fbm(q+1.1), fbm(q+5.2), fbm(q+9.3));
  float detail = fbm(q + 0.65*warp);
  float breathe = sin(t*0.85)*0.5 + 0.5;            // slow inhale/exhale
  // lumps crawling under the skin (the symbiont)
  vec3 a = normalize(vec3(sin(t*0.50), cos(t*0.42)*0.6, cos(t*0.33)));
  vec3 b = normalize(vec3(cos(t*0.37), sin(t*0.50)*0.7, sin(t*0.29)));
  vec3 c = normalize(vec3(sin(t*0.60+2.0), cos(t*0.31), sin(t*0.45+1.0)));
  float lumps = exp(-7.0*distance(dir,a)) + exp(-8.0*distance(dir,b)) + exp(-9.0*distance(dir,c));
  float disp = detail*0.16 + breathe*0.10 + lumps*0.20;
  vD = disp;
  vec3 displaced = position + normal * disp;
  vec4 wp = modelMatrix * vec4(displaced, 1.0);
  vWP = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const BLOB_FRAG = `
uniform float uTime;
uniform vec3 uColor;
varying vec3 vN; varying vec3 vWP; varying float vD;
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vWP);
  vec3 L = normalize(vec3(0.35, 0.95, 0.3));
  float diff = clamp(dot(N, L), 0.0, 1.0);
  float fres = pow(1.0 - clamp(dot(V, N), 0.0, 1.0), 2.5);
  // subsurface flesh: dark in the crevices, pale on the bulges
  vec3 deep  = vec3(0.42, 0.30, 0.34);
  vec3 flesh = vec3(0.94, 0.88, 0.84);
  vec3 col = mix(deep, flesh, clamp(0.32 + 0.6*diff + vD*1.3, 0.0, 1.0));
  col *= mix(vec3(1.0), uColor, 0.35);              // gentle tint
  // iridescent membrane on the rim
  float hue = fres*3.0 + uTime*0.18;
  vec3 irid = 0.5 + 0.5*cos(6.2831*(vec3(0.0, 0.33, 0.67) + hue));
  col += irid * fres * 0.42;
  col += vec3(0.10) * smoothstep(0.10, 0.40, vD);   // glow on protrusions
  gl_FragColor = vec4(col, 1.0);
}`;

/* ---- raymarched metaball field (Shadertoy MdcSRj port) ----
   Rendered as a fullscreen triangle behind the interior; the tomb becomes a
   living tunnel of merging organic spheres. */
const RAYMARCH_VERT = `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RAYMARCH_FRAG = `
precision highp float;
uniform float uTime;
uniform float uAspect;
uniform float uYaw;
varying vec2 vUv;
const int MAX_STEPS = 90;
const int NUM_SPHERES = 12;
float hash(float n){ return fract(sin(n*43758.5453123)); }
float sphereSDF(vec3 pos, float radius, vec3 smpl){ return length(pos - smpl) - radius; }
float planeSDF(vec3 dir, float offset, vec3 smpl){ return dot(dir, smpl) + offset; }
float dfDist(vec3 smpl){
  float T1 = 10.0; float T2 = 2.0*T1;
  float result = 10000.0;
  smpl.y += sin(smpl.z*0.2 + uTime)*sin(uTime*1.33)
          + sin(smpl.x*0.3 + uTime)*sin(uTime*3.22)
          + sin(smpl.x*0.5 + smpl.z*0.22 + uTime)*sin(uTime*2.22 + smpl.z*0.1);
  float o = floor((smpl.z + T1)/T2);
  smpl.x += o*7.0;
  smpl.xz = mod(smpl.xz + T1, T2) - T1;
  for (int i=0;i<NUM_SPHERES;i++){
    float t = float(i)/float(NUM_SPHERES);
    float n = t + uTime*0.25 + o*0.5;
    vec3 pos = vec3(sin(n*5.0)*5.0, cos(n*3.0)*9.0, cos(n*2.0)*3.0 + 5.0);
    float radius = hash(t*t + 3.1)*2.0 + 1.4;
    result = min(result, sphereSDF(pos, radius, smpl));
  }
  result = min(result, planeSDF(vec3(0,-1,0), 10.0, smpl));
  result = min(result, planeSDF(vec3(0,1,0), 10.0, smpl));
  return result;
}
vec3 dfNormal(vec3 smpl){
  const float E = 0.04;
  float d0 = dfDist(smpl);
  float dX = dfDist(smpl+vec3(E,0,0));
  float dY = dfDist(smpl+vec3(0,E,0));
  float dZ = dfDist(smpl+vec3(0,0,E));
  return normalize(vec3(dX-d0, dY-d0, dZ-d0));
}
float dfOcclusion(vec3 smpl, vec3 normal){ float N=1.0; return clamp(dfDist(smpl+normal*N)/N, 0.0, 1.0); }
float trace(inout vec3 pos, vec3 dir, out vec3 normal){
  int steps = 0;
  for (int i=0;i<MAX_STEPS;i++){
    steps++;
    float d = dfDist(pos);
    pos += d*dir;
    if (d < 0.001) break;
  }
  normal = dfNormal(pos);
  return float(steps)/float(MAX_STEPS);
}
void main(){
  // each wall is a window into the shared field, looking out along its facing
  vec2 uv = vUv - 0.5;
  vec3 opos = vec3(4.5, sin(uTime*0.4)*3.0 + 2.0, -7.0 + uTime*3.0);
  vec3 pos = opos;
  vec3 dir = normalize(vec3(uv.x*uAspect, uv.y, 1.0));
  float cy = cos(uYaw), sy = sin(uYaw);
  dir.xz = mat2(cy, -sy, sy, cy) * dir.xz;     // rotate ray by wall facing
  vec3 normal;
  float steps = trace(pos, dir, normal);
  float occ = dfOcclusion(pos, normal);
  float fogAmt = 1.0 - exp(-distance(opos, pos)*0.01);
  vec3 fogCol = vec3(0.2, 0.14, 0.18);
  vec3 diffuse = vec3(0.4, 0.5, 0.6) * dot(normal, normalize(vec3(1.0, 0.3, -1.0)));
  vec3 ambient = vec3(0.4, 0.2, 0.1);
  vec3 color = (ambient + diffuse) * vec3(1.0 - steps) + pow(1.0 - occ, 1.5) * vec3(1.0, 0.9, 0.8) * 0.8;
  color = mix(color, fogCol, fogAmt);
  color = (1.0 - exp(-color * 1.5)) * 1.3;
  gl_FragColor = vec4(color, 1.0);
}`;

function makeRaymarchWall(w, h, yaw){
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:   { value: 0 },
      uAspect: { value: w / h },
      uYaw:    { value: yaw },
    },
    vertexShader: RAYMARCH_VERT, fragmentShader: RAYMARCH_FRAG,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  return { mesh, mat };
}

function buildOrganicInterior(prim){
  organicBlob = null;
  const g = new THREE.Group();
  const W = 9, D = 9, H = 5;          // 3D room you walk inside
  const walls = [];
  // floor + ceiling (plain, bright) to ground the space
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ color: 0x20201f, roughness: 0.9 }));
  floor.rotation.x = -Math.PI/2; g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ color: 0x16161a, roughness: 1.0 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; g.add(ceil);

  // 4 shader walls — each a window into the metaball field along its facing
  const defs = [
    { w: W, yaw: 0.0,        pos: [0, H/2, -D/2], rotY: 0 },          // front (faces +Z)
    { w: W, yaw: Math.PI,    pos: [0, H/2,  D/2], rotY: Math.PI },    // back  (faces -Z)
    { w: D, yaw: -Math.PI/2, pos: [-W/2, H/2, 0], rotY: Math.PI/2 },  // left  (faces +X)
    { w: D, yaw:  Math.PI/2, pos: [ W/2, H/2, 0], rotY: -Math.PI/2 }, // right (faces -X)
  ];
  defs.forEach(d => {
    const { mesh, mat } = makeRaymarchWall(d.w, H, d.yaw);
    mesh.position.set(d.pos[0], d.pos[1], d.pos[2]);
    mesh.rotation.y = d.rotY;
    g.add(mesh); walls.push(mat);
  });

  // footage floats in the middle of the room
  const src = prim.videos[0] || null;
  const screen = makeScreen(4.4, 2.6, src, prim);
  screen.position.set(0, 1.8, -D/2 + 0.5);
  g.add(screen); interiorScreens.push(screen);

  organicBlob = { walls, raymarch: true };
  interiorBounds = { minX:-W/2+0.6, maxX:W/2-0.6, minZ:-D/2+0.6, maxZ:D/2-0.6 };
  interiorSpawn = { pos: new THREE.Vector3(0, 1.6, D/2 - 1.5), yaw: Math.PI };
  return g;
}

const INTERIOR_BUILDERS = {
  chamber: buildChamberInterior,
  fan: buildFanInterior,
  well: buildWellInterior,
  crypt: buildCryptInterior,
  rack: buildRackInterior,
  organic: buildOrganicInterior,
};

/* ---- shared ambiance: descending light beads + swaying organic tendrils ----
   gives every tomb the "mix of everything" feel: the light-points of the main
   screen + the organic motion of the pendant, in the bright interior. */
let interiorAmbiance = null;
function interiorExtent(){
  const b = interiorBounds || {};
  if (b.ringOuter != null) return { centric:true, r: b.ringOuter, top: 5.0, bottom: -14.0, ceil: 5.0 };
  if (b.circleR != null)   return { centric:true, r: b.circleR,  top: 6.0, bottom: 0.3,  ceil: 6.0 };
  const minX = b.minX ?? -5, maxX = b.maxX ?? 5, minZ = b.minZ ?? -5, maxZ = b.maxZ ?? 5;
  return { centric:false, minX, maxX, minZ, maxZ, top: 4.4, bottom: 0.3, ceil: 4.6 };
}
function ambiancePoint(ext){
  if (ext.centric){
    const a = Math.random()*Math.PI*2, rr = Math.random()*ext.r*0.85;
    return [Math.cos(a)*rr, Math.sin(a)*rr];
  }
  return [ THREE.MathUtils.lerp(ext.minX, ext.maxX, Math.random()),
           THREE.MathUtils.lerp(ext.minZ, ext.maxZ, Math.random()) ];
}
function addInteriorAmbiance(root){
  const ext = interiorExtent();
  const beadTex = makeDotTexture();
  // descending light beads
  const beads = [];
  const N = 22;
  for (let i=0;i<N;i++){
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: beadTex, color: 0xffffff, transparent: true,
      toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    const sc = 0.10 + Math.random()*0.07;
    const [x,z] = ambiancePoint(ext);
    sp.position.set(x, THREE.MathUtils.lerp(ext.bottom, ext.top, Math.random()), z);
    sp.scale.set(sc, sc, 1);
    sp.userData = { baseScale: sc, speed: 0.35 + Math.random()*0.6, phase: Math.random()*Math.PI*2 };
    root.add(sp);
    beads.push(sp);
  }
  // swaying organic tendrils hanging from the ceiling
  const tendrils = [];
  const tMat = new THREE.MeshStandardMaterial({ color: 0xd6d4cc, roughness: 0.85 });
  const NT = ext.centric ? 5 : 4;
  for (let i=0;i<NT;i++){
    const pivot = new THREE.Group();
    const [x,z] = ambiancePoint(ext);
    pivot.position.set(x, ext.ceil, z);
    const len = 1.4 + Math.random()*1.6;
    const seed = i*1.7;
    const pts = [];
    const SEG = 8;
    for (let s=0;s<=SEG;s++){
      const t = s/SEG;
      const w = Math.sin(t*Math.PI*2 + seed)*0.18*t;
      pts.push(new THREE.Vector3(w, -t*len, Math.cos(t*Math.PI*1.6+seed)*0.18*t));
    }
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.035, 5, false), tMat
    );
    pivot.add(tube);
    pivot.userData = { seed, amp: 0.06 + Math.random()*0.05, speed: 0.4 + Math.random()*0.4 };
    root.add(pivot);
    tendrils.push(pivot);
  }
  interiorAmbiance = { beads, tendrils, ext };
}

/* ---- FPS state ---- */
const fps = {
  yaw: Math.PI, pitch: 0,
  speed: 3.4, run: 6.6,
  sens: 0.0022,
  muted: false,
};
const fpsKeys = {};

function clampInterior(pos){
  const b = interiorBounds; if (!b) return;
  if (b.circleR != null){
    const d = Math.hypot(pos.x, pos.z);
    if (d > b.circleR){ const s = b.circleR / d; pos.x *= s; pos.z *= s; }
  } else if (b.ringInner != null){
    const d = Math.hypot(pos.x, pos.z);
    if (d < b.ringInner){ const s = b.ringInner / d; pos.x *= s; pos.z *= s; }
    if (d > b.ringOuter){ const s = b.ringOuter / d; pos.x *= s; pos.z *= s; }
  } else {
    pos.x = THREE.MathUtils.clamp(pos.x, b.minX, b.maxX);
    pos.z = THREE.MathUtils.clamp(pos.z, b.minZ, b.maxZ);
  }
}

let pendingInteriorIdx = -1;   // node waiting for the click-to-enter gesture

function prepareInterior(idx){
  const prim = PRIMS[idx];
  disposeInterior();
  const builder = INTERIOR_BUILDERS[prim.interior] || buildChamberInterior;
  interiorScreens = [];
  interiorRoot = builder(prim);
  if (prim.interior !== "organic") addInteriorAmbiance(interiorRoot);  // shader field stands alone
  interiorScene.add(interiorRoot);
  // place camera at spawn, turned 180° so it faces the screen (not the wall)
  fps.yaw = interiorSpawn.yaw + Math.PI; fps.pitch = 0;
  camera.position.copy(interiorSpawn.pos);
  applyFpsLook();
  // HUD text
  ihudTitle.textContent = prim.title;
  ihudMeta.textContent = prim.meta;
  lockKicker.textContent = prim.tag;
  lockTitle.textContent = prim.videos.length ? prim.title : prim.title + " — no footage yet";
  lockBody.textContent = prim.videos.length
    ? "Step inside. Mouse to look, WASD or arrows to walk through the footage of mourning held in this tomb."
    : "This tomb is built but its footage is still being recovered from the archive. You may still walk the empty chamber.";
}

function enterInterior(idx){
  if (idx == null || idx < 0) idx = camState.focusIdx;
  pendingInteriorIdx = idx;
  camState.mode = "interior";
  document.body.classList.add("interior");
  // widen FOV for first-person
  camera.fov = 72; camera.updateProjectionMatrix();
  prepareInterior(idx);
  // show the click-to-enter gate (pointer lock requires a user gesture)
  showLockGate(true);
  crosshairEl.classList.add("hidden");
  interiorHud.classList.add("hidden");
  // hide exterior fan overlay
  if (fanOverlayOn){ fanCtx.clearRect(0,0,fanRaysCanvas.width,fanRaysCanvas.height); fanRaysCanvas.classList.add("hidden"); fanOverlayOn = false; }
}

function showLockGate(show){
  lockOverlay.classList.toggle("hidden", !show);
}

function requestLock(){
  showLockGate(false);
  crosshairEl.classList.remove("hidden");
  interiorHud.classList.remove("hidden");
  canvas.requestPointerLock?.();
  // play + unmute (this runs from a click gesture)
  interiorScreens.forEach(s => {
    const ve = s.userData.vEntry;
    if (ve){ ve.el.muted = fps.muted; ve.el.play().catch(()=>{}); if (s.userData.screenLight) s.userData.screenLight.intensity = 1.4; }
  });
}

function exitInterior(){
  // stop videos
  interiorScreens.forEach(s => { const ve = s.userData.vEntry; if (ve){ ve.el.pause(); } });
  if (document.pointerLockElement) document.exitPointerLock?.();
  showLockGate(false);
  crosshairEl.classList.add("hidden");
  interiorHud.classList.add("hidden");
  document.body.classList.remove("interior");
  disposeInterior();
  pendingInteriorIdx = -1;
  // restore exterior camera + FOV, return to focused on this node
  camera.fov = 38; camera.updateProjectionMatrix();
  const idx = camState.focusIdx;
  camState.mode = "focused";
  focusNode(idx, { smooth: false, openInfo: false });
}

function applyFpsLook(){
  fps.pitch = THREE.MathUtils.clamp(fps.pitch, -Math.PI/2 + 0.05, Math.PI/2 - 0.05);
  const e = new THREE.Euler(fps.pitch, fps.yaw, 0, "YXZ");
  camera.quaternion.setFromEuler(e);
}

/* pointer lock listeners */
document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === canvas;
  if (camState.mode !== "interior") return;
  if (!locked){
    // user pressed Esc or lost lock → show the gate (paused)
    showLockGate(true);
    crosshairEl.classList.add("hidden");
  }
});
document.addEventListener("mousemove", (e) => {
  if (camState.mode !== "interior") return;
  if (document.pointerLockElement !== canvas) return;
  fps.yaw   -= e.movementX * fps.sens;
  fps.pitch -= e.movementY * fps.sens;
  applyFpsLook();
});

/* lock-gate buttons */
lockResume.addEventListener("click", (e) => { e.stopPropagation(); requestLock(); });
lockExit.addEventListener("click", (e) => { e.stopPropagation(); exitInterior(); });

/* enter button (focused mode) */
enterBtn.addEventListener("click", () => enterInterior(camState.focusIdx));

/* ---------------- INPUT ---------------- */
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  const k = e.key;

  /* ---- INTERIOR mode owns the keyboard ---- */
  if (camState.mode === "interior"){
    fpsKeys[k.toLowerCase()] = true;
    if (k === "Escape"){
      const locked = document.pointerLockElement === canvas;
      if (locked){
        // browser will release the pointer; pointerlockchange raises the gate
      } else if (!lockOverlay.classList.contains("hidden")){
        exitInterior();                 // gate already up → leave the tomb
      } else {
        showLockGate(true);             // not locked, no gate → offer resume/leave
        crosshairEl.classList.add("hidden");
      }
      return;
    }
    if (k.toLowerCase() === "m"){
      fps.muted = !fps.muted;
      interiorScreens.forEach(s => { const ve = s.userData.vEntry; if (ve) ve.el.muted = fps.muted; });
    }
    if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k.toLowerCase())) e.preventDefault();
    return;
  }

  /* ---- EXTERIOR (overview / focused) ---- */
  if (k === "ArrowRight"){ focusNode(camState.focusIdx + 1, {openInfo:false}); flashKey("k-right"); e.preventDefault(); }
  else if (k === "ArrowLeft"){ focusNode(camState.focusIdx - 1, {openInfo:false}); flashKey("k-left"); e.preventDefault(); }
  else if (k === "ArrowUp"){ // zoom in (dolly closer)
    camState.desiredPos.z = Math.max(2.5, camState.desiredPos.z - 1.0);
    flashKey("k-up"); e.preventDefault();
  } else if (k === "ArrowDown"){
    camState.desiredPos.z = Math.min(16, camState.desiredPos.z + 1.0);
    flashKey("k-down"); e.preventDefault();
  } else if (k === "Escape"){
    if (camState.mode === "focused") goOverview();
    else panel.classList.add("hidden");
  }
  else if (k === "Enter"){ // Enter steps INTO the focused tomb
    if (camState.mode === "focused") enterInterior(camState.focusIdx);
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
  fpsKeys[e.key.toLowerCase()] = false;
});

function flashKey(cls){
  const el = document.querySelector("." + cls);
  if (!el) return;
  el.classList.add("hot");
  setTimeout(()=> el.classList.remove("hot"), 120);
}

/* mouse raycast click */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
canvas.addEventListener("click", (e) => {
  // interior: clicking the canvas (re)locks the pointer
  if (camState.mode === "interior"){
    if (!lockOverlay.classList.contains("hidden")) requestLock();
    else if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(nodeMeshes, false);
  spawnRipple(e.clientX, e.clientY);
  cursorEl.classList.add("click");
  setTimeout(() => cursorEl.classList.remove("click"), 400);
  if (hits.length){
    const idx = hits[0].object.userData.idx;
    // clicking the already-focused tomb steps inside
    if (camState.mode === "focused" && idx === camState.focusIdx){
      enterInterior(idx);
    } else {
      focusNode(idx, {openInfo:true});
    }
  }
});

/* drag-rotate orbit-ish (around current focus) */
let drag = null;
let orbit = { yaw: 0, pitch: 0 };
canvas.addEventListener("pointerdown", (e) => {
  if (camState.mode === "interior") return;   // pointer lock owns the mouse inside
  drag = { x: e.clientX, y: e.clientY, yaw: orbit.yaw, pitch: orbit.pitch };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag || camState.mode === "interior") return;
  orbit.yaw   = drag.yaw   + (e.clientX - drag.x) * 0.005;
  orbit.pitch = THREE.MathUtils.clamp(drag.pitch + (e.clientY - drag.y) * 0.003, -0.3, 0.6);
});
canvas.addEventListener("pointerup", () => drag = null);

canvas.addEventListener("wheel", (e) => {
  if (camState.mode === "interior") return;
  e.preventDefault();
  camState.desiredPos.z = THREE.MathUtils.clamp(
    camState.desiredPos.z + e.deltaY * 0.005, 2.5, 20
  );
}, { passive: false });

/* ---------------- LOOP ---------------- */
const tmpV = new THREE.Vector3();
function tick(){
  // free-fly
  if (camState.freeFly){
    const speed = 0.25;
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    if (keys["w"]) camera.position.addScaledVector(fwd, speed);
    if (keys["s"]) camera.position.addScaledVector(fwd, -speed);
    if (keys["a"]) camera.position.addScaledVector(right, -speed);
    if (keys["d"]) camera.position.addScaledVector(right,  speed);
    if (keys["q"]) camera.position.y -= speed;
    if (keys["e"]) camera.position.y += speed;
    camera.lookAt(camState.target);
  } else {
    // smooth follow desired pos, with orbit offset around target
    const p = PRIMS[camState.focusIdx];
    const base = new THREE.Vector3(p.x, camState.desiredPos.y, camState.desiredPos.z);
    // orbit yaw rotates base around target on Y
    const offset = base.clone().sub(camState.target);
    offset.applyAxisAngle(new THREE.Vector3(0,1,0), orbit.yaw);
    offset.y = THREE.MathUtils.lerp(offset.y, offset.y + orbit.pitch * 4, 1);
    tmpV.copy(camState.target).add(offset);
    camera.position.lerp(tmpV, 0.08);
    camera.lookAt(camState.target);
  }
  // pulse hot ring under focused node
  highlightFocused();

  coordEl.textContent = `[${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}]`;
  composer.render();
  requestAnimationFrame(tick);
}

/* highlight ring */
const ringMat = new THREE.MeshBasicMaterial({
  color: 0x2a6dff, transparent: true, opacity: 0.95,
  toneMapped: false
});
const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.7, 96), ringMat);
ring.rotation.x = -Math.PI/2;
ring.position.y = 0.02;
scene.add(ring);
// soft inner glow disc
const glowMat = new THREE.MeshBasicMaterial({
  color: 0x4a8aff, transparent: true, opacity: 0.35, toneMapped: false
});
const glow = new THREE.Mesh(new THREE.CircleGeometry(2.0, 64), glowMat);
glow.rotation.x = -Math.PI/2;
glow.position.y = 0.015;
scene.add(glow);
let ringPulse = 0;
function highlightFocused(){
  const visible = camState.mode === "focused";
  ring.visible = visible; glow.visible = visible;
  if (!visible) return;
  const p = PRIMS[camState.focusIdx];
  ring.position.x = THREE.MathUtils.lerp(ring.position.x, p.x, 0.15);
  glow.position.x = ring.position.x;
  ringPulse += 0.024;
  const s = 1 + Math.sin(ringPulse) * 0.08;
  ring.scale.setScalar(s);
  glow.scale.setScalar(s * 1.05);
  ringMat.opacity = 0.7 + Math.sin(ringPulse)*0.25;
  glowMat.opacity = 0.28 + Math.sin(ringPulse)*0.12;
}

/* ---------------- CLOCK ---------------- */
function tickClock(){
  const d = new Date();
  const pad = n => String(n).padStart(2,"0");
  clockEl.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
tickClock(); setInterval(tickClock, 1000);

/* ---------------- BOOT ---------------- */
/* ---------------- PARAMS WIRING ---------------- */
function applyParams(){
  if (bloomPass){
    bloomPass.strength  = PARAMS.bloomStrength;
    bloomPass.radius    = PARAMS.bloomRadius;
    bloomPass.threshold = PARAMS.bloomThreshold;
  }
  scene.fog.near = PARAMS.fogNear;
  scene.fog.far  = PARAMS.fogNear + 110;
  const hsl = new THREE.Color();
  hsl.setHSL((PARAMS.ringHue % 360)/360, 1.0, 0.5);
  ringMat.color.copy(hsl);
  const hsl2 = new THREE.Color();
  hsl2.setHSL((PARAMS.ringHue % 360)/360, 0.95, 0.6);
  glowMat.color.copy(hsl2);
}
paramsBody.querySelectorAll("input[type=range]").forEach(inp => {
  inp.addEventListener("input", () => {
    const k = inp.dataset.k;
    PARAMS[k] = parseFloat(inp.value);
    const vEl = paramsBody.querySelector(`[data-v="${k}"]`);
    if (vEl) vEl.textContent = (+inp.value).toFixed(inp.step.includes(".") ? 2 : 0);
    applyParams();
  });
});
paramsBody.querySelectorAll("button[data-act]").forEach(btn => {
  btn.addEventListener("click", () => {
    const act = btn.dataset.act;
    if (act === "reset"){
      for (const k in DEFAULTS) PARAMS[k] = DEFAULTS[k];
      paramsBody.querySelectorAll("input[type=range]").forEach(inp => {
        inp.value = PARAMS[inp.dataset.k];
        inp.dispatchEvent(new Event("input"));
      });
      PARAMS.autoOrbit = false;
    } else if (act === "orbit"){
      PARAMS.autoOrbit = !PARAMS.autoOrbit;
      btn.style.background = PARAMS.autoOrbit ? "var(--acid)" : "";
      btn.style.color = PARAMS.autoOrbit ? "var(--paper)" : "";
    } else if (act === "randomize"){
      paramsBody.querySelectorAll("input[type=range]").forEach(inp => {
        const min = parseFloat(inp.min), max = parseFloat(inp.max);
        inp.value = (min + Math.random()*(max-min)).toFixed(2);
        inp.dispatchEvent(new Event("input"));
      });
    }
  });
});
// reflect initial AUTO-ORBIT state in button styling
{
  const orbitBtn = paramsBody.querySelector('button[data-act="orbit"]');
  if (orbitBtn && PARAMS.autoOrbit){
    orbitBtn.style.background = "var(--acid)";
    orbitBtn.style.color = "var(--paper)";
  }
}
paramsToggle.addEventListener("click", () => {
  paramsEl.classList.toggle("collapsed");
  paramsToggle.textContent = paramsEl.classList.contains("collapsed") ? "+" : "−";
});

/* ---------------- CURSOR FOLLOW ---------------- */
const cursorPos = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener("pointermove", (e) => {
  cursorPos.tx = e.clientX;
  cursorPos.ty = e.clientY;
});

/* hover detection */
let hoverIdx = -1;
function updateHover(){
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(nodeMeshes, false);
  const newHover = hits.length ? hits[0].object.userData.idx : -1;
  if (newHover !== hoverIdx){
    hoverIdx = newHover;
    cursorEl.classList.toggle("hot", hoverIdx >= 0);
  }
}
canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
});

function spawnRipple(x, y){
  const r = document.createElement("div");
  r.className = "ripple";
  const vp = document.getElementById("viewport").getBoundingClientRect();
  r.style.left = `${x - vp.left}px`;
  r.style.top  = `${y - vp.top}px`;
  ripplesEl.appendChild(r);
  setTimeout(() => r.remove(), 700);
}

/* ---------------- IDLE ANIMATION HOOK ---------------- */
let animT = 0;
function animateNodes(dt){
  animT += dt;
  nodesGroup.children.forEach((g, i) => {
    const phase = i * 0.7;
    g.position.y = Math.sin(animT * 1.4 + phase) * PARAMS.idleFloat;
    const k = PRIMS[i].kind;
    const inner = g.userData.inner;
    const ud = inner && inner.userData;

    // gentle yaw wobble for round forms
    if ((k === "sphere" || k === "dome" || k === "mesh") && inner){
      inner.rotation.y = Math.sin(animT * 0.4 + phase) * PARAMS.idleSpin * 0.18
                       + animT * PARAMS.idleSpin * 0.05;
    }
    // subtle organic breathing for the still forms (preserve NODE_SCALE)
    if (inner && (k==="datastack"||k==="ziggurat"||k==="dataspires"||k==="box"||k==="mesh"||k==="dome"||k==="chiparray"||k==="columns")){
      const bx = NODE_SCALE * (1 + Math.sin(animT*0.8 + phase + 1.0) * 0.018);
      const by = NODE_SCALE * (1 + Math.sin(animT*0.95 + phase) * 0.026);
      inner.scale.set(bx, by, bx);
    }
    // windfarm blade rotation
    if (k === "windfarm" && ud && ud.blades){
      ud.blades.forEach((bg, bi) => {
        bg.rotation.z = animT * (0.8 + bi * 0.15) * (1 + PARAMS.idleSpin);
      });
    }
    // PENDANT — breathing body + swaying organic roots
    if (k === "pendant" && ud && ud.body){
      ud.body.scale.y = 1 + Math.sin(animT * 1.05 + phase) * 0.055;
      ud.body.scale.x = 1 + Math.sin(animT * 0.9 + phase + 1.0) * 0.03;
      ud.body.rotation.z = Math.sin(animT * 0.5 + phase) * 0.045;
      ud.rootPivots.forEach((pv) => {
        const u = pv.userData;
        pv.rotation.z = Math.sin(animT * u.swaySpeed + u.seed) * u.swayAmp;
        pv.rotation.x = Math.cos(animT * u.swaySpeed * 0.8 + u.seed) * u.swayAmp;
        pv.scale.y = 1 + Math.sin(animT * 0.7 + u.seed) * 0.06;
      });
    }
    // WELL — beads of light descending into the shaft
    if (k === "well" && ud && ud.orbs){
      ud.orbs.forEach((sp) => {
        const u = sp.userData;
        sp.position.y -= u.speed * dt;
        if (sp.position.y < u.bottomY){
          u.ang = Math.random()*Math.PI*2;
          u.rad = Math.random() * ud.wellR * 0.7;
          sp.position.set(Math.cos(u.ang)*u.rad, u.topY + Math.random()*1.2, Math.sin(u.ang)*u.rad);
          u.speed = 0.5 + Math.random()*0.7;
        }
        const tw = 0.6 + 0.4*Math.sin(animT*3 + u.ang*5);
        sp.material.opacity = 0.5 + tw*0.5;
        const sc = u.baseScale * (0.8 + tw*0.4);
        sp.scale.set(sc, sc, 1);
      });
    }
    // RACK — vertical conveyor: trays empty from the middle, re-stack on top
    if (k === "rack" && ud && ud.trayUnits){
      const drift = 0.55;
      ud.trayUnits.forEach((unit) => {
        let o = (unit.userData.phase0 + animT * drift) % ud.range;
        if (o < 0) o += ud.range;
        unit.position.y = ud.yBottom + o;
        // subtle pop-out as they ride up
        unit.position.z = Math.sin(o * 4.0 + unit.userData.phase0) * 0.05 * ud.rackD;
        // fade in at the bottom, out at the very top to hide the wrap
        const tNorm = o / ud.range;
        const edgeFade = Math.min(1, Math.min(tNorm, 1 - tNorm) * 12);
        unit.children.forEach(ch => {
          if (ch.material){
            ch.material.transparent = true;
            ch.material.opacity = edgeFade;
          }
        });
      });
    }
    // focus bounce
    if (bounceState.idx === i && bounceState.t < 1){
      bounceState.t = Math.min(1, bounceState.t + dt * 2.4);
      const b = PARAMS.focusBounce;
      // ease-out elastic-ish
      const s = 1 + b * Math.sin(bounceState.t * Math.PI * 2.5) * (1 - bounceState.t);
      g.scale.setScalar(s);
    } else if (bounceState.idx !== i){
      g.scale.x = THREE.MathUtils.lerp(g.scale.x, 1, 0.12);
      g.scale.y = g.scale.x; g.scale.z = g.scale.x;
    }
  });
}

/* ---- interior FPS update (movement + collision) ---- */
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _dbSize = new THREE.Vector2();
function updateInterior(dt){
  // only move while the pointer is locked (i.e. the gate is closed)
  const active = document.pointerLockElement === canvas;
  if (active){
    const sp = (fpsKeys["shift"] ? fps.run : fps.speed) * dt;
    // horizontal forward from camera orientation (flatten pitch)
    camera.getWorldDirection(_fwd);
    _fwd.y = 0;
    if (_fwd.lengthSq() < 1e-6) _fwd.set(Math.sin(fps.yaw), 0, -Math.cos(fps.yaw));
    _fwd.normalize();
    _right.crossVectors(_fwd, camera.up).normalize();
    const move = new THREE.Vector3();
    if (fpsKeys["w"] || fpsKeys["arrowup"])    move.add(_fwd);
    if (fpsKeys["s"] || fpsKeys["arrowdown"])  move.sub(_fwd);
    if (fpsKeys["d"] || fpsKeys["arrowright"]) move.add(_right);
    if (fpsKeys["a"] || fpsKeys["arrowleft"])  move.sub(_right);
    if (move.lengthSq() > 0){
      move.normalize().multiplyScalar(sp);
      camera.position.x += move.x;
      camera.position.z += move.z;
      clampInterior(camera.position);
    }
    camera.position.y = 1.6;   // eye height locked to floor
  }
}

/* ---- FAN exterior reactive rays (2D overlay converging on the node) ---- */
let fanAnchors = null;
const _fanProj = new THREE.Vector3();
function fanPerimeter(t, w, h){
  const p = ((t % 1) + 1) % 1 * 4;
  if (p < 1) return [p * w, 0];
  if (p < 2) return [w, (p - 1) * h];
  if (p < 3) return [(3 - p) * w, h];
  return [0, (4 - p) * h];
}
function drawFanRays(node, time){
  const w = fanRaysCanvas.width, h = fanRaysCanvas.height;
  fanCtx.clearRect(0, 0, w, h);
  _fanProj.set(node.x, 1.4, 0).project(camera);
  if (_fanProj.z > 1) return;                 // behind camera
  const cx = (_fanProj.x * 0.5 + 0.5) * w;
  const cy = (-_fanProj.y * 0.5 + 0.5) * h;
  if (!fanAnchors){
    fanAnchors = [];
    const N = 24;
    for (let i = 0; i < N; i++)
      fanAnchors.push({ t: i / N, jitter: Math.random() * Math.PI * 2, amp: 6 + Math.random() * 22 });
  }
  const mx = cursorPos.x, my = cursorPos.y;
  fanCtx.lineWidth = 1;
  fanAnchors.forEach((a, i) => {
    let [px, py] = fanPerimeter(a.t + Math.sin(time * 0.06 + a.jitter) * 0.012, w, h);
    px += Math.sin(time * 0.8 + a.jitter) * a.amp;
    py += Math.cos(time * 0.7 + a.jitter) * a.amp;
    // reactive: lean the rays toward the cursor
    px += (mx - px) * 0.05;
    py += (my - py) * 0.05;
    const flick = 0.3 + 0.35 * Math.sin(time * 1.7 + i * 0.6);
    fanCtx.strokeStyle = `rgba(22,22,30,${0.10 + flick * 0.20})`;
    fanCtx.beginPath();
    fanCtx.moveTo(px, py);
    fanCtx.lineTo(cx, cy);
    fanCtx.stroke();
  });
  // bright electric-blue convergence point
  const r = 3 + 1.5 * Math.sin(time * 3);
  fanCtx.fillStyle = "rgba(0,85,255,0.55)";
  fanCtx.beginPath(); fanCtx.arc(cx, cy, Math.max(1.5, r), 0, Math.PI * 2); fanCtx.fill();
}
let fanOverlayOn = false;
function updateFanOverlay(){
  const show = camState.mode === "focused" && PRIMS[camState.focusIdx].kind === "fan";
  if (show){
    if (!fanOverlayOn){ fanRaysCanvas.classList.remove("hidden"); fanOverlayOn = true; }
    drawFanRays(nodesGroup.children[camState.focusIdx], performance.now() * 0.001);
  } else if (fanOverlayOn){
    fanCtx.clearRect(0, 0, fanRaysCanvas.width, fanRaysCanvas.height);
    fanRaysCanvas.classList.add("hidden");
    fanOverlayOn = false;
  }
}

/* override tick loop with dt + animations + auto-orbit */
let lastTS = performance.now();
function tick2(ts){
  const dt = Math.min(0.05, (ts - lastTS) / 1000);
  lastTS = ts;

  /* ---- INTERIOR mode: FPS walk + render interior scene ---- */
  if (camState.mode === "interior"){
    updateInterior(dt);
    updateInteriorFx(dt);
    interiorKey.intensity = 0.85 + Math.sin(ts*0.0012)*0.08;
    renderer.autoClear = true;
    if (interiorComposer) interiorComposer.render();
    else renderer.render(interiorScene, camera);
    requestAnimationFrame(tick2);
    return;
  }

  if (PARAMS.autoOrbit && camState.mode === "focused"){
    orbit.yaw += dt * 0.21;
  }

  // free-fly
  if (camState.freeFly){
    const speed = 0.25;
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    if (keys["w"]) camera.position.addScaledVector(fwd, speed);
    if (keys["s"]) camera.position.addScaledVector(fwd, -speed);
    if (keys["a"]) camera.position.addScaledVector(right, -speed);
    if (keys["d"]) camera.position.addScaledVector(right,  speed);
    if (keys["q"]) camera.position.y -= speed;
    if (keys["e"]) camera.position.y += speed;
    camera.lookAt(camState.target);
  } else if (camState.mode === "focused"){
    const p = PRIMS[camState.focusIdx];
    const base = new THREE.Vector3(p.x, camState.desiredPos.y, camState.desiredPos.z);
    const offset = base.clone().sub(camState.target);
    offset.applyAxisAngle(new THREE.Vector3(0,1,0), orbit.yaw);
    offset.y += orbit.pitch * 4;
    tmpV.copy(camState.target).add(offset);
    camera.position.lerp(tmpV, PARAMS.camEase);
    camera.lookAt(camState.target);
  } else {
    // overview: gentle drift, framing all nodes
    const driftX = Math.sin(animT * 0.12) * 3.0;
    const driftY = Math.sin(animT * 0.18) * 0.4;
    tmpV.set(
      camState.desiredPos.x + driftX,
      camState.desiredPos.y + driftY,
      camState.desiredPos.z
    );
    camera.position.lerp(tmpV, PARAMS.camEase);
    camera.lookAt(camState.target);
  }

  animateNodes(dt);
  // dot trail — unidirectional flow + subtle twinkle
  const FLOW_SPEED = 1.6;
  dotEntries.forEach((s) => {
    const u = s.userData;
    const rel = (u.offset + animT * FLOW_SPEED) % DOT_SPAN;
    s.position.x = DOT_X_START + (rel < 0 ? rel + DOT_SPAN : rel);
    const twinkle = 0.55 + 0.45 * Math.sin(animT * 1.2 + u.phase);
    s.material.opacity = 0.45 + twinkle * 0.45;
    const sc = u.baseScale * (0.85 + twinkle * 0.25);
    s.scale.set(sc, sc, 1);
  });
  highlightFocused();
  updateHover();
  updateFanOverlay();

  // cursor lerp
  cursorPos.x += (cursorPos.tx - cursorPos.x) * 0.35;
  cursorPos.y += (cursorPos.ty - cursorPos.y) * 0.35;
  cursorEl.style.transform = `translate(${cursorPos.x}px, ${cursorPos.y}px)`;

  coordEl.textContent = `[${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}]`;

  // sync label sprite Y with each node's idle bobbing
  labelEntries.forEach(({ sprite, nodeIdx, baseY }) => {
    const node = nodesGroup.children[nodeIdx];
    sprite.position.y = baseY + node.position.y;
  });

  composer.render();
  // overlay labels without bloom
  renderer.autoClear = false;
  renderer.clearDepth();
  renderer.render(labelScene, camera);
  renderer.autoClear = true;
  requestAnimationFrame(tick2);
}

/* replace original tick */
// (the original `tick` reference is no longer scheduled; tick2 takes over)

setupPost();
resize();
applyParams();
goOverview();
camera.position.copy(OVERVIEW_CAM).add(new THREE.Vector3(0, 6, 8));
requestAnimationFrame(tick2);
