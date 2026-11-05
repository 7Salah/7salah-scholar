// صفحات الجامعات والمخابر 🏛🔬 — يتطلب v19q-institutions.sql. يُحمَّل بعد groups.js.
// الصفحة = اسم + تعريف + أعضاء. منشورات الصفحة هي منشورات أعضائها (لا جدول منشورات جديد). المخبر قد يتبع جامعة.
const INK={university:"🏛 جامعة",lab:"🔬 مخبر"};
const inMissing=e=>/institution|relation|schema cache|does not exist|could not find the function/i.test((e&&e.message)||"");
const inNeedSql=()=>h("div",{class:"card"},h("h3",{},"🏛 الجامعات والمخابر"),h("div",{class:"meta"},SC.me&&SC.me.is_admin?"لتفعيل هذه الميزة شغّل v19q-institutions.sql في Supabase.":"هذه الميزة غير مفعّلة بعد."));
const inBadge=i=>h("span",{class:"badge "+(i.verified?"g":"n"),style:"margin-inline-start:6px"},i.verified?"✓ موثّقة":"غير موثّقة");
function openInst(id){SC.view="instp";SC.iid=id;render();window.scrollTo(0,0)}

// ---------- القائمة والبحث ----------
async function instView(v){
 const qi=h("input",{class:"cin",placeholder:"🔎 اسم جامعة أو مخبر أو مدينة",value:SC.iq||"",enterkeyhint:"search"}),list=h("div",{});
 let kind=SC.ik||"";
 const chips=h("div",{class:"chips",style:"padding:0 0 6px"},[["","الكل"],["university","🏛 جامعات"],["lab","🔬 مخابر"]].map(([k,n])=>h("button",{class:"chip"+(kind===k?" on":""),onclick:e=>{kind=k;SC.ik=k;[...chips.children].forEach(c=>c.classList.remove("on"));e.target.classList.add("on");load()}},n)));
 v.append(h("div",{style:"padding:0 16px"},h("h3",{style:"margin:10px 0 6px"},"🏛 الجامعات والمخابر"),
  h("div",{class:"meta"},"انضم إلى جامعتك أو مخبرك لتجد زملاءك ومنشوراتهم في مكان واحد."),qi,chips,
  SC.user?h("button",{class:"btn",onclick:()=>instCreate()},"＋ أضف جامعة أو مخبرًا"):null),list);
 async function load(){
  SC.iq=sq(qi.value);list.replaceChildren(h("div",{class:"meta",style:"padding:12px 16px"},"⏳"));
  const r=await SC.sb.rpc("list_institutions",{q:SC.iq||null,k:kind||null,par:null});
  if(r.error){list.replaceChildren(inMissing(r.error)?inNeedSql():h("div",{class:"card"},"⚠ "+r.error.message));return}
  const rows=r.data||[];
  if(!rows.length){list.replaceChildren(h("div",{class:"meta",style:"text-align:center;padding:20px"},SC.iq?"لا نتائج. إن لم تجد صفحتك فأنشئها وستكون أول عضو.":"لا صفحات بعد. كن أول من يضيف جامعته!"));return}
  list.replaceChildren(...rows.map(instRow))}
 qi.onkeydown=e=>{if(e.key==="Enter")load()};
 if(SC.user&&!SC._inMine){SC._inMine=1;
  // اقتراح: جامعة الملف الشخصي إن وُجدت صفحة بها ولم ينضم إليها بعد
  const u=SC.me&&SC.me.university&&sq(SC.me.university);
  if(u&&!SC.iq){SC.sb.rpc("list_institutions",{q:u,k:"university",par:null}).then(r=>{const m=(r.data||[]).find(x=>!x.joined);if(m)list.prepend(h("div",{class:"meta",style:"padding:0 16px 6px"},"💡 هل تدرس في «"+m.name+"»؟ ",h("button",{class:"btn",onclick:()=>openInst(m.id)},"افتح صفحتها")))})}}
 load()}

function instRow(i){
 return h("div",{class:"card phd",style:"display:flex;gap:10px;align-items:center;cursor:pointer",onclick:()=>openInst(i.id)},
  h("div",{style:"font-size:26px"},i.kind==="lab"?"🔬":"🏛"),
  h("div",{style:"flex:1;min-width:0"},h("b",{dir:"auto"},i.name),inBadge(i),
   h("div",{class:"meta",dir:"auto"},[INK[i.kind],i.parent_name,i.city,i.members+" عضو"].filter(Boolean).join(" · "))),
  i.joined?h("span",{class:"badge b"},"عضو"):null)}

// ---------- إنشاء وتعديل ----------
async function instCreate(presetKind,parent){
 if(!SC.user)return authModal();
 const kd=h("select",{class:"cin",onchange:sync},h("option",{value:"university"},"🏛 جامعة"),h("option",{value:"lab"},"🔬 مخبر بحث"));if(presetKind)kd.value=presetKind;
 const nm=h("input",{class:"cin",placeholder:"الاسم الكامل (مثال: جامعة قسنطينة 1)",maxlength:"100"}),
  par=h("select",{class:"cin"},h("option",{value:""},"الجامعة التابع لها (اختياري)")),
  ct=h("input",{class:"cin",placeholder:"المدينة (اختياري)",maxlength:"60"}),wb=h("input",{class:"cin",placeholder:"الموقع الرسمي https://… (اختياري)",maxlength:"200",type:"url",dir:"ltr"}),
  ab=h("textarea",{class:"cin",maxlength:"600",placeholder:"نبذة قصيرة (اختياري)",style:"min-height:70px"}),pw=h("div",{},par);
 function sync(){pw.style.display=kd.value==="lab"?"":"none"}sync();
 SC.sb.rpc("list_institutions",{q:null,k:"university",par:null}).then(r=>{(r.data||[]).forEach(u=>par.append(h("option",{value:u.id},u.name)));if(parent)par.value=parent});
 const m=modal(h("h3",{},"＋ صفحة جديدة"),h("div",{class:"meta"},"ابحث أولًا كي لا تُكرَّر الصفحة. تظهر صفحتك «غير موثّقة» حتى تراجعها الإدارة."),kd,nm,pw,ct,wb,ab,
  h("button",{class:"pri",onclick:async e=>{const b=e.target,n=nm.value.trim(),w=wb.value.trim();
   if(n.length<3)return toast("اكتب اسمًا (3 أحرف على الأقل)");if(w&&!/^https:\/\/\S{3,200}$/.test(w))return toast("الموقع يجب أن يبدأ بـ https://");
   b.disabled=true;const r=await SC.sb.rpc("create_institution",{k:kd.value,nm:n,par:kd.value==="lab"&&par.value?par.value:null,cty:ct.value,web:w,abt:ab.value});
   if(r.error){b.disabled=false;return toast(inMissing(r.error)?"لتفعيل الميزة شغّل v19q-institutions.sql":r.error.message)}
   m.remove();toast("✅ أُنشئت الصفحة");openInst(r.data)}},"إنشاء"),cancelB({remove:()=>m.remove()}))}

function instEdit(i,done){
 const ct=h("input",{class:"cin",placeholder:"المدينة",maxlength:"60",value:i.city||""}),wb=h("input",{class:"cin",placeholder:"https://…",maxlength:"200",dir:"ltr",value:i.website||""}),
  ab=h("textarea",{class:"cin",maxlength:"600",style:"min-height:90px"});ab.value=i.about||"";
 const m=modal(h("h3",{},"✏️ تعديل الصفحة"),ct,wb,ab,h("button",{class:"pri",onclick:async()=>{const w=wb.value.trim();if(w&&!/^https:\/\/\S{3,200}$/.test(w))return toast("الموقع يجب أن يبدأ بـ https://");
  const r=await SC.sb.rpc("update_institution",{iid:i.id,cty:ct.value,web:w,abt:ab.value});if(r.error)return toast(r.error.message);m.remove();toast("✅ تم الحفظ");done()}},"حفظ"),cancelB({remove:()=>m.remove()}))}

// ---------- صفحة الجامعة / المخبر ----------
async function instPage(v){
 const id=SC.iid,box=h("div",{});
 v.append(h("div",{style:"padding:0 16px"},h("button",{class:"btn",onclick:()=>{SC.view="inst";SC.iid=null;render()}},"← الجامعات والمخابر")),box);
 const [ir,mr]=await Promise.all([SC.sb.from("institutions").select("*").eq("id",id).maybeSingle(),SC.sb.from("institution_members").select("user_id,role,created_at").eq("inst_id",id).order("created_at",{ascending:true}).limit(300)]);
 if(ir.error)return box.append(inMissing(ir.error)?inNeedSql():h("div",{class:"card"},"⚠ "+ir.error.message));
 const i=ir.data;if(!i)return box.append(h("div",{class:"card"},"الصفحة غير موجودة أو أُخفيت."));
 const mem=mr.data||[],me=SC.user&&SC.user.id,mine=me&&mem.find(x=>x.user_id===me),isAdm=!!(mine&&mine.role==="admin"),sysAdm=!!(SC.me&&SC.me.is_admin);
 let par=null;if(i.parent_id){const p=await SC.sb.from("institutions").select("id,name").eq("id",i.parent_id).maybeSingle();par=p.data}
 const act=h("div",{class:"btns",style:"justify-content:center"});
 act.append(h("button",{class:mine?"btn":"pri",onclick:async()=>{if(!SC.user)return authModal();
  if(mine&&!confirm("مغادرة هذه الصفحة؟"))return;const r=await SC.sb.rpc(mine?"leave_institution":"join_institution",{iid:i.id});if(r.error)return toast(r.error.message);render()}},mine?"✓ عضو — مغادرة":"＋ انضم"));
 if(isAdm)act.append(h("button",{class:"btn",onclick:()=>instEdit(i,render)},"✏️ تعديل"));
 if(SC.user&&i.created_by!==me)act.append(h("button",{class:"btn",onclick:async()=>{if(!confirm("الإبلاغ عن هذه الصفحة (انتحال أو محتوى مخالف)؟"))return;const r=await SC.sb.from("institution_reports").insert({inst_id:i.id});toast(r.error&&r.error.code!=="23505"?"تعذّر الإبلاغ":"شكرًا، وصلنا بلاغك")}},"⚑ بلاغ"));
 if(sysAdm){act.append(h("button",{class:"btn",onclick:async()=>{const r=await SC.sb.rpc("admin_verify_institution",{iid:i.id,v:!i.verified});if(r.error)return toast(r.error.message);render()}},i.verified?"إلغاء التوثيق":"🛡 وثّق الصفحة"),
  h("button",{class:"btn danger",onclick:async()=>{if(!confirm("حذف الصفحة نهائيًا؟"))return;const r=await SC.sb.from("institutions").delete().eq("id",i.id);if(r.error)return toast(r.error.message);SC.view="inst";SC.iid=null;render()}},"🗑 حذف"))}
 box.append(h("div",{class:"card",style:"text-align:center"},h("div",{style:"font-size:42px"},i.kind==="lab"?"🔬":"🏛"),
  h("h3",{dir:"auto"},i.name,inBadge(i)),h("div",{class:"meta"},[INK[i.kind],i.city,mem.length+" عضو"].filter(Boolean).join(" · ")),
  par?h("div",{class:"meta"},"تابع لـ ",h("a",{href:"#",onclick:e=>{e.preventDefault();openInst(par.id)}},par.name)):null,
  i.website&&okU(i.website)?h("div",{},h("a",{class:"btn",href:i.website,target:"_blank",rel:"noopener noreferrer"},"🌐 الموقع الرسمي")):null,
  i.about?h("div",{dir:"auto",style:"margin:8px 0;white-space:pre-wrap"},i.about):null,act));
 // تبويبات: منشورات الأعضاء | الأعضاء | (للجامعة) المخابر والمجموعات
 const tabs=[["posts","📄 منشورات"],["members","👥 الأعضاء ("+mem.length+")"]];
 if(i.kind==="university")tabs.push(["labs","🔬 المخابر"],["groups","📚 مجموعات"]);
 const body=h("div",{}),bar=h("div",{class:"chips",style:"padding:0 16px"});let cur=SC.itab&&tabs.some(t=>t[0]===SC.itab)?SC.itab:"posts";
 const show=async k=>{cur=k;SC.itab=k;[...bar.children].forEach((c,j)=>c.classList.toggle("on",tabs[j][0]===k));body.replaceChildren(h("div",{class:"meta",style:"text-align:center;padding:12px"},"⏳"));const out=h("div",{});
  if(k==="posts"){if(!mem.length)out.append(h("div",{class:"meta",style:"text-align:center;padding:16px"},"لا أعضاء بعد."));else await loadPosts(out,{uids:mem.map(x=>x.user_id).slice(0,200)})}
  else if(k==="members")await instMembers(out,mem);
  else if(k==="labs")await instLabs(out,i);
  else await instGroups(out,i);
  body.replaceChildren(out)};
 tabs.forEach(([k,n])=>bar.append(h("button",{class:"chip",onclick:()=>show(k)},n)));
 box.append(bar,body);show(cur)}

async function instMembers(out,mem){
 const ids=mem.map(x=>x.user_id),role={};mem.forEach(x=>role[x.user_id]=x.role);
 if(!ids.length)return out.append(h("div",{class:"meta",style:"text-align:center;padding:16px"},"لا أعضاء بعد."));
 const pr=await SC.sb.from("profiles").select("id,username,name,avatar_url,field,university,verified").in("id",ids.slice(0,100));
 (pr.data||[]).filter(p=>!SC.blocked.has(p.id)).sort((a,b)=>(role[b.id]==="admin")-(role[a.id]==="admin")).forEach(p=>{const r=userRow(p,false);if(role[p.id]==="admin")r.append(h("span",{class:"badge b"},"مشرف"));out.append(r)});
 if(ids.length>100)out.append(h("div",{class:"meta",style:"text-align:center"},"يُعرض أول 100 عضو."))}

async function instLabs(out,i){
 const r=await SC.sb.rpc("list_institutions",{q:null,k:"lab",par:i.id});
 if(r.error)return out.append(h("div",{class:"card"},"⚠ "+r.error.message));
 if(SC.user)out.append(h("div",{style:"padding:0 16px"},h("button",{class:"btn",onclick:()=>instCreate("lab",i.id)},"＋ أضف مخبرًا تابعًا لهذه الجامعة")));
 if(!(r.data||[]).length)out.append(h("div",{class:"meta",style:"text-align:center;padding:16px"},"لا مخابر مضافة بعد."));
 (r.data||[]).forEach(x=>out.append(instRow(x)))}

// مجموعات المواد العامة التي كتب منشئوها اسم هذه الجامعة (لا نكرّر جدول المجموعات)
async function instGroups(out,i){
 const t=sq(i.name);
 const r=await SC.sb.from("conversations").select("id,title,subject,level,university").eq("kind","group").eq("is_public",true).ilike("university","*"+t+"*").order("last_at",{ascending:false}).limit(20);
 if(r.error)return out.append(h("div",{class:"card"},"⚠ "+r.error.message));
 if(!(r.data||[]).length)return out.append(h("div",{class:"meta",style:"text-align:center;padding:16px"},"لا مجموعات مواد باسم هذه الجامعة بعد. أنشئ مجموعة من «الرسائل» واكتب اسم الجامعة."));
 r.data.forEach(g=>out.append(h("div",{class:"card",style:"display:flex;gap:8px;align-items:center"},
  h("div",{style:"flex:1;min-width:0"},h("b",{dir:"auto"},g.title),h("div",{class:"meta",dir:"auto"},[g.subject,lvName(g.level)].filter(Boolean).join(" · "))),
  h("button",{class:"btn",onclick:async()=>{if(!SC.user)return authModal();const x=await SC.sb.rpc("join_group",{cid:g.id});if(x.error)return toast(x.error.message);openChat(g.id,"👥 "+g.title)}},"انضم"))))}

// ---------- الملف الشخصي: وسوم الجامعة/المخبر ----------
{const _pv=profView;profView=async function(v){await _pv(v);
 try{const box=v.lastElementChild,card=box&&box.firstElementChild;if(!card||!SC.uid)return;const uid=SC.uid;
  const r=await SC.sb.rpc("user_institutions",{uid});if(r.error||!(r.data||[]).length||SC.uid!==uid||!card.isConnected)return;
  card.append(h("div",{class:"btns",style:"justify-content:center"},r.data.map(x=>h("button",{class:"btn",onclick:()=>openInst(x.id)},(x.kind==="lab"?"🔬 ":"🏛 ")+x.name+(x.verified?" ✓":"")))))}catch(e){}}}
