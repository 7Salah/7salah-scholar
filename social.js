// المجتمع الأكاديمي: حسابات وصفحات ومنشورات (Supabase). يُحمَّل بعد app.js ويشاركه الدوال العامة.
const SC={blocked:new Set(),sb:null,user:null,me:null,view:"feed",kind:"",uid:null};
Object.assign(T.ar,{nCom:"المجتمع"});Object.assign(T.en,{nCom:"Community"});
TABS.splice(4,0,["com","nCom",icp("users")]);
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
 loadSb().then(()=>{if(S.tab!=="com")return;v.replaceChildren();comBody(v);if(SC.view==="chat")return;if(window.connBanner)connBanner(v);v.append(h("div",{class:"meta",style:"text-align:center;padding:16px"},h("a",{href:"#",onclick:e=>{e.preventDefault();legalModal()}},"الشروط وسياسة الخصوصية")))}).catch(()=>{v.replaceChildren(h("div",{class:"card"},"⚠ تعذّر الاتصال. تحقق من الإنترنت."))})}
// شريط التنقّل: شبكة ثابتة المواضع (كل وجهة لها خانتها دائمًا) + صف إجراءات منفصل
function comNav(u){const unread=typeof unreadTotal==="function"?unreadTotal():0,V=SC.view||"feed";
 const tile=(icon,label,on,fn,badge)=>h("button",{class:"ctile"+(on?" on":""),"aria-current":on?"page":null,onclick:fn},ic(icon),h("span",{},label),badge?h("i",{class:"cbadge"},badge>99?"99+":String(badge)):null);
 const tiles=[tile("home","المنشورات",V==="feed"||V==="search",()=>{SC.view="feed";render()}),tile("trophy","التصنيف",V==="rank",()=>{SC.view="rank";render()})];
 if(u)tiles.push(tile("message","الرسائل",V==="chats"||V==="chat",()=>{SC.view="chats";render()},unread),tile("user","صفحتي",V==="prof"&&SC.uid===u.id,()=>openProf(u.id)));
 if(SC.me&&SC.me.is_admin)tiles.push(tile("shield","الإدارة",V==="admin",()=>{SC.view="admin";render()}));
 const ib=(icon,label,fn)=>h("button",{class:"ibtn",title:label,"aria-label":label,onclick:fn},ic(icon));
 return h("nav",{class:"cnav","aria-label":"المجتمع"},h("div",{class:"cgrid",style:"--n:"+tiles.length},tiles),
  h("div",{class:"cacts"},u?h("button",{class:"cpost",onclick:postModal},ic("plus"),"انشر"):h("button",{class:"cpost",onclick:authModal},ic("login"),"دخول / تسجيل"),
   ib("globe","لغة الترجمة",trModal),u?ib("logout","خروج",()=>SC.sb.auth.signOut()):null))}
function comBody(v){const u=SC.user;if(window.stopChat)stopChat();
 if(u&&!SC._k0){SC._k0=1;if(!SC.kind)SC.kind="foryou"}if(!u&&SC.kind==="foryou")SC.kind="";
 if(SC.view!=="chat")v.append(comNav(u));
 if(SC.view==="rank")return rankView(v);if(SC.view==="prof")return profView(v);if(SC.view==="chats")return chatList(v);if(SC.view==="admin")return adminView(v);if(SC.view==="search")return searchView(v);if(SC.view==="chat")return chatRoom(v);
 v.append(searchBar());if(u&&typeof storiesBar==="function")v.append(storiesBar());if(u&&(!SC.kind||SC.kind==="foryou"))sugBox(v);
 // الفلاتر في مجموعتين: النطاق (لك / الكل / متابَعوني) ثم نوع المحتوى بشريط أفقي قابل للتمرير
 const pick=k=>()=>{SC.kind=k;render()};
 if(u)v.append(h("div",{class:"seg",role:"tablist"},[["foryou","sparkles","لك"],["","layers","الكل"],["following","user-plus","متابَعوني"]].map(([k,i,n])=>h("button",{role:"tab","aria-selected":SC.kind===k?"true":"false",class:SC.kind===k?"on":"",onclick:pick(k)},ic(i),n))));
 const TK=[["post","message","منشورات"],["question","help","أسئلة"],["deck","cards","حزم"],["topdecks","flame","حزم رائجة"],["research","file-text","أبحاث"],["experience","flask","تجارب"],["video","video","فيديو"],["board","image","لوحات"],["map","map","خرائط"],["attachment","paperclip","مرفقات"]];
 v.append(h("div",{class:"tscroll"},(u?[]:[["","layers","الكل"]]).concat(TK).map(([k,i,n])=>h("button",{class:"tchip"+(SC.kind===k?" on":""),onclick:pick(k)},ic(i),n))));
 const box=h("div",{});v.append(box);if(SC.kind==="foryou"&&u)loadForYou(box);else if(SC.kind==="topdecks")loadTopDecks(box);else if(SC.kind==="following"&&u)SC.sb.from("follows").select("followee").eq("follower",u.id).then(r=>loadPosts(box,{uids:(r.data||[]).map(x=>x.followee)}));else loadPosts(box,SC.kind&&SC.kind!=="following"&&SC.kind!=="foryou"?{kind:SC.kind}:{})}
const av=(p,n)=>{const d=h("div",{class:"cav",style:"width:"+n+"px;height:"+n+"px;font-size:"+n/2+"px"});
 if(p&&p.avatar_url&&p.avatar_url.startsWith(SUPA.url+"/"))d.append(h("img",{src:p.avatar_url,alt:""}));else d.textContent=((p&&(p.name||p.username))||"?").slice(0,1).toUpperCase();return d};
function vid(u){const m=(u||"").match(/^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
 return m?h("iframe",{class:"cvid",src:"https://www.youtube-nocookie.com/embed/"+m[1],allowfullscreen:"",loading:"lazy"}):(okU(u)?h("a",{class:"btn",href:u,target:"_blank",rel:"noopener noreferrer"},"▶ مشاهدة الفيديو"):null)}
async function loadPosts(box,f){
 // البحث يشمل التخصص (topic)؛ وإن لم يُشغَّل v19m-topic.sql بعد نعيد المحاولة بدونه كي لا ينكسر البحث
 const mk=tp=>{let q=SC.sb.from("posts").select("*,likes(count),comments(count)").order("created_at",{ascending:false}).limit(f.limit||30);
  if(f.kind)q=f.kind==="post"?q.in("kind",["post","quote"]):q.eq("kind",f.kind);if(f.q)q=q.neq("kind","repost");if(f.ids)q=q.in("id",f.ids);if(f.uid)q=q.eq("user_id",f.uid);if(f.uids)q=q.in("user_id",f.uids.length?f.uids:["00000000-0000-0000-0000-000000000000"]);if(f.q)q=q.or("title.ilike.*"+f.q+"*,body.ilike.*"+f.q+"*"+(tp?",topic.ilike.*"+f.q+"*":""));return q};
 let {data,error}=await mk(true);if(error&&f.q&&/topic/i.test(error.message||""))({data,error}=await mk(false));
 if(error){box.append(h("div",{class:"card"},"⚠ "+error.message));return}
 if(f.rank)data=f.rank(data).slice(0,30);
 {const ids=[...new Set(data.map(p=>p.user_id))];if(ids.length){const pr=await SC.sb.from("profiles").select("id,username,name,avatar_url,verified,is_teacher").in("id",ids),m={};(pr.data||[]).forEach(x=>m[x.id]=x);data.forEach(p=>p.profiles=m[p.user_id]||null)}}
 if(window.xPrep){try{await xPrep(data)}catch(e){}data=data.filter(p=>!(p.thread_pos>1&&!f.q)&&!p._hide)}
 const mine=new Set();if(SC.user&&data.length)((await SC.sb.from("likes").select("post_id").eq("user_id",SC.user.id).in("post_id",data.map(p=>p.id))).data||[]).forEach(x=>mine.add(x.post_id));
 if(!data.length)box.append(h("div",{class:"meta",style:"text-align:center;padding:20px"},"لا منشورات بعد. كن أول من ينشر!"));
 data.filter(p=>!SC.blocked.has(p.user_id)).forEach(p=>{const c=postCard(p,mine.has(p.id));if(p._why)c.prepend(h("div",{class:"meta",style:"font-size:12px;opacity:.75;margin-bottom:4px"},p._why));box.append(c)})}
function postCard(p,liked){const a=p.profiles||{},cnt=x=>(p[x]&&p[x][0]&&p[x][0].count)||0;let lk=cnt("likes"),lked=liked;
 const lb=h("button",{class:"pbtn like","aria-label":"إعجاب"}),cb=h("div",{}),tr=h("div",{class:"trout",dir:"auto"}),paint=()=>{lb.className="pbtn like"+(lked?" on":"");lb.setAttribute("aria-pressed",lked?"true":"false");lb.replaceChildren(ic("heart",{fill:lked}),h("span",{},String(lk)))};paint();
 lb.onclick=async()=>{if(!SC.user)return authModal();lked=!lked;lk+=lked?1:-1;paint();
  const r=lked?await SC.sb.from("likes").insert({post_id:p.id,user_id:SC.user.id}):await SC.sb.from("likes").delete().match({post_id:p.id,user_id:SC.user.id});
  if(r.error){lked=!lked;lk+=lked?1:-1;paint()}};
 const own=SC.user&&SC.user.id===p.user_id,K={post:["message","منشور"],question:["help","سؤال"],deck:["cards","حزمة"],research:["file-text","بحث"],experience:["flask","تجربة"],video:["video","فيديو"],lesson:["cap","مادة تعليمية"]},kk=K[p.kind];
 const tb=trBtn(()=>p.title+(p.body?"\n\n"+p.body:""),tr,"pbtn");tb.setAttribute("aria-label","ترجمة");tb.title="ترجمة";
 return h("article",{class:"card post","data-pid":p.id},
  h("div",{class:"phead"},h("div",{class:"phd",onclick:()=>openProf(a.id)},av(a,44),h("div",{class:"pwho"},h("b",{dir:"auto"},(a.name||a.username||"?"),a.verified?h("span",{class:"premium-badge","aria-label":"حساب مميز موثّق",title:"حساب مميز موثّق"},ic("check",{w:2.6})):null,a.is_teacher?h("span",{class:"teacher-badge"},ic("cap"),"أستاذ"):null),h("div",{class:"meta"},h("span",{class:"ltr-handle"},"@"+(a.username||""))," · "+new Date(p.created_at).toLocaleDateString(S.lang)))),
   h("span",{class:"kchip"},kk?[ic(kk[0]),kk[1]]:p.kind)),
  h("h3",{dir:"auto"},p.title),p.body?h("div",{class:"pbody",dir:"auto"},p.body):null,tr,
  p.doi?h("div",{class:"btns"},h("a",{class:"btn",href:"https://doi.org/"+encodeURI(p.doi),target:"_blank",rel:"noopener noreferrer"},ic("link"),"DOI: "+p.doi)):null,vid(p.video_url),
  h("div",{class:"pfoot"},h("div",{class:"pacts"},lb,h("button",{class:"pbtn","data-k":"com","aria-label":"التعليقات",onclick:()=>cb.childNodes.length?cb.replaceChildren():loadComments(p,cb)},ic("message"),h("span",{},String(cnt("comments")))),tb),
   own?h("button",{class:"pbtn danger","aria-label":"حذف المنشور",title:"حذف المنشور",onclick:async()=>{if(confirm("حذف المنشور؟")){if(p.file_path)await SC.sb.storage.from("posts").remove([p.file_path]);await SC.sb.from("posts").delete().eq("id",p.id);render()}}},ic("trash")):
   h("button",{class:"pbtn","aria-label":"إبلاغ",title:"إبلاغ",onclick:()=>reportModal({post_id:p.id,target_user:p.user_id})},ic("flag"))),cb)}
async function loadComments(p,box){
 const {data}=await SC.sb.from("comments").select("*,profiles(username,name)").eq("post_id",p.id).order("created_at").limit(50);
 box.replaceChildren(...(data||[]).filter(c=>!SC.blocked.has(c.user_id)).map(c=>{const o=h("div",{class:"trout"});return h("div",{class:"meta",dir:"auto"},h("b",{},(c.profiles&&(c.profiles.name||c.profiles.username))||"?"),": "+c.body,trBtn(()=>c.body,o,"flag"),o)}));
 const inp=h("input",{class:"cin",placeholder:"اكتب تعليقًا…",maxlength:"500"});
 box.append(h("div",{class:"ccomp"},inp,h("button",{class:"sendb","aria-label":"إرسال التعليق",onclick:async()=>{const b=inp.value.trim();if(!b)return;if(!SC.user)return authModal();
  const r=await SC.sb.from("comments").insert({post_id:p.id,user_id:SC.user.id,body:b});if(r.error)return toast(r.error.message);loadComments(p,box)}},ic("send"))))}
function openProf(id){SC.view="prof";SC.uid=id;render();window.scrollTo(0,0)}
async function profView(v){const box=h("div",{});v.append(box);const cn=(c,k,id)=>SC.sb.from("follows").select("*",{count:"exact",head:true}).eq(c,id);
 const [pr,f1,f2,f3,pc]=await Promise.all([SC.sb.from("profiles").select("*").eq("id",SC.uid).maybeSingle(),cn("followee",0,SC.uid),cn("follower",0,SC.uid),SC.user?cn("follower",0,SC.user.id).eq("followee",SC.uid):{count:0},SC.sb.from("posts").select("*",{count:"exact",head:true}).eq("user_id",SC.uid)]);
 const p=pr.data;if(!p){box.append(h("div",{class:"card"},"الصفحة غير موجودة"));return}
 const own=SC.user&&SC.user.id===p.id;let fol=!!f3.count,nf=f1.count||0;const sf=h("b",{},"0"),fb=h("button",{class:"pri pfollow"});
 const paint=()=>{sf.textContent=String(nf);fb.className="pri pfollow"+(fol?" on":"");fb.setAttribute("aria-pressed",fol?"true":"false");fb.replaceChildren(ic(fol?"check":"user-plus"),fol?"تتابعه":"متابعة")};paint();
 fb.onclick=async()=>{if(!SC.user)return authModal();fol=!fol;nf+=fol?1:-1;paint();
  const r=fol?await SC.sb.from("follows").insert({follower:SC.user.id,followee:p.id}):await SC.sb.from("follows").delete().match({follower:SC.user.id,followee:p.id});if(r.error){fol=!fol;nf+=fol?1:-1;paint()}};
 const lvl=p.academic_level?AVC[Math.max(0,LVCODE.indexOf(p.academic_level))][0]:null,
  meta=[lvl&&["cap",lvl],p.field&&["book",p.field],p.university&&["pin",p.university]].filter(Boolean),
  stat=(n,l)=>h("div",{class:"pst"},h("b",{},String(n)),h("span",{},l));
 const dmB=h("button",{class:"btn pmsg",onclick:async()=>{if(!SC.user)return authModal();const r=await SC.sb.rpc("start_dm",{other:p.id});if(r.error)return toast(r.error.message);openChat(r.data,p.name||p.username)}},ic("message"),"راسل");
 const blB=h("button",{class:"btn danger",onclick:async()=>{if(!SC.user)return authModal();const bl=SC.blocked.has(p.id);if(!bl&&!confirm("حظر هذا المستخدم؟ لن ترى منشوراته ولن يستطيع مراسلتك."))return;const r=bl?await SC.sb.from("blocks").delete().match({blocker:SC.user.id,blocked:p.id}):await SC.sb.from("blocks").insert({blocker:SC.user.id,blocked:p.id});if(r.error)return toast(r.error.message);bl?SC.blocked.delete(p.id):SC.blocked.add(p.id);render()}},ic("ban"),SC.blocked.has(p.id)?"إلغاء الحظر":"حظر"),
  rpB=h("button",{class:"btn",onclick:()=>reportModal({target_user:p.id})},ic("flag"),"إبلاغ"),
  vfB=SC.me&&SC.me.is_admin?h("button",{class:"btn",onclick:async()=>{const x=await SC.sb.rpc("admin_act",{act:p.verified?"unverify":"verify",tid:p.id});if(x.error)return toast(x.error.message);render()}},ic("star"),p.verified?"إلغاء التوثيق":"توثيق مميز"):null,
  tcB=SC.me&&SC.me.is_admin?h("button",{class:"btn",onclick:async()=>{const x=await SC.sb.rpc("admin_act",{act:p.is_teacher?"unset_teacher":"set_teacher",tid:p.id});if(x.error)return toast(x.error.message);render()}},ic("cap"),p.is_teacher?"إزالة صفة الأستاذ":"اعتماد كأستاذ"):null;
 box.append(h("section",{class:"card pcard"},h("div",{class:"pcover"}),
  h("div",{class:"pid"},h("div",{class:"pav"},av(p,88)),
   h("h3",{dir:"auto"},(p.name||p.username),p.verified?h("span",{class:"premium-badge"},ic("check",{w:2.6}),"حساب مميز"):null,p.is_teacher?h("span",{class:"teacher-badge"},ic("cap"),"أستاذ"):null),
   h("div",{class:"meta ltr-handle"},"@"+p.username),uidChip(p.researcher_uid),
   meta.length?h("ul",{class:"pmeta"},meta.map(([i,t])=>h("li",{dir:"auto"},ic(i),h("span",{},t)))):null,
   p.bio?h("p",{class:"pbio",dir:"auto"},p.bio):null),
  h("div",{class:"pstats"},stat(pc.count||0,"منشور"),h("div",{class:"pst"},sf,h("span",{},"متابِع")),stat(f2.count||0,"يتابع")),
  own?h("div",{class:"pact"},h("button",{class:"pri",onclick:()=>editModal(p)},ic("pencil"),"تعديل ملفي")):[
   h("div",{class:"pact"},fb,dmB),
   h("div",{class:"pgrid"},blB,rpB),
   vfB?h("div",{class:"padmin"},h("div",{class:"plabel"},ic("shield"),"أدوات الإدارة"),h("div",{class:"pgrid"},vfB,tcB)):null]));
 const lst=h("div",{});box.append(lst);loadPosts(lst,{uid:p.id})}
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
 vd=h("input",{class:"cin",dir:"ltr",placeholder:"رابط فيديو يوتيوب (اختياري)"});
 const sv=h("select",{class:"cin",onchange:()=>{const s=S.saved[sv.value-1];if(s){ti.value=s.title||""}}},h("option",{value:0},"أرفق من مصادري المحفوظة…"),S.saved.map((s,i)=>h("option",{value:i+1},(s.title||"").slice(0,60))));
 const m=modal(h("h3",{},"＋ منشور جديد"),kind,ti,bd,sv,vd,h("button",{class:"pri",onclick:async()=>{
  const vu=vd.value.trim();if(!ti.value.trim())return toast("اكتب عنوانًا");if(vu&&!okU(vu))return toast("الرابط يجب أن يبدأ بـ https://");
  const r=await SC.sb.from("posts").insert({user_id:SC.user.id,kind:kind.value,title:ti.value.trim(),body:bd.value.trim()||null,video_url:vu||null});
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
