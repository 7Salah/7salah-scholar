import test from "node:test";
import assert from "node:assert/strict";
import { createGlbController } from "../src/avatar-glb";
import type { ContainerLike, GlbOps, GroupLike, HolderLike, AvatarStatus } from "../src/avatar-glb";
import type { AvatarModel } from "../src/avatar-manifest";

const model: AvatarModel = { id: "m", name: "M", url: "m.glb", height: 1.8, yaw: 0, safetyReviewed: true };

function group(name: string, log: string[]): GroupLike {
  return { name, start: () => log.push(`start:${name}`), stop: () => log.push(`stop:${name}`), dispose: () => log.push(`dispose:${name}`) };
}
function container(o: { tris?: number; tex?: number; meshes?: number; groups?: GroupLike[]; log?: string[] } = {}): ContainerLike & { disposed: number; added: number } {
  const n = o.meshes ?? 1;
  const c = {
    disposed: 0, added: 0,
    meshes: Array.from({ length: n }, (_, i) => ({
      name: `mesh${i}`, isPickable: true, checkCollisions: true, alwaysSelectAsActiveMesh: false,
      getTotalIndices: () => (o.tris ?? 3000) * 3, maxTextureSize: () => o.tex ?? 1024
    })),
    animationGroups: o.groups ?? [],
    addAllToScene() { c.added++; }, dispose() { c.disposed++; }
  };
  return c;
}
function holder() {
  const h = { rotationY: 0, scale: 1, offsetY: 0, enabled: false, setEnabled(v: boolean) { h.enabled = v; } };
  return h as HolderLike & { enabled: boolean };
}
function setup(over: Partial<GlbOps> = {}, quality: "low" | "medium" | "high" = "low") {
  const statuses: AvatarStatus[] = [];
  const h = holder();
  const ops: GlbOps = {
    load: async () => container(), mount: () => ({ minY: 0, maxY: 1.8, holderWorldY: 0 }), retarget: () => [], ...over
  };
  const ctl = createGlbController({ ops, holder: h, quality: () => quality, onStatus: (s) => statuses.push(s), timeoutMs: 50 });
  return { ctl, h, statuses };
}
const kinds = (s: AvatarStatus[]) => s.map((x) => x.kind);

test("success: mounts, fits, hides nothing else, reports clips", async () => {
  const log: string[] = [];
  const c = container({ groups: [group("Idle", log), group("Walk", log), group("Run", log)], log });
  const { ctl, h, statuses } = setup({ load: async () => c, mount: () => ({ minY: 0.2, maxY: 2.2, holderWorldY: 0 }) });
  assert.equal(await ctl.setModel(model), true);
  assert.equal(c.added, 1);
  assert.ok(Math.abs(h.scale - 0.9) < 1e-9);
  assert.equal(h.rotationY, Math.PI);
  assert.equal(h.enabled, true);
  assert.ok(c.meshes.every((m) => !m.isPickable && !m.checkCollisions && m.alwaysSelectAsActiveMesh));
  assert.deepEqual(kinds(statuses), ["loading", "ready"]);
  assert.deepEqual((statuses[1] as { clips: string[] }).clips.sort(), ["idle", "run", "walk"]);
});
test("load error -> fallback, holder disabled, no throw", async () => {
  const { ctl, h, statuses } = setup({ load: async () => { throw new Error("404"); } });
  assert.equal(await ctl.setModel(model), false);
  assert.equal(ctl.active, false); assert.equal(h.enabled, false);
  assert.deepEqual(statuses.at(-1), { kind: "fallback", id: "m", reason: "404" });
});
test("timeout -> fallback", async () => {
  const { ctl, statuses } = setup({ load: () => new Promise(() => {}) });
  assert.equal(await ctl.setModel(model), false);
  assert.equal((statuses.at(-1) as { reason: string }).reason, "timeout");
});
test("over budget -> fallback and container disposed", async () => {
  const c = container({ tris: 60000 });
  const { ctl, statuses } = setup({ load: async () => c }, "low");
  assert.equal(await ctl.setModel(model), false);
  assert.equal(c.disposed, 1); assert.equal(c.added, 0);
  assert.match((statuses.at(-1) as { reason: string }).reason, /budget: triangles/);
});
test("same model passes on a higher quality tier", async () => {
  const { ctl } = setup({ load: async () => container({ tris: 60000 }) }, "medium");
  assert.equal(await ctl.setModel(model), true);
});
test("no meshes and bad bounds -> fallback", async () => {
  let r = setup({ load: async () => container({ meshes: 0 }) });
  assert.equal(await r.ctl.setModel(model), false);
  r = setup({ mount: () => ({ minY: 1, maxY: 1, holderWorldY: 0 }) });
  assert.equal(await r.ctl.setModel(model), false);
  assert.equal((r.statuses.at(-1) as { reason: string }).reason, "invalid-bounds");
});
test("superseded request disposes stale container and keeps latest", async () => {
  const stale = container(); const fresh = container();
  let release!: () => void;
  const gate = new Promise<void>((r) => { release = r; });
  let n = 0;
  const { ctl } = setup({ load: async () => { if (n++ === 0) { await gate; return stale; } return fresh; } });
  const first = ctl.setModel(model);
  const second = ctl.setModel({ ...model, id: "m2" });
  assert.equal(await second, true);
  release();
  assert.equal(await first, false);
  assert.equal(stale.disposed, 1); assert.equal(stale.added, 0);
  assert.equal(fresh.disposed, 0); assert.equal(ctl.active, true);
});
test("dispose during load discards result", async () => {
  const c = container(); let release!: () => void;
  const gate = new Promise<void>((r) => { release = r; });
  const { ctl } = setup({ load: async () => { await gate; return c; } });
  const p = ctl.setModel(model); ctl.dispose(); release();
  assert.equal(await p, false); assert.equal(c.disposed, 1); assert.equal(ctl.active, false);
});
test("setModel(null) returns to procedural", async () => {
  const { ctl, h, statuses } = setup();
  await ctl.setModel(model);
  await ctl.setModel(null);
  assert.equal(h.enabled, false); assert.equal(h.scale, 1);
  assert.equal(statuses.at(-1)!.kind, "procedural");
});
test("update switches clips with fallback and stops previous", async () => {
  const log: string[] = [];
  const c = container({ groups: [group("Idle", log), group("Walk", log)], log });
  const { ctl } = setup({ load: async () => c });
  await ctl.setModel(model); log.length = 0;
  ctl.update("idle"); ctl.update("idle"); ctl.update("run"); ctl.update("walk"); ctl.update("jump");
  assert.deepEqual(log, ["start:Idle", "stop:Idle", "start:Walk", "stop:Walk", "start:Idle"]);
});
test("external clips retargeted; external load failure still succeeds", async () => {
  const log: string[] = [];
  const ext = container({ log });
  const calls: string[] = [];
  let r = setup({
    load: async (u) => (u === "a.glb" ? ext : container()),
    retarget: () => { calls.push("rt"); return [group("Run", log)]; }
  });
  assert.equal(await r.ctl.setModel({ ...model, animationsUrl: "a.glb" }), true);
  assert.deepEqual(calls, ["rt"]); assert.equal(ext.disposed, 1);
  assert.ok((r.statuses.at(-1) as { clips: string[] }).clips.includes("run"));
  r = setup({ load: async (u) => { if (u === "a.glb") throw new Error("x"); return container(); } });
  assert.equal(await r.ctl.setModel({ ...model, animationsUrl: "a.glb" }), true);
});
test("status listener exceptions never break loading", async () => {
  const h = holder();
  const ctl = createGlbController({
    ops: { load: async () => container(), mount: () => ({ minY: 0, maxY: 1.8, holderWorldY: 0 }), retarget: () => [] },
    holder: h, quality: () => "low", onStatus: () => { throw new Error("ui"); }
  });
  assert.equal(await ctl.setModel(model), true);
});
