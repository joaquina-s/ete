/* ETE // PROTOCOL.LANDSCAPE.v0
   Geometric landscape inspired by ete.institute themes:
   decentralized memory, hyperbolic relational geometry,
   counter-extractive primitives, visceral data agency.
*/

const stage = document.getElementById("stage");
const panel = document.getElementById("panel");
const panelId = document.getElementById("panel-id");
const panelTitle = document.getElementById("panel-title");
const panelMeta = document.getElementById("panel-meta");
const panelBody = document.getElementById("panel-body");
const panelTag  = document.getElementById("panel-tag");
const panelClose = document.getElementById("panel-close");
const coordEl = document.getElementById("coord");
const zoomEl  = document.getElementById("zoom");
const clockEl = document.getElementById("clock");

const SVG_NS = "http://www.w3.org/2000/svg";

/* viewbox state */
const VB = { x: 0, y: 0, w: 2400, h: 900, baseW: 2400, baseH: 900 };
function applyVB(){
  stage.setAttribute("viewBox", `${VB.x} ${VB.y} ${VB.w} ${VB.h}`);
  coordEl.textContent = `[${VB.x.toFixed(2).padStart(7,"0")} , ${VB.y.toFixed(2).padStart(7,"0")}]`;
  zoomEl.textContent = `${(VB.baseW / VB.w).toFixed(2)}x`;
}

/* ---------- PRIMITIVES DATA ----------
   Each primitive is a station along the protocol landscape.
   "kind" controls geometry. Order = horizontal sequence.
*/
const PRIMS = [
  { id:"01", kind:"dome",    title:"PRIMITIVE.DOME",
    meta:"01 / Eternal Terra Ear · containment",
    body:"A hemispheric memory chamber. Stores visceral data agency. Externally smooth, internally hyperbolic: more room inside than the surface suggests.",
    tag:"∎ MEMORY" },
  { id:"02", kind:"fan",     title:"RELATIONAL.FAN",
    meta:"02 / hyperbolic relational geometry",
    body:"Sun-rayed analytic of relations. Each line is a tie between distributed nodes. The fan refuses centralized vantage — every ray is a periphery.",
    tag:"∎ RELATION" },
  { id:"03", kind:"columns", title:"INFRASTRUCTURE.COMB",
    meta:"03 / dept. of computational critique",
    body:"Rows of vertical lines: rendered as decorative columns, parsed as a critique of extractive infrastructure. Counts the cost of every tower it draws.",
    tag:"∎ INFRA" },
  { id:"04", kind:"sphere",  title:"GOVERNANCE.SPHERE",
    meta:"04 / women-led governance / CN·CO·IR·AR",
    body:"A satellite of decentralized governance. Polished, rendered in white plastic. The black dot at its meridian is the only accountable pixel.",
    tag:"∎ GOVERN" },
  { id:"05", kind:"fan",     title:"POST.HUMANITARIAN.FAN",
    meta:"05 / system decoding",
    body:"Second fan, denser rays. A post-humanitarian protocol diagram: aid as a vector field, decoded by the people it was supposed to reach.",
    tag:"∎ DECODE" },
  { id:"06", kind:"dot",     title:"PUNCTUM.NULL",
    meta:"06 / index null",
    body:"An ungoverned point. Refuses to be a node. The landscape recognizes it precisely because it is not on the protocol.",
    tag:"∎ NULL" },
  { id:"07", kind:"fan",     title:"BERLIN.FAN.2025",
    meta:"07 / Berlin Science Week",
    body:"Public-facing pavilion. Wide-angle radial. Approved by committee, deployed in the courtyard, dismantled by tuesday.",
    tag:"∎ EVENT" },
  { id:"08", kind:"sphere",  title:"OCEAN.NODE",
    meta:"08 / UN Ocean Decade 2025",
    body:"Submerged sphere of the protocol. Salt water as a router. The pixel at the equator is a small audible click.",
    tag:"∎ OCEAN" },
  { id:"09", kind:"dot",     title:"PUNCTUM.AAbS",
    meta:"09 / Agile Aesthetics Beyond Stacks",
    body:"A method that fits in a single dot. Beyond stacks: no inheritance, no scaffolding, no hierarchy. Just this point, agile.",
    tag:"∎ AAbS" },
  { id:"10", kind:"sphere",  title:"PRIMITIVE.WHITE",
    meta:"10 / surveillance counter-surface",
    body:"Mirror-finish sphere. Reflects only itself. Useful for hiding from extractive surveillance, useless for being seen.",
    tag:"∎ COUNTER" },
  { id:"11", kind:"box",     title:"DEPOT.PROTOCOL",
    meta:"11 / archival container",
    body:"A box. A protocol depot. Contains everything the landscape has decided not to display. Open on appointment.",
    tag:"∎ DEPOT" },
  { id:"12", kind:"fan",     title:"TERMINAL.FAN",
    meta:"12 / end of index — eternal terra ear",
    body:"Closing radial. The ear of the land listens. The protocol does not end; it loops back to PRIMITIVE.DOME at the next traverse.",
    tag:"∎ LOOP" },
];

/* ---------- LAYOUT ----------
   Place primitives along baseline (y = 430).
*/
const BASELINE_Y = 430;
const START_X = 120;
const SPACING = 180;
PRIMS.forEach((p, i) => {
  p.x = START_X + i * SPACING;
  p.y = BASELINE_Y;
});
const LAST_X = PRIMS[PRIMS.length-1].x + 200;

/* ---------- RENDER ---------- */
function el(tag, attrs={}, parent){
  const n = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

/* defs / gradients */
const defs = el("defs", {}, stage);
const grad = el("radialGradient", { id:"sphereGrad", cx:"35%", cy:"30%", r:"75%" }, defs);
el("stop", { offset:"0%",  "stop-color":"#ffffff" }, grad);
el("stop", { offset:"55%", "stop-color":"#f1f1ec" }, grad);
el("stop", { offset:"100%","stop-color":"#cfcec8" }, grad);

/* grid ticks under baseline */
const ticks = el("g", { class:"ticks" }, stage);
for (let x = 0; x < LAST_X + 200; x += 30){
  el("line", {
    x1:x, y1:BASELINE_Y, x2:x, y2:BASELINE_Y+5,
    class:"tick"
  }, ticks);
}

/* baseline */
el("line", {
  x1: 0, y1: BASELINE_Y, x2: LAST_X + 200, y2: BASELINE_Y,
  class:"baseline"
}, stage);

/* update viewbox extent so we can pan to the right end */
const SCENE_W = LAST_X + 240;
VB.baseW = SCENE_W;
VB.w = Math.min(2400, SCENE_W);

/* per-primitive renderers */
function renderDome(g, p){
  const r = 95;
  el("path", {
    d:`M ${p.x-r} ${p.y} A ${r} ${r} 0 0 1 ${p.x+r} ${p.y} Z`,
    class:"dome"
  }, g);
  // inner contour lines (hyperbolic interior hint)
  for (let i=1;i<8;i++){
    const rr = r * (1 - i*0.11);
    el("path", {
      d:`M ${p.x-rr} ${p.y} A ${rr} ${rr*0.95} 0 0 1 ${p.x+rr} ${p.y}`,
      fill:"none", stroke:"#dedcd4", "stroke-width":0.4
    }, g);
  }
  el("rect", { x:p.x-r-4, y:p.y-r-4, width:r*2+8, height:r+8, class:"hit" }, g);
}

function renderFan(g, p){
  const r = 95;
  const rays = 36;
  for (let i=0;i<=rays;i++){
    const t = i/rays;
    const ang = Math.PI + Math.PI*t; // lower half fan
    const x2 = p.x + Math.cos(ang)*r;
    const y2 = p.y - Math.sin(ang)*r;  // sin negative -> below baseline (since y grows down, use +)
    // we want fan BELOW baseline (like the reference): flip
    const y2b = p.y + Math.abs(Math.sin(ang))*r;
    el("line", {
      x1:p.x, y1:p.y, x2:x2, y2:y2b, class:"fan-line"
    }, g);
  }
  // top arc
  el("path", {
    d:`M ${p.x-r} ${p.y} A ${r} ${r*0.95} 0 0 0 ${p.x+r} ${p.y}`,
    fill:"none", stroke:"#bdbcb6", "stroke-width":0.5
  }, g);
  el("rect", { x:p.x-r-4, y:p.y-4, width:r*2+8, height:r+10, class:"hit" }, g);
}

function renderColumns(g, p){
  const w = 150, h = 70;
  // top slab
  el("rect", { x:p.x-w/2, y:p.y-h, width:w, height:8, class:"column" }, g);
  // vertical columns hanging below baseline
  const cols = 26;
  for (let i=0;i<cols;i++){
    const cx = p.x - w/2 + (i+0.5)*(w/cols);
    el("line", {
      x1:cx, y1:p.y, x2:cx, y2:p.y+ h*0.7 + (i%3)*4,
      stroke:"#9a9a93", "stroke-width":0.5
    }, g);
  }
  el("rect", { x:p.x-w/2-4, y:p.y-h-4, width:w+8, height:h*1.7+12, class:"hit" }, g);
}

function renderSphere(g, p){
  const r = 22;
  el("circle", { cx:p.x, cy:p.y-r, r:r, class:"sphere" }, g);
  // accountable pixel
  el("circle", { cx:p.x+r*0.55, cy:p.y-r*0.9, r:1.6, class:"dot" }, g);
  el("rect", { x:p.x-r-4, y:p.y-r*2-4, width:r*2+8, height:r*2+8, class:"hit" }, g);
}

function renderDot(g, p){
  el("circle", { cx:p.x, cy:p.y-6, r:3.2, class:"dot" }, g);
  el("rect", { x:p.x-10, y:p.y-16, width:20, height:20, class:"hit" }, g);
}

function renderBox(g, p){
  const w = 110, h = 60;
  el("rect", { x:p.x-w/2, y:p.y-h, width:w, height:h, class:"column" }, g);
  // hatching below baseline (like reference)
  for (let i=0;i<10;i++){
    el("line", {
      x1:p.x-w/2+8, y1:p.y+ i*4+4, x2:p.x+w/2-8, y2:p.y+ i*4+4,
      stroke:"#bdbcb6", "stroke-width":0.5
    }, g);
  }
  el("rect", { x:p.x-w/2-4, y:p.y-h-4, width:w+8, height:h+50, class:"hit" }, g);
}

const RENDERERS = {
  dome: renderDome,
  fan: renderFan,
  columns: renderColumns,
  sphere: renderSphere,
  dot: renderDot,
  box: renderBox,
};

/* draw */
const layer = el("g", { id:"primitives" }, stage);
PRIMS.forEach(p => {
  const g = el("g", { class:"prim", "data-id": p.id }, layer);
  RENDERERS[p.kind](g, p);
  // id + label
  el("text", { x:p.x, y:p.y+24, "text-anchor":"middle", class:"id" }, g).textContent = `${p.id}·${p.kind.toUpperCase()}`;
  el("text", { x:p.x, y:p.y+38, "text-anchor":"middle", class:"label" }, g).textContent = p.title.split(".").join(" · ");
  g.addEventListener("click", (e) => { e.stopPropagation(); openPanel(p, g); });
});

/* ---------- INTERACTION ---------- */
let activeEl = null;
function openPanel(p, g){
  if (activeEl) activeEl.classList.remove("active");
  if (g){ g.classList.add("active"); activeEl = g; }
  panelId.textContent = `${p.id} / ${p.kind}`;
  panelTitle.textContent = p.title;
  panelMeta.textContent = p.meta;
  panelBody.textContent = p.body;
  panelTag.textContent = p.tag;
  panel.classList.remove("hidden");
}
panelClose.addEventListener("click", () => {
  panel.classList.add("hidden");
  if (activeEl) activeEl.classList.remove("active");
  activeEl = null;
});

/* arrow nav: pan viewbox + cycle focused primitive */
let focusIdx = -1;
function focusPrimitive(i){
  focusIdx = (i + PRIMS.length) % PRIMS.length;
  const p = PRIMS[focusIdx];
  // center viewbox on primitive
  const targetX = p.x - VB.w/2;
  const maxX = SCENE_W - VB.w;
  VB.x = Math.max(0, Math.min(maxX, targetX));
  applyVB();
  const g = layer.querySelector(`.prim[data-id="${p.id}"]`);
  openPanel(p, g);
}

const PAN_STEP = 80;
const ZOOM_STEP = 0.85;
window.addEventListener("keydown", (e) => {
  const k = e.key;
  if (k === "ArrowRight"){
    if (e.shiftKey) focusPrimitive(focusIdx + 1);
    else { VB.x = Math.min(SCENE_W - VB.w, VB.x + PAN_STEP); applyVB(); }
    flashKey("k-right");
  } else if (k === "ArrowLeft"){
    if (e.shiftKey) focusPrimitive(focusIdx - 1);
    else { VB.x = Math.max(0, VB.x - PAN_STEP); applyVB(); }
    flashKey("k-left");
  } else if (k === "ArrowUp"){
    // zoom in
    const cx = VB.x + VB.w/2, cy = VB.y + VB.h/2;
    VB.w *= ZOOM_STEP; VB.h *= ZOOM_STEP;
    VB.w = Math.max(400, VB.w); VB.h = Math.max(150, VB.h);
    VB.x = Math.max(0, Math.min(SCENE_W - VB.w, cx - VB.w/2));
    VB.y = cy - VB.h/2;
    applyVB();
    flashKey("k-up");
  } else if (k === "ArrowDown"){
    const cx = VB.x + VB.w/2, cy = VB.y + VB.h/2;
    VB.w /= ZOOM_STEP; VB.h /= ZOOM_STEP;
    VB.w = Math.min(SCENE_W, VB.w); VB.h = Math.min(VB.baseH*2, VB.h);
    VB.x = Math.max(0, Math.min(SCENE_W - VB.w, cx - VB.w/2));
    VB.y = cy - VB.h/2;
    applyVB();
    flashKey("k-down");
  } else if (k === "Enter" || k === " "){
    if (focusIdx === -1) focusPrimitive(0);
    else focusPrimitive(focusIdx);
  } else if (k === "Escape"){
    panel.classList.add("hidden");
    if (activeEl) activeEl.classList.remove("active");
    activeEl = null;
  }
});
function flashKey(cls){
  const el = document.querySelector("." + cls);
  if (!el) return;
  el.classList.add("hot");
  setTimeout(()=> el.classList.remove("hot"), 120);
}

/* drag-pan with mouse / touch */
let drag = null;
stage.addEventListener("pointerdown", (e) => {
  drag = { sx: e.clientX, sy: e.clientY, vx: VB.x, vy: VB.y };
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const rect = stage.getBoundingClientRect();
  const sx = (e.clientX - drag.sx) * (VB.w / rect.width);
  const sy = (e.clientY - drag.sy) * (VB.h / rect.height);
  VB.x = Math.max(0, Math.min(SCENE_W - VB.w, drag.vx - sx));
  VB.y = drag.vy - sy;
  applyVB();
});
stage.addEventListener("pointerup", () => drag = null);
stage.addEventListener("pointercancel", () => drag = null);

/* wheel zoom */
stage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const dir = e.deltaY < 0 ? ZOOM_STEP : 1/ZOOM_STEP;
  const cx = VB.x + VB.w/2, cy = VB.y + VB.h/2;
  VB.w *= dir; VB.h *= dir;
  VB.w = Math.max(400, Math.min(SCENE_W, VB.w));
  VB.h = Math.max(150, Math.min(VB.baseH*2, VB.h));
  VB.x = Math.max(0, Math.min(SCENE_W - VB.w, cx - VB.w/2));
  VB.y = cy - VB.h/2;
  applyVB();
}, { passive:false });

/* click on empty stage closes panel */
stage.addEventListener("click", () => {
  // only when click didn't reach a primitive (handled by stopPropagation)
  // small UX nicety: do nothing here to avoid surprise closes
});

/* clock */
function tickClock(){
  const d = new Date();
  const pad = n => String(n).padStart(2,"0");
  clockEl.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
tickClock();
setInterval(tickClock, 1000);

applyVB();
