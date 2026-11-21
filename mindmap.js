/* 7Salah Mind Maps v1 - ملف مستقل. الاستخدام: MindMap.open() */
(function () {
  "use strict";
  var KEY = "7s_mindmaps_v1";
  var NAVY = "#0a1a4a", GOLD = "#d4a93a";
  var COLORS = ["#d4a93a", "#2f6fed", "#1f9d6b", "#d9534f", "#8e5bd6", "#e07b39"];
  var W = 150, H = 46, GX = 46, GY = 12;
  var uid = function () { return Math.random().toString(36).slice(2, 9); };
  var st = { maps: [], cur: null, sel: null, scale: 1, review: false, shown: {} };
  var el = {};

  var P = {
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.2-1.7-.4-1 .2-2.1 1.4-2.1H17a4 4 0 0 0 4-4c0-5-4-10.2-9-10.2Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    fold: '<path d="m6 9 6 6 6-6"/>',
    unfold: '<path d="m15 6-6 6 6 6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1"/><path d="M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    spark: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z"/>',
    load: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>'
  };
  function ic(n) {
    return '<svg class="ic' + (n === "load" ? " spin" : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + P[n] + "</svg>";
  }

  function load() {
    try { st.maps = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { st.maps = []; }
    if (!st.maps.length) st.maps = [newMap("خريطتي الأولى")];
    st.cur = st.maps[0];
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st.maps)); } catch (e) {} }
  function newMap(title) {
    return { id: uid(), title: title, root: { id: uid(), t: title, c: GOLD, open: true, kids: [] } };
  }
  function norm(n, depth) {
    var o = { id: uid(), t: String((n && (n.t || n.title || n.name)) || "؟").slice(0, 80), c: null, open: true, kids: [] };
    var k = (n && (n.kids || n.children)) || [];
    if (depth < 5 && Array.isArray(k)) o.kids = k.slice(0, 12).map(function (x) { return norm(x, depth + 1); });
    return o;
  }
  function find(n, id, parent) {
    if (n.id === id) return { n: n, p: parent };
    for (var i = 0; i < n.kids.length; i++) { var r = find(n.kids[i], id, n); if (r) return r; }
    return null;
  }

  var cursor, pos;
  function layout(n, d, col) {
    var c = n.c || col;
    var vis = n.open && n.kids.length ? n.kids : [];
    if (!vis.length) { pos[n.id] = { x: d * (W + GX), y: cursor, c: c, n: n }; cursor += H + GY; return; }
    vis.forEach(function (k) { layout(k, d + 1, d === 0 ? (k.c || COLORS[(n.kids.indexOf(k) + 1) % COLORS.length]) : c); });
    var a = pos[vis[0].id].y, b = pos[vis[vis.length - 1].id].y;
    pos[n.id] = { x: d * (W + GX), y: (a + b) / 2, c: c, n: n };
  }

  function css() {
    if (document.getElementById("mm-css")) return;
    var s = document.createElement("style"); s.id = "mm-css";
    s.textContent =
      "#mm{position:fixed;inset:0;z-index:99999;background:radial-gradient(circle at 80% 0,#16285f 0,#0c1633 55%);color:#fff;font-family:inherit;display:flex;flex-direction:column;direction:rtl}" +
      "#mm .bar{display:flex;gap:7px;align-items:center;padding:8px 10px;padding-top:calc(8px + env(safe-area-inset-top,0px));background:#0a1a4aee;border-bottom:1px solid #d4a93a44}" +
      "#mm .bar b{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;padding:0 4px}" +
      "#mm button{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#ffffff12;color:#e8eeff;border:1px solid #ffffff22;border-radius:13px;min-width:40px;height:40px;padding:0;font-family:inherit;-webkit-tap-highlight-color:transparent;transition:transform .12s,background .15s}" +
      "#mm button:active{transform:scale(.92)}" +
      "#mm button.on{background:" + GOLD + ";color:" + NAVY + ";border-color:" + GOLD + "}" +
      "#mm button.gold{background:linear-gradient(135deg,#f0cf6e," + GOLD + ");color:" + NAVY + ";border-color:#f0cf6e;box-shadow:0 0 14px #d4a93a55}" +
      "#mm button:disabled{opacity:.7}" +
      "#mm .ic{width:20px;height:20px;flex:none}" +
      "#mm .spin{animation:mmspin .9s linear infinite}@keyframes mmspin{to{transform:rotate(360deg)}}" +
      "#mm .area{flex:1;overflow:auto;direction:ltr;-webkit-overflow-scrolling:touch}" +
      "#mm .stage{position:relative;transform-origin:0 0}" +
      "#mm .nd{position:absolute;width:" + W + "px;height:" + H + "px;box-sizing:border-box;border-radius:15px;padding:4px 10px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:13px;line-height:1.3;direction:rtl;background:linear-gradient(160deg,#1c2b5e,#121e45);border:2px solid;overflow:hidden;box-shadow:0 4px 12px #0006;transition:box-shadow .15s}" +
      "#mm .nd span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
      "#mm .nd.sel{box-shadow:0 0 0 3px #fff,0 6px 18px #000a}" +
      "#mm .nd.root{background:linear-gradient(135deg,#f0cf6e," + GOLD + ");color:" + NAVY + ";font-weight:700;font-size:14px;box-shadow:0 0 22px #d4a93a66}" +
      "#mm .nd.hide span{filter:blur(6px)}" +
      "#mm .cnt{position:absolute;top:2px;left:4px;background:#fff;color:" + NAVY + ";border-radius:10px;font-size:11px;font-style:normal;font-weight:700;padding:0 6px}" +
      "#mm .act{display:flex;gap:8px;justify-content:center;padding:9px;padding-bottom:calc(9px + env(safe-area-inset-bottom,0px));background:#0a1a4aee;border-top:1px solid #d4a93a44;flex-wrap:wrap}" +
      "#mm .act button.lb{height:46px;padding:0 14px;font-size:14px}" +
      "#mm .sheet{position:absolute;inset:auto 0 0 0;max-height:70%;overflow:auto;background:#101c40;border-top:2px solid " + GOLD + ";border-radius:20px 20px 0 0;padding:14px;box-shadow:0 -10px 30px #000a}" +
      "#mm .sheet button.lb{width:100%;height:46px;margin-top:6px}" +
      "#mm .row{display:flex;gap:8px;margin:7px 0;align-items:center}" +
      "#mm .row .t{flex:1;padding:12px;border-radius:12px;background:#ffffff10}" +
      "#mm .hint{opacity:.65;font-size:12.5px;text-align:center;padding:6px}";
    document.head.appendChild(s);
  }

  function btn(icon, label, fn, cls) {
    var b = document.createElement("button");
    b.innerHTML = ic(icon) + (label ? "<span>" + label + "</span>" : "");
    if (label) b.className = "lb";
    if (cls) b.className += " " + cls;
    b.onclick = fn; return b;
  }

  function render() {
    var area = el.area; var oldL = area.scrollLeft, oldT = area.scrollTop, first = !el.stage;
    cursor = 0; pos = {}; layout(st.cur.root, 0, GOLD);
    var maxD = 0, ids = Object.keys(pos);
    ids.forEach(function (i) { if (pos[i].x > maxD) maxD = pos[i].x; });
    var tw = maxD + W + 40, th = cursor + 20;
    var stage = document.createElement("div"); stage.className = "stage";
    stage.style.width = tw + "px"; stage.style.height = th + "px"; stage.style.transform = "scale(" + st.scale + ")";
    var NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", tw); svg.setAttribute("height", th);
    svg.style.cssText = "position:absolute;left:0;top:0";
    stage.appendChild(svg);
    var X = function (p) { return tw - 20 - W - p.x; }; // الجذر يمين، والفروع تتجه يساراً
    ids.forEach(function (id) {
      var p = pos[id], n = p.n;
      if (n.open) n.kids.forEach(function (k) {
        var q = pos[k.id]; if (!q) return;
        var x1 = X(p), y1 = p.y + H / 2 + 10, x2 = X(q) + W, y2 = q.y + H / 2 + 10, mx = (x1 + x2) / 2;
        var path = document.createElementNS(NS, "path");
        path.setAttribute("d", "M" + x1 + " " + y1 + " C" + mx + " " + y1 + " " + mx + " " + y2 + " " + x2 + " " + y2);
        path.setAttribute("stroke", q.c); path.setAttribute("stroke-width", "2.5"); path.setAttribute("fill", "none");
        path.setAttribute("opacity", ".8"); svg.appendChild(path);
      });
      var d = document.createElement("div");
      var isRoot = n === st.cur.root;
      d.className = "nd" + (isRoot ? " root" : "") + (st.sel === n.id ? " sel" : "");
      d.style.left = X(p) + "px"; d.style.top = p.y + 10 + "px"; d.style.borderColor = p.c;
      var sp = document.createElement("span"); sp.textContent = n.t; d.appendChild(sp);
      if (st.review && !isRoot && !n.kids.length && !st.shown[n.id]) d.classList.add("hide");
      if (n.kids.length && !n.open) { var c = document.createElement("i"); c.className = "cnt"; c.textContent = "+" + n.kids.length; d.appendChild(c); }
      d.onclick = function () {
        if (d.classList.contains("hide")) st.shown[n.id] = true;
        st.sel = st.sel === n.id && !d.classList.contains("hide") ? st.sel : n.id; render(); bar();
      };
      stage.appendChild(d);
    });
    var wrap = document.createElement("div");
    wrap.style.cssText = "width:" + tw * st.scale + "px;height:" + th * st.scale + "px;overflow:hidden";
    wrap.appendChild(stage);
    area.innerHTML = ""; area.appendChild(wrap); el.stage = stage;
    if (first) area.scrollLeft = area.scrollWidth; else { area.scrollLeft = oldL; area.scrollTop = oldT; }
    el.title.textContent = st.cur.title;
  }

  function bar() {
    var a = el.act; a.innerHTML = "";
    var f = st.sel && find(st.cur.root, st.sel, null);
    if (!f) { var h = document.createElement("div"); h.className = "hint"; h.textContent = "اضغط على أي فرع لتعديله، أو اضغط زر النجمة الذهبية ليولّد لك المساعد خريطة"; a.appendChild(h); return; }
    var n = f.n;
    a.appendChild(btn("plus", "فرع", function () { var t = prompt("نص الفرع الجديد:"); if (t && t.trim()) { n.kids.push({ id: uid(), t: t.trim(), c: null, open: true, kids: [] }); n.open = true; save(); render(); } }));
    a.appendChild(btn("edit", "تعديل", function () { var t = prompt("عدّل النص:", n.t); if (t && t.trim()) { n.t = t.trim(); if (n === st.cur.root) st.cur.title = n.t; save(); render(); } }));
    if (f.p) {
      a.appendChild(btn("trash", "حذف", function () { if (confirm("حذف هذا الفرع وما تحته؟")) { f.p.kids = f.p.kids.filter(function (k) { return k !== n; }); st.sel = null; save(); render(); bar(); } }));
      a.appendChild(btn("palette", "لون", function () { var i = COLORS.indexOf(n.c); n.c = COLORS[(i + 1) % COLORS.length]; save(); render(); }));
    }
    if (n.kids.length) a.appendChild(btn(n.open ? "fold" : "unfold", n.open ? "طيّ" : "توسيع", function () { n.open = !n.open; save(); render(); bar(); }));
  }

  function aiGen() {
    var f = st.sel && find(st.cur.root, st.sel, null), target = f ? f.n : st.cur.root;
    var hasData = target.kids.length > 0;
    var ask = hasData ? "ماذا تريد من المساعد أن يفعل بفرع «" + target.t + "»؟ (مثال: أضف تفاصيل، اختصر، أضف أمثلة)" : "اكتب الموضوع الذي تريد خريطة له:";
    var q = prompt(ask, hasData ? "" : target.t); if (!q) return;
    if (typeof window.MindMapAI !== "function") { alert("ربط الذكاء الاصطناعي لم يُفعَّل بعد في التطبيق."); return; }
    el.ai.innerHTML = ic("load"); el.ai.disabled = true;
    var tree = (function cp(n) { return { t: n.t, kids: n.kids.map(cp) }; })(target);
    Promise.resolve(window.MindMapAI({ mode: hasData ? "edit" : "generate", topic: st.cur.title, instruction: q, tree: tree }))
      .then(function (r) {
        if (!r || !(r.t || r.title || r.name)) throw new Error("bad");
        var nn = norm(r, 0); target.kids = nn.kids; target.open = true;
        if (!hasData && target === st.cur.root && r.t) { /* نحتفظ بعنوان الجذر */ }
        save(); render(); bar();
      })
      .catch(function () { alert("تعذّر توليد الخريطة الآن. حاول لاحقاً (قد تكون حصة الذكاء مؤقتاً قد نفدت)."); })
      .then(function () { el.ai.innerHTML = ic("spark"); el.ai.disabled = false; });
  }

  function list() {
    var s = document.createElement("div"); s.className = "sheet";
    var close = function () { s.remove(); };
    s.appendChild(btn("plus", "خريطة جديدة", function () {
      var t = prompt("عنوان الخريطة:"); if (!t || !t.trim()) return;
      var m = newMap(t.trim()); st.maps.unshift(m); st.cur = m; st.sel = null; el.stage = null; save(); close(); render(); bar();
    }, "on"));
    st.maps.forEach(function (m) {
      var r = document.createElement("div"); r.className = "row";
      var t = document.createElement("div"); t.className = "t"; t.textContent = m.title;
      t.onclick = function () { st.cur = m; st.sel = null; el.stage = null; close(); render(); bar(); };
      r.appendChild(t);
      r.appendChild(btn("trash", "", function () {
        if (st.maps.length < 2) { alert("لا يمكن حذف آخر خريطة."); return; }
        if (!confirm("حذف «" + m.title + "»؟")) return;
        st.maps = st.maps.filter(function (x) { return x !== m; });
        if (st.cur === m) { st.cur = st.maps[0]; el.stage = null; }
        save(); close(); render(); bar();
      }));
      s.appendChild(r);
    });
    s.appendChild(btn("x", "إغلاق", close));
    el.root.appendChild(s);
  }

  function zoom(d) { st.scale = Math.min(1.6, Math.max(0.5, st.scale + d)); render(); }

  function open() {
    css(); load(); close();
    var r = document.createElement("div"); r.id = "mm"; el.root = r;
    var b = document.createElement("div"); b.className = "bar";
    b.appendChild(btn("x", "", close));
    el.title = document.createElement("b");
    el.title.onclick = function () { var t = prompt("عنوان الخريطة:", st.cur.title); if (t && t.trim()) { st.cur.title = t.trim(); st.cur.root.t = t.trim(); save(); render(); } };
    b.appendChild(el.title);
    b.appendChild(btn("layers", "", list));
    el.rv = btn("eye", "", function () { st.review = !st.review; st.shown = {}; el.rv.className = st.review ? "on" : ""; el.rv.innerHTML = ic(st.review ? "eyeoff" : "eye"); render(); });
    b.appendChild(el.rv);
    el.ai = btn("spark", "", aiGen, "gold"); b.appendChild(el.ai);
    b.appendChild(btn("minus", "", function () { zoom(-0.15); }));
    b.appendChild(btn("plus", "", function () { zoom(0.15); }));
    r.appendChild(b);
    el.area = document.createElement("div"); el.area.className = "area"; r.appendChild(el.area);
    el.act = document.createElement("div"); el.act.className = "act"; r.appendChild(el.act);
    document.body.appendChild(r);
    el.stage = null; st.sel = null; render(); bar();
  }
  function close() { var o = document.getElementById("mm"); if (o) o.remove(); }

  window.MindMap = { open: open, close: close };
})();
/* ===== ربط تبويب "خرائط الدراسة" بالخرائط الذهنية ===== */
(function () {
  var RE = /خرائط\s*الدراسة|أماكن\s*الدراسة/;
  var EXACT = /^\s*خرائط\s*الدراسة\s*$/;
  function relabel() {
    var tabs = document.querySelectorAll("button,[role=tab],a");
    for (var i = 0; i < tabs.length; i++) {
      var b = tabs[i];
      if (b.closest("#mm") || b.getAttribute("data-mm")) continue;
      if (!EXACT.test(b.textContent || "")) continue;
      b.setAttribute("data-mm", "1");
      var target = b, all = b.querySelectorAll("*");
      for (var j = 0; j < all.length; j++) {
        if (!all[j].children.length && EXACT.test(all[j].textContent)) target = all[j];
      }
      target.textContent = "الخرائط الذهنية";
    }
  }
  var timer;
  new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(relabel, 150); })
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", relabel);
  setTimeout(relabel, 500);

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button,[role=tab],a,[role=button]");
    if (!b || b.closest("#mm")) return;
    var s = (b.textContent || "") + " " + (b.getAttribute("aria-label") || "");
    if (b.getAttribute("data-mm") || (s.length < 120 && RE.test(s))) {
      e.preventDefault(); e.stopPropagation();
      window.MindMap.open();
    }
  }, true);
})();
