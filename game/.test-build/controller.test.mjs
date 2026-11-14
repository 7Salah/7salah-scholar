// game/tests/controller.test.ts
import test from "node:test";
import assert from "node:assert/strict";

// game/src/avatar-rig.ts
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

// game/src/avatar-glb.ts
function createGlbController(opts) {
  const { ops, holder: holder2 } = opts;
  let token = 0;
  let current = null;
  let playing = null;
  const status = (s) => {
    try {
      opts.onStatus?.(s);
    } catch {
    }
  };
  const unload = () => {
    if (!current) return;
    try {
      current.extra.forEach((g) => g.dispose());
      current.container.dispose();
    } catch {
    }
    current = null;
    playing = null;
    holder2.scale = 1;
    holder2.offsetY = 0;
    holder2.setEnabled(false);
  };
  const fail = (id, reason, c) => {
    try {
      c?.dispose();
    } catch {
    }
    unload();
    status({ kind: "fallback", id, reason });
  };
  const withTimeout = (p, ms) => new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      res(v);
    }, (e) => {
      clearTimeout(t);
      rej(e);
    });
  });
  async function setModel(model2) {
    const my = ++token;
    unload();
    if (!model2) {
      status({ kind: "procedural" });
      return false;
    }
    status({ kind: "loading", id: model2.id });
    let container2 = null;
    try {
      const ms = opts.timeoutMs ?? 2e4;
      container2 = await withTimeout(ops.load(model2.url), ms);
      if (my !== token) {
        container2.dispose();
        return false;
      }
      if (!container2.meshes.length) return fail(model2.id, "no-meshes", container2), false;
      const tris = container2.meshes.reduce((n, m) => n + Math.floor(m.getTotalIndices() / 3), 0);
      const tex = container2.meshes.reduce((n, m) => Math.max(n, m.maxTextureSize()), 0);
      const over = withinBudget(tris, tex, opts.quality());
      if (over) return fail(model2.id, `budget: ${over}`, container2), false;
      let external = null;
      if (model2.animationsUrl) {
        try {
          external = await withTimeout(ops.load(model2.animationsUrl), ms);
        } catch {
          external = null;
        }
        if (my !== token) {
          external?.dispose();
          container2.dispose();
          return false;
        }
      }
      container2.addAllToScene();
      const bounds = ops.mount(container2);
      const fit = computeFit(bounds.minY, bounds.maxY, bounds.holderWorldY, model2.height);
      if (!fit) return fail(model2.id, "invalid-bounds", container2), false;
      holder2.scale = fit.scale;
      holder2.offsetY = fit.offsetY;
      holder2.rotationY = Math.PI + model2.yaw;
      container2.meshes.forEach((m) => {
        m.isPickable = false;
        m.checkCollisions = false;
        m.alwaysSelectAsActiveMesh = true;
      });
      const own = container2.animationGroups;
      const extra = external ? ops.retarget(external, container2) : [];
      external?.dispose();
      own.forEach((g) => g.stop());
      const picked = { ...pickClips(extra), ...pickClips(own) };
      for (const g of [...own, ...extra]) {
        g.enableBlending = true;
        g.blendingSpeed = 0.08;
      }
      current = { container: container2, extra, clips: picked };
      holder2.setEnabled(true);
      opts.onMeshes?.(container2.meshes);
      status({ kind: "ready", id: model2.id, clips: Object.keys(picked) });
      return true;
    } catch (e) {
      if (my !== token) {
        try {
          container2?.dispose();
        } catch {
        }
        return false;
      }
      fail(model2.id, e instanceof Error ? e.message : "load-error", container2 ?? void 0);
      return false;
    }
  }
  return {
    setModel,
    get active() {
      return !!current;
    },
    update(state) {
      if (!current) return;
      const s = resolveState(state, current.clips);
      if (s === playing) return;
      if (playing) current.clips[playing]?.stop();
      playing = s;
      if (s) current.clips[s].start(s !== "jump", s === "run" ? 1 : 1);
    },
    dispose() {
      token++;
      unload();
    }
  };
}

// game/tests/controller.test.ts
var model = { id: "m", name: "M", url: "m.glb", height: 1.8, yaw: 0, safetyReviewed: true };
function group(name, log) {
  return { name, start: () => log.push(`start:${name}`), stop: () => log.push(`stop:${name}`), dispose: () => log.push(`dispose:${name}`) };
}
function container(o = {}) {
  const n = o.meshes ?? 1;
  const c = {
    disposed: 0,
    added: 0,
    meshes: Array.from({ length: n }, (_, i) => ({
      name: `mesh${i}`,
      isPickable: true,
      checkCollisions: true,
      alwaysSelectAsActiveMesh: false,
      getTotalIndices: () => (o.tris ?? 3e3) * 3,
      maxTextureSize: () => o.tex ?? 1024
    })),
    animationGroups: o.groups ?? [],
    addAllToScene() {
      c.added++;
    },
    dispose() {
      c.disposed++;
    }
  };
  return c;
}
function holder() {
  const h = { rotationY: 0, scale: 1, offsetY: 0, enabled: false, setEnabled(v) {
    h.enabled = v;
  } };
  return h;
}
function setup(over = {}, quality = "low") {
  const statuses = [];
  const h = holder();
  const ops = {
    load: async () => container(),
    mount: () => ({ minY: 0, maxY: 1.8, holderWorldY: 0 }),
    retarget: () => [],
    ...over
  };
  const ctl = createGlbController({ ops, holder: h, quality: () => quality, onStatus: (s) => statuses.push(s), timeoutMs: 50 });
  return { ctl, h, statuses };
}
var kinds = (s) => s.map((x) => x.kind);
test("success: mounts, fits, hides nothing else, reports clips", async () => {
  const log = [];
  const c = container({ groups: [group("Idle", log), group("Walk", log), group("Run", log)], log });
  const { ctl, h, statuses } = setup({ load: async () => c, mount: () => ({ minY: 0.2, maxY: 2.2, holderWorldY: 0 }) });
  assert.equal(await ctl.setModel(model), true);
  assert.equal(c.added, 1);
  assert.ok(Math.abs(h.scale - 0.9) < 1e-9);
  assert.equal(h.rotationY, Math.PI);
  assert.equal(h.enabled, true);
  assert.ok(c.meshes.every((m) => !m.isPickable && !m.checkCollisions && m.alwaysSelectAsActiveMesh));
  assert.deepEqual(kinds(statuses), ["loading", "ready"]);
  assert.deepEqual(statuses[1].clips.sort(), ["idle", "run", "walk"]);
});
test("load error -> fallback, holder disabled, no throw", async () => {
  const { ctl, h, statuses } = setup({ load: async () => {
    throw new Error("404");
  } });
  assert.equal(await ctl.setModel(model), false);
  assert.equal(ctl.active, false);
  assert.equal(h.enabled, false);
  assert.deepEqual(statuses.at(-1), { kind: "fallback", id: "m", reason: "404" });
});
test("timeout -> fallback", async () => {
  const { ctl, statuses } = setup({ load: () => new Promise(() => {
  }) });
  assert.equal(await ctl.setModel(model), false);
  assert.equal(statuses.at(-1).reason, "timeout");
});
test("over budget -> fallback and container disposed", async () => {
  const c = container({ tris: 6e4 });
  const { ctl, statuses } = setup({ load: async () => c }, "low");
  assert.equal(await ctl.setModel(model), false);
  assert.equal(c.disposed, 1);
  assert.equal(c.added, 0);
  assert.match(statuses.at(-1).reason, /budget: triangles/);
});
test("same model passes on a higher quality tier", async () => {
  const { ctl } = setup({ load: async () => container({ tris: 6e4 }) }, "medium");
  assert.equal(await ctl.setModel(model), true);
});
test("no meshes and bad bounds -> fallback", async () => {
  let r = setup({ load: async () => container({ meshes: 0 }) });
  assert.equal(await r.ctl.setModel(model), false);
  r = setup({ mount: () => ({ minY: 1, maxY: 1, holderWorldY: 0 }) });
  assert.equal(await r.ctl.setModel(model), false);
  assert.equal(r.statuses.at(-1).reason, "invalid-bounds");
});
test("superseded request disposes stale container and keeps latest", async () => {
  const stale = container();
  const fresh = container();
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  let n = 0;
  const { ctl } = setup({ load: async () => {
    if (n++ === 0) {
      await gate;
      return stale;
    }
    return fresh;
  } });
  const first = ctl.setModel(model);
  const second = ctl.setModel({ ...model, id: "m2" });
  assert.equal(await second, true);
  release();
  assert.equal(await first, false);
  assert.equal(stale.disposed, 1);
  assert.equal(stale.added, 0);
  assert.equal(fresh.disposed, 0);
  assert.equal(ctl.active, true);
});
test("dispose during load discards result", async () => {
  const c = container();
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  const { ctl } = setup({ load: async () => {
    await gate;
    return c;
  } });
  const p = ctl.setModel(model);
  ctl.dispose();
  release();
  assert.equal(await p, false);
  assert.equal(c.disposed, 1);
  assert.equal(ctl.active, false);
});
test("setModel(null) returns to procedural", async () => {
  const { ctl, h, statuses } = setup();
  await ctl.setModel(model);
  await ctl.setModel(null);
  assert.equal(h.enabled, false);
  assert.equal(h.scale, 1);
  assert.equal(statuses.at(-1).kind, "procedural");
});
test("update switches clips with fallback and stops previous", async () => {
  const log = [];
  const c = container({ groups: [group("Idle", log), group("Walk", log)], log });
  const { ctl } = setup({ load: async () => c });
  await ctl.setModel(model);
  log.length = 0;
  ctl.update("idle");
  ctl.update("idle");
  ctl.update("run");
  ctl.update("walk");
  ctl.update("jump");
  assert.deepEqual(log, ["start:Idle", "stop:Idle", "start:Walk", "stop:Walk", "start:Idle"]);
});
test("external clips retargeted; external load failure still succeeds", async () => {
  const log = [];
  const ext = container({ log });
  const calls = [];
  let r = setup({
    load: async (u) => u === "a.glb" ? ext : container(),
    retarget: () => {
      calls.push("rt");
      return [group("Run", log)];
    }
  });
  assert.equal(await r.ctl.setModel({ ...model, animationsUrl: "a.glb" }), true);
  assert.deepEqual(calls, ["rt"]);
  assert.equal(ext.disposed, 1);
  assert.ok(r.statuses.at(-1).clips.includes("run"));
  r = setup({ load: async (u) => {
    if (u === "a.glb") throw new Error("x");
    return container();
  } });
  assert.equal(await r.ctl.setModel({ ...model, animationsUrl: "a.glb" }), true);
});
test("status listener exceptions never break loading", async () => {
  const h = holder();
  const ctl = createGlbController({
    ops: { load: async () => container(), mount: () => ({ minY: 0, maxY: 1.8, holderWorldY: 0 }), retarget: () => [] },
    holder: h,
    quality: () => "low",
    onStatus: () => {
      throw new Error("ui");
    }
  });
  assert.equal(await ctl.setModel(model), true);
});
