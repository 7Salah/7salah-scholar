/* =====================================================================
   7Salah Scholar — وحدة المنصة v1  (platform.js)
   تضيف إلى التطبيق بلا مكتبات:
   1) قوائم المتابِعين/المتابَعين عند الضغط على الأرقام في الملف الشخصي
   2) (الرسائل صارت داخل chat.js مباشرة)
   3) جرس الإشعارات (متابعة، إعجاب، تعليق، إعادة نشر، اقتباس)
   الاستخدام: <script src="platform.js"></script> في آخر الصفحة.
   إن كان تطبيقك ينشئ عميل Supabase فمرّره: Platform.init(sb)
   ===================================================================== */
(function () {
  "use strict";
  var URL_ = "https://sgacauoadufbuotreeeh.supabase.co",
      KEY = "sb_publishable_n14PQQhVGc3F4hOHZdd0Cg_arnOMWgh",
      UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  var AR = {followers:"المتابِعون", following:"يتابعهم", empty:"لا أحد هنا بعد", follow:"متابعة", back:"متابعة بالمثل",
    unfollow:"إلغاء المتابعة", youfollow:"تتابعه", followsYou:"يتابعك", copy:"نسخ", copied:"تم النسخ", edit:"تعديل",
    del:"حذف للجميع", save:"حفظ", cancel:"إلغاء", sure:"حذف هذه الرسالة للجميع؟", gone:"تم حذف هذه الرسالة",
    edited:"معدّلة", cantEdit:"يمكن تعديل الرسالة خلال ١٥ دقيقة فقط", err:"حدث خطأ، حاول مرة أخرى",
    noid:"تعذّر تحديد الرسالة", notifs:"الإشعارات", none:"لا إشعارات بعد", loading:"جارٍ التحميل…",
    k_follow:"بدأ بمتابعتك", k_like:"أعجبه منشورك", k_comment:"علّق على منشورك", k_repost:"أعاد نشر منشورك", k_quote:"اقتبس منشورك"};
  var EN = {followers:"Followers", following:"Following", empty:"Nobody here yet", follow:"Follow", back:"Follow back",
    unfollow:"Unfollow", youfollow:"Following", followsYou:"Follows you", copy:"Copy", copied:"Copied", edit:"Edit",
    del:"Delete for everyone", save:"Save", cancel:"Cancel", sure:"Delete this message for everyone?", gone:"This message was deleted",
    edited:"edited", cantEdit:"Messages can only be edited within 15 minutes", err:"Something went wrong, try again",
    noid:"Couldn’t identify the message", notifs:"Notifications", none:"No notifications yet", loading:"Loading…",
    k_follow:"started following you", k_like:"liked your post", k_comment:"commented on your post", k_repost:"reposted your post", k_quote:"quoted your post"};
  var FR = {followers:"Abonnés", following:"Abonnements", empty:"Personne ici pour l’instant", follow:"Suivre", back:"Suivre en retour",
    unfollow:"Ne plus suivre", youfollow:"Abonné", followsYou:"Vous suit", copy:"Copier", copied:"Copié", edit:"Modifier",
    del:"Supprimer pour tous", save:"Enregistrer", cancel:"Annuler", sure:"Supprimer ce message pour tout le monde ?", gone:"Ce message a été supprimé",
    edited:"modifié", cantEdit:"Les messages peuvent être modifiés dans les 15 minutes uniquement", err:"Une erreur est survenue, réessayez",
    noid:"Impossible d’identifier le message", notifs:"Notifications", none:"Aucune notification", loading:"Chargement…",
    k_follow:"a commencé à vous suivre", k_like:"a aimé votre publication", k_comment:"a commenté votre publication", k_repost:"a reposté votre publication", k_quote:"a cité votre publication"};
  function T(k) { var l = (document.documentElement.lang || "ar").slice(0, 2); return (l === "en" ? EN : l === "fr" ? FR : AR)[k]; }

  var sb = null, me = null, bell = null, badge = null;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function say(m) { var t = el("div", "pf-toast", m); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }

  function pick() {
    try { if (typeof SC !== "undefined" && SC && SC.sb && SC.sb.auth) return SC.sb; } catch (e) {} /* عميل تطبيق 7Salah نفسه */
    var n = ["sb", "supabaseClient", "db", "client", "_sb"];
    for (var i = 0; i < n.length; i++) { var c = window[n[i]]; if (c && c.auth && c.from) return c; }
    if (window.supabase && window.supabase.auth && window.supabase.from) return window.supabase;
    return null;
  }
  async function client() {
    if (sb) return sb;
    sb = pick();
    if (!sb) {
      var lib = window.supabase && window.supabase.createClient ? window.supabase
        : await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
      sb = lib.createClient(URL_, KEY);
    }
    var r = await sb.auth.getUser();
    me = r && r.data && r.data.user ? r.data.user.id : null;
    return sb;
  }

  /* ---------- نافذة سفلية ---------- */
  function sheet(title, body) {
    var old = document.querySelector(".pf-ov"); if (old) old.remove();
    var ov = el("div", "pf-ov"), s = el("div", "pf-sheet");
    if (title) { var h = el("div", "pf-h"); h.appendChild(el("b", "", title)); var x = el("button", "pf-x", "✕"); x.onclick = function () { ov.remove(); }; h.appendChild(x); s.appendChild(h); }
    s.appendChild(body); ov.appendChild(s);
    ov.addEventListener("click", function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
    return { close: function () { ov.remove(); } };
  }
  function avatar(u, size) {
    var a = el("div", "cav");
    a.style.cssText = "width:" + size + "px;height:" + size + "px;font-size:" + Math.round(size * .42) + "px;flex:none";
    var src = u.avatar_url;
    if (src) { if (!/^https?:/.test(src)) src = URL_ + "/storage/v1/object/public/avatars/" + src; var i = new Image(); i.src = src; i.alt = ""; a.appendChild(i); }
    else a.textContent = u.avatar_emoji || (u.name || u.username || "?").trim().charAt(0).toUpperCase();
    return a;
  }
  function openProfile(u) {
    document.dispatchEvent(new CustomEvent("platform:openProfile", { detail: { id: u.id, username: u.username } }));
    if (typeof window.openProfile === "function") { try { window.openProfile(u.id, u.username); } catch (e) {} }
  }

  /* ---------- 1) المتابِعون والمتابَعون ---------- */
  function followBtn(u) {
    var b = el("button", "pf-btn"); var on = u.i_follow;
    function paint() { b.textContent = on ? T("youfollow") : (u.follows_me ? T("back") : T("follow")); b.classList.toggle("pf-pri", !on); }
    paint();
    b.onclick = async function (e) {
      e.stopPropagation(); b.disabled = true;
      var c = await client();
      var r = on ? await c.from("follows").delete().eq("follower", me).eq("followee", u.id) : await c.from("follows").insert({ followee: u.id });
      b.disabled = false; if (r.error) return say(T("err"));
      on = !on; paint();
    };
    return b;
  }
  async function openFollows(uid, kind) {
    var body = el("div", "pf-list", T("loading")); var sh = sheet(T(kind), body);
    try {
      var c = await client();
      var r = await c.rpc("follow_list", { uid: uid, kind: kind, lim: 100, skip: 0 });
      if (r.error) throw r.error;
      body.textContent = "";
      if (!r.data.length) { body.appendChild(el("div", "pf-empty", T("empty"))); return; }
      r.data.forEach(function (u) {
        var row = el("div", "pf-row"), nm = el("div", "pf-nm");
        var line = el("b", "", u.name || u.username || ""); if (u.verified) line.appendChild(el("i", "pf-v", " ✓"));
        nm.appendChild(line); nm.appendChild(el("small", "", "@" + (u.username || "") + (u.follows_me ? " · " + T("followsYou") : "")));
        row.appendChild(avatar(u, 44)); row.appendChild(nm); if (u.id !== me) row.appendChild(followBtn(u));
        row.onclick = function () { sh.close(); openProfile(u); };
        body.appendChild(row);
      });
    } catch (e) { body.textContent = T("err"); console.warn("[Platform] follow_list", e); }
  }
  document.addEventListener("click", async function (e) {
    var st = e.target.closest(".pstats .pst"); if (!st) return;
    var lbl = ((st.querySelector("span") || st).textContent || "").trim(), kind = null;
    if (/^يتاب|following/i.test(lbl)) kind = "following"; else if (/^متاب|follower/i.test(lbl)) kind = "followers"; else return;
    var c = await client(), uid = me, card = st.closest(".pcard");
    var m = card && card.textContent.match(/@([A-Za-z0-9_.]+)/);
    if (m) { var p = await c.from("profiles").select("id").eq("username", m[1]).maybeSingle(); if (p.data) uid = p.data.id; }
    if (uid) openFollows(uid, kind);
  });

  /* ---------- 3) الإشعارات ---------- */
  async function refreshBadge() {
    try {
      var c = await client(); if (!me) return;
      var r = await c.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
      var n = r.count || 0; badge.hidden = !n; badge.textContent = n > 9 ? "9+" : String(n);
    } catch (e) {}
  }
  async function openNotifs() {
    var body = el("div", "pf-list", T("loading")); sheet(T("notifs"), body);
    try {
      var c = await client();
      var r = await c.from("notifications").select("id,kind,post_id,created_at,read_at,actor:profiles!notifications_actor_fkey(id,name,username,avatar_url,avatar_emoji)").order("created_at", { ascending: false }).limit(40);
      if (r.error) throw r.error; body.textContent = "";
      if (!r.data.length) { body.appendChild(el("div", "pf-empty", T("none"))); return; }
      var lang = (document.documentElement.lang || "ar").slice(0, 2);
      r.data.forEach(function (n) {
        var a = n.actor || {}, row = el("div", "pf-row" + (n.read_at ? "" : " pf-unread")), nm = el("div", "pf-nm");
        var line = el("b", "", a.name || a.username || ""); line.appendChild(el("span", "pf-k", " " + T("k_" + n.kind)));
        nm.appendChild(line); nm.appendChild(el("small", "", new Date(n.created_at).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" })));
        row.appendChild(avatar(a, 44)); row.appendChild(nm);
        row.onclick = function () {
          var ov = document.querySelector(".pf-ov"); if (ov) ov.remove();
          if (n.post_id) { document.dispatchEvent(new CustomEvent("platform:openPost", { detail: { id: n.post_id } })); if (typeof window.openPost === "function") { try { window.openPost(n.post_id); } catch (e) {} } }
          else openProfile(a);
        };
        body.appendChild(row);
      });
      await c.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", me).is("read_at", null);
      badge.hidden = true;
    } catch (e) { body.textContent = T("err"); console.warn("[Platform] notifications", e); }
  }
  function addBell() {
    var h = document.querySelector("header"); if (!h || bell || !me || window.PLATFORM_NO_BELL) return;
    bell = el("button", "lang hbtn pf-bell"); bell.type = "button"; bell.setAttribute("aria-label", T("notifs"));
    bell.innerHTML = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
    badge = el("b", "pf-badge"); badge.hidden = true; bell.appendChild(badge);
    var anchor = h.querySelector(".gchip");
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(bell, anchor);
    else { var box = h.querySelector(".header-actions") || h; box.appendChild(bell); }
    bell.onclick = openNotifs; refreshBadge();
  }

  /* ---------- التشغيل ---------- */
  var tid = null;
  async function live() {
    var c = await client(); if (!me || !c.channel) return;
    c.channel("pf-live").on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + me }, refreshBadge).subscribe();
    setInterval(function () { if (!document.hidden) refreshBadge(); }, 60000);
  }
  function boot() {
    client().then(function (c) {
      addBell(); live();
      c.auth.onAuthStateChange(function (_e, s) {
        me = s && s.user ? s.user.id : null;
        if (me) { addBell(); refreshBadge(); } else if (bell) { bell.remove(); bell = null; }
      });
    }).catch(function (e) { console.warn("[Platform] init", e); });
    new MutationObserver(function () { clearTimeout(tid); tid = setTimeout(addBell, 300); }).observe(document.body, { childList: true, subtree: true });
  }
  window.Platform = {
    init: function (c) { sb = c; return client().then(addBell); },
    openFollows: openFollows,
    counts: async function (uid) { var c = await client(); var r = await c.rpc("profile_counts", { uid: uid }); return r.data && r.data[0]; }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
