// Pure helpers for the optional GLB avatar (no Babylon imports, unit-testable in Node).

export type AvatarState = "idle" | "walk" | "run" | "jump" | "talk";
export const AVATAR_STATES: readonly AvatarState[] = ["idle", "walk", "run", "jump", "talk"];

// Normalises bone/node names from different rigs: "mixamorig:LeftArm", "mixamorig9LeftArm",
// "Armature|LeftArm", "CC_Base_L_Upperarm", "Bip01 L UpperArm", "LeftArm" -> comparable key.
export function canonicalBone(name: string): string {
  let n = String(name || "");
  n = n.replace(/^.*[|:]/, "");                    // Armature|X, mixamorig:X
  n = n.replace(/^(mixamorig\d*|cc_base_|bip\d*\s*|bip001\s*)/i, "");
  n = n.toLowerCase().replace(/[^a-z0-9]/g, "");
  n = n.replace(/^l(?=(upper|fore|arm|hand|leg|up|lo|thigh|calf|foot|toe|shoulder|clavicle))/, "left")
       .replace(/^r(?=(upper|fore|arm|hand|leg|up|lo|thigh|calf|foot|toe|shoulder|clavicle))/, "right");
  n = n.replace(/upperarm|upparm/g, "arm").replace(/forearm|lowerarm|lowarm/g, "forearm")
       .replace(/upperleg|upleg|thigh/g, "leg").replace(/lowerleg|lowleg|calf|shin/g, "shin");
  return n;
}

// Maps clip names ("Armature|Walk", "mixamo.com", "Idle_01", ...) to avatar states.
const CLIP_PATTERNS: Array<[AvatarState, RegExp]> = [
  ["run", /run|sprint|jog/i],
  ["walk", /walk|stroll/i],
  ["jump", /jump|hop|leap/i],
  ["talk", /talk|speak|chat|gesture|explain|wave/i],
  ["idle", /idle|stand|breath|rest|pose/i]
];
export function classifyClip(name: string): AvatarState | null {
  const short = String(name || "").replace(/^.*[|:]/, "");
  for (const [state, re] of CLIP_PATTERNS) if (re.test(short)) return state;
  return null;
}
export function pickClips<T extends { name: string }>(groups: readonly T[]): Partial<Record<AvatarState, T>> {
  const out: Partial<Record<AvatarState, T>> = {};
  for (const g of groups) {
    const s = classifyClip(g.name);
    if (s && !out[s]) out[s] = g;
  }
  // A single unnamed clip is the best available idle/walk guess only if nothing else matched.
  if (!Object.keys(out).length && groups.length === 1) out.idle = groups[0];
  return out;
}

// Decide the state for this frame. Falls back along run->walk->idle if a clip is missing.
export function resolveState(
  wanted: AvatarState,
  available: Partial<Record<AvatarState, unknown>>
): AvatarState | null {
  const chain: Record<AvatarState, AvatarState[]> = {
    run: ["run", "walk", "idle"], walk: ["walk", "idle"], jump: ["jump", "idle"],
    talk: ["talk", "idle"], idle: ["idle"]
  };
  return chain[wanted].find((s) => available[s]) ?? null;
}
export function frameState(moving: boolean, running: boolean, grounded: boolean, talking = false): AvatarState {
  if (!grounded) return "jump";
  if (moving) return running ? "run" : "walk";
  return talking ? "talk" : "idle";
}

// Fit a model to a target height and put its feet on the player root's ground (y=0 local).
export function computeFit(minY: number, maxY: number, holderWorldY: number, targetHeight: number) {
  const h = maxY - minY;
  if (!Number.isFinite(h) || h <= 0.01) return null;
  const scale = targetHeight / h;
  return { scale, offsetY: -(minY - holderWorldY) * scale };
}

export type Budget = { maxTriangles: number; maxTextureSize: number };
export const BUDGETS: Record<"low" | "medium" | "high", Budget> = {
  low: { maxTriangles: 40000, maxTextureSize: 2048 },
  medium: { maxTriangles: 70000, maxTextureSize: 2048 },
  high: { maxTriangles: 120000, maxTextureSize: 4096 }
};
export function withinBudget(tris: number, maxTex: number, q: keyof typeof BUDGETS) {
  const b = BUDGETS[q];
  if (tris > b.maxTriangles) return `triangles ${tris} > ${b.maxTriangles}`;
  if (maxTex > b.maxTextureSize) return `texture ${maxTex}px > ${b.maxTextureSize}px`;
  return null;
}
