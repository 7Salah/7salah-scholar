import { parseManifest } from "./avatar-manifest";
import type { AvatarModel } from "./avatar-manifest";
import type { AcademicWorld, Appearance, GraphicsQuality, WorldOptions } from "./types";

type Lang = "ar" | "en";
type SessionUser = { email?: string; user_metadata?: Record<string, unknown> };

declare global {
  interface Window {
    SUPA?: { url?: string; key?: string };
    supabase?: {
      createClient: (
        url: string,
        key: string,
        options?: { auth?: { autoRefreshToken?: boolean; detectSessionInUrl?: boolean } }
      ) => {
        auth: {
          getSession: () => Promise<{
            data: { session: { user?: SessionUser } | null };
            error: Error | null;
          }>;
        };
      };
    };
    AcademicQuest?: {
      mountAcademy: (canvas: HTMLCanvasElement, options: WorldOptions) => AcademicWorld;
    };
  }
}

const text = {
  ar: {
    back: "العودة للمنصة", level: "المستوى", xp: "خبرة تجريبية", location: "ساحة الأكاديمية",
    title: "أكاديميتك بانتظارك", intro: "ادخل الساحة الجامعية، تعرّف إلى شخصيتك، واستكشف أول مساحة تعليمية ثلاثية الأبعاد.",
    "single-player": "استكشاف فردي", "no-xp": "الخبرة تجريبية", enter: "دخول الأكاديمية",
    "session-check": "يتم التحقق من جلسة المنصة عند الدخول…", character: "الشخصية",
    customize: "تخصيص المظهر", hair: "تسريحة الشعر", "hair-color": "لون الشعر", "eye-color": "لون العينين",
    outfit: "الزي المحتشم", shoes: "الحذاء", bag: "الحقيبة", accessory: "الإكسسوار",
    theme: "سمة الألوان", details: "تفاصيل بصرية",
    "custom-note": "شخصية مؤقتة؛ الحركة والكاميرا منفصلتان وجاهزتان لاستبدالها بنموذج GLB لاحقاً.",
    settings: "الإعدادات", graphics: "جودة الرسوم",
    "settings-note": "تُحفظ هذه الخيارات على هذا الجهاز فقط. لن تُحفظ خبرة حقيقية أو بيانات حساب.",
    paused: "اللعبة متوقفة مؤقتاً", resume: "متابعة اللعب", return: "العودة إلى المنصة",
    run: "جري", jump: "قفز", interact: "تفاعل", move: "حركة", menu: "القائمة", loading: "جارٍ تجهيز الأكاديمية…",
    "session-ready": "تم العثور على جلسة المنصة الحالية.", "session-guest": "لم توجد جلسة محفوظة؛ يمكنك الاستكشاف كضيف.",
    "session-unavailable": "تعذر قراءة الجلسة؛ يمكنك الدخول كضيف.", loadingSdk: "جارٍ التحقق من جلسة المنصة…",
    loadingWorld: "جارٍ إنشاء المشهد ثلاثي الأبعاد…", "interaction-near": "تفاعل مع بوابة المعرفة",
    "interaction-done": "مرحباً بك في أكاديمية 7Salah! هذه مساحة استكشاف أولية.",
    "character-short": "قصير", "character-bob": "بوب", "character-long": "طويل", "character-ponytail": "ذيل حصان",
    "outfit-blue": "أزرق أكاديمي", "outfit-purple": "بنفسجي أنيق", "outfit-green": "أخضر هادئ", "outfit-coral": "مرجاني دافئ",
    "shoes-ivory": "عاجي", "shoes-navy": "كحلي", "shoes-leather": "جلدي",
    "bag-backpack": "حقيبة ظهر", "bag-satchel": "حقيبة كتف", "bag-none": "بدون",
    "accessory-star": "مشبك نجمة", "accessory-band": "عصابة رأس", "accessory-none": "بدون",
    "theme-aqua": "أكوا", "theme-gold": "ذهبي", "theme-rose": "وردي",
    "detail-trim": "حواف مضيئة", "detail-classic": "كلاسيكي", "detail-glasses": "نظارات دائرية",
    "avatar-model": "نموذج الشخصية", "avatar-procedural": "إجرائي (افتراضي)", "avatar-fallback": "تعذر تحميل النموذج؛ عدنا إلى الشخصية الافتراضية.", "avatar-loading": "جارٍ تحميل النموذج…",
    "quality-low": "منخفضة · الهاتف", "quality-medium": "متوسطة", "quality-high": "عالية"
  },
  en: {
    back: "Back to platform", level: "Level", xp: "Experimental XP", location: "Academy courtyard",
    title: "Your academy awaits", intro: "Enter the university courtyard, meet your character, and explore the first 3D learning space.",
    "single-player": "Solo exploration", "no-xp": "XP is experimental", enter: "Enter academy",
    "session-check": "Your platform session will be checked when you enter…", character: "Character",
    customize: "Customize appearance", hair: "Hairstyle", "hair-color": "Hair color", "eye-color": "Eye color",
    outfit: "Modest outfit", shoes: "Shoes", bag: "Bag", accessory: "Accessory",
    theme: "Color theme", details: "Visual details",
    "custom-note": "Temporary avatar. Movement and camera are separate and ready for a future GLB model.",
    settings: "Settings", graphics: "Graphics quality",
    "settings-note": "Preferences stay on this device. No real XP or account data is saved.",
    paused: "Game paused", resume: "Resume", return: "Return to the platform",
    run: "Run", jump: "Jump", interact: "Interact", move: "Move", menu: "Menu", loading: "Preparing the academy…",
    "session-ready": "Your current platform session was found.", "session-guest": "No saved session was found; you can explore as a guest.",
    "session-unavailable": "Could not read the session; you can continue as a guest.", loadingSdk: "Checking your platform session…",
    loadingWorld: "Building the 3D scene…", "interaction-near": "Interact with the knowledge gate",
    "interaction-done": "Welcome to 7Salah Academy! This is an early exploration space.",
    "character-short": "Short", "character-bob": "Bob", "character-long": "Long", "character-ponytail": "Ponytail",
    "outfit-blue": "Academic blue", "outfit-purple": "Elegant violet", "outfit-green": "Calm green", "outfit-coral": "Warm coral",
    "shoes-ivory": "Ivory", "shoes-navy": "Navy", "shoes-leather": "Leather",
    "bag-backpack": "Backpack", "bag-satchel": "Satchel", "bag-none": "None",
    "accessory-star": "Star clip", "accessory-band": "Headband", "accessory-none": "None",
    "theme-aqua": "Aqua", "theme-gold": "Gold", "theme-rose": "Rose",
    "detail-trim": "Luminous trim", "detail-classic": "Classic", "detail-glasses": "Round glasses",
    "avatar-model": "Character model", "avatar-procedural": "Procedural (default)", "avatar-fallback": "Could not load the model; using the default character.", "avatar-loading": "Loading model…",
    "quality-low": "Low · mobile", "quality-medium": "Medium", "quality-high": "High"
  }
} as const;

const params = new URLSearchParams(location.search);
const lang: Lang = params.get("lang") === "en" ? "en" : "ar";
const copy = text[lang];
document.documentElement.lang = lang;
document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

function el<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing game element: ${id}`);
  return found as T;
}

function localize() {
  document.querySelectorAll<HTMLElement>("[data-copy]").forEach((node) => {
    const key = node.dataset.copy as keyof typeof copy;
    if (key in copy) node.textContent = copy[key];
  });
  const optionLabels: Record<string, Record<string, keyof typeof copy>> = {
    "hair-style": { short: "character-short", bob: "character-bob", long: "character-long", ponytail: "character-ponytail" },
    outfit: { "#345f91": "outfit-blue", "#745b91": "outfit-purple", "#3e766b": "outfit-green", "#b06755": "outfit-coral" },
    shoes: { "#f2eee7": "shoes-ivory", "#243248": "shoes-navy", "#a97849": "shoes-leather" },
    bag: { backpack: "bag-backpack", satchel: "bag-satchel", none: "bag-none" },
    accessory: { hairclip: "accessory-star", headband: "accessory-band", none: "accessory-none" },
    theme: { aqua: "theme-aqua", gold: "theme-gold", rose: "theme-rose" },
    details: { trim: "detail-trim", classic: "detail-classic", glasses: "detail-glasses" },
    "graphics-quality": { low: "quality-low", medium: "quality-medium", high: "quality-high" }
  };
  for (const [id, labels] of Object.entries(optionLabels)) {
    document.querySelectorAll<HTMLSelectElement>(`#${id} option`).forEach((option) => {
      const key = labels[option.value];
      if (key) option.textContent = copy[key];
    });
  }
}
localize();

function readLocal<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing may block storage. */ }
}

function getAppearance(): Appearance {
  const fallback: Appearance = {
    hairStyle: "short", hairColor: "#28334f", eyeColor: "#62d3d0", outfitColor: "#345f91",
    shoesColor: "#f2eee7", bag: "backpack", accessory: "hairclip", theme: "aqua", details: "trim"
  };
  const stored = readLocal<Partial<Appearance>>("academicQuest:appearance", {});
  const choose = <T extends string>(value: unknown, allowed: readonly T[], otherwise: T): T =>
    allowed.includes(value as T) ? value as T : otherwise;
  const hex = (value: unknown, otherwise: string) =>
    typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : otherwise;
  return {
    hairStyle: choose(stored.hairStyle, ["short", "bob", "long", "ponytail"], fallback.hairStyle),
    hairColor: hex(stored.hairColor, fallback.hairColor),
    eyeColor: hex(stored.eyeColor, fallback.eyeColor),
    outfitColor: choose(stored.outfitColor, ["#345f91", "#745b91", "#3e766b", "#b06755"], fallback.outfitColor),
    shoesColor: choose(stored.shoesColor, ["#f2eee7", "#243248", "#a97849"], fallback.shoesColor),
    bag: choose(stored.bag, ["backpack", "satchel", "none"], fallback.bag),
    accessory: choose(stored.accessory, ["hairclip", "headband", "none"], fallback.accessory),
    theme: choose(stored.theme, ["aqua", "gold", "rose"], fallback.theme),
    details: choose(stored.details, ["trim", "classic", "glasses"], fallback.details)
  };
}
function fillAppearance(a: Appearance) {
  el<HTMLSelectElement>("hair-style").value = a.hairStyle;
  el<HTMLInputElement>("hair-color").value = a.hairColor;
  el<HTMLInputElement>("eye-color").value = a.eyeColor;
  el<HTMLSelectElement>("outfit").value = a.outfitColor;
  el<HTMLSelectElement>("shoes").value = a.shoesColor;
  el<HTMLSelectElement>("bag").value = a.bag;
  el<HTMLSelectElement>("accessory").value = a.accessory;
  el<HTMLSelectElement>("theme").value = a.theme;
  el<HTMLSelectElement>("details").value = a.details;
}

let appearance = getAppearance();
fillAppearance(appearance);
const defaultQuality: GraphicsQuality = matchMedia("(pointer: coarse)").matches ? "low" : "medium";
const savedQuality = readLocal<GraphicsQuality>("academicQuest:graphics", defaultQuality);
let quality: GraphicsQuality = ["low", "medium", "high"].includes(savedQuality) ? savedQuality : defaultQuality;
el<HTMLSelectElement>("graphics-quality").value = quality;

// Optional GLB avatars (22.1). Absent/invalid manifest => the procedural avatar is used, silently.
let avatarModels: AvatarModel[] = [];
let avatarModel: AvatarModel | null = null;
const avatarReady = (async () => {
  try {
    const res = await fetch(new URL("./avatars/manifest.json", location.href).href, { cache: "no-cache" });
    if (!res.ok) return;
    avatarModels = parseManifest(await res.json());
    if (!avatarModels.length) return;
    const select = el<HTMLSelectElement>("avatar-model");
    el("avatar-model-row").hidden = false;
    select.options[0]!.textContent = copy["avatar-procedural"];
    for (const m of avatarModels) select.add(new Option(m.name, m.id));
    const saved = readLocal<string>("academicQuest:avatarModel", "");
    avatarModel = avatarModels.find((m) => m.id === saved) ?? null;
    select.value = avatarModel?.id ?? "";
  } catch { /* keep procedural */ }
})();
const avatarOptions = () => ({
  model: avatarModel,
  onStatus: (s: { kind: string }) => {
    if (s.kind === "fallback") showToast(copy["avatar-fallback"]);
    else if (s.kind === "loading") showToast(copy["avatar-loading"]);
  }
});

let world: AcademicWorld | null = null;
let paused = false;
let toastTimer = 0;
const toastNode = el<HTMLDivElement>("toast");
const showToast = (message: string) => {
  toastNode.textContent = message;
  toastNode.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastNode.classList.remove("show"), 2800);
};
const setPause = (value: boolean) => {
  if (!world) return;
  paused = value;
  el("pause-screen").hidden = !value;
  if (value) world.pause();
  else world.resume();
};

async function loadSupabaseSdk(): Promise<void> {
  if (window.supabase) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
    script.async = true;
    script.onload = () => window.supabase ? resolve() : reject(new Error("Supabase SDK did not initialize"));
    script.onerror = () => reject(new Error("Supabase SDK could not be loaded"));
    document.head.append(script);
  });
}

async function readCurrentStudentName(): Promise<{ name: string | null; hasSession: boolean }> {
  const config = window.SUPA;
  if (!config?.url || !config.key) return { name: null, hasSession: false };
  await loadSupabaseSdk();
  // Match the host app's URL, key, SDK version, and default storage key. Disable refresh;
  // this page only reads the current session and never queries a table or writes account data.
  const client = window.supabase!.createClient(config.url, config.key, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false }
  });
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const user = data.session?.user;
  if (!user) return { name: null, hasSession: false };
  const meta = user.user_metadata || {};
  const fullName = [meta.full_name, meta.name, meta.display_name, meta.first_name, meta.username]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);
  return {
    name: fullName?.trim() || null,
    hasSession: true
  };
}

async function loadAcademyEntry(): Promise<void> {
  if (window.AcademicQuest) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = new URL(
      import.meta.env.DEV ? "./src/academy-entry.ts" : "./assets/academy-entry.js",
      location.href
    ).href;
    script.onload = () => window.AcademicQuest ? resolve() : reject(new Error("Academy module did not initialize"));
    script.onerror = () => reject(new Error("Academy module could not be loaded"));
    document.head.append(script);
  });
}

async function enterAcademy() {
  const enter = el<HTMLButtonElement>("enter-academy");
  if (enter.disabled) return;
  enter.disabled = true;
  el("loading-screen").hidden = false;
  el<HTMLElement>("session-note").textContent = copy.loadingSdk;
  let sessionState: { name: string | null; hasSession: boolean } = { name: null, hasSession: false };
  await avatarReady;
  try {
    sessionState = await readCurrentStudentName();
    el("session-note").textContent = sessionState.hasSession ? copy["session-ready"] : copy["session-guest"];
  } catch {
    el("session-note").textContent = copy["session-unavailable"];
  }
  el<HTMLElement>("player-name").textContent = sessionState.name || (lang === "ar" ? "مستكشف الأكاديمية" : "Academy explorer");
  el<HTMLElement>("loading-screen").querySelector("b")!.textContent = copy.loadingWorld;

  try {
    // Babylon's independent entry and vendor chunks are requested only after this button is pressed.
    await loadAcademyEntry();
    if (!window.AcademicQuest) throw new Error("Academy module did not initialize");
    world = window.AcademicQuest.mountAcademy(el<HTMLCanvasElement>("academy-canvas"), {
      quality,
      appearance,
      onInteract: () => showToast(copy["interaction-done"]),
      onPrompt: (visible) => {
        const prompt = el<HTMLDivElement>("interaction-prompt");
        prompt.hidden = !visible;
        const label = prompt.querySelector("span");
        if (label) label.textContent = copy["interaction-near"];
      },
      onEscape: () => setPause(!paused),
      avatar: avatarOptions()
    });
    el("welcome-screen").hidden = true;
    el("loading-screen").hidden = true;
    enter.disabled = false;
    el<HTMLCanvasElement>("academy-canvas").focus({ preventScroll: true });
  } catch {
    el("loading-screen").hidden = true;
    enter.disabled = false;
    showToast(lang === "ar"
      ? "تعذر تحميل محرك اللعبة. تحقق من الاتصال ثم حاول مجدداً."
      : "Could not load the game engine. Check your connection and try again.");
  }
}

el<HTMLButtonElement>("enter-academy").addEventListener("click", () => void enterAcademy());
el<HTMLButtonElement>("pause-open").addEventListener("click", () => setPause(true));
el<HTMLButtonElement>("resume-game").addEventListener("click", () => {
  setPause(false);
  el<HTMLCanvasElement>("academy-canvas").focus({ preventScroll: true });
});
el<HTMLButtonElement>("customize-open").addEventListener("click", () => { el("customize-panel").hidden = false; });
el<HTMLButtonElement>("settings-open").addEventListener("click", () => { el("settings-panel").hidden = false; });
document.querySelectorAll<HTMLButtonElement>("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    el(button.dataset.close!).hidden = true;
    el<HTMLCanvasElement>("academy-canvas").focus({ preventScroll: true });
  });
});

const lookControls = ["hair-style", "hair-color", "eye-color", "outfit", "shoes", "bag", "accessory", "theme", "details"];
const refreshAppearance = () => {
  appearance = {
    hairStyle: el<HTMLSelectElement>("hair-style").value as Appearance["hairStyle"],
    hairColor: el<HTMLInputElement>("hair-color").value,
    eyeColor: el<HTMLInputElement>("eye-color").value,
    outfitColor: el<HTMLSelectElement>("outfit").value,
    shoesColor: el<HTMLSelectElement>("shoes").value,
    bag: el<HTMLSelectElement>("bag").value as Appearance["bag"],
    accessory: el<HTMLSelectElement>("accessory").value as Appearance["accessory"],
    theme: el<HTMLSelectElement>("theme").value as Appearance["theme"],
    details: el<HTMLSelectElement>("details").value as Appearance["details"]
  };
  writeLocal("academicQuest:appearance", appearance);
  world?.setAppearance(appearance);
};
lookControls.forEach((id) => {
  const input = el<HTMLInputElement | HTMLSelectElement>(id);
  input.addEventListener("input", refreshAppearance);
  input.addEventListener("change", refreshAppearance);
});
el<HTMLSelectElement>("graphics-quality").addEventListener("change", (event) => {
  quality = (event.currentTarget as HTMLSelectElement).value as GraphicsQuality;
  writeLocal("academicQuest:graphics", quality);
  world?.setQuality(quality);
  if (avatarModel) world?.setAvatarModel?.(avatarModel);   // re-check the performance budget for the new quality
});
el<HTMLSelectElement>("avatar-model").addEventListener("change", (event) => {
  const id = (event.currentTarget as HTMLSelectElement).value;
  avatarModel = avatarModels.find((m) => m.id === id) ?? null;
  writeLocal("academicQuest:avatarModel", id);
  world?.setAvatarModel?.(avatarModel);
});

const joystick = el<HTMLDivElement>("joystick");
const knob = joystick.querySelector<HTMLElement>(".joystick-knob")!;
let stickPointer: number | null = null;
const updateStick = (event: PointerEvent) => {
  if (event.pointerId !== stickPointer) return;
  const rect = joystick.getBoundingClientRect();
  const radius = rect.width / 2 - 25;
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const length = Math.hypot(dx, dy);
  const scale = length > radius ? radius / length : 1;
  const x = Math.max(-1, Math.min(1, (dx * scale) / radius));
  const y = Math.max(-1, Math.min(1, (dy * scale) / radius));
  knob.style.transform = `translate(calc(-50% + ${x * radius}px), calc(-50% + ${y * radius}px))`;
  world?.setVirtualMove(x, y);
};
const resetStick = (event: PointerEvent) => {
  if (event.pointerId !== stickPointer) return;
  stickPointer = null;
  knob.style.transform = "translate(-50%, -50%)";
  world?.setVirtualMove(0, 0);
};
joystick.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  stickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  updateStick(event);
});
joystick.addEventListener("pointermove", updateStick);
joystick.addEventListener("pointerup", resetStick);
joystick.addEventListener("pointercancel", resetStick);

const runButton = el<HTMLButtonElement>("touch-run");
runButton.addEventListener("pointerdown", (event) => { event.preventDefault(); world?.setRunning(true); });
["pointerup", "pointercancel", "pointerleave"].forEach((type) =>
  runButton.addEventListener(type, () => world?.setRunning(false))
);
el<HTMLButtonElement>("touch-jump").addEventListener("pointerdown", (event) => { event.preventDefault(); world?.jump(); });
el<HTMLButtonElement>("touch-interact").addEventListener("click", () => world?.interact());

document.addEventListener("visibilitychange", () => {
  if (!world) return;
  if (document.hidden) world.pause();
  else if (!paused) world.resume();
});
window.addEventListener("pagehide", () => world?.dispose(), { once: true });
