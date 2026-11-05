// التصنيف (Tier List) بين الباحثين حسب الفئة + معرّف الباحث ID. يُحمَّل بعد discover.js.
const LVCODE=["l1","l2","l3","m1","m2","phd"],RGRP=[["l","ليسانس"],["m","ماستر"],["d","دكتوراه"]];
const TIERS=[["S","#ff7f7f"],["A","#ffbf7f"],["B","#ffdf7f"],["C","#ffff7f"],["D","#bfff7f"],["F","#7f7fff"]];
const tierOf=(r,n)=>{const p=r/n;return r===1||p<=.1?0:p<=.3?1:p<=.55?2:p<=.75?3:p<=.9?4:5};
const grpOfCol=c=>c<=2?"l":c<=4?"m":"d";
let _ls="";
let _busy=false;
async function syncProf(){if(!SC.user||!SC.sb||_busy)return;_busy=true;try{const q=LS.get("7s_pend",{}),keys=Object.keys(q).filter(k=>q[k]>0);
 if(keys.length){const r=await SC.sb.rpc("report_acts",{acts:q});if(!r.error){const cur=LS.get("7s_pend",{});keys.forEach(k=>{cur[k]=Math.max(0,(cur[k]||0)-q[k])});LS.set("7s_pend",cur);if(SC.me&&typeof r.data==="number")SC.me.points=r.data}}
 const e=S.prof.av||"📚";if(e!==_ls){const r=await SC.sb.rpc("sync_emoji",{emo:e});if(!r.error)_ls=e}}finally{_busy=false}}
async function lvPick(k){if(!SC.user||!SC.sb){S.prof.col=k;persist();render();return}
 if(k===myCol()&&SC.me&&SC.me.level_set)return;const code=LVCODE[k];
 let r=await SC.sb.rpc("request_level",{lvl:code,note:null,verify:false});if(r.error)return toast(r.error.message);
 if(r.data==="declared"&&confirm("تم تعيين مستواك «"+AVC[k][0]+"» (غير موثّق). هل تريد طلب توثيقه (✓) من المشرف؟")){
  const n=prompt("أضف ما يساعد المشرف على التحقق (الجامعة، رقم الطالب، رابط ملفك الأكاديمي):","");
  if(n!==null){r=await SC.sb.rpc("request_level",{lvl:code,note:n.slice(0,300),verify:true});if(r.error)return toast(r.error.message)}}
 const pr=await SC.sb.from("profiles").select("*").eq("id",SC.user.id).maybeSingle();if(pr.data)SC.me=pr.data;
 toast(r.data==="verified"?"✅ تم اعتماد المستوى":r.data==="pending"?"⏳ أُرسل طلب التوثيق للمشرف":"✅ تم تعيين مستواك");render()}
function askLevel(){if(!SC.user||!SC.me||SC.me.level_set||document.querySelector(".lvask"))return;
 // اختياري: لا نسأل أكثر من مرة كل 7 أيام إن تخطّاه المستخدم
 try{if(Date.now()-(+localStorage.getItem("7s_lvskip")||0)<6048e5)return;localStorage.setItem("7s_lvskip",String(Date.now()))}catch(e){}
 const m=modal(h("h3",{},"🎓 ما مستواك الأكاديمي؟"),h("div",{class:"meta"},"اختياري: اختر مستواك الحالي، أو تخطَّ الآن وغيّره في أي وقت. يمكنك طلب توثيقه (✓) لاحقًا."),
  h("div",{class:"emj",style:"justify-content:center;margin:10px 0"},AVC.map((c,k)=>h("button",{class:"col lvb",title:c[0],style:"background:linear-gradient(135deg,"+c[1]+","+c[2]+")",onclick:async()=>{m.remove();await lvPick(k)}},c[3]))),h("button",{class:"btn",onclick:()=>m.remove()},"لاحقًا — ليس الآن"));
 m.classList.add("lvask")}
{const _su=setUser;setUser=async function(ss){await _su(ss);syncProf();setTimeout(askLevel,800)}}
setInterval(syncProf,60000);
function copyUid(id){const s=String(id);(navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>toast("تم نسخ ID ✓"),()=>prompt("ID",s))}
const uidChip=id=>id?h("div",{class:"uidc",onclick:()=>copyUid(id)},"ID: "+id+" 📋"):null;
async function rankView(v){
 const myCol=SC.me&&SC.me.academic_level?Math.max(0,LVCODE.indexOf(SC.me.academic_level)):(S.prof.col|0);
 if(!SC.rg)SC.rg=grpOfCol(myCol);
 await syncProf();if(SC.user){const pr=await SC.sb.from("profiles").select("*").eq("id",SC.user.id).maybeSingle();if(pr.data)SC.me=pr.data}
 v.append(h("div",{class:"card"},h("h3",{},"🏆 تصنيف الباحثين"),h("div",{class:"meta"},"تنافس مع باحثي فئتك. التصنيف من S إلى F حسب ترتيبك بين أبناء فئتك، والنقاط تأتي من مراجعاتك وتحدّياتك.")),
  h("div",{class:"chips",style:"padding:0 16px"},RGRP.map(([k,n])=>h("button",{class:"chip"+(SC.rg===k?" on":""),onclick:()=>{SC.rg=k;render()}},n))));
 const box=h("div",{class:"tl"},h("div",{class:"meta",style:"padding:14px;color:#ccc;text-align:center"},"⏳"));v.append(box);
 const r=await SC.sb.rpc("leaderboard",{grp:SC.rg});
 if(r.error){box.replaceChildren(h("div",{class:"meta",style:"padding:14px;color:#ccc"},"⚠ تعذّر التحميل — تأكد من تشغيل v19-ranking.sql في Supabase. "+r.error.message));return}
 const rows=(r.data||[]).filter(p=>!SC.blocked.has(p.id));
 if(!rows.length){box.replaceChildren(h("div",{class:"meta",style:"padding:14px;color:#ccc;text-align:center"},"لا باحثين في هذه الفئة بعد. كن الأول! 🚀"));return}
 const by=TIERS.map(()=>[]);rows.forEach(p=>by[tierOf(+p.rank,+p.total)].push(p));
 box.replaceChildren(...TIERS.map(([L,c],i)=>h("div",{class:"r"},h("div",{class:"k",style:"background:"+c},L),
  h("div",{class:"v"},by[i].length?by[i].map(p=>{const ci=Math.max(0,LVCODE.indexOf(p.academic_level));
   return h("div",{class:"pc"+(SC.user&&SC.user.id===p.id?" me":""),title:p.academic_level,onclick:()=>openProf(p.id)},avBadge(44,false,ci,p.avatar_emoji),
    h("b",{dir:"auto"},(p.name||p.username).slice(0,10)+(p.level_verified?" ✓":"")),h("span",{},"⭐ "+p.points),h("span",{style:"opacity:.7"},"#"+p.rank))}):h("span",{style:"color:#666"},"—")))));
 const mine=SC.user&&rows.find(p=>p.id===SC.user.id),hid=SC.me&&SC.me.hide_rank;
 v.append(h("div",{class:"meta",style:"text-align:center;padding:10px 16px"},hid?"🙈 ترتيبك مخفي عن الآخرين.":mine?("ترتيبك: #"+mine.rank+" من "+rows[0].total+" — تصنيف "+TIERS[tierOf(+mine.rank,+mine.total)][0]):(SC.user?"سجّل مراجعات لتظهر في القائمة (فئتك حسب مستواك الموثّق).":"سجّل الدخول لتنافس وتظهر في القائمة."),
  SC.user?h("div",{},h("button",{class:"btn",style:"margin-top:8px",onclick:async()=>{const nv=!hid,r=await SC.sb.from("profiles").update({hide_rank:nv}).eq("id",SC.user.id);if(r.error)return toast(r.error.message);if(SC.me)SC.me.hide_rank=nv;render()}},hid?"👁 إظهار ترتيبي":"🙈 إخفاء ترتيبي")):null));
}
async function lvReqs(box){const r=await SC.sb.rpc("admin_level_requests");if(r.error)return box.append(h("div",{class:"card"},"⚠ "+r.error.message));
 if(!r.data.length)return box.append(h("div",{class:"meta",style:"text-align:center;padding:12px"},"لا طلبات توثيق"));
 r.data.forEach(q=>box.append(h("div",{class:"card"},h("div",{dir:"auto"},h("b",{},(q.name||q.username)+" "),h("span",{class:"meta"},"@"+q.username)),
  h("div",{},"المستوى المطلوب: "+AVC[Math.max(0,LVCODE.indexOf(q.level))][0]),h("div",{class:"meta",dir:"ltr"},"نطاق البريد: "+(q.dom||"—")),q.note?h("div",{class:"meta",dir:"auto"},"📝 "+q.note):null,
  h("div",{class:"btns"},h("button",{class:"btn",onclick:()=>openProf(q.uid)},"الملف"),
   h("button",{class:"btn",onclick:async()=>{const x=await SC.sb.rpc("admin_level",{req:q.rid,approve:true});if(x.error)return toast(x.error.message);toast("✅ اعتُمد");render()}},"اعتماد"),
   h("button",{class:"btn danger",onclick:async()=>{const x=await SC.sb.rpc("admin_level",{req:q.rid,approve:false});if(x.error)return toast(x.error.message);toast("رُفض");render()}},"رفض")))))}
{const _av=adminView;adminView=async function(v){const lb=h("div",{});v.append(h("div",{class:"card"},h("h3",{},"🎓 طلبات توثيق المستوى")),lb);await lvReqs(lb);return _av(v)}}
