// مجموعات المواد والبحث الأكاديمي (عامة وخاصة) + الإرشاد الأكاديمي. يُحمَّل بعد formats.js.
const LVN=["ليسانس 1","ليسانس 2","ليسانس 3","ماستر 1","ماستر 2","دكتوراه"];
const LVN_EN=["Licence 1","Licence 2","Licence 3","Master 1","Master 2","PhD"];
const gTr=(a,e,f)=>S.lang==="ar"?a:S.lang==="fr"?(f||e):e;
const lvSel=any=>h("select",{class:"cin"},h("option",{value:""},any?gTr("كل المستويات","All levels","Tous niveaux"):gTr("المستوى (اختياري)","Level (optional)","Niveau")),LVCODE.map((c,i)=>h("option",{value:c},S.lang==="ar"?LVN[i]:LVN_EN[i])));
const lvName=c=>{const idx=LVCODE.indexOf(c);if(idx<0)return"";return S.lang==="ar"?LVN[idx]:LVN_EN[idx]};

function newGroupModal(){
 const me=window.Net?Net.myIdentity():{id:SC.user&&SC.user.id,name:(SC.me&&SC.me.name)||S.prof.name||"Scholar",username:(SC.me&&SC.me.username)||"scholar"};
 const ti=h("input",{class:"cin",placeholder:gTr("اسم المجموعة: مثال، حلقة علم الاجتماع","Group name: e.g., Sociology Seminar","Nom du groupe"),maxlength:"80"});
 const fd=window.Net?h("select",{class:"cin"},Net.DISCIPLINES.map(d=>h("option",{value:d.id||"General",selected:(me.field||"")===d.id?"selected":null},d.id?(d[S.lang]||d.en):gTr("متعدد التخصصات","Interdisciplinary","Interdisciplinaire")))):null;
 const sb=h("input",{class:"cin",placeholder:gTr("المادة / الموضوع البحثي (اختياري)","Subject / Research topic (optional)","Matière"),maxlength:"80"});
 const lv=lvSel(false);
 const un=h("input",{class:"cin",placeholder:gTr("الجامعة (اختياري)","University (optional)","Université"),maxlength:"80",value:me.university||""});
 const pub=h("input",{type:"checkbox",checked:true});
 const createBtn=h("button",{class:"pri",type:"button",onclick:async()=>{
  const title=ti.value.trim();if(!title)return toast(gTr("اكتب اسم المجموعة","Enter a group name","Entrez un nom"));
  createBtn.disabled=true;
  if(SC.user&&SC.sb){
   try{
    const r=await SC.sb.rpc("create_study_group",{ttl:title,subj:sb.value,lvl:lv.value||null,univ:un.value,pub:pub.checked});
    if(!r.error&&r.data){
     if(window.Net){
      Net.apiPost("/api/groups",{title,field:(fd&&fd.value)||sb.value||"General",level:lv.value||"",university:un.value.trim(),description:sb.value.trim(),visibility:pub.checked?"public":"private",creatorId:me.id,creatorName:me.name,creatorHandle:me.username}).catch(()=>{});
     }
     m.remove();return openChat(r.data,"👥 "+title);
    }
   }catch(e){}
  }
  if(window.Net){
   try{
    const res=await Net.apiPost("/api/groups",{title,field:(fd&&fd.value)||sb.value||"General",level:lv.value||"",university:un.value.trim(),description:sb.value.trim(),visibility:pub.checked?"public":"private",creatorId:me.id,creatorName:me.name,creatorHandle:me.username});
    m.remove();
    toast(gTr("تم إنشاء المجموعة ✓ · رمز الدعوة: ","Group created ✓ · Invite code: ","Groupe créé ✓ · Code : ")+res.group.inviteCode);
    return openChat(res.group.id,"👥 "+res.group.title);
   }catch(e){createBtn.disabled=false;return toast(e.message||gTr("تعذّر إنشاء المجموعة","Could not create group","Erreur"))}
  }
  createBtn.disabled=false;
 }},gTr("إنشاء المجموعة","Create Group","Créer le groupe"));

 const m=modal(
  h("h3",{},ic("users")," ",gTr("مجموعة بحثية ودراسية جديدة","New Academic Study Group","Nouveau groupe d'étude")),
  ti,fd,sb,lv,un,
  h("label",{class:"meta",style:"display:flex;gap:8px;align-items:center;cursor:pointer;margin-top:6px"},pub,gTr("عامة: تظهر في الدليل ويمكن للباحثين الانضمام إليها (أو خاصة برمز دعوة)","Public: discoverable by scholars (uncheck for private invite-code group)","Public : visible dans l'annuaire")),
  createBtn,
  cancelB({remove:()=>m.remove()})
 );
}

async function discoverModal(){
 const me=window.Net?Net.myIdentity():{id:SC.user&&SC.user.id,name:(SC.me&&SC.me.name)||"Scholar",username:(SC.me&&SC.me.username)||"scholar"};
 const q=h("input",{class:"cin",placeholder:gTr("ابحث بالتخصص أو الجامعة أو اسم المجموعة","Search by field, university, or group name","Rechercher un groupe")});
 const lv=lvSel(true);
 const inv=h("input",{class:"cin",dir:"ltr",placeholder:gTr("أدخل رمز دعوة مجموعة خاصة","Private group invite code (e.g. ABC-123)","Code d'invitation privé")});
 const list=h("div",{},"⏳");
 const joinPrivate=async()=>{
  const code=inv.value.trim();if(!code||!window.Net)return;
  try{
   const r=await Net.apiPost("/api/groups/join",{inviteCode:code,userId:me.id,name:me.name,handle:me.username});
   m.remove();openChat(r.group.id,"👥 "+r.group.title);
  }catch(e){toast(e.message||gTr("رمز الدعوة غير صحيح","Invalid invite code","Code invalide"))}
 };
 const m=modal(
  h("h3",{},ic("compass")," ",gTr("اكتشف المجموعات الأكاديمية","Discover Academic Groups","Découvrir des groupes")),
  h("div",{style:"display:flex;gap:6px;align-items:center"},inv,h("button",{class:"btn",type:"button",onclick:joinPrivate},gTr("دخول برمز","Join Code","Rejoindre"))),
  q,lv,
  h("button",{class:"btn",type:"button",onclick:load},ic("search"),gTr("بحث","Search","Rechercher")),
  list,
  cancelB({remove:()=>m.remove()})
 );

 async function load(){
  setT(list,"⏳");
  const cards=[];
  if(window.Net){
   try{
    const qs=new URLSearchParams({peerId:me.id});
    if(q.value.trim())qs.set("q",q.value.trim());
    const r=await Net.apiGet("/api/groups?"+qs.toString());
    (r.groups||[]).forEach(g=>{
     if(lv.value&&g.level!==lv.value)return;
     cards.push(h("div",{class:"card grp-card"},
      h("div",{style:"display:flex;align-items:center;justify-content:space-between;gap:8px"},
       h("b",{dir:"auto"},g.title),
       h("span",{class:"badge "+(g.visibility==="private"?"n":"b")},g.visibility==="private"?gTr("خاصة","Private","Privé"):gTr("عامة","Public","Public"))
      ),
      h("div",{class:"meta",dir:"auto"},[g.field&&Net.discLabel(g.field),lvName(g.level),g.university,(g.members||[]).length+" "+gTr("أعضاء","members","membres")].filter(Boolean).join(" · ")),
      h("div",{class:"btns"},
       h("button",{class:"btn fill",type:"button",onclick:async()=>{
        await Net.apiPost("/api/groups/join",{groupId:g.id,userId:me.id,name:me.name,handle:me.username});
        m.remove();openChat(g.id,"👥 "+g.title);
       }},gTr("فتح / انضمام","Open / Join","Rejoindre")),
       g.roomId&&window.joinStudyRoom?h("button",{class:"btn",type:"button",onclick:()=>{m.remove();joinStudyRoom(g.roomId)}},ic("video"),gTr("غرفة فيديو","Video Room","Vidéo")):null
      )
     ));
    });
   }catch(e){}
  }
  if(SC.user&&SC.sb){
   try{
    let s=SC.sb.from("conversations").select("id,title,subject,level,university").eq("kind","group").eq("is_public",true);
    if(lv.value)s=s.eq("level",lv.value);const t0=sq(q.value);if(t0)s=s.or("title.ilike.*"+t0+"*,subject.ilike.*"+t0+"*,university.ilike.*"+t0+"*");
    const {data}=await s.order("last_at",{ascending:false}).limit(20);
    (data||[]).forEach(g=>cards.push(h("div",{class:"btns",style:"align-items:center"},
     h("div",{style:"flex:1;min-width:0"},h("b",{dir:"auto"},g.title),h("div",{class:"meta",dir:"auto"},[g.subject,lvName(g.level),g.university].filter(Boolean).join(" · "))),
     h("button",{class:"btn",onclick:async()=>{const r=await SC.sb.rpc("join_group",{cid:g.id});if(r.error)return toast(r.error.message);m.remove();openChat(g.id,"👥 "+g.title)}},gTr("انضم","Join","Rejoindre")))));
   }catch(e){}
  }
  list.replaceChildren(...(cards.length?cards:[h("div",{class:"meta",style:"padding:10px 0"},gTr("لا مجموعات مطابقة بعد — أنشئ أول مجموعة!","No matching groups yet — create the first one!","Aucun groupe trouvé."))]));
 }
 q.onkeydown=e=>{if(e.key==="Enter")load()};load();
}

// ---------- الإرشاد الأكاديمي ----------
async function openMentors(){
 if(!SC.user)return authModal();
 const me=SC.me||{},ok=["m1","m2","phd"].includes(me.academic_level)&&me.level_verified,body=h("div",{}),
  m=modal(h("h3",{},"🎓 "+gTr("الإرشاد الأكاديمي","Academic Mentorship","Mentorat")),body,cancelB({remove:()=>m.remove()}));
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

{const _cl=chatList;chatList=async function(v){await _cl(v);if(SC.user)v.prepend(h("div",{class:"btns",style:"padding:0 16px"},h("button",{class:"btn",onclick:openMentors},"🎓 "+gTr("الإرشاد الأكاديمي","Academic Mentorship","Mentorat"))))}}

