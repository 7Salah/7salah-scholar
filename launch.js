// Small, lazy platform entry point. Babylon is only loaded after navigating into the game.
(() => {
  const view = document.getElementById("view");
  if (!view) return;

  const style = document.createElement("style");
  style.textContent = `
    .aq-launch { display:flex; align-items:center; gap:16px; margin:0 16px 18px; padding:18px 20px;
      color:#f6f7fb; text-decoration:none; border:1px solid rgba(160,205,220,.28); border-radius:20px;
      background:radial-gradient(circle at 88% 0%,rgba(74,183,180,.25),transparent 42%),linear-gradient(125deg,#102748,#183b5c 65%,#285b69);
      box-shadow:0 14px 34px rgba(16,39,72,.2); overflow:hidden; }
    .aq-launch:focus-visible { outline:3px solid #70d7cf; outline-offset:3px; }
    .aq-launch-mark { width:48px;height:48px;flex:0 0 48px;display:grid;place-items:center;border-radius:15px;
      color:#e8d5a4;background:rgba(255,255,255,.1);font-size:25px; }
    .aq-launch-copy { flex:1; min-width:0; }
    .aq-launch-copy small { display:block;color:#9dc7ce;font-size:10px;font-weight:800;letter-spacing:.12em; }
    .aq-launch-copy b { display:block;margin-top:3px;font-size:17px; }
    .aq-launch-copy span { display:block;margin-top:3px;color:#d2deeb;font-size:12px;line-height:1.5; }
    .aq-launch-arrow { color:#f1d99c;font-size:22px; }
    @media(max-width:420px){.aq-launch{margin-inline:12px;padding:15px;gap:12px}.aq-launch-mark{width:42px;height:42px;flex-basis:42px}.aq-launch-copy b{font-size:15px}.aq-launch-copy span{font-size:11px}}
  `;
  document.head.append(style);

  const appState = () => {
    try { return typeof S !== "undefined" ? S : null; }
    catch { return null; }
  };
  const addEntry = () => {
    const state = appState();
    const active = state && state.tab === "home";
    const current = view.querySelector(".aq-launch");
    if (!active) {
      current?.remove();
      return;
    }
    if (current || !view.firstElementChild) return;
    const arabic = !state || state.lang !== "en";
    const link = document.createElement("a");
    link.className = "aq-launch";
    link.href = new URL(`game/dist/?lang=${arabic ? "ar" : "en"}`, document.baseURI).href;
    link.setAttribute("aria-label", arabic ? "دخول Academic Quest واستكشاف الأكاديمية" : "Enter Academic Quest and explore the academy");
    link.innerHTML = `<span class="aq-launch-mark" aria-hidden="true">✦</span>
      <span class="aq-launch-copy"><small>7SALAH SCHOLAR · ACADEMIC QUEST</small>
      <b>${arabic ? "استكشف الأكاديمية" : "Explore the academy"}</b>
      <span>${arabic ? "مساحة جامعية ثلاثية الأبعاد — ادخل وجربها" : "A 3D university space — step inside and explore"}</span></span>
      <span class="aq-launch-arrow" aria-hidden="true">${arabic ? "←" : "→"}</span>`;
    view.prepend(link);
  };

  new MutationObserver(addEntry).observe(view, { childList: true, subtree: true });
  addEntry();
})();
