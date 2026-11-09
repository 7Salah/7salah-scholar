// مجموعات المواد + الإرشاد الأكاديمي. يُحمَّل بعد formats.js ويستبدل newGroupModal و discoverModal.
const LVN=["ليسانس 1","ليسانس 2","ليسانس 3","ماستر 1","ماستر 2","دكتوراه"];
const lvSel=any=>h("select",{class:"cin"},h("option",{value:""},any?"كل المستويات":"المستوى (اختياري)"),LVCODE.map((c,i)=>h("option",{value:c},LVN[i])));
const lvName=c=>LVN[LVCODE.indexOf(c)]||"";

function newGroupModal(){
 const ti=h("input",{class:"cin",placeholder:"اسم المجموعة: مثال، مراجعة الإحصاء",maxlength:"80"}),sb=h("input",{class:"cin",placeholder:"المادة / المقياس (اختياري)",maxlength:"80"}),
  lv=lvSel(false),un=h("input",{class:"cin",placeholder:"الجامعة (اختياري)",maxlength:"80"}),pub=h("input",{type:"checkbox",checked:true});
 const m=modal(h("h3",{},"👥 مجموعة جديدة"),ti,sb,lv,un,h("label",{class:"meta",style:"display:flex;gap:6px;align-items:center"},pub,"عامة: يستطيع أي طالب اكتشافها والانضمام"),
  h("button",{class:"pri",onclick:async()=>{if(!ti.value.trim())return toast("اكتب اسمًا");
   const r=await SC.sb.rpc("create_study_group",{ttl:ti.value.trim(),subj:sb.value,lvl:lv.value||null,univ:un.value,pub:pub.checked});
   if(r.error)return toast(r.error.message);m.remove();openChat(r.data,"👥 "+ti.value.trim())}},"إنشاء"),cancelB({remove:()=>m.remove()}))}

async function discoverModal(){
 const q=h("input",{class:"cin",placeholder:"مادة أو جامعة أو اسم مجموعة"}),lv=lvSel(true),list=h("div",{},"⏳");
 const m=modal(h("h3",{},"🔎 مجموعات المواد"),q,lv,h("button",{class:"btn",onclick:load},"بحث"),list,cancelB({remove:()=>m.remove()}));
 async function load(){setT(list,"⏳");let s=SC.sb.from("conversations").select("id,title,subject,level,university").eq("kind","group").eq("is_public",true);
  if(lv.value)s=s.eq("level",lv.value);const t=sq(q.value);if(t)s=s.or("title.ilike.*"+t+"*,subject.ilike.*"+t+"*,university.ilike.*"+t+"*");
  const {data,error}=await s.order("last_at",{ascending:false}).limit(30);
  list.replaceChildren(...(error?[h("div",{},"⚠ "+error.message)]:(data||[]).map(g=>h("div",{class:"btns",style:"align-items:center"},
   h("div",{style:"flex:1;min-width:0"},h("b",{dir:"auto"},g.title),h("div",{class:"meta",dir:"auto"},[g.subject,lvName(g.level),g.university].filter(Boolean).join(" · "))),
   h("button",{class:"btn",onclick:async()=>{const r=await SC.sb.rpc("join_group",{cid:g.id});if(r.error)return toast(r.error.message);m.remove();openChat(g.id,"👥 "+g.title)}},"انضم")))));
  if(!error&&!(data||[]).length)list.textContent="لا مجموعات مطابقة."}
 q.onkeydown=e=>{if(e.key==="Enter")load()};load()}

// ---------- الإرشاد ----------
async function openMentors(){
 if(!SC.user)return authModal();
 const me=SC.me||{},ok=["m1","m2","phd"].includes(me.academic_level)&&me.level_verified,body=h("div",{}),
  m=modal(h("h3",{},"🎓 الإرشاد الأكاديمي"),body,cancelB({remove:()=>m.remove()}));
 const T=x=>h("div",{class:"meta",style:"font-weight:700;margin-top:10px"},x);
 if(ok){const on=h("input",{type:"checkbox",checked:!!me.mentor_open}),tp=h("input",{class:"cin",placeholder:"مجالات إرشادك: مثال، منهجية البحث، كتابة المذكرة",maxlength:"120",value:me.mentor_topics||""});
  body.append(T("أنت مؤهل لتكون مرشدًا"),h("label",{class:"meta",style:"display:flex;gap:6px;align-items:center"},on,"أتيح نفسي لاستقبال طلبات الإرشاد"),tp,
   h("button",{class:"btn",onclick:async()=>{const r=await SC.sb.rpc("set_mentor",{opn:on.checked,topics:tp.value});if(r.error)return toast(r.error.message);Object.assign(SC.me,{mentor_open:on.checked,mentor_topics:tp.value});toast("✅ تم الحفظ")}},"حفظ"));
  const rq=await SC.sb.rpc("my_mentor_requests");
  if(!rq.error&&(rq.data||[]).length)body.append(T("📥 طلبات واردة"),...rq.data.map(x=>h("div",{class:"card"},h("b",{dir:"auto"},(x.name||x.username)+" · "+lvName(x.academic_level)),h("div",{class:"meta",dir:"auto"},x.msg||""),
   h("div",{class:"btns"},[true,false].map(a=>h("button",{class:"btn",onclick:async()=>{const r=await SC.sb.rpc("answer_mentor",{req:x.rid,accept:a});if(r.error)return toast(r.error.message);
    if(a&&r.data){m.remove();openChat(r.data,x.name||x.username)}else{toast("تم");m.remove();openMentors()}}},a?"✅ قبول":"رفض"))))))}
 else if(["m1","m2","phd"].includes(me.academic_level))body.append(h("div",{class:"meta"},"وثّق مستواك (✓) لتصبح مرشدًا: من تبويب الإنجازات اطلب التوثيق."));
 const q=h("input",{class:"cin",placeholder:"ابحث عن مرشد بالمجال أو الجامعة"}),list=h("div",{},"⏳");
 body.append(T("🧭 ابحث عن مرشد"),q,list);
 async function load(){setT(list,"⏳");const r=await SC.sb.rpc("list_mentors",{q:sq(q.value)||null});
  list.replaceChildren(...(r.error?[h("div",{},"⚠ "+r.error.message)]:(r.data||[]).map(p=>h("div",{class:"card phd"},av(p,38),
   h("div",{style:"flex:1;min-width:0"},h("b",{dir:"auto"},p.name||p.username),h("div",{class:"meta",dir:"auto"},[lvName(p.academic_level),p.university,p.mentor_topics].filter(Boolean).join(" · "))),
   h("button",{class:"btn",onclick:async()=>{const n=prompt("اكتب رسالة قصيرة للمرشد: ما الذي تحتاج مساعدة فيه؟","");if(n===null)return;
    const x=await SC.sb.rpc("request_mentor",{mentor_id:p.id,message:n.slice(0,300)});toast(x.error?x.error.message:"✅ أُرسل طلبك")}},"اطلب إرشادًا")))));
  if(!r.error&&!(r.data||[]).length)list.textContent="لا مرشدين متاحين الآن."}
 q.onkeydown=e=>{if(e.key==="Enter")load()};load()}

{const _cl=chatList;chatList=async function(v){await _cl(v);if(SC.user)v.prepend(h("div",{class:"btns",style:"padding:0 16px"},h("button",{class:"btn",onclick:openMentors},"🎓 الإرشاد الأكاديمي")))}}
