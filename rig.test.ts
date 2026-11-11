import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBone, classifyClip, pickClips, resolveState, frameState, computeFit, withinBudget } from "../src/avatar-rig";
import { parseManifest } from "../src/avatar-manifest";

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
  const f = computeFit(0.5, 2.5, 0, 1.8)!;           // 2 units tall, feet 0.5 above holder
  assert.ok(Math.abs(f.scale - 0.9) < 1e-9);
  assert.ok(Math.abs(f.offsetY - -0.45) < 1e-9);
  assert.equal(computeFit(1, 1, 0, 1.8), null);
  assert.equal(computeFit(NaN, 2, 0, 1.8), null);
});
test("budgets", () => {
  assert.equal(withinBudget(30000, 2048, "low"), null);
  assert.match(withinBudget(50000, 1024, "low")!, /triangles/);
  assert.match(withinBudget(1000, 4096, "medium")!, /texture/);
  assert.equal(withinBudget(100000, 4096, "high"), null);
});
test("manifest accepts only reviewed same-origin .glb entries", () => {
  const ok = { id: "a-1", name: "A", url: "a.glb", safetyReviewed: true };
  const bad = [
    { ...ok, safetyReviewed: false }, { ...ok, safetyReviewed: undefined }, { ...ok, url: "https://x.com/a.glb" },
    { ...ok, url: "/a.glb" }, { ...ok, url: "../a.glb" }, { ...ok, url: "a.exe" }, { ...ok, id: "Bad Id" },
    { ...ok, animationsUrl: "http://evil/x.glb" }, null, 5
  ];
  const r = parseManifest({ models: [ok, ...bad] });
  assert.equal(r.length, 1);
  assert.equal(r[0]!.height, 1.85);
  assert.deepEqual(parseManifest(null), []);
  assert.deepEqual(parseManifest({ models: "x" }), []);
  assert.equal(parseManifest({ models: [{ ...ok, height: 9 }] })[0]!.height, 1.85);
});
