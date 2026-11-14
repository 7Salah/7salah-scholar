// Optional GLB avatar controller. Babylon-agnostic on purpose (structural types only) so the
// load/fallback/animation logic is unit-tested in Node; avatar-loader.ts supplies the Babylon bits.
import { classifyClip, computeFit, pickClips, resolveState, withinBudget } from "./avatar-rig";
import type { AvatarState } from "./avatar-rig";
import type { AvatarModel } from "./avatar-manifest";

export interface GroupLike {
  name: string; start(loop?: boolean, speed?: number): unknown; stop(): unknown; dispose(): void;
  enableBlending?: boolean; blendingSpeed?: number;
}
export interface MeshLike {
  name: string; isPickable: boolean; checkCollisions: boolean; alwaysSelectAsActiveMesh: boolean;
  receiveShadows?: boolean; getTotalIndices(): number; maxTextureSize(): number;
}
export interface ContainerLike {
  meshes: MeshLike[]; animationGroups: GroupLike[];
  addAllToScene(): void; dispose(): void;
}
export interface HolderLike {
  rotationY: number; scale: number; offsetY: number; setEnabled(v: boolean): void;
}
export type Bounds = { minY: number; maxY: number; holderWorldY: number };
export interface GlbOps {
  load(url: string): Promise<ContainerLike>;
  mount(c: ContainerLike): Bounds;                                   // parent under holder, return bounds
  retarget(external: ContainerLike, avatar: ContainerLike): GroupLike[]; // clips re-bound by bone name
}
export type AvatarStatus =
  | { kind: "procedural" } | { kind: "loading"; id: string }
  | { kind: "ready"; id: string; clips: AvatarState[] }
  | { kind: "fallback"; id: string; reason: string };

export type GlbController = ReturnType<typeof createGlbController>;

export function createGlbController(opts: {
  ops: GlbOps; holder: HolderLike; quality: () => "low" | "medium" | "high";
  onStatus?: (s: AvatarStatus) => void; onMeshes?: (m: MeshLike[]) => void; timeoutMs?: number;
}) {
  const { ops, holder } = opts;
  let token = 0;
  let current: { container: ContainerLike; extra: GroupLike[]; clips: Partial<Record<AvatarState, GroupLike>> } | null = null;
  let playing: AvatarState | null = null;
  const status = (s: AvatarStatus) => { try { opts.onStatus?.(s); } catch { /* UI errors must not affect the game */ } };

  const unload = () => {
    if (!current) return;
    try { current.extra.forEach((g) => g.dispose()); current.container.dispose(); } catch { /* already gone */ }
    current = null; playing = null;
    holder.scale = 1; holder.offsetY = 0;
    holder.setEnabled(false);
  };
  const fail = (id: string, reason: string, c?: ContainerLike) => {
    try { c?.dispose(); } catch { /* ignore */ }
    unload();
    status({ kind: "fallback", id, reason });   // procedural avatar stays visible (Academy re-enables it)
  };
  const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
    new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error("timeout")), ms);
      p.then((v) => { clearTimeout(t); res(v); }, (e) => { clearTimeout(t); rej(e); });
    });

  async function setModel(model: AvatarModel | null): Promise<boolean> {
    const my = ++token;
    unload();
    if (!model) { status({ kind: "procedural" }); return false; }
    status({ kind: "loading", id: model.id });
    let container: ContainerLike | null = null;
    try {
      const ms = opts.timeoutMs ?? 20000;
      container = await withTimeout(ops.load(model.url), ms);
      if (my !== token) { container.dispose(); return false; }           // superseded or disposed
      if (!container.meshes.length) return fail(model.id, "no-meshes", container), false;
      const tris = container.meshes.reduce((n, m) => n + Math.floor(m.getTotalIndices() / 3), 0);
      const tex = container.meshes.reduce((n, m) => Math.max(n, m.maxTextureSize()), 0);
      const over = withinBudget(tris, tex, opts.quality());
      if (over) return fail(model.id, `budget: ${over}`, container), false;

      let external: ContainerLike | null = null;
      if (model.animationsUrl) {
        try { external = await withTimeout(ops.load(model.animationsUrl), ms); }
        catch { external = null; }                                         // clips are optional
        if (my !== token) { external?.dispose(); container.dispose(); return false; }
      }
      container.addAllToScene();
      const bounds = ops.mount(container);
      const fit = computeFit(bounds.minY, bounds.maxY, bounds.holderWorldY, model.height);
      if (!fit) return fail(model.id, "invalid-bounds", container), false;
      holder.scale = fit.scale; holder.offsetY = fit.offsetY; holder.rotationY = Math.PI + model.yaw;

      container.meshes.forEach((m) => { m.isPickable = false; m.checkCollisions = false; m.alwaysSelectAsActiveMesh = true; });
      const own = container.animationGroups;
      const extra = external ? ops.retarget(external, container) : [];
      external?.dispose();
      own.forEach((g) => g.stop());
      const picked = { ...pickClips(extra), ...pickClips(own) };          // own clips win
      for (const g of [...own, ...extra]) { g.enableBlending = true; g.blendingSpeed = 0.08; }
      current = { container, extra, clips: picked };
      holder.setEnabled(true);
      opts.onMeshes?.(container.meshes);
      status({ kind: "ready", id: model.id, clips: Object.keys(picked) as AvatarState[] });
      return true;
    } catch (e) {
      if (my !== token) { try { container?.dispose(); } catch { /* ignore */ } return false; }
      fail(model.id, e instanceof Error ? e.message : "load-error", container ?? undefined);
      return false;
    }
  }

  return {
    setModel,
    get active() { return !!current; },
    update(state: AvatarState) {
      if (!current) return;
      const s = resolveState(state, current.clips);
      if (s === playing) return;
      if (playing) current.clips[playing]?.stop();
      playing = s;
      if (s) current.clips[s]!.start(s !== "jump", s === "run" ? 1 : 1);
    },
    dispose() { token++; unload(); }
  };
}
export { classifyClip };
