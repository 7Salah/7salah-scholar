import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AcademicWorld, Appearance, GraphicsQuality, WorldOptions } from "./types";
import { createGlbController } from "./avatar-glb";
import type { GlbController, MeshLike } from "./avatar-glb";
import { frameState } from "./avatar-rig";
import type { AvatarModel } from "./avatar-manifest";

type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };
type AvatarAnimation = { leftArm: AbstractMesh; rightArm: AbstractMesh; leftLeg: AbstractMesh; rightLeg: AbstractMesh };

const color = (hex: string) => Color3.FromHexString(hex);

export function mountAcademy(canvas: HTMLCanvasElement, options: WorldOptions): AcademicWorld {
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
    adaptToDeviceRatio: true
  });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.55, 0.73, 0.83, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0025;
  scene.fogColor = new Color3(scene.clearColor.r, scene.clearColor.g, scene.clearColor.b);

  const skyMat = new StandardMaterial("academy-sky", scene);
  skyMat.backFaceCulling = false;
  skyMat.disableLighting = true;
  skyMat.emissiveColor = new Color3(0.62, 0.78, 0.86);
  const sky = MeshBuilder.CreateSphere("soft-sky-dome", { diameter: 180, segments: 16 }, scene);
  sky.material = skyMat;
  sky.infiniteDistance = true;
  sky.isPickable = false;

  const ambient = new HemisphericLight("academy-ambient", new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.82;
  ambient.diffuse = new Color3(0.87, 0.92, 1);
  ambient.groundColor = new Color3(0.36, 0.43, 0.39);
  const sun = new DirectionalLight("morning-sun", new Vector3(-0.42, -1, 0.33), scene);
  sun.position = new Vector3(-32, 44, -24);
  sun.intensity = 1.0;

  const makeMaterial = (name: string, hex: string, emissive = false) => {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color(hex);
    material.specularColor = new Color3(0.13, 0.16, 0.18);
    if (emissive) material.emissiveColor = color(hex).scale(0.26);
    return material;
  };
  const grass = makeMaterial("academy-lawn", "#799978");
  const stone = makeMaterial("warm-stone", "#c9c5b4");
  const lightStone = makeMaterial("path-stone", "#ded9c9");
  const navy = makeMaterial("academy-navy", "#233d59");
  const cream = makeMaterial("academy-limestone", "#e2d9c5");
  const trim = makeMaterial("brass-trim", "#b99c62");
  const glass = makeMaterial("academy-glass", "#79b8c2");
  const glassDark = makeMaterial("deep-window", "#315c72");
  const wood = makeMaterial("garden-wood", "#74583e");
  const leaf = makeMaterial("garden-leaf", "#4f826b");
  const leafLight = makeMaterial("garden-leaf-light", "#73a27a");
  const water = makeMaterial("fountain-water", "#64b9bf", true);
  const goldLight = makeMaterial("gate-glow", "#dfc27b", true);
  const meshesToShadow: Mesh[] = [];
  const colliders: Bounds[] = [
    { minX: -13.4, maxX: 13.4, minZ: 20.2, maxZ: 34.5 }
  ];

  const addBox = (
    name: string,
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material: StandardMaterial,
    parent?: TransformNode
  ) => {
    const mesh = MeshBuilder.CreateBox(name, { width, height, depth }, scene);
    mesh.position.set(x, y, z);
    mesh.material = material;
    if (parent) mesh.parent = parent;
    else meshesToShadow.push(mesh);
    return mesh;
  };
  const addCylinder = (
    name: string,
    diameter: number,
    height: number,
    x: number,
    y: number,
    z: number,
    material: StandardMaterial,
    parent?: TransformNode,
    diameterTop = diameter
  ) => {
    const mesh = MeshBuilder.CreateCylinder(name, { diameter, diameterTop, diameterBottom: diameter, height, tessellation: 18 }, scene);
    mesh.position.set(x, y, z);
    mesh.material = material;
    if (parent) mesh.parent = parent;
    else meshesToShadow.push(mesh);
    return mesh;
  };

  // A broad, quiet lawn with stone paths makes the courtyard read as one campus.
  const ground = MeshBuilder.CreateGround("campus-lawn", { width: 120, height: 120, subdivisions: 1 }, scene);
  ground.position.y = -0.12;
  ground.material = grass;
  ground.receiveShadows = true;
  addBox("front-walk", 7, 0.1, 42, 0, -0.025, 4, lightStone);
  addBox("plaza-main", 30, 0.12, 22, 0, -0.005, 10, stone);
  addBox("plaza-crossing", 42, 0.11, 5, 0, 0.012, 10, lightStone);
  addBox("left-garden-walk", 4, 0.09, 32, -22, -0.03, 7, lightStone);
  addBox("right-garden-walk", 4, 0.09, 32, 22, -0.03, 7, lightStone);
  addBox("campus-terrace", 34, 0.55, 16, 0, 0.18, 27.1, navy);
  addBox("terrace-top", 32, 0.14, 14, 0, 0.52, 26.5, cream);

  // Main academy: warm stone, blue glass, a colonnaded entry, and a clear sign.
  addBox("academic-main-wing", 27, 8.4, 13.2, 0, 4.75, 27.2, cream);
  addBox("roof-edge", 29, 0.45, 14.8, 0, 9.13, 27.1, navy);
  addBox("facade-band-upper", 27.3, 0.22, 0.24, 0, 7.8, 20.55, trim);
  addBox("facade-band-lower", 27.3, 0.22, 0.24, 0, 3.8, 20.55, trim);
  for (let i = -5; i <= 5; i += 1) {
    const x = i * 2.35;
    addBox(`upper-window-${i}`, 1.65, 2.05, 0.18, x, 6.15, 20.43, glassDark);
    addBox(`lower-window-${i}`, 1.65, 1.7, 0.18, x, 2.75, 20.43, glass);
    addBox(`window-mullion-${i}`, 0.08, 2.14, 0.22, x, 6.15, 20.3, trim);
  }
  addBox("central-entry", 4.4, 3.1, 0.24, 0, 1.9, 20.25, navy);
  addBox("entry-door-left", 1.7, 2.9, 0.15, -0.91, 1.82, 20.08, glass);
  addBox("entry-door-right", 1.7, 2.9, 0.15, 0.91, 1.82, 20.08, glass);
  addBox("entry-lintel", 5.7, 0.38, 0.55, 0, 3.72, 20.05, trim);
  for (const x of [-3.15, 3.15]) {
    addCylinder(`entry-column-${x}`, 0.62, 4.1, x, 2.62, 19.95, cream, undefined, 0.62);
    addCylinder(`column-cap-${x}`, 0.84, 0.24, x, 4.64, 19.95, trim);
  }
  addBox("entry-canopy", 9, 0.4, 2.1, 0, 4.12, 19.4, navy);
  addBox("entry-step-1", 10, 0.22, 1.2, 0, 0.58, 18.9, cream);
  addBox("entry-step-2", 12, 0.18, 1.1, 0, 0.69, 18.15, lightStone);
  addBox("entry-step-3", 14, 0.16, 1.1, 0, 0.78, 17.43, stone);

  const signTexture = new DynamicTexture("academy-nameplate", { width: 768, height: 144 }, scene, false);
  const signContext = signTexture.getContext() as unknown as CanvasRenderingContext2D;
  signContext.clearRect(0, 0, 768, 144);
  signContext.fillStyle = "#19344d";
  signContext.fillRect(0, 0, 768, 144);
  signContext.strokeStyle = "#c5a873";
  signContext.lineWidth = 7;
  signContext.strokeRect(8, 8, 752, 128);
  signContext.fillStyle = "#f5e8c9";
  signContext.font = "700 58px Arial";
  signContext.textAlign = "center";
  signContext.textBaseline = "middle";
  signContext.fillText("7SALAH  ·  ACADEMY", 384, 72);
  signTexture.update();
  const signMaterial = new StandardMaterial("academy-nameplate-material", scene);
  signMaterial.diffuseTexture = signTexture;
  signMaterial.emissiveColor = new Color3(0.22, 0.22, 0.16);
  const sign = MeshBuilder.CreatePlane("academy-sign", { width: 8.5, height: 1.55 }, scene);
  sign.position.set(0, 8.45, 20.05);
  sign.material = signMaterial;
  meshesToShadow.push(sign);

  const portal = MeshBuilder.CreateTorus("knowledge-gate-ring", { diameter: 3.2, thickness: 0.12, tessellation: 36 }, scene);
  portal.position.set(0, 2.1, 16.15);
  portal.material = goldLight;
  meshesToShadow.push(portal);
  const portalBase = addBox("knowledge-gate-base", 3.5, 0.15, 0.45, 0, 0.08, 16.15, navy);
  portalBase.receiveShadows = true;

  // Garden furniture and a fountain give the plaza landmarks without imported assets.
  const fountainBase = addCylinder("fountain-basin", 5.3, 0.52, 8.5, 0.25, 9.5, cream);
  const fountainLip = addCylinder("fountain-lip", 4.5, 0.15, 8.5, 0.57, 9.5, trim);
  const fountainPool = addCylinder("fountain-pool", 3.9, 0.12, 8.5, 0.65, 9.5, water);
  fountainBase.receiveShadows = fountainLip.receiveShadows = fountainPool.receiveShadows = true;
  addCylinder("fountain-column", 0.48, 1.8, 8.5, 1.45, 9.5, cream, undefined, 0.3);
  addCylinder("fountain-crown", 1.1, 0.35, 8.5, 2.38, 9.5, trim);

  const treeAt = (x: number, z: number, scale: number) => {
    const group = new TransformNode(`tree-${x}-${z}`, scene);
    group.position.set(x, 0, z);
    addCylinder("tree-trunk", 0.68 * scale, 2.6 * scale, 0, 1.3 * scale, 0, wood, group);
    for (const [i, offset] of [-0.18, 0.15, 0.48].entries()) {
      const canopy = MeshBuilder.CreateSphere(`tree-canopy-${i}`, { diameter: (3.1 - i * 0.18) * scale, segments: 12 }, scene);
      canopy.position.set((i - 1) * 0.62 * scale, (3.1 + offset) * scale, (i % 2 ? 0.3 : -0.12) * scale);
      canopy.material = i === 1 ? leafLight : leaf;
      canopy.parent = group;
      meshesToShadow.push(canopy);
    }
    const r = 0.63 * scale;
    colliders.push({ minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r });
  };
  [
    [-24, -14, 1.15], [-17, 0, 0.9], [-25, 15, 1.12], [-20, 29, 1.1],
    [24, -14, 1.18], [17, 0, 0.9], [25, 15, 1.1], [20, 30, 1.15],
    [-38, -25, 1.2], [-36, 6, 1.1], [-38, 31, 1.15],
    [38, -25, 1.2], [36, 6, 1.12], [38, 31, 1.15],
    [-9, -29, 0.9], [9, -31, 0.95], [-15, 36, 1.1], [15, 37, 1.05]
  ].forEach(([x, z, scale]) => treeAt(x!, z!, scale!));

  const lampAt = (x: number, z: number) => {
    addCylinder("path-lamp-post", 0.12, 2.7, x, 1.35, z, navy);
    const lamp = MeshBuilder.CreateSphere("path-lamp-globe", { diameter: 0.52, segments: 12 }, scene);
    lamp.position.set(x, 2.8, z);
    lamp.material = goldLight;
    meshesToShadow.push(lamp);
  };
  [[-12, 2], [12, 2], [-13, 16], [13, 16], [-23, -5], [23, -5]].forEach(([x, z]) => lampAt(x!, z!));

  const benchAt = (x: number, z: number, rotation = 0) => {
    const seat = addBox("courtyard-bench-seat", 2.2, 0.18, 0.62, x, 0.62, z, wood);
    const back = addBox("courtyard-bench-back", 2.2, 0.72, 0.16, x, 1.02, z - 0.24, wood);
    seat.rotation.y = back.rotation.y = rotation;
    for (const dx of [-0.78, 0.78]) {
      const leg = addBox("courtyard-bench-leg", 0.14, 0.62, 0.14, x + dx, 0.32, z, navy);
      leg.rotation.y = rotation;
    }
  };
  benchAt(-10, 7);
  benchAt(-10, 13);
  benchAt(16, 3, Math.PI / 2);
  benchAt(16, 13, Math.PI / 2);

  const playerRoot = new TransformNode("player-character-root", scene);
  playerRoot.position.set(0, 0, -6);
  const playerVisual = new TransformNode("replaceable-avatar-model", scene);
  playerVisual.parent = playerRoot;
  let animation = createAvatar(playerVisual, options.appearance, true);

  // Optional GLB avatar (22.1): a sibling of the procedural model under the same player root.
  // The procedural avatar is never removed; it is only hidden while a GLB model is active.
  const glbHolder = new TransformNode("glb-avatar-holder", scene);
  glbHolder.parent = playerRoot;
  glbHolder.setEnabled(false);
  let glb: GlbController | null = null;
  let glbMeshes: MeshLike[] = [];
  let glbBusy: Promise<void> = Promise.resolve();

  const npcRoot = new TransformNode("academy-student-root", scene);
  npcRoot.position.set(5.5, 0, 8);
  const npcVisual = new TransformNode("academy-student-model", scene);
  npcVisual.parent = npcRoot;
  createAvatar(npcVisual, {
    hairStyle: "bob", hairColor: "#674b5a", eyeColor: "#6bbac1", outfitColor: "#49736b",
    shoesColor: "#243248", bag: "satchel", accessory: "headband", theme: "rose", details: "classic"
  }, false);
  npcRoot.scaling.set(0.9, 0.9, 0.9);

  const camera = new FreeCamera("academy-third-person-camera", new Vector3(0, 4, -10), scene);
  camera.minZ = 0.1;
  camera.maxZ = 300;
  camera.fov = 0.82;
  camera.setTarget(new Vector3(0, 1.2, 0));
  scene.activeCamera = camera;

  const keys = new Set<string>();
  const velocity = new Vector3(0, 0, 0);
  let virtualX = 0;
  let virtualY = 0;
  let touchRun = false;
  let verticalSpeed = 0;
  let grounded = true;
  let cameraYaw = 0;
  let cameraPitch = 0.18;
  let cameraDistance = 8.5;
  let dragging = false;
  let dragPointer: number | null = null;
  let previousX = 0;
  let previousY = 0;
  let runningLoop = true;
  let walkTime = 0;
  let promptVisible = false;
  let shadowGenerator: ShadowGenerator | null = null;
  let disposed = false;

  const nearGate = () => Math.hypot(playerRoot.position.x, playerRoot.position.z - 16.15) < 4.7;
  const setPrompt = (visible: boolean) => {
    if (promptVisible === visible) return;
    promptVisible = visible;
    options.onPrompt(visible);
  };
  const canStandAt = (x: number, z: number) => {
    if (Math.abs(x) > 56 || Math.abs(z) > 56) return false;
    const radius = 0.48;
    return !colliders.some((b) =>
      x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ
    );
  };
  const interact = () => {
    if (nearGate()) options.onInteract();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const code = event.code;
    if (code === "Escape" && !event.repeat) {
      options.onEscape();
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, select, textarea, button, a, [contenteditable=true]")) return;
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight", "Space"].includes(code)) {
      keys.add(code);
      event.preventDefault();
    }
    if (code === "Space" && !event.repeat) jump();
    if (code === "KeyE" && !event.repeat) interact();
  };
  const onKeyUp = (event: KeyboardEvent) => { keys.delete(event.code); };
  const clearKeys = () => keys.clear();
  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    dragging = true;
    dragPointer = event.pointerId;
    previousX = event.clientX;
    previousY = event.clientY;
    try { canvas.setPointerCapture(event.pointerId); } catch { /* Some embedded browsers disallow capture. */ }
    event.preventDefault();
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== dragPointer) return;
    const dx = event.clientX - previousX;
    const dy = event.clientY - previousY;
    previousX = event.clientX;
    previousY = event.clientY;
    cameraYaw -= dx * (event.pointerType === "touch" ? 0.006 : 0.0046);
    cameraPitch = Math.max(-0.12, Math.min(0.68, cameraPitch + dy * 0.0035));
  };
  const endDrag = (event: PointerEvent) => {
    if (event.pointerId === dragPointer) {
      dragging = false;
      dragPointer = null;
    }
  };
  const onWheel = (event: WheelEvent) => {
    cameraDistance = Math.max(5.3, Math.min(12, cameraDistance + event.deltaY * 0.006));
  };
  const onResize = () => engine.resize();

  function jump() {
    if (!grounded) return;
    grounded = false;
    verticalSpeed = 7.2;
  }
  let currentQuality: GraphicsQuality = options.quality;
  const setQuality = (quality: GraphicsQuality) => {
    currentQuality = quality;
    engine.setHardwareScalingLevel(quality === "high" ? 1 : quality === "medium" ? 1.25 : 1.65);
    if (shadowGenerator) {
      shadowGenerator.dispose();
      shadowGenerator = null;
    }
    if (quality === "high") {
      shadowGenerator = new ShadowGenerator(1024, sun);
      shadowGenerator.useBlurExponentialShadowMap = true;
      shadowGenerator.blurKernel = 18;
      meshesToShadow.slice(0, 95).forEach((mesh) => shadowGenerator?.addShadowCaster(mesh));
      playerVisual.getChildMeshes().forEach((mesh) => shadowGenerator?.addShadowCaster(mesh));
      glbMeshes.forEach((mesh) => shadowGenerator?.addShadowCaster(mesh as unknown as AbstractMesh));
      ground.receiveShadows = true;
      scene.meshes.forEach((mesh) => { if (mesh !== sky && mesh !== ground) mesh.receiveShadows = true; });
    } else {
      scene.meshes.forEach((mesh) => { mesh.receiveShadows = false; });
      ground.receiveShadows = true;
    }
  };
  const setAppearance = (value: Appearance) => {
    playerVisual.getChildMeshes().forEach((mesh) => shadowGenerator?.removeShadowCaster(mesh, true));
    animation = createAvatar(playerVisual, value, true);
    if (shadowGenerator) playerVisual.getChildMeshes().forEach((mesh) => shadowGenerator?.addShadowCaster(mesh));
  };

  const setAvatarModel = (model: AvatarModel | null) => {
    // Serialise requests; any failure falls back to the procedural avatar and never throws.
    glbBusy = glbBusy.then(async () => {
      if (disposed) return;
      try {
        if (!glb) {
          if (!model) return;
          const { createBabylonOps } = await import("./avatar-loader");
          const { ops, holder } = createBabylonOps(scene, glbHolder);
          glb = createGlbController({
            ops, holder, quality: () => currentQuality,
            timeoutMs: 20000,
            onMeshes: (meshes) => {
              glbMeshes = meshes;
              meshes.forEach((m) => shadowGenerator?.addShadowCaster(m as unknown as AbstractMesh));
            },
            onStatus: (status) => {
              playerVisual.setEnabled(status.kind !== "ready");
              if (status.kind !== "ready") glbMeshes = [];
              options.avatar?.onStatus?.(status);
            }
          });
        }
        await glb.setModel(model);
      } catch (error) {
        playerVisual.setEnabled(true);
        options.avatar?.onStatus?.({ kind: "fallback", id: model?.id ?? "", reason: error instanceof Error ? error.message : "load-error" });
      }
    });
  };

  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearKeys);
  window.addEventListener("resize", onResize);

  const frame = () => {
    if (disposed) return;
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
    const keyboardX = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    const keyboardForward = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    let moveX = Math.max(-1, Math.min(1, keyboardX + virtualX));
    let moveForward = Math.max(-1, Math.min(1, keyboardForward - virtualY));
    const magnitude = Math.hypot(moveX, moveForward);
    if (magnitude > 1) { moveX /= magnitude; moveForward /= magnitude; }
    const forwardX = Math.sin(cameraYaw);
    const forwardZ = Math.cos(cameraYaw);
    const rightX = Math.cos(cameraYaw);
    const rightZ = -Math.sin(cameraYaw);
    const intendedX = rightX * moveX + forwardX * moveForward;
    const intendedZ = rightZ * moveX + forwardZ * moveForward;
    const isRunning = touchRun || keys.has("ShiftLeft") || keys.has("ShiftRight");
    const maxSpeed = isRunning ? 6.3 : 3.65;
    const ease = Math.min(1, dt * 9);
    velocity.x += (intendedX * maxSpeed - velocity.x) * ease;
    velocity.z += (intendedZ * maxSpeed - velocity.z) * ease;
    const nextX = playerRoot.position.x + velocity.x * dt;
    const nextZ = playerRoot.position.z + velocity.z * dt;
    if (canStandAt(nextX, playerRoot.position.z)) playerRoot.position.x = nextX;
    else velocity.x = 0;
    if (canStandAt(playerRoot.position.x, nextZ)) playerRoot.position.z = nextZ;
    else velocity.z = 0;

    if (!grounded) {
      verticalSpeed -= 18 * dt;
      playerRoot.position.y += verticalSpeed * dt;
      if (playerRoot.position.y <= 0) {
        playerRoot.position.y = 0;
        verticalSpeed = 0;
        grounded = true;
      }
    }

    const moving = Math.hypot(velocity.x, velocity.z) > 0.28;
    if (moving) {
      playerRoot.rotation.y = Math.atan2(velocity.x, velocity.z);
      walkTime += dt * (isRunning ? 12 : 8);
    } else {
      walkTime += dt * 1.5;
    }
    const swing = moving ? Math.sin(walkTime) * (isRunning ? 0.72 : 0.46) : Math.sin(walkTime) * 0.025;
    glb?.update(frameState(moving, isRunning, grounded));
    animation.leftArm.rotation.x = -swing * 0.7;
    animation.rightArm.rotation.x = swing * 0.7;
    animation.leftLeg.rotation.x = swing;
    animation.rightLeg.rotation.x = -swing;

    const distance = cameraDistance;
    const horizontal = Math.cos(cameraPitch) * distance;
    const desiredCamera = new Vector3(
      playerRoot.position.x + Math.sin(cameraYaw) * horizontal,
      playerRoot.position.y + 2.4 + Math.sin(cameraPitch) * distance,
      playerRoot.position.z - Math.cos(cameraYaw) * horizontal
    );
    camera.position = Vector3.Lerp(camera.position, desiredCamera, Math.min(1, dt * 5));
    camera.setTarget(new Vector3(playerRoot.position.x, playerRoot.position.y + 1.25, playerRoot.position.z));
    setPrompt(nearGate());
    scene.render();
  };

  const pause = () => {
    if (!runningLoop) return;
    runningLoop = false;
    engine.stopRenderLoop(frame);
  };
  const resume = () => {
    if (runningLoop || disposed) return;
    runningLoop = true;
    engine.runRenderLoop(frame);
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (runningLoop) engine.stopRenderLoop(frame);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", endDrag);
    canvas.removeEventListener("pointercancel", endDrag);
    canvas.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", clearKeys);
    window.removeEventListener("resize", onResize);
    glb?.dispose();
    shadowGenerator?.dispose();
    scene.dispose();
    engine.dispose();
  };

  setQuality(options.quality);
  engine.runRenderLoop(frame);
  if (options.avatar?.model) setAvatarModel(options.avatar.model);

  return {
    pause,
    resume,
    dispose,
    setQuality,
    setAppearance,
    setAvatarModel,
    setVirtualMove: (x, y) => { virtualX = x; virtualY = y; },
    setRunning: (running) => { touchRun = running; },
    jump,
    interact
  };
}

function createAvatar(root: TransformNode, appearance: Appearance, animated: boolean): AvatarAnimation {
  const oldMaterials = (root.metadata?.appearanceMaterials || []) as StandardMaterial[];
  root.getChildMeshes().forEach((mesh) => mesh.dispose(false, false));
  root.getChildTransformNodes().forEach((node) => node.dispose(false, false));
  oldMaterials.forEach((material) => material.dispose());

  const scene = root.getScene();
  const materials: StandardMaterial[] = [];
  const mat = (name: string, hex: string, glow = false) => {
    const material = new StandardMaterial(`${name}-${Math.random().toString(36).slice(2, 7)}`, scene);
    material.diffuseColor = color(hex);
    material.specularColor = new Color3(0.12, 0.13, 0.16);
    if (glow) material.emissiveColor = color(hex).scale(0.2);
    materials.push(material);
    return material;
  };
  const skin = mat("avatar-skin", "#d4ad8e");
  const hair = mat("avatar-hair", appearance.hairColor);
  const eyes = mat("avatar-eye", appearance.eyeColor, true);
  const jacket = mat("modest-academy-jacket", appearance.outfitColor);
  const shoes = mat("academy-shoes", appearance.shoesColor);
  const accentHex = appearance.theme === "gold" ? "#e2bf77" : appearance.theme === "rose" ? "#dc92ac" : "#6fd2cc";
  const accent = mat("academy-accent", appearance.details === "classic" ? "#d5c49b" : accentHex, true);
  const bagMaterial = mat("academy-bag", appearance.theme === "rose" ? "#75536c" : "#29445d");
  const white = mat("eye-white", "#f6f4ed");
  const sole = mat("shoe-sole", "#38414b");

  const part = (
    name: string,
    builder: (scene: Scene) => Mesh,
    x: number,
    y: number,
    z: number,
    material: StandardMaterial,
    rx = 0,
    ry = 0,
    rz = 0
  ) => {
    const mesh = builder(scene);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.material = material;
    mesh.parent = root;
    mesh.isPickable = false;
    return mesh;
  };
  const capsule = (name: string, height: number, radius: number, x: number, y: number, z: number, material: StandardMaterial, rz = 0) =>
    part(name, (s) => MeshBuilder.CreateCapsule(name, { height, radius, tessellation: 12, subdivisions: 2 }, s), x, y, z, material, 0, 0, rz);
  const box = (name: string, w: number, h: number, d: number, x: number, y: number, z: number, material: StandardMaterial, rz = 0) =>
    part(name, (s) => MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, s), x, y, z, material, 0, 0, rz);
  const sphere = (name: string, diameter: number, x: number, y: number, z: number, material: StandardMaterial, sx = 1, sy = 1, sz = 1) => {
    const mesh = part(name, (s) => MeshBuilder.CreateSphere(name, { diameter, segments: 14 }, s), x, y, z, material);
    mesh.scaling.set(sx, sy, sz);
    return mesh;
  };
  const cylinder = (name: string, diameter: number, height: number, x: number, y: number, z: number, material: StandardMaterial) =>
    part(name, (s) => MeshBuilder.CreateCylinder(name, { diameter, height, tessellation: 12 }, s), x, y, z, material);

  capsule("covered-academic-torso", 1.12, 0.37, 0, 1.05, 0, jacket);
  box("jacket-placket", 0.07, 0.72, 0.045, 0, 1.09, 0.371, accent);
  for (const x of [-0.2, 0.2]) {
    const leg = cylinder("covered-trousers", 0.24, 0.77, x, 0.47, 0, jacket);
    leg.rotation.x = -0.04;
    box("shoe-sole", 0.34, 0.1, 0.48, x, 0.105, 0.09, sole);
    box("closed-academy-shoe", 0.34, 0.22, 0.48, x, 0.19, 0.09, shoes);
  }
  const leftArm = capsule("left-sleeve", 0.88, 0.145, -0.48, 1.15, 0, jacket, -0.12);
  const rightArm = capsule("right-sleeve", 0.88, 0.145, 0.48, 1.15, 0, jacket, 0.12);
  sphere("neck", 0.3, 0, 1.64, 0.005, skin, 0.92, 0.9, 0.9);
  sphere("anime-head", 0.8, 0, 1.91, 0, skin, 0.92, 1.05, 0.88);
  sphere("hair-cap", 0.84, 0, 2.18, -0.015, hair, 1.02, 0.55, 1.02);
  for (const x of [-0.145, 0.145]) {
    sphere("eye-white", 0.115, x, 1.96, 0.334, white, 0.95, 1.18, 0.56);
    sphere("eye-color", 0.066, x, 1.96, 0.365, eyes, 0.92, 1.13, 0.55);
    sphere("eye-light", 0.025, x - 0.012, 1.986, 0.38, white, 0.8, 0.8, 0.5);
  }
  sphere("hair-fringe", 0.5, 0, 2.22, 0.25, hair, 1.1, 0.31, 0.66);
  if (appearance.hairStyle === "bob" || appearance.hairStyle === "long") {
    for (const x of [-0.32, 0.32]) {
      const lock = capsule("side-hair-lock", appearance.hairStyle === "long" ? 1.05 : 0.64, 0.13, x, appearance.hairStyle === "long" ? 1.53 : 1.71, 0.01, hair);
      lock.scaling.x = 0.82;
    }
  } else if (appearance.hairStyle === "ponytail") {
    sphere("ponytail-knot", 0.26, 0.01, 2.04, -0.38, accent, 1, 0.8, 1);
    capsule("ponytail", 0.78, 0.13, 0.01, 1.66, -0.47, hair, -0.08);
  } else {
    sphere("short-hair-side", 0.3, -0.31, 2.02, -0.06, hair, 0.85, 1.0, 0.88);
    sphere("short-hair-side", 0.3, 0.31, 2.02, -0.06, hair, 0.85, 1.0, 0.88);
  }
  if (appearance.accessory === "hairclip") {
    sphere("star-clip-center", 0.13, -0.3, 2.18, 0.29, accent, 1, 1, 0.5);
    for (const [dx, dy] of [[-0.1, 0], [0.1, 0], [0, -0.1], [0, 0.1]]) {
      sphere("star-clip-point", 0.08, -0.3 + dx, 2.18 + dy, 0.29, accent, 1, 1, 0.5);
    }
  } else if (appearance.accessory === "headband") {
    const band = MeshBuilder.CreateTorus("modest-headband", { diameter: 0.79, thickness: 0.075, tessellation: 20 }, scene);
    band.position.set(0, 2.2, 0);
    band.scaling.z = 0.88;
    band.material = accent;
    band.parent = root;
  }
  if (appearance.bag !== "none") {
    const bag = box("closed-study-bag", 0.5, 0.58, 0.22, 0, 1.02, -0.31, bagMaterial);
    bag.rotation.x = -0.12;
    if (appearance.bag === "satchel") {
      const strap = box("satchel-strap", 0.1, 1.1, 0.08, 0.15, 1.17, -0.24, accent, -0.34);
      strap.rotation.x = -0.32;
    } else {
      box("backpack-pocket", 0.32, 0.22, 0.06, 0, 0.9, -0.44, accent);
    }
  }
  if (appearance.details === "glasses") {
    for (const x of [-0.15, 0.15]) {
      const lens = MeshBuilder.CreateTorus("round-glasses-frame", { diameter: 0.22, thickness: 0.025, tessellation: 18 }, scene);
      lens.position.set(x, 1.96, 0.366);
      lens.scaling.y = 0.78;
      lens.material = accent;
      lens.parent = root;
    }
    box("glasses-bridge", 0.1, 0.035, 0.035, 0, 1.97, 0.375, accent);
  }

  // Every appearance update rebuilds only the model under this stable root.
  root.metadata = { ...(root.metadata || {}), appearanceMaterials: materials };
  if (!animated) return { leftArm, rightArm, leftLeg: root.getChildMeshes()[0]!, rightLeg: root.getChildMeshes()[1]! };
  const legs = root.getChildMeshes().filter((mesh) => mesh.name === "covered-trousers");
  return { leftArm, rightArm, leftLeg: legs[0]!, rightLeg: legs[1]! };
}
