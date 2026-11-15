import { mountAcademy } from "./academy";
import type { AcademicWorld, WorldOptions } from "./types";

declare global {
  interface Window {
    AcademicQuest?: {
      mountAcademy: (canvas: HTMLCanvasElement, options: WorldOptions) => AcademicWorld;
    };
  }
}

window.AcademicQuest = { mountAcademy };
