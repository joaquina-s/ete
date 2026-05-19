/* ETE // PROTOCOL.LANDSCAPE.v0 — 3D
   three.js scene of geometric primitives along a baseline.
   Arrow keys traverse nodes; WASD free-fly; click to decode.
*/

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/* ---------------- DATA ---------------- */
const PRIMS = [
  { id:"01", kind:"dome",       title:"PRIMITIVE.DOME",
    meta:"01 / Eternal Terra Ear · containment",
    body:"A hemispheric memory chamber. Stores visceral data agency. Externally smooth, internally hyperbolic: more room inside than the surface suggests.",
    tag:"∎ MEMORY" },
  { id:"02", kind:"fan",        title:"RELATIONAL.FAN",
    meta:"02 / hyperbolic relational geometry",
    body:"Sun-rayed analytic of relations. Each line is a tie between distributed nodes. The fan refuses centralized vantage — every ray is a periphery.",
    tag:"∎ RELATION" },
  { id:"03", kind:"datastack",  title:"DIGITAL.STACK",
    meta:"03 / the layers · EuroStack critique",
    body:"Vertical strata of the computational order. Top crust: data & AI. Middle: software, cloud, IoT, networks, chips. Base: critical resources, raw materials, energy, water.",
    tag:"∎ STACK" },
  { id:"04", kind:"rack",       title:"GOVERNANCE.RACK",
    meta:"04 / server-rack governance / CN·CO·IR·AR",
    body:"A vertical stack of 8 trays. Each tray a jurisdiction, each LED a quarterly report. Decentralized in topology, suspiciously centralized in chassis.",
    tag:"∎ GOVERN" },
  { id:"05", kind:"mesh",       title:"RELATIONAL.MESH",
    meta:"05 / triangulated tie analytic",
    body:"A polygonal canopy of relations. Every vertex is a node, every edge a contract. The mesh decides who is connected to whom by refusing to centralize the question.",
    tag:"∎ MESH" },
  { id:"06", kind:"well",       title:"EXTRACTION.WELL",
    meta:"06 / inverted dome · subterranean intake",
    body:"A negative dome. The protocol opens downward. Contour rings descend toward a single dark dot. Where the surface ends, accountability begins.",
    tag:"∎ WELL" },
  { id:"07", kind:"dataspires", title:"NETWORK.SPIRES",
    meta:"07 / signal verticals",
    body:"A bundle of thin towers. Each one is a route. The taller, the slower. Approved by carriers, deployed in courtyards, paid for by everyone except the carriers.",
    tag:"∎ NET" },
  { id:"08", kind:"ziggurat",   title:"OCEAN.ZIGGURAT",
    meta:"08 / stepped protocol · UN Ocean Decade 2025",
    body:"A terraced stack of receding plateaus. Each step is a treaty, each treaty narrower than the last. Crowned by an obelisk that listens to the sea.",
    tag:"∎ OCEAN" },
  { id:"09", kind:"pendant",    title:"PENDANT.PROTOCOL",
    meta:"09 / hanging strata · root memory",
    body:"A stalactite of stacked rings descending from the rail. Each segment narrower than the last. The protocol learns by hanging from itself.",
    tag:"∎ PENDANT" },
  { id:"10", kind:"windfarm",   title:"RESOURCE.FARM",
    meta:"10 / critical resources · raw materials, energy, water",
    body:"Turbines, posts, masts. The lowest layer of the stack and the loudest. Lithium, cobalt, copper, rare earths. Wind, sun, rivers. The price tag is somewhere else.",
    tag:"∎ RES" },
  { id:"11", kind:"box",        title:"DEPOT.PROTOCOL",
    meta:"11 / archival container",
    body:"A box. A protocol depot. Contains everything the landscape has decided not to display. Open on appointment.",
    tag:"∎ DEPOT" },
  { id:"12", kind:"fan",        title:"TERMINAL.FAN",
    meta:"12 / end of index — eternal terra ear",
    body:"Closing radial. The ear of the land listens. The protocol does not end; it loops back to PRIMITIVE.DOME at the next traverse.",
    tag:"∎ LOOP" },
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
function setupPost(){
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(1,1), 0.28, 0.7, 0.55);
  bloomPass.threshold = PARAMS.bloomThreshold;
  bloomPass.strength = PARAMS.bloomStrength;
  bloomPass.radius = PARAMS.bloomRadius;
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
}

function resize(){
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  if (composer) composer.setSize(w, h);
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

/* pendant / stalactite — hangs down from rail */
function buildPendant(p){
  const g = new THREE.Group();
  const segsBase = [
    { h: 0.4, r: 0.55, color: 0xdedcd6 },
    { h: 0.35, r: 0.42, color: 0xd2d2cd },
    { h: 0.5,  r: 0.3,  color: 0xc6c6c0 },
    { h: 0.6,  r: 0.16, color: 0xbab9b4 },
  ];
  const SUBDIV = 3;
  const GAP = 0.012;
  // For each segment, subdivide into 3 sub-cylinders with linear radius taper
  const segs = segsBase.flatMap((s, idx) => {
    const nextR = segsBase[idx+1] ? segsBase[idx+1].r : s.r * 0.78;
    const subH = (s.h - (SUBDIV-1)*GAP) / SUBDIV;
    return Array.from({length: SUBDIV}, (_, k) => {
      const t0 = k / SUBDIV;
      const t1 = (k+1) / SUBDIV;
      return {
        h: subH,
        rTop: s.r * (1-t0) + nextR * t0,
        rBot: s.r * (1-t1) + nextR * t1,
        color: s.color,
        firstOfBase: k === 0
      };
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
    g.add(mesh);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 25),
      new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.55 })
    );
    edges.position.copy(mesh.position);
    g.add(edges);
    y -= s.h;
  });
  // tip dot
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), matInk);
  tip.position.y = y - 0.05;
  g.add(tip);
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
  // trays
  for (let i=0;i<trays;i++){
    const y = 0.25 + i*(trayH+gap) + trayH/2 + 0.05;
    const trayGeo = new THREE.BoxGeometry(w-0.12, trayH, d-0.12);
    const tray = new THREE.Mesh(trayGeo, new THREE.MeshPhysicalMaterial({
      color: 0xe6e6e3, roughness: 0.3, clearcoat: 0.5
    }));
    tray.position.y = y;
    tray.castShadow = true; tray.receiveShadow = true;
    g.add(tray);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(trayGeo, 25),
      new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.5 })
    );
    edges.position.copy(tray.position);
    g.add(edges);
    // status LEDs on right side
    for (let l=0;l<3;l++){
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.03, 0.03),
        matInk
      );
      led.position.set(w/2 - 0.12 - l*0.1, y, d/2 - 0.08);
      g.add(led);
    }
  }
  // top cap
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(w+0.06, 0.06, d+0.06),
    new THREE.MeshPhysicalMaterial({ color: 0xc8c8c5, roughness: 0.4 })
  );
  cap.position.y = 0.25 + totalH + 0.03;
  cap.castShadow = true;
  g.add(cap);
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

/* ---------------- INPUT ---------------- */
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  const k = e.key;
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
  else if (k === "Enter" || k === " "){ openPanel(PRIMS[camState.focusIdx]); }
  // wasd toggles free fly
  if (["w","a","s","d","q","e"].includes(e.key.toLowerCase())) camState.freeFly = true;
});
window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

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
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(nodeMeshes, false);
  spawnRipple(e.clientX, e.clientY);
  cursorEl.classList.add("click");
  setTimeout(() => cursorEl.classList.remove("click"), 400);
  if (hits.length){
    focusNode(hits[0].object.userData.idx, {openInfo:true});
  }
});

/* drag-rotate orbit-ish (around current focus) */
let drag = null;
let orbit = { yaw: 0, pitch: 0 };
canvas.addEventListener("pointerdown", (e) => {
  drag = { x: e.clientX, y: e.clientY, yaw: orbit.yaw, pitch: orbit.pitch };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag) return;
  orbit.yaw   = drag.yaw   + (e.clientX - drag.x) * 0.005;
  orbit.pitch = THREE.MathUtils.clamp(drag.pitch + (e.clientY - drag.y) * 0.003, -0.3, 0.6);
});
canvas.addEventListener("pointerup", () => drag = null);

canvas.addEventListener("wheel", (e) => {
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
    // gentle yaw wobble — only meshes above the ground tag
    const k = PRIMS[i].kind;
    g.children.forEach(child => {
      if (child.geometry && child.geometry.type !== "PlaneGeometry"){
        if (k === "sphere" || k === "dome" || k === "mesh"){
          child.rotation.y = Math.sin(animT * 0.4 + phase) * PARAMS.idleSpin * 0.3
                           + animT * PARAMS.idleSpin * 0.06;
        }
      }
    });
    // windfarm blade rotation
    if (k === "windfarm" && g.userData.blades){
      g.userData.blades.forEach((bg, bi) => {
        bg.rotation.z = animT * (0.8 + bi * 0.15) * (1 + PARAMS.idleSpin);
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

/* override tick loop with dt + animations + auto-orbit */
let lastTS = performance.now();
function tick2(ts){
  const dt = Math.min(0.05, (ts - lastTS) / 1000);
  lastTS = ts;

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
