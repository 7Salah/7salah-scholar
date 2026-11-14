// game/tests/rig.test.ts
import test from "node:test";
import assert from "node:assert/strict";

// game/src/avatar-rig.ts
function canonicalBone(name) {
  let n = String(name || "");
  n = n.replace(/^.*[|:]/, "");
  n = n.replace(/^(mixamorig\d*|cc_base_|bip\d*\s*|bip001\s*)/i, "");
  n = n.toLowerCase().replace(/[^a-z0-9]/g, "");
  n = n.replace(/^l(?=(upper|fore|arm|hand|leg|up|lo|thigh|calf|foot|toe|shoulder|clavicle))/, "left").replace(/^r(?=(upper|fore|arm|hand|leg|up|lo|thigh|calf|foot|toe|shoulder|clavicle))/, "right");
  n = n.replace(/upperarm|upparm/g, "arm").replace(/forearm|lowerarm|lowarm/g, "forearm").replace(/upperleg|upleg|thigh/g, "leg").replace(/lowerleg|lowleg|calf|shin/g, "shin");
  return n;
}
var CLIP_PATTERNS = [
  ["run", /run|sprint|jog/i],
  ["walk", /walk|stroll/i],
  ["jump", /jump|hop|leap/i],
  ["talk", /talk|speak|chat|gesture|explain|wave/i],
  ["idle", /idle|stand|breath|rest|pose/i]
];
function classifyClip(name) {
  const short = String(name || "").replace(/^.*[|:]/, "");
  for (const [state, re] of CLIP_PATTERNS) if (re.test(short)) return state;
  return null;
}
function pickClips(groups) {
  const out = {};
  for (const g of groups) {
    const s = classifyClip(g.name);
    if (s && !out[s]) out[s] = g;
  }
  if (!Object.keys(out).length && groups.length === 1) out.idle = groups[0];
  return out;
}
function resolveState(wanted, available) {
  const chain = {
    run: ["run", "walk", "idle"],
    walk: ["walk", "idle"],
    jump: ["jump", "idle"],
    talk: ["talk", "idle"],
    idle: ["idle"]
  };
  return chain[wanted].find((s) => available[s]) ?? null;
}
function frameState(moving, running, grounded, talking = false) {
  if (!grounded) return "jump";
  if (moving) return running ? "run" : "walk";
  return talking ? "talk" : "idle";
}
function computeFit(minY, maxY, holderWorldY, targetHeight) {
  const h = maxY - minY;
  if (!Number.isFinite(h) || h <= 0.01) return null;
  const scale = targetHeight / h;
  return { scale, offsetY: -(minY - holderWorldY) * scale };
}
var BUDGETS = {
  low: { maxTriangles: 4e4, maxTextureSize: 2048 },
  medium: { maxTriangles: 7e4, maxTextureSize: 2048 },
  high: { maxTriangles: 12e4, maxTextureSize: 4096 }
};
function withinBudget(tris, maxTex, q) {
  const b = BUDGETS[q];
  if (tris > b.maxTriangles) return `triangles ${tris} > ${b.maxTriangles}`;
  if (maxTex > b.maxTextureSize) return `texture ${maxTex}px > ${b.maxTextureSize}px`;
  return null;
}

// game/src/avatar-manifest.ts
var isRel = (u) => typeof u === "string" && /^[\w./-]+\.glb$/i.test(u) && !u.startsWith("/") && !u.includes("..");
function parseManifest(raw) {
  const list = raw?.models;
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const m of list) {
    if (!m || typeof m !== "object") continue;
    const r = m;
    if (r.safetyReviewed !== true) continue;
    if (typeof r.id !== "string" || !/^[a-z0-9-]{1,40}$/.test(r.id)) continue;
    if (!isRel(r.url)) continue;
    if (r.animationsUrl !== void 0 && !isRel(r.animationsUrl)) continue;
    const height = typeof r.height === "number" && r.height >= 1 && r.height <= 2.6 ? r.height : 1.85;
    const yaw = typeof r.yaw === "number" && Math.abs(r.yaw) <= Math.PI * 2 ? r.yaw : 0;
    out.push({
      id: r.id,
      name: typeof r.name === "string" ? r.name.slice(0, 40) : r.id,
      url: r.url,
      animationsUrl: r.animationsUrl,
      height,
      yaw,
      safetyReviewed: true
    });
  }
  return out;
}

// game/tests/rig.test.ts
test("canonicalBone unifies common rig naming", () => {
  const arm = ["mixamorig:LeftArm", "mixamorig9LeftArm", "Armature|LeftArm", "LeftUpperArm", "CC_Base_L_Upperarm", "Bip01 L UpperArm"];
  const keys = new Set(arm.map(canonicalBone));
  assert.equal(keys.size, 1, [...keys].join(","));
  assert.notEqual(canonicalBone("mixamorig:RightArm"), canonicalBone("mixamorig:LeftArm"));
  assert.equal(canonicalBone("mixamorig:LeftUpLeg"), canonicalBone("LeftThigh"));
});
test("classifyClip", () => {
  assert.equal(classifyClip("Armature|Walking"), "walk");
  assert.equal(classifyClip("Run_Fast"), "run");
  assert.equal(classifyClip("mixamo.com"), null);
  assert.equal(classifyClip("Idle_01"), "idle");
  assert.equal(classifyClip("Jump"), "jump");
  assert.equal(classifyClip("Talking_2"), "talk");
});
test("pickClips + resolveState fallback chain", () => {
  const p = pickClips([{ name: "Idle" }, { name: "Walk" }]);
  assert.equal(resolveState("run", p), "walk");
  assert.equal(resolveState("jump", p), "idle");
  assert.equal(resolveState("talk", p), "idle");
  assert.equal(resolveState("idle", {}), null);
  assert.equal(pickClips([{ name: "mixamo.com" }]).idle?.name, "mixamo.com");
});
test("frameState priorities", () => {
  assert.equal(frameState(true, true, false), "jump");
  assert.equal(frameState(true, true, true), "run");
  assert.equal(frameState(true, false, true), "walk");
  assert.equal(frameState(false, false, true), "idle");
  assert.equal(frameState(false, false, true, true), "talk");
});
test("computeFit puts feet on ground and scales to height", () => {
  const f = computeFit(0.5, 2.5, 0, 1.8);
  assert.ok(Math.abs(f.scale - 0.9) < 1e-9);
  assert.ok(Math.abs(f.offsetY - -0.45) < 1e-9);
  assert.equal(computeFit(1, 1, 0, 1.8), null);
  assert.equal(computeFit(NaN, 2, 0, 1.8), null);
});
test("budgets", () => {
  assert.equal(withinBudget(3e4, 2048, "low"), null);
  assert.match(withinBudget(5e4, 1024, "low"), /triangles/);
  assert.match(withinBudget(1e3, 4096, "medium"), /texture/);
  assert.equal(withinBudget(1e5, 4096, "high"), null);
});
test("manifest accepts only reviewed same-origin .glb entries", () => {
  const ok = { id: "a-1", name: "A", url: "a.glb", safetyReviewed: true };
  const bad = [
    { ...ok, safetyReviewed: false },
    { ...ok, safetyReviewed: void 0 },
    { ...ok, url: "https://x.com/a.glb" },
    { ...ok, url: "/a.glb" },
    { ...ok, url: "../a.glb" },
    { ...ok, url: "a.exe" },
    { ...ok, id: "Bad Id" },
    { ...ok, animationsUrl: "http://evil/x.glb" },
    null,
    5
  ];
  const r = parseManifest({ models: [ok, ...bad] });
  assert.equal(r.length, 1);
  assert.equal(r[0].height, 1.85);
  assert.deepEqual(parseManifest(null), []);
  assert.deepEqual(parseManifest({ models: "x" }), []);
  assert.equal(parseManifest({ models: [{ ...ok, height: 9 }] })[0].height, 1.85);
});
