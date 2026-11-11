import type { AvatarModel } from "./avatar-manifest";
import type { AvatarStatus } from "./avatar-glb";

export type GraphicsQuality = "low" | "medium" | "high";

export type Appearance = {
  hairStyle: "short" | "bob" | "long" | "ponytail";
  hairColor: string;
  eyeColor: string;
  outfitColor: string;
  shoesColor: string;
  bag: "backpack" | "satchel" | "none";
  accessory: "hairclip" | "headband" | "none";
  theme: "aqua" | "gold" | "rose";
  details: "trim" | "classic" | "glasses";
};

export type WorldOptions = {
  quality: GraphicsQuality;
  appearance: Appearance;
  onInteract: () => void;
  onPrompt: (visible: boolean) => void;
  onEscape: () => void;
  avatar?: { model?: AvatarModel | null; onStatus?: (status: AvatarStatus) => void };
};

export type AcademicWorld = {
  pause: () => void;
  resume: () => void;
  dispose: () => void;
  setQuality: (quality: GraphicsQuality) => void;
  setAppearance: (appearance: Appearance) => void;
  setAvatarModel?: (model: AvatarModel | null) => void;
  setVirtualMove: (x: number, y: number) => void;
  setRunning: (running: boolean) => void;
  jump: () => void;
  interact: () => void;
};
