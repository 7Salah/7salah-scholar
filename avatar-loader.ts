// Babylon-specific half of the GLB avatar. Loaded lazily (dynamic import) only when a model is chosen,
// so the glTF loader never enters the initial game bundle.
import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AssetContainer } from "@babylonjs/core/assetContainer";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { canonicalBone } from "./avatar-rig";
import type { ContainerLike, GlbOps, GroupLike, HolderLike, MeshLike } from "./avatar-glb";

export function createBabylonOps(scene: Scene, holderNode: TransformNode) {
  const wrapMesh = (m: AbstractMesh): MeshLike => Object.assign(m, {
    maxTextureSize: () => {
      let max = 0;
      for (const t of m.material?.getActiveTextures?.() ?? []) {
        const s = t.getSize(); max = Math.max(max, s.width, s.height);
      }
      return max;
    }
  }) as unknown as MeshLike;
  const wrap = (c: AssetContainer): ContainerLike & { raw: AssetContainer } => ({
    raw: c,
    meshes: c.meshes.filter((m) => m.getTotalIndices() > 0).map(wrapMesh),
    animationGroups: c.animationGroups as unknown as GroupLike[],
    addAllToScene: () => c.addAllToScene(),
    dispose: () => c.dispose()
  });

  const ops: GlbOps = {
    async load(url) {
      const [{ LoadAssetContainerAsync }] = await Promise.all([
        import("@babylonjs/core/Loading/sceneLoader"),
        import("@babylonjs/loaders/glTF")        // registers the .glb/.gltf plugin
      ]);
      const container = await LoadAssetContainerAsync(url, scene, { pluginExtension: ".glb" });
      container.animationGroups.forEach((g) => g.stop());
      return wrap(container);
    },
    mount(c) {
      const raw = (c as ReturnType<typeof wrap>).raw;
      raw.rootNodes.forEach((n) => { (n as TransformNode).parent = holderNode; });
      holderNode.computeWorldMatrix(true);
      const { min, max } = holderNode.getHierarchyBoundingVectors(true);
      return { minY: min.y, maxY: max.y, holderWorldY: holderNode.getAbsolutePosition().y };
    },
    retarget(external, avatar) {
      // Re-bind external clips to this avatar's bones by canonical name; unmatched channels are dropped.
      const nodes = new Map<string, unknown>();
      const a = (avatar as ReturnType<typeof wrap>).raw;
      for (const n of [...a.transformNodes, ...a.skeletons.flatMap((s) => s.bones.map((b) => b.getTransformNode() ?? b))])
        if (n?.name) nodes.set(canonicalBone(n.name), n);
      const out: GroupLike[] = [];
      for (const g of (external as ReturnType<typeof wrap>).raw.animationGroups as AnimationGroup[]) {
        const clone = g.clone(g.name, (t) => (nodes.get(canonicalBone((t as { name: string }).name)) as typeof t) ?? null);
        if (clone.targetedAnimations.length) out.push(clone as unknown as GroupLike); else clone.dispose();
      }
      return out;
    }
  };
  const holder: HolderLike = {
    get rotationY() { return holderNode.rotation.y; }, set rotationY(v) { holderNode.rotation.y = v; },
    get scale() { return holderNode.scaling.x; }, set scale(v) { holderNode.scaling.setAll(v); },
    get offsetY() { return holderNode.position.y; }, set offsetY(v) { holderNode.position.y = v; },
    setEnabled: (v) => holderNode.setEnabled(v)
  };
  return { ops, holder };
}
