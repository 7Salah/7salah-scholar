// دعوات الأصدقاء 🤝 — يتطلب v19r-invites.sql. يُحمَّل بعد institutions.js.
// الرابط: ?inv=اسم_المستخدم. يُحفظ محليًا (ليصمد عبر تأكيد البريد) ثم يُسجَّل عند أول دخول للحساب الجديد.
(function(){try{const c=new URLSearchParams(location.search).get("inv");
 if(c&&/^[a-z0-9_]{3,20}$/.test(c.toLowerCase())){localStorage.setItem("7s_inv",c.toLowerCase());
  const u=new URL(location.href);u.searchParams.delete("inv");history.replaceState(null,"",u.pathname+u.search+u.hash);
  setTimeout(()=>{if(typeof toast==="function")toast("🤝 وصلتك دعوة من @"+c.toLowerCase()+" — أنشئ حسابك لتنضم إليه")},1200)}}catch(e){}})();

const invLink=()=>location.origin+location.pathname+"?inv="+encodeURIComponent(SC.me&&SC.me.username||"");
const invText=()=>"ادرس معي على 7salah-scholar 📚 بطاقات موثّقة بالمصادر العلمية وتحدّيات بين الأصدقاء. انضم من هنا:";

// عند الدخول: سجّل الدعوة المحفوظة مرة واحدة ثم امسحها (بنجاح أو برفض نهائي)
{const _su=setUser;setUser=async function(ss){await _su(ss);
 try{const c=localStorage.getItem("7s_inv");if(!c||!SC.user)return;
  if(SC.me&&c===SC.me.username){localStorage.removeItem("7s_inv");return}
  const r=await SC.sb.rpc("accept_invite",{code:c});
  if(r.error&&/function|schema cache|does not exist/i.test(r.error.message||""))return;   // الميزة غير مفعّلة بعد: أبقِ الكود
  localStorage.removeItem("7s_inv");
  if(!r.error&&r.data)toast("🤝 انضممت بدعوة "+r.data+" وأصبحت تتابعه")}catch(e){}}}

async function inviteModal(){
 if(!SC.user)return authModal();
 const link=invLink(),inp=h("input",{class:"cin",readonly:"",value:link,dir:"ltr",onclick:e=>e.target.select()}),list=h("div",{},"⏳"),
  full=invText()+"\n"+link,enc=encodeURIComponent(full);
 const copy=async()=>{try{await navigator.clipboard.writeText(link);toast("✅ نُسخ الرابط")}catch(e){inp.select();toast("حدّد الرابط وانسخه")}};
 const m=modal(h("h3",{},"🤝 ادعُ أصدقاءك"),h("div",{class:"meta"},"من يسجّل عبر رابطك يتابعك تلقائيًا، وتظهر في قائمتك هنا. لا نقاط ولا مكافآت."),inp,
  h("div",{class:"btns"},h("button",{class:"btn fill",onclick:copy},"📋 نسخ"),
   navigator.share?h("button",{class:"btn",onclick:async()=>{try{await navigator.share({text:invText(),url:link})}catch(e){}}},"📤 مشاركة"):null,
   h("a",{class:"btn",href:"https://wa.me/?text="+enc,target:"_blank",rel:"noopener noreferrer"},"واتساب"),
   h("a",{class:"btn",href:"https://t.me/share/url?url="+encodeURIComponent(link)+"&text="+encodeURIComponent(invText()),target:"_blank",rel:"noopener noreferrer"},"تيليغرام")),
  h("div",{class:"meta",style:"font-weight:700;margin-top:12px"},"👥 من انضموا بدعوتك"),list,cancelB({remove:()=>m.remove()}));
 const r=await SC.sb.rpc("my_invites");
 if(r.error)return list.replaceChildren(h("div",{class:"meta"},/function|schema cache|does not exist/i.test(r.error.message||"")?(SC.me&&SC.me.is_admin?"لتفعيل القائمة شغّل v19r-invites.sql في Supabase.":"القائمة غير مفعّلة بعد."):"⚠ "+r.error.message));
 const rows=r.data||[];
 if(!rows.length)return list.replaceChildren(h("div",{class:"meta"},"لم ينضم أحد بعد. شارك الرابط مع زملائك!"));
 list.replaceChildren(h("div",{class:"meta"},rows.length+" باحث"),...rows.map(p=>h("div",{class:"card phd",style:"display:flex;gap:10px;align-items:center;cursor:pointer",onclick:()=>{m.remove();openProf(p.id)}},av(p,36),
  h("div",{style:"flex:1;min-width:0"},h("b",{dir:"auto"},p.name||p.username),h("div",{class:"meta"},"@"+p.username)))))}
