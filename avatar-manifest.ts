// Manifest of optional GLB avatars. A model is usable only if it passed the V22 content review.
export type AvatarModel = {
  id: string; name: string; url: string;
  animationsUrl?: string;   // optional shared clip library (retargeted by bone name)
  height: number;           // target height in scene units
  yaw: number;              // extra yaw (rad) if the model does not face the walking direction
  safetyReviewed: true;     // REQUIRED: content reviewed per docs/V22-CONTENT-SAFETY.md
};
const isRel = (u: unknown): u is string =>
  typeof u === "string" && /^[\w./-]+\.glb$/i.test(u) && !u.startsWith("/") && !u.includes("..");

export function parseManifest(raw: unknown): AvatarModel[] {
  const list = (raw as { models?: unknown })?.models;
  if (!Array.isArray(list)) return [];
  const out: AvatarModel[] = [];
  for (const m of list) {
    if (!m || typeof m !== "object") continue;
    const r = m as Record<string, unknown>;
    if (r.safetyReviewed !== true) continue;                       // content policy gate
    if (typeof r.id !== "string" || !/^[a-z0-9-]{1,40}$/.test(r.id)) continue;
    if (!isRel(r.url)) continue;                                   // same-origin relative .glb only
    if (r.animationsUrl !== undefined && !isRel(r.animationsUrl)) continue;
    const height = typeof r.height === "number" && r.height >= 1 && r.height <= 2.6 ? r.height : 1.85;
    const yaw = typeof r.yaw === "number" && Math.abs(r.yaw) <= Math.PI * 2 ? r.yaw : 0;
    out.push({
      id: r.id, name: typeof r.name === "string" ? r.name.slice(0, 40) : r.id, url: r.url,
      animationsUrl: r.animationsUrl as string | undefined, height, yaw, safetyReviewed: true
    });
  }
  return out;
}
