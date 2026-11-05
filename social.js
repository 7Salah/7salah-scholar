// المجتمع الأكاديمي: حسابات وصفحات ومنشورات (Supabase). يُحمَّل بعد app.js ويشاركه الدوال العامة.
const SC={blocked:new Set(),sb:null,user:null,me:null,view:"feed",kind:"",uid:null};
Object.assign(T.ar,{nCom:"المجتمع"});Object.assign(T.en,{nCom:"Community"});
TABS.splice(4,0,["com","nCom","<circle cx='9' cy='8' r='3'/><path d='M3 20c0-3 3-5 6-5s6 2 6 5'/><circle cx='17' cy='9' r='2.5'/><path d='M17 14c2.5 0 4 1.5 4 4'/>"]);
VIEWS.com=renderCom;buildTabs();
const okU=u=>/^https:\/\//i.test(u||"");
const cancelB=m=>h("div",{class:"acts"},h("button",{class:"btn",onclick:()=>m.remove()},t("cancel")));
let _lp=null;const loadSb=()=>_lp||(_lp=new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
 s.onload=async()=>{SC.sb=supabase.createClient(SUPA.url,SUPA.key);await setUser((await SC.sb.auth.getSession()).data.session);if(window.startNotif)startNotif();
  SC.sb.auth.onAuthStateChange((_e,ss)=>{setTimeout(async()=>{await setUser(ss);if(window.startNotif)startNotif();if(S.tab==="com")render()},0)});ok()};s.onerror=()=>{_lp=null;no()};document.head.append(s)}));
async function setUser(ss){SC.user=ss?ss.user:null;SC.me=null;if(SC.user)SC.me=(await SC.sb.from("profiles").select("*").eq("id",SC.user.id).maybeSingle()).data;SC.blocked=new Set(((SC.user?(await SC.sb.from("blocks").select("blocked").eq("blocker",SC.user.id)).data:null)||[]).map(x=>x.blocked))}
function renderCom(v){
 if(!(window.SUPA&&SUPA.url&&SUPA.key)){v.append(h("div",{class:"card"},h("h3",{},"🌐 المجتمع الأكاديمي"),h("div",{class:"meta"},SUPA.bad?("⚠️ "+SUPA.bad):"لتفعيله: أنشئ مشروع Supabase، شغّل schema.sql، ثم ضع Project URL وanon key في config.js.")));return}
 v.append(h("div",{class:"meta",style:"text-align:center;padding:24px"},"⏳"));
 loadSb().then(()=>{if(S.tab!=="com")return;v.replaceChildren();comBody(v);v.append(h("div",{class:"meta",style:"text-align:center;padding:16px"},h("a",{href:"#",onclick:e=>{e.preventDefault();legalModal()}},"الشروط وسياسة الخصوصية")))}).catch(()=>{v.replaceChildren(h("div",{class:"card"},"⚠ تعذّر الاتصال. تحقق من الإنترنت."))})}
function comBody(v){const u=SC.user;if(window.stopChat)stopChat();
 if(u&&!SC._k0){SC._k0=1;if(!SC.kind)SC.kind="foryou"}if(!u&&SC.kind==="foryou")SC.kind="";
 v.append(h("div",{class:"card"},h("div",{class:"btns",style:"margin:0"},
  h("button",{class:"btn",onclick:()=>{SC.view="feed";render()}},"🏠 المنشورات"),h("button",{class:"btn",onclick:()=>{SC.view="rank";render()}},"🏆 التصنيف"),u?h("button",{class:"btn",onclick:()=>{SC.view="chats";render()}},"💬 الرسائل"+(unreadTotal()?" ("+unreadTotal()+")":"")):null,SC.me&&SC.me.is_admin?h("button",{class:"btn",onclick:()=>{SC.view="admin";render()}},"🛡 الإدارة"):null,u?h("button",{class:"btn",onclick:()=>openProf(u.id)},"👤 صفحتي"):null,h("button",{class:"btn teacher-nav",onclick:()=>{SC.view="teacher";SC.uid=null;render()}},"🎓 صفحة الأستاذ"),
  u?h("button",{class:"btn",onclick:postModal},"＋ انشر"):null,h("button",{class:"btn",onclick:trModal},"🌐"),h("button",{class:"btn",onclick:()=>u?SC.sb.auth.signOut():authModal()},u?"خروج":"دخول / تسجيل"))));
 if(SC.view==="rank")return rankView(v);if(SC.view==="teacher")return teacherView(v);if(SC.view==="prof")return profView(v);if(SC.view==="chats")return chatList(v);if(SC.view==="admin")return adminView(v);if(SC.view==="search")return searchView(v);if(SC.view==="chat")return chatRoom(v);
 v.append(searchBar());if(u&&typeof storiesBar==="function")v.append(storiesBar());if(u&&(!SC.kind||SC.kind==="foryou"))sugBox(v);v.append(h("div",{class:"chips",style:"padding:0 16px"},(u?[["foryou","✨ لك"]]:[]).concat([["","الكل"],["post","💬 منشورات"],["question","❓ أسئلة"],["deck","🃏 حزم"],["topdecks","🔥 حزم رائجة"],["research","أبحاث"],["experience","تجارب"],["video","فيديو"],["board","🖼 لوحات"],["map","🗺 خرائط"],["attachment","📎 مرفقات"]]).concat(u?[["following","متابَعوني"]]:[]).map(([k,n])=>h("button",{class:"chip"+(SC.kind===k?" on":""),onclick:()=>{SC.kind=k;render()}},n))));
 const box=h("div",{});v.append(box);if(SC.kind==="foryou"&&u)loadForYou(box);else if(SC.kind==="topdecks")loadTopDecks(box);else if(SC.kind==="following"&&u)SC.sb.from("follows").select("followee").eq("follower",u.id).then(r=>loadPosts(box,{uids:(r.data||[]).map(x=>x.followee)}));else loadPosts(box,SC.kind&&SC.kind!=="following"&&SC.kind!=="foryou"?{kind:SC.kind}:{})}
const av=(p,n)=>{const d=h("div",{class:"cav",style:"width:"+n+"px;height:"+n+"px;font-size:"+n/2+"px"});
 if(p&&p.avatar_url&&p.avatar_url.startsWith(SUPA.url+"/"))d.append(h("img",{src:p.avatar_url,alt:""}));else d.textContent=((p&&(p.name||p.username))||"?").slice(0,1).toUpperCase();return d};
function vid(u){const m=(u||"").match(/^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
 return m?h("iframe",{class:"cvid",src:"https://www.youtube-nocookie.com/embed/"+m[1],allowfullscreen:"",loading:"lazy"}):(okU(u)?h("a",{class:"btn",href:u,target:"_blank",rel:"noopener noreferrer"},"▶ مشاهدة الفيديو"):null)}
async function loadPosts(box,f){
 // البحث يشمل التخصص (topic)؛ وإن لم يُشغَّل v19m-topic.sql بعد نعيد المحاولة بدونه كي لا ينكسر البحث
 const mk=tp=>{let q=SC.sb.from("posts").select("*,likes(count),comments(count)").order("created_at",{ascending:false}).limit(f.limit||30);
  if(f.kind)q=q.eq("kind",f.kind);if(f.ids)q=q.in("id",f.ids);if(f.uid)q=q.eq("user_id",f.uid);if(f.uids)q=q.in("user_id",f.uids.length?f.uids:["00000000-0000-0000-0000-000000000000"]);if(f.q)q=q.or("title.ilike.*"+f.q+"*,body.ilike.*"+f.q+"*"+(tp?",topic.ilike.*"+f.q+"*":""));return q};
 let {data,error}=await mk(true);if(error&&f.q&&/topic/i.test(error.message||""))({data,error}=await mk(false));
 if(error){box.append(h("div",{class:"card"},"⚠ "+error.message));return}
 if(f.rank)data=f.rank(data).slice(0,30);
 {const ids=[...new Set(data.map(p=>p.user_id))];if(ids.length){const pr=await SC.sb.from("profiles").select("id,username,name,avatar_url,verified,is_teacher").in("id",ids),m={};(pr.data||[]).forEach(x=>m[x.id]=x);data.forEach(p=>p.profiles=m[p.user_id]||null)}}
 const mine=new Set();if(SC.user&&data.length)((await SC.sb.from("likes").select("post_id").eq("user_id",SC.user.id).in("post_id",data.map(p=>p.id))).data||[]).forEach(x=>mine.add(x.post_id));
 if(!data.length)box.append(h("div",{class:"meta",style:"text-align:center;padding:20px"},"لا منشورات بعد. كن أول من ينشر!"));
 data.filter(p=>!SC.blocked.has(p.user_id)).forEach(p=>{const c=postCard(p,mine.has(p.id));if(p._why)c.prepend(h("div",{class:"meta",style:"font-size:12px;opacity:.75;margin-bottom:4px"},p._why));box.append(c)})}
function postCard(p,liked){const a=p.profiles||{},cnt=x=>(p[x]&&p[x][0]&&p[x][0].count)||0;let lk=cnt("likes"),lked=liked;
 const lb=h("button",{class:"btn"}),cb=h("div",{}),tr=h("div",{class:"trout",dir:"auto"}),paint=()=>{lb.textContent=(lked?"❤️ ":"🤍 ")+lk};paint();
 lb.onclick=async()=>{if(!SC.user)return authModal();lked=!lked;lk+=lked?1:-1;paint();
  const r=lked?await SC.sb.from("likes").insert({post_id:p.id,user_id:SC.user.id}):await SC.sb.from("likes").delete().match({post_id:p.id,user_id:SC.user.id});
  if(r.error){lked=!lked;lk+=lked?1:-1;paint()}};
 const own=SC.user&&SC.user.id===p.user_id,K={post:"💬 منشور",question:"❓ سؤال",deck:"🃏 حزمة",research:"📄 بحث",experience:"🧪 تجربة",video:"🎬 فيديو",lesson:"🎓 مادة تعليمية"};
 return h("div",{class:"card"},
  h("div",{class:"phd",onclick:()=>openProf(a.id)},av(a,42),h("div",{},h("b",{dir:"auto"},(a.name||a.username||"?"),a.verified?h("span",{class:"premium-badge","aria-label":"حساب مميز موثّق"}," ✓"):null,a.is_teacher?h("span",{class:"teacher-badge"}," أستاذ"):null),h("div",{class:"meta"},"@"+(a.username||"")+" · "+new Date(p.created_at).toLocaleDateString(S.lang)))),
  h("span",{class:"badge"},K[p.kind]||p.kind),h("h3",{dir:"auto"},p.title),p.body?h("div",{dir:"auto",style:"white-space:pre-wrap"},p.body):null,tr,
  p.doi?h("div",{class:"btns"},h("a",{class:"btn",href:"https://doi.org/"+encodeURI(p.doi),target:"_blank",rel:"noopener noreferrer"},"🔗 DOI: "+p.doi)):null,vid(p.video_url),
  h("div",{class:"btns"},lb,trBtn(()=>p.title+(p.body?"\n\n"+p.body:""),tr),h("button",{class:"btn",onclick:()=>cb.childNodes.length?cb.replaceChildren():loadComments(p,cb)},"💬 "+cnt("comments")),
   own?h("button",{class:"btn",onclick:async()=>{if(confirm("حذف المنشور؟")){if(p.file_path)await SC.sb.storage.from("posts").remove([p.file_path]);await SC.sb.from("posts").delete().eq("id",p.id);render()}}},"🗑"):
   h("button",{class:"btn",onclick:()=>reportModal({post_id:p.id,target_user:p.user_id})},"🚩")),cb)}
async function loadComments(p,box){
 const {data}=await SC.sb.from("comments").select("*,profiles(username,name)").eq("post_id",p.id).order("created_at").limit(50);
 box.replaceChildren(...(data||[]).filter(c=>!SC.blocked.has(c.user_id)).map(c=>{const o=h("div",{class:"trout"});return h("div",{class:"meta",dir:"auto"},h("b",{},(c.profiles&&(c.profiles.name||c.profiles.username))||"?"),": "+c.body,trBtn(()=>c.body,o,"flag"),o)}));
 const inp=h("input",{class:"cin",placeholder:"اكتب تعليقًا…",maxlength:"500"});
 box.append(h("div",{class:"btns"},inp,h("button",{class:"btn",onclick:async()=>{const b=inp.value.trim();if(!b)return;if(!SC.user)return authModal();
  const r=await SC.sb.from("comments").insert({post_id:p.id,user_id:SC.user.id,body:b});if(r.error)return toast(r.error.message);loadComments(p,box)}},"إرسال")))}
function openProf(id){SC.view="prof";SC.uid=id;render();window.scrollTo(0,0)}
async function profView(v){const box=h("div",{});v.append(box);const cn=(c,k,id)=>SC.sb.from("follows").select("*",{count:"exact",head:true}).eq(c,id);
 const [pr,f1,f2,f3]=await Promise.all([SC.sb.from("profiles").select("*").eq("id",SC.uid).maybeSingle(),cn("followee",0,SC.uid),cn("follower",0,SC.uid),SC.user?cn("follower",0,SC.user.id).eq("followee",SC.uid):{count:0}]);
 const p=pr.data;if(!p){box.append(h("div",{class:"card"},"الصفحة غير موجودة"));return}
 const own=SC.user&&SC.user.id===p.id;let fol=!!f3.count,nf=f1.count||0;const st=h("div",{class:"meta"}),fb=h("button",{class:"pri"});
 const paint=()=>{st.textContent=nf+" متابِع · "+(f2.count||0)+" يتابع";fb.textContent=fol?"✓ تتابعه":"＋ متابعة"};paint();
 fb.onclick=async()=>{if(!SC.user)return authModal();fol=!fol;nf+=fol?1:-1;paint();
  const r=fol?await SC.sb.from("follows").insert({follower:SC.user.id,followee:p.id}):await SC.sb.from("follows").delete().match({follower:SC.user.id,followee:p.id});if(r.error){fol=!fol;nf+=fol?1:-1;paint()}};
 box.append(h("div",{class:"card",style:"text-align:center"},h("div",{style:"display:flex;justify-content:center"},av(p,84)),h("h3",{dir:"auto"},(p.name||p.username),p.verified?h("span",{class:"premium-badge"}," ✓ حساب مميز"):null,p.is_teacher?h("span",{class:"teacher-badge"}," 🎓 أستاذ"):null),
  h("div",{class:"meta ltr-handle"},"@"+p.username),uidChip(p.researcher_uid),p.academic_level?h("div",{class:"meta"},"🎓 "+(AVC[Math.max(0,LVCODE.indexOf(p.academic_level))][0])):null,[p.field,p.university].filter(Boolean).length?h("div",{class:"meta",dir:"auto"},[p.field,p.university].filter(Boolean).join(" · ")):null,
  p.bio?h("div",{dir:"auto",style:"margin:6px 0"},p.bio):null,p.is_teacher?h("button",{class:"teacher-open",onclick:()=>{SC.view="teacher";SC.uid=p.id;render()}},"🎓 زيارة صفحة الأستاذ"):null,st,own?h("button",{class:"pri",onclick:()=>editModal(p)},"✏️ تعديل ملفي"):[fb,h("button",{class:"btn",style:"margin-top:8px",onclick:async()=>{if(!SC.user)return authModal();const r=await SC.sb.rpc("start_dm",{other:p.id});if(r.error)return toast(r.error.message);openChat(r.data,p.name||p.username)}},"💬 راسل"),h("div",{class:"btns",style:"justify-content:center"},h("button",{class:"btn",onclick:async()=>{if(!SC.user)return authModal();const bl=SC.blocked.has(p.id);if(!bl&&!confirm("حظر هذا المستخدم؟ لن ترى منشوراته ولن يستطيع مراسلتك."))return;const r=bl?await SC.sb.from("blocks").delete().match({blocker:SC.user.id,blocked:p.id}):await SC.sb.from("blocks").insert({blocker:SC.user.id,blocked:p.id});if(r.error)return toast(r.error.message);bl?SC.blocked.delete(p.id):SC.blocked.add(p.id);render()}},SC.blocked.has(p.id)?"إلغاء الحظر":"🚫 حظر"),h("button",{class:"btn",onclick:()=>reportModal({target_user:p.id})},"🚩 إبلاغ"),SC.me&&SC.me.is_admin?h("button",{class:"btn",onclick:async()=>{const x=await SC.sb.rpc("admin_act",{act:p.verified?"unverify":"verify",tid:p.id});if(x.error)return toast(x.error.message);render()}},p.verified?"إلغاء التوثيق":"⭐ توثيق مميز"):null,SC.me&&SC.me.is_admin?h("button",{class:"btn",onclick:async()=>{const x=await SC.sb.rpc("admin_act",{act:p.is_teacher?"unset_teacher":"set_teacher",tid:p.id});if(x.error)return toast(x.error.message);render()}},p.is_teacher?"إزالة صفة الأستاذ":"🎓 اعتماد كأستاذ"):null)]));
 const lst=h("div",{});box.append(lst);loadPosts(lst,{uid:p.id})}
async function teacherView(v){
 const back=h("button",{class:"btn",onclick:()=>{SC.view="feed";SC.uid=null;render()}},"← العودة للمجتمع");
 v.append(h("section",{class:"teacher-hero"},h("div",{class:"teacher-kicker"},"7SALAH SCHOLAR · FACULTY"),h("h2",{},"مساحة الأستاذ"),h("p",{},"فضاء أكاديمي مخصص للأساتذة لنشر الدروس والمواد التعليمية والتوجيهات العلمية."),back));
 const box=h("div",{});v.append(box);
 let q=SC.sb.from("profiles").select("id,username,name,field,university,bio,avatar_url,verified,is_teacher").eq("is_teacher",true).order("created_at",{ascending:false});
 if(SC.uid)q=q.eq("id",SC.uid);
 const r=await q.limit(50);if(r.error){box.append(h("div",{class:"card"},"تعذّر تحميل صفحات الأساتذة: "+r.error.message));return}
 if(!r.data||!r.data.length){box.append(h("div",{class:"card teacher-empty"},"لا توجد صفحات أساتذة منشورة بعد. تُفعّل صفة الأستاذ من الإدارة بعد التحقق من الحساب."));return}
 if(SC.uid){const p=r.data[0];box.append(h("div",{class:"card teacher-profile"},av(p,76),h("h3",{},p.name||p.username,p.verified?h("span",{class:"premium-badge"}," ✓ حساب مميز"):null),h("div",{class:"meta"},"@"+p.username),h("div",{class:"meta"},[p.field,p.university].filter(Boolean).join(" · ")),p.bio?h("p",{},p.bio):null,h("button",{class:"btn",onclick:()=>{SC.uid=null;render()}},"عرض جميع الأساتذة")),h("h3",{class:"teacher-section-title"},"المواد والمنشورات التعليمية"));const posts=h("div",{});box.append(posts);loadPosts(posts,{uid:p.id});return}
 r.data.forEach(p=>box.append(h("article",{class:"card teacher-card",onclick:()=>{SC.uid=p.id;render()}},av(p,58),h("div",{class:"teacher-info"},h("b",{},p.name||p.username,p.verified?h("span",{class:"premium-badge"}," ✓"):null),h("div",{class:"meta"},"@"+p.username),h("div",{class:"meta"},[p.field,p.university].filter(Boolean).join(" · ")||"أستاذ جامعي"),p.bio?h("p",{},p.bio):null),h("span",{class:"teacher-arrow"},"←"))));
 if(SC.me&&SC.me.is_teacher){const own=h("button",{class:"pri",onclick:()=>openProf(SC.user.id)},"عرض صفحتي الأكاديمية");box.prepend(h("div",{class:"card teacher-own"},h("b",{},"مرحبًا بك في مساحة الأستاذ"),h("p",{},"يمكنك نشر موادك التعليمية من زر «انشر» داخل المجتمع، وستظهر في صفحتك الأكاديمية."),own))}
}
const square=(f,n)=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const c=document.createElement("canvas");c.width=c.height=n;const s=Math.min(i.width,i.height);
 c.getContext("2d").drawImage(i,(i.width-s)/2,(i.height-s)/2,s,s,0,0,n,n);c.toBlob(ok,"image/jpeg",.85)};i.onerror=no;i.src=URL.createObjectURL(f)});
function editModal(p){const I=(v,ph)=>h("input",{class:"cin",value:v||"",placeholder:ph}),nm=I(p.name,"الاسم"),fl=(x=>{x.setAttribute("list",fieldDl());x.maxLength=60;return x})(I(p.field,"التخصص (اكتب ما تشاء أو اختر من الاقتراحات)")),un=I(p.university,"الجامعة / المؤسسة"),
 bio=h("textarea",{class:"cta",maxlength:"300",placeholder:"نبذة عنك"},p.bio||""),file=h("input",{type:"file",accept:"image/*"});
 const m=modal(h("h3",{},"✏️ ملفي الأكاديمي"),h("div",{class:"meta"},"الصورة الشخصية"),file,nm,fl,un,bio,h("button",{class:"pri",onclick:async()=>{let url=p.avatar_url;const f=file.files[0];
  if(f){const b=await square(f,256),path=SC.user.id+"/avatar-"+Date.now()+".jpg",up=await SC.sb.storage.from("avatars").upload(path,b,{contentType:"image/jpeg"});
   if(up.error)return toast(up.error.message);url=SC.sb.storage.from("avatars").getPublicUrl(path).data.publicUrl}
  const r=await SC.sb.from("profiles").update({name:nm.value.trim(),field:fl.value.trim(),university:un.value.trim(),bio:bio.value.trim(),avatar_url:url}).eq("id",p.id);
  if(r.error)return toast(r.error.message);await setUser((await SC.sb.auth.getSession()).data.session);m.remove();render()}},"حفظ"),h("button",{class:"btn danger",style:"margin-top:8px",onclick:deleteAccount},"🗑 حذف حسابي نهائيًا"),cancelB({remove:()=>m.remove()}))}
function postModal(){const kinds=[["research","📄 بحث"],["experience","🧪 تجربة"],["video","🎬 فيديو"]];if(SC.me&&SC.me.is_teacher)kinds.push(["lesson","🎓 مادة تعليمية"]);const kind=h("select",{class:"cin"},kinds.map(([k,n])=>h("option",{value:k},n)));
 const ti=h("input",{class:"cin",placeholder:"العنوان",maxlength:"150"}),bd=h("textarea",{class:"cta",placeholder:"لخّص بحثك أو اشرح تجربتك…",maxlength:"3000"}),
 doi=h("input",{class:"cin",dir:"ltr",placeholder:"DOI (اختياري — يقبل الرابط أو الرقم)"}),vd=h("input",{class:"cin",dir:"ltr",placeholder:"رابط فيديو يوتيوب (اختياري)"});
 const sv=h("select",{class:"cin",onchange:()=>{const s=S.saved[sv.value-1];if(s){ti.value=s.title||"";doi.value=s.doi||""}}},h("option",{value:0},"أرفق من مصادري المحفوظة…"),S.saved.map((s,i)=>h("option",{value:i+1},(s.title||"").slice(0,60))));
 const m=modal(h("h3",{},"＋ منشور جديد"),kind,ti,bd,sv,doi,vd,h("button",{class:"pri",onclick:async()=>{
  const d=cleanDoi(doi.value),vu=vd.value.trim();if(!ti.value.trim())return toast("اكتب عنوانًا");if(d&&!/^10\.\d{4,9}\/\S+$/.test(d))return toast("صيغة DOI غير صحيحة — الصق الرقم مثل 10.1000/xyz أو الرابط كاملًا، أو اتركه فارغًا");if(vu&&!okU(vu))return toast("الرابط يجب أن يبدأ بـ https://");
  const r=await SC.sb.from("posts").insert({user_id:SC.user.id,kind:kind.value,title:ti.value.trim(),body:bd.value.trim()||null,doi:d||null,video_url:vu||null});
  if(r.error)return toast(r.error.message);m.remove();SC.view="feed";render()}},"نشر"),cancelB({remove:()=>m.remove()}))}
function authModal(){let up=false;const I=(ph,o)=>h("input",Object.assign({class:"cin",placeholder:ph},o||{}));
 const em=I("البريد الإلكتروني",{type:"email",dir:"ltr"}),pw=I("كلمة المرور (8 أحرف على الأقل)",{type:"password"}),nm=I("الاسم الظاهر"),un=I("اسم المستخدم بالإنجليزية: salah_01",{dir:"ltr"});
 const ag=h("input",{type:"checkbox"}),ex=h("div",{style:"display:none"},nm,un,h("label",{class:"meta",style:"display:flex;gap:6px;align-items:center"},ag,h("span",{},"أوافق على ",h("a",{href:"#",onclick:e=>{e.preventDefault();legalModal()}},"الشروط وسياسة الخصوصية"),"، وعمري 16 سنة فأكثر"))),go=h("button",{class:"pri"},"دخول"),sw=h("button",{class:"btn"},"ليس لديك حساب؟ سجّل");
 sw.onclick=()=>{up=!up;ex.style.display=up?"":"none";go.textContent=up?"إنشاء حساب":"دخول";sw.textContent=up?"لديك حساب؟ ادخل":"ليس لديك حساب؟ سجّل"};
 go.onclick=async()=>{const e=em.value.trim(),p=pw.value;if(!e||p.length<8)return toast("أدخل بريدًا صحيحًا وكلمة مرور من 8 أحرف على الأقل");
  if(up){if(!ag.checked)return toast("يجب الموافقة على الشروط وسياسة الخصوصية");const u=un.value.trim().toLowerCase();if(!/^[a-z0-9_]{3,20}$/.test(u))return toast("اسم المستخدم: 3–20 حرفًا إنجليزيًا أو أرقامًا أو _");
   const r=await SC.sb.auth.signUp({email:e,password:p,options:{data:{username:u,name:nm.value.trim()||u},emailRedirectTo:location.origin+location.pathname}});if(r.error)return toast(r.error.message);if(!r.data.session){toast("أرسلنا رابط تأكيد إلى بريدك الإلكتروني. افتح الرسالة وأكّد الحساب قبل تسجيل الدخول.");return}}
  else{const r=await SC.sb.auth.signInWithPassword({email:e,password:p});if(r.error)return toast(r.error.message)}m.remove()};
 const m=modal(h("h3",{},"👤 حسابك الأكاديمي"),em,pw,ex,go,h("div",{class:"meta"},"بالتسجيل توافق أن ملفك ومنشوراتك عامة."),h("div",{class:"acts"},sw,h("button",{class:"btn",onclick:()=>m.remove()},t("cancel"))))}
