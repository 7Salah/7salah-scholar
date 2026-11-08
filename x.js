// 7Salah Scholar v20 — التفاعل الأكاديمي المتكامل (يُحمَّل آخر ملف).
// إعادة النشر · الاقتباس · السلاسل · الردود المتفرعة · الإشارات @ · صفحة المنشور.
// الرد على الرسائل الخاصة يعيش داخل chat.js (لأنه جزء من حلقة الرسائل) ويستعمل xt/mentionize/xMention من هنا.
// يعمل فوق v20-interactive.sql؛ قبل تشغيله تبقى الميزات القديمة كما هي وتُخفى الجديدة.

// ===================== 1) النصوص: عربي · English · Français =====================
const XT={
 ar:{
  reply:"رد",replyingTo:"الرد على {name}",cancelReply:"إلغاء الرد",you:"أنت",photo:"صورة",file:"ملف",deletedMsg:"رسالة محذوفة",goOriginal:"الانتقال إلى الرسالة الأصلية",
  origFar:"الرسالة الأصلية خارج الرسائل المحمّلة",replyGone:"الرسالة التي تردّ عليها لم تعد موجودة",sendFail:"تعذّر الإرسال (قد يكون هناك حظر بينكما)",
  needMigration:"لتفعيل هذه الميزة شغّل v20-interactive.sql في Supabase",
  repost:"إعادة نشر",undoRepost:"إلغاء إعادة النشر",reposted:"{name} أعاد النشر",youReposted:"أعدتَ نشره",repostTitle:"{r} إعادة نشر · {q} اقتباس",
  quote:"اقتباس",quoteTitle:"اقتباس منشور",quotePh:"أضف رأيك أو تحليلك العلمي…",quoteEmpty:"اكتب رأيك أو تحليلك أولًا",quoted:"✅ نُشر اقتباسك",reposting:"✅ أُعيد نشر المنشور",unreposted:"أُلغيت إعادة النشر",
  publish:"نشر",origUnavailable:"المنشور الأصلي غير متاح",
  thread:"سلسلة منشورات",threadShort:"سلسلة",threadHint:"اربط عدة منشورات في سلسلة مترابطة (من 2 إلى {n}). تُنشر كلها معًا.",threadPostPh:"المنشور {n}…",addPost:"منشور آخر",removePost:"حذف هذا المنشور",
  threadMin:"السلسلة تحتاج منشورين على الأقل",threadPublished:"✅ نُشرت السلسلة",showThread:"عرض السلسلة ({n} أخرى)",hideThread:"إخفاء السلسلة",viewThread:"عرض السلسلة كاملة",
  addToThread:"أضف للسلسلة",addToThreadTitle:"إضافة منشور إلى سلسلتك",threadAdded:"✅ أُضيف إلى السلسلة",threadPart:"{n} من {t}",
  comments:"التعليقات",writeComment:"اكتب تعليقًا…",replyToUser:"ردًّا على {name}…",showReplies:"عرض {n} ردود",hideReplies:"إخفاء الردود",blockedComment:"تعليق من مستخدم محظور",
  sendIt:"إرسال",delComment:"حذف التعليق",confirmDelComment:"حذف هذا التعليق؟",confirmDelReplies:"سيُحذف التعليق مع كل الردود عليه. المتابعة؟",inReplyTo:"ردًّا على @{u}",noComments:"لا تعليقات بعد. ابدأ النقاش.",
  noUser:"لا يوجد مستخدم باسم @{u}",back:"رجوع",postTitle:"المنشور",quotesOf:"اقتباسات هذا المنشور ({n})",postGone:"هذا المنشور غير متاح",
  errBlocked:"لا يمكن إتمام ذلك بسبب الحظر",errGeneric:"تعذّر تنفيذ العملية",mentionHint:"@ لذكر باحث",
  k_research:"بحث",k_experience:"تجربة",k_video:"فيديو",k_deck:"حزمة بطاقات",k_board:"لوحة",k_attachment:"مرفق",k_map:"خريطة",k_lesson:"مادة تعليمية",k_question:"سؤال"},
 en:{
  reply:"Reply",replyingTo:"Replying to {name}",cancelReply:"Cancel reply",you:"You",photo:"Photo",file:"File",deletedMsg:"Deleted message",goOriginal:"Go to the original message",
  origFar:"The original message is outside the loaded history",replyGone:"The message you are replying to no longer exists",sendFail:"Could not send (one of you may have blocked the other)",
  needMigration:"To enable this feature, run v20-interactive.sql in Supabase",
  repost:"Repost",undoRepost:"Undo repost",reposted:"{name} reposted",youReposted:"You reposted",repostTitle:"{r} reposts · {q} quotes",
  quote:"Quote",quoteTitle:"Quote post",quotePh:"Add your take or scholarly analysis…",quoteEmpty:"Write your take or analysis first",quoted:"✅ Your quote was posted",reposting:"✅ Post reposted",unreposted:"Repost removed",
  publish:"Post",origUnavailable:"The original post is unavailable",
  thread:"Thread",threadShort:"Thread",threadHint:"Link several posts into one connected thread (2 to {n}). They are published together.",threadPostPh:"Post {n}…",addPost:"Add another post",removePost:"Remove this post",
  threadMin:"A thread needs at least two posts",threadPublished:"✅ Thread published",showThread:"Show thread ({n} more)",hideThread:"Hide thread",viewThread:"View full thread",
  addToThread:"Add to thread",addToThreadTitle:"Add a post to your thread",threadAdded:"✅ Added to the thread",threadPart:"{n} of {t}",
  comments:"Comments",writeComment:"Write a comment…",replyToUser:"Replying to {name}…",showReplies:"Show {n} replies",hideReplies:"Hide replies",blockedComment:"Comment from a blocked user",
  sendIt:"Send",delComment:"Delete comment",confirmDelComment:"Delete this comment?",confirmDelReplies:"This deletes the comment and all replies to it. Continue?",inReplyTo:"Replying to @{u}",noComments:"No comments yet. Start the discussion.",
  noUser:"No user named @{u}",back:"Back",postTitle:"Post",quotesOf:"Quotes of this post ({n})",postGone:"This post is unavailable",
  errBlocked:"This can't be done because of a block",errGeneric:"The action could not be completed",mentionHint:"@ to mention a researcher",
  k_research:"Research",k_experience:"Experiment",k_video:"Video",k_deck:"Flashcard deck",k_board:"Board",k_attachment:"Attachment",k_map:"Map",k_lesson:"Teaching material",k_question:"Question"},
 fr:{
  reply:"Répondre",replyingTo:"En réponse à {name}",cancelReply:"Annuler la réponse",you:"Vous",photo:"Photo",file:"Fichier",deletedMsg:"Message supprimé",goOriginal:"Aller au message d'origine",
  origFar:"Le message d'origine est hors de l'historique chargé",replyGone:"Le message auquel vous répondez n'existe plus",sendFail:"Envoi impossible (l'un de vous a peut-être bloqué l'autre)",
  needMigration:"Pour activer cette fonction, exécutez v20-interactive.sql dans Supabase",
  repost:"Reposter",undoRepost:"Annuler le repost",reposted:"{name} a reposté",youReposted:"Vous avez reposté",repostTitle:"{r} reposts · {q} citations",
  quote:"Citer",quoteTitle:"Citer le post",quotePh:"Ajoutez votre avis ou votre analyse…",quoteEmpty:"Écrivez d'abord votre avis ou votre analyse",quoted:"✅ Votre citation est publiée",reposting:"✅ Post reposté",unreposted:"Repost retiré",
  publish:"Publier",origUnavailable:"Le post d'origine n'est pas disponible",
  thread:"Fil de posts",threadShort:"Fil",threadHint:"Reliez plusieurs posts en un fil cohérent (de 2 à {n}). Ils sont publiés ensemble.",threadPostPh:"Post {n}…",addPost:"Ajouter un post",removePost:"Supprimer ce post",
  threadMin:"Un fil demande au moins deux posts",threadPublished:"✅ Fil publié",showThread:"Voir le fil ({n} de plus)",hideThread:"Masquer le fil",viewThread:"Voir le fil complet",
  addToThread:"Ajouter au fil",addToThreadTitle:"Ajouter un post à votre fil",threadAdded:"✅ Ajouté au fil",threadPart:"{n} sur {t}",
  comments:"Commentaires",writeComment:"Écrire un commentaire…",replyToUser:"En réponse à {name}…",showReplies:"Voir {n} réponses",hideReplies:"Masquer les réponses",blockedComment:"Commentaire d'un utilisateur bloqué",
  sendIt:"Envoyer",delComment:"Supprimer le commentaire",confirmDelComment:"Supprimer ce commentaire ?",confirmDelReplies:"Le commentaire et toutes ses réponses seront supprimés. Continuer ?",inReplyTo:"En réponse à @{u}",noComments:"Pas encore de commentaires. Lancez la discussion.",
  noUser:"Aucun utilisateur nommé @{u}",back:"Retour",postTitle:"Post",quotesOf:"Citations de ce post ({n})",postGone:"Ce post n'est pas disponible",
  errBlocked:"Action impossible à cause d'un blocage",errGeneric:"L'action n'a pas pu être effectuée",mentionHint:"@ pour mentionner un chercheur",
  k_research:"Recherche",k_experience:"Expérience",k_video:"Vidéo",k_deck:"Paquet de cartes",k_board:"Planche",k_attachment:"Pièce jointe",k_map:"Carte",k_lesson:"Support de cours",k_question:"Question"}
};
function xt(k,o){const d=XT[S.lang]||XT.en;let s=d[k];if(s==null)s=XT.en[k];if(s==null)s=XT.ar[k];if(s==null)return k;return o?s.replace(/\{(\w+)\}/g,(m,x)=>o[x]==null?"":o[x]):s}
window.xt=xt;window.XT=XT;

// ===================== 2) الحالة وكشف جاهزية قاعدة البيانات =====================
const XF={ready:null};window.XF=XF;                       // true بعد تشغيل v20-interactive.sql
const XC={rep:new Set(),fl:null};                          // rep: منشورات أعدتُ نشرها (يُحدَّث من القاعدة عند كل تحميل)
async function xReady(){
 if(XF.ready!==null)return XF.ready;
 if(!SC.sb)return false;
 try{const r=await SC.sb.from("posts").select("repost_of,quote_of,repost_count,quote_count,thread_root,thread_pos,thread_len").limit(1);
  if(!r.error)XF.ready=true;else if(/column|42703|schema cache|PGRST/i.test((r.error.code||"")+" "+(r.error.message||"")))XF.ready=false;else return false}   // خطأ شبكة: لا نخزّن النتيجة
 catch(e){return false}
 return XF.ready}
function xErr(e){const m=(e&&e.message)||"";
 if(/blocked/i.test(m))return xt("errBlocked");
 if(/not found/i.test(m))return xt("origUnavailable");
 if(/column|schema cache|posts_kind_check|function .*create_thread|repost_of|quote_of|parent_id|thread_/i.test(m))return xt("needMigration");
 return m||xt("errGeneric")}

// ===================== 3) الإشارات @ =====================
const MRE=/(^|[^A-Za-z0-9_@])@([A-Za-z0-9_]{3,20})(?![A-Za-z0-9_])/g;
function mentionize(text){
 const s=String(text==null?"":text),f=document.createDocumentFragment();let last=0,m;MRE.lastIndex=0;
 while((m=MRE.exec(s))){const st=m.index+m[1].length;if(st>last)f.append(document.createTextNode(s.slice(last,st)));
  f.append(h("a",{class:"mention",href:"#","data-u":m[2].toLowerCase(),dir:"ltr",onclick:e=>{e.preventDefault();e.stopPropagation();xOpenUser(e.currentTarget.dataset.u)}},"@"+m[2]));last=st+1+m[2].length}
 if(last<s.length)f.append(document.createTextNode(s.slice(last)));return f}
const XU=new Map();
async function xOpenUser(u){u=String(u||"").toLowerCase();if(!SC.sb)return;let id=XU.get(u);
 if(id===undefined){const r=await SC.sb.from("profiles").select("id").eq("username",u).maybeSingle();id=r.data?r.data.id:null;if(!r.error)XU.set(u,id)}
 if(!id)return toast(xt("noUser",{u}));openProf(id)}
async function xFollowing(){
 if(!SC.user||!SC.sb)return[];const c=XC.fl;if(c&&c.uid===SC.user.id&&Date.now()-c.t<60000)return c.rows;
 const f=await SC.sb.from("follows").select("followee").eq("follower",SC.user.id).limit(100),ids=(f.data||[]).map(x=>x.followee);let rows=[];
 if(ids.length){const r=await SC.sb.from("profiles").select("id,username,name,avatar_url,verified").in("id",ids);rows=r.data||[]}
 XC.fl={uid:SC.user.id,t:Date.now(),rows,set:new Set(ids)};return rows}
// اقتراحات الحسابات أثناء الكتابة: تعمل على أي input/textarea
const XM={close:null};
window.addEventListener("scroll",()=>{if(XM.close)XM.close()},true);
function xMention(el){
 if(!el||el._xm)return;el._xm=1;let box=null,items=[],sel=0,seq=0,tmr=0,range=null;
 const close=()=>{if(box){box.remove();box=null}items=[];range=null;if(XM.close===close)XM.close=null};
 const ctx=()=>{const v=el.value,pos=el.selectionStart==null?v.length:el.selectionStart,m=/(^|[\s(\[«"'،؛:])@([A-Za-z0-9_]{0,20})$/.exec(v.slice(0,pos));return m?{q:m[2],start:pos-m[2].length-1,end:pos}:null};
 const place=()=>{if(!box)return;const r=el.getBoundingClientRect(),vh=window.innerHeight,up=r.bottom+250>vh&&r.top>250;
  box.style.width=Math.min(Math.max(r.width,220),360)+"px";box.style.left=Math.max(8,Math.min(r.left,window.innerWidth-box.offsetWidth-8))+"px";
  if(up){box.style.bottom=(vh-r.top+4)+"px";box.style.top="auto"}else{box.style.top=(r.bottom+4)+"px";box.style.bottom="auto"}};
 const pick=i=>{const p=items[i],c=range;if(!p||!c)return close();const v=el.value,ins="@"+p.username+" ";el.value=v.slice(0,c.start)+ins+v.slice(c.end);
  const np=c.start+ins.length;try{el.setSelectionRange(np,np)}catch(e){}close();el.dispatchEvent(new Event("input",{bubbles:true}));el.focus()};
 const paint=()=>{if(!el.isConnected||!items.length)return close();
  if(!box){box=h("div",{class:"mnbox",role:"listbox","aria-label":xt("mentionHint")});document.body.append(box);XM.close=close}
  box.replaceChildren(...items.map((p,i)=>h("button",{type:"button",role:"option","aria-selected":i===sel?"true":"false",class:"mnitem"+(i===sel?" on":""),onpointerdown:e=>{e.preventDefault();pick(i)}},
   av(p,30),h("span",{class:"mnw"},h("b",{dir:"auto"},p.name||p.username),h("small",{dir:"ltr"},"@"+p.username)),p.verified?h("span",{class:"premium-badge","aria-hidden":"true"},ic("check",{w:2.6})):null)));place()};
 const search=async q=>{const my=++seq;if(!SC.sb)return;let rows=[];
  if(!q)rows=await xFollowing();
  else{const s=sq(q),r=await SC.sb.from("profiles").select("id,username,name,avatar_url,verified").or("username.ilike."+s+"*,name.ilike.*"+s+"*").limit(10);rows=r.data||[];
   await xFollowing();const fs=XC.fl&&XC.fl.set,lq=s.toLowerCase();
   rows.sort((a,b)=>((fs&&fs.has(b.id))?1:0)-((fs&&fs.has(a.id))?1:0)||(a.username.startsWith(lq)?0:1)-(b.username.startsWith(lq)?0:1))}
  if(my!==seq)return;items=rows.filter(p=>!SC.blocked.has(p.id)).slice(0,6);sel=0;paint()};
 el.addEventListener("input",()=>{const c=ctx();if(!c){close();return}range=c;clearTimeout(tmr);tmr=setTimeout(()=>search(c.q),c.q?170:0)});
 el.addEventListener("keydown",e=>{if(!box||e.isComposing)return;const k=e.key;
  if(k==="ArrowDown"||k==="ArrowUp"){e.preventDefault();e.stopImmediatePropagation();sel=(sel+(k==="ArrowDown"?1:-1)+items.length)%items.length;paint()}
  else if(k==="Enter"||k==="Tab"){e.preventDefault();e.stopImmediatePropagation();pick(sel)}
  else if(k==="Escape"){e.preventDefault();e.stopImmediatePropagation();close()}});
 el.addEventListener("blur",()=>setTimeout(close,150));
 el.addEventListener("click",()=>{if(!ctx())close()})}
window.mentionize=mentionize;window.xMention=xMention;

// ===================== 4) جلب المنشورات المرتبطة =====================
async function xHydrate(rows){
 if(!rows.length)return rows;
 const pr=await SC.sb.from("profiles").select("id,username,name,avatar_url,verified,is_teacher").in("id",[...new Set(rows.map(p=>p.user_id))]),pm={};(pr.data||[]).forEach(x=>pm[x.id]=x);
 const liked=new Set();if(SC.user){const lk=await SC.sb.from("likes").select("post_id").eq("user_id",SC.user.id).in("post_id",rows.map(p=>p.id));(lk.data||[]).forEach(x=>liked.add(x.post_id))}
 rows.forEach(p=>{p.profiles=pm[p.user_id]||null;p._liked=liked.has(p.id)});return rows}
async function xFetchPosts(ids){const out=new Map();ids=[...new Set(ids)].filter(Boolean).slice(0,100);if(!ids.length)return out;
 const r=await SC.sb.from("posts").select("*,likes(count),comments(count)").in("id",ids);if(r.error)return out;
 (await xHydrate(r.data||[])).forEach(p=>out.set(p.id,p));return out}
async function xFetchThread(root){
 const r=await SC.sb.from("posts").select("*,likes(count),comments(count)").eq("thread_root",root).order("thread_pos").limit(25);if(r.error)return[];
 const rows=await xHydrate(r.data||[]);rows.forEach(p=>{p._tlen=rows.length});return rows}
// يُستدعى من loadPosts قبل بناء البطاقات: يضيف المنشور الأصلي لكل إعادة نشر/اقتباس ويحدّث حالة «أعدتُ نشره»
async function xPrep(data){
 if(!SC.sb||!(await xReady()))return;
 const need=[...new Set(data.map(p=>p.repost_of||p.quote_of).filter(Boolean))],om=need.length?await xFetchPosts(need):new Map();
 data.forEach(p=>{const k=p.repost_of||p.quote_of;if(!k)return;let o=om.get(k)||null;if(o&&SC.blocked.has(o.user_id))o=null;p._orig=o;if(!o&&p.repost_of)p._hide=true});
 if(SC.user){const tg=[...new Set(data.map(p=>p.kind==="repost"?p.repost_of:p.id).filter(Boolean))];
  if(tg.length){const r=await SC.sb.from("posts").select("repost_of").eq("user_id",SC.user.id).eq("kind","repost").in("repost_of",tg);
   if(!r.error){const have=new Set((r.data||[]).map(x=>x.repost_of));tg.forEach(id=>have.has(id)?XC.rep.add(id):XC.rep.delete(id))}}}}
window.xPrep=xPrep;

// ===================== 5) واجهات مساعدة =====================
function xMenu(anchor,items){
 document.querySelectorAll(".xmenu").forEach(x=>x.remove());
 const out=e=>{if(!m.contains(e.target))close()},close=()=>{m.remove();document.removeEventListener("pointerdown",out,true);window.removeEventListener("scroll",close,true)};
 const m=h("div",{class:"xmenu",role:"menu"},items.map(it=>h("button",{type:"button",role:"menuitem",class:"mitem"+(it.on?" on":""),onclick:()=>{close();it.fn()}},ic(it.icon),h("span",{},it.label))));
 document.body.append(m);const r=anchor.getBoundingClientRect(),w=m.offsetWidth,hh=m.offsetHeight,vh=window.innerHeight;
 m.style.left=Math.max(8,Math.min(r.left,window.innerWidth-w-8))+"px";if(r.bottom+hh+8>vh&&r.top>hh+8)m.style.top=(r.top-hh-4)+"px";else m.style.top=(r.bottom+4)+"px";
 setTimeout(()=>{document.addEventListener("pointerdown",out,true);window.addEventListener("scroll",close,true)},0);return m}
const xNorm=s=>String(s||"").replace(/\s+/g," ").trim();
const XK={research:"file-text",experience:"flask",video:"video",deck:"cards",board:"image",attachment:"paperclip",map:"map",lesson:"cap",question:"help"};
// بطاقة مصغّرة للمنشور الأصلي داخل الاقتباس
function xEmbed(o,opt){opt=opt||{};
 if(!o)return h("div",{class:"xq gone"},ic("alert"),h("span",{},xt("origUnavailable")));
 const a=o.profiles||{},t=xNorm(o.title),b=xNorm(o.body),txt=(b&&(!t||b.startsWith(t)))?b:[t,b].filter(Boolean).join(" — "),clip=txt.length>300?txt.slice(0,300)+"…":txt;
 const open=()=>xOpenPost(o.id),img=o.kind==="board"&&o.file_path&&typeof pubUrl==="function"?pubUrl(o.file_path):null;
 return h("div",Object.assign({class:"xq"},opt.static?{}:{role:"link",tabindex:"0",onclick:open,onkeydown:e=>{if(e.key==="Enter")open()}}),
  h("div",{class:"xqh"},av(a,22),h("b",{dir:"auto"},a.name||a.username||"?"),a.verified?h("span",{class:"premium-badge","aria-hidden":"true"},ic("check",{w:2.6})):null,
   h("span",{class:"ltr-handle meta"},"@"+(a.username||"")),h("span",{class:"meta"},"· "+new Date(o.created_at).toLocaleDateString(S.lang))),
  clip?h("div",{class:"xqb",dir:"auto"},clip):null,
  img&&okU(img)?h("img",{class:"xqi",src:img,alt:"",loading:"lazy"}):null,
  XK[o.kind]?h("div",{class:"xqm"},ic(XK[o.kind]),h("span",{},xt("k_"+o.kind))):null)}

// ===================== 6) فتح منشور (صفحة المنشور) =====================
function xOpenPost(id){if(!id)return;(SC.pstack=SC.pstack||[]).push({view:SC.view,uid:SC.uid,kind:SC.kind,q:SC.q,pid:SC.pid,y:window.scrollY});SC.view="post";SC.pid=id;render();window.scrollTo(0,0)}
function xBack(){const s=(SC.pstack||[]).pop();if(s){SC.view=s.view;SC.uid=s.uid;SC.kind=s.kind;SC.q=s.q;SC.pid=s.pid}else{SC.view="feed";SC.pid=null}render();if(s&&s.y)setTimeout(()=>window.scrollTo(0,s.y),150)}
{const _cb=comBody;comBody=function(v){if(SC.view==="post"&&SC.pid){if(window.stopChat)stopChat();v.append(comNav(SC.user));return xPostView(v)}return _cb(v)}}
async function xPostView(v){
 v.append(h("div",{class:"xbar"},h("button",{class:"btn",type:"button",onclick:xBack},ic("arrow-right",{cls:"flip"}),xt("back")),h("b",{},xt("postTitle"))));
 const box=h("div",{});v.append(box);box.append(h("div",{class:"meta",style:"text-align:center;padding:20px"},"⏳"));
 await xReady();let p=(await xFetchPosts([SC.pid])).get(SC.pid);
 if(p&&p.kind==="repost")p=(await xFetchPosts([p.repost_of])).get(p.repost_of);
 if(!p||SC.blocked.has(p.user_id)){box.replaceChildren(h("div",{class:"card"},ic("alert"),xt("postGone")));return}
 const rows=XF.ready&&p.thread_root?await xFetchThread(p.thread_root):[p];if(!rows.some(x=>x.id===p.id))rows.push(p);
 await xPrep(rows);box.replaceChildren();let focus=null;
 rows.forEach(sp=>{sp._inThread=true;const c=postCard(sp,!!sp._liked);box.append(c);if(sp.id===p.id){focus=c;c.classList.add("xfocus");const cb=c.lastElementChild;if(cb&&cb.tagName==="DIV")loadComments(sp,cb)}});
 if(focus&&rows.length>1)setTimeout(()=>focus.scrollIntoView({block:"center"}),60);
 if(XF.ready&&(p.quote_count|0)>0){
  const qb=h("div",{});box.append(h("div",{class:"sec"},xt("quotesOf",{n:p.quote_count})),qb);
  const r=await SC.sb.from("posts").select("*,likes(count),comments(count)").eq("quote_of",p.id).order("created_at",{ascending:false}).limit(20);
  const qs=await xHydrate((r.data||[]).filter(x=>!SC.blocked.has(x.user_id)));qs.forEach(q=>{q._orig=p;q._noEmbed=true});qs.forEach(q=>qb.append(postCard(q,!!q._liked)))}}

// ===================== 7) إعادة النشر والاقتباس =====================
async function xRefreshCounts(p){try{const r=await SC.sb.from("posts").select("repost_count,quote_count").eq("id",p.id).maybeSingle();if(r.data){p.repost_count=r.data.repost_count;p.quote_count=r.data.quote_count}}catch(e){}}
async function xRepost(p){
 const r=await SC.sb.from("posts").insert({user_id:SC.user.id,kind:"repost",title:String(p.title||"repost").slice(0,150),repost_of:p.id});
 if(r.error){if(r.error.code==="23505"||/duplicate key|unique/i.test(r.error.message||"")){XC.rep.add(p.id);await xRefreshCounts(p);return true}toast(xErr(r.error));return false}
 XC.rep.add(p.id);p.repost_count=(p.repost_count|0)+1;xRefreshCounts(p);return true}
async function xUnrepost(p){
 const r=await SC.sb.from("posts").delete().eq("user_id",SC.user.id).eq("kind","repost").eq("repost_of",p.id);
 if(r.error){toast(xErr(r.error));return false}
 XC.rep.delete(p.id);await xRefreshCounts(p);return true}
function xQuoteModal(p){
 if(!SC.user)return authModal();
 const ta=h("textarea",{class:"cta",maxlength:"1500",rows:"4",placeholder:xt("quotePh"),"aria-label":xt("quotePh")}),cn=h("div",{class:"meta xcount"},"0/1500");xMention(ta);
 ta.addEventListener("input",()=>{cn.textContent=ta.value.length+"/1500"});
 const go=h("button",{class:"pri",type:"button"},xt("publish")),m=modal(h("h3",{},ic("quote"),xt("quoteTitle")),ta,cn,xEmbed(p,{static:true}),go,cancelB({remove:()=>m.remove()}));
 go.onclick=async()=>{const b=ta.value.trim();if(!b)return toast(xt("quoteEmpty"));if(go.disabled)return;go.disabled=true;
  const r=await SC.sb.from("posts").insert({user_id:SC.user.id,kind:"quote",quote_of:p.id,title:xNorm(b).slice(0,80),body:b});
  if(r.error){go.disabled=false;return toast(xErr(r.error))}
  m.remove();toast(xt("quoted"));SC.view="feed";render()};
 setTimeout(()=>ta.focus(),50)}
function xRepostBtn(p){
 const b=h("button",{class:"pbtn rp",type:"button","aria-haspopup":"menu"}),paint=()=>{const on=XC.rep.has(p.id),r=p.repost_count|0,q=p.quote_count|0;
  b.className="pbtn rp"+(on?" on":"");b.setAttribute("aria-pressed",on?"true":"false");b.setAttribute("aria-label",xt("repost")+" ("+(r+q)+")");b.title=xt("repostTitle",{r,q});b.replaceChildren(ic("repeat"),h("span",{},String(r+q)))};paint();
 let busy=false;
 b.onclick=()=>{if(!SC.user)return authModal();if(busy)return;const on=XC.rep.has(p.id);
  xMenu(b,[{icon:"repeat",label:on?xt("undoRepost"):xt("repost"),on,fn:async()=>{if(busy)return;busy=true;b.disabled=true;
    const ok=on?await xUnrepost(p):await xRepost(p);busy=false;b.disabled=false;paint();if(ok)toast(on?xt("unreposted"):xt("reposting"))}},
   {icon:"quote",label:xt("quote"),fn:()=>xQuoteModal(p)}])};
 return b}
function xRepostCard(p){
 const o=p._orig,a=p.profiles||{},mine=SC.user&&SC.user.id===p.user_id,card=postCard(o,!!o._liked);
 card.prepend(h("div",{class:"xbanner"},ic("repeat"),mine?h("span",{},xt("youReposted")):h("a",{href:"#",dir:"auto",onclick:e=>{e.preventDefault();if(a.id)openProf(a.id)}},xt("reposted",{name:a.name||a.username||"?"})),
  mine?h("button",{class:"ibtn xundo",type:"button","aria-label":xt("undoRepost"),title:xt("undoRepost"),onclick:async()=>{if(await xUnrepost(o)){toast(xt("unreposted"));render()}}},ic("x")):null));
 return card}

// ===================== 8) السلاسل =====================
function xThreadWidget(){
 const MAX=20,items=["",""],list=h("div",{class:"xtw-list"}),add=h("button",{class:"btn",type:"button"},ic("plus"),xt("addPost"));
 const paint=()=>{list.replaceChildren(...items.map((val,i)=>{const ta=h("textarea",{class:"cta",maxlength:"1500",rows:"3",placeholder:xt("threadPostPh",{n:i+1}),"aria-label":xt("threadPostPh",{n:i+1})},val),cn=h("span",{class:"meta"},val.length+"/1500");
   ta.addEventListener("input",()=>{items[i]=ta.value;cn.textContent=ta.value.length+"/1500"});xMention(ta);
   return h("div",{class:"xtw-item"},h("div",{class:"xtw-h"},h("b",{},(i+1)+"/"+items.length),cn,items.length>2?h("button",{class:"ibtn",type:"button","aria-label":xt("removePost"),title:xt("removePost"),onclick:()=>{items.splice(i,1);paint()}},ic("trash")):null),ta)}));
  add.disabled=items.length>=MAX};
 add.onclick=()=>{if(items.length>=MAX)return;items.push("");paint();const t=list.lastElementChild.querySelector("textarea");if(t)t.focus()};paint();
 return{el:h("div",{class:"xtw"},h("div",{class:"meta"},xt("threadHint",{n:MAX})),list,add),get:()=>items.map(s=>s.trim())}}
async function xPublishThread(btn,items,topic,done){
 const it=items.filter(Boolean);if(it.length<2)return toast(xt("threadMin"));if(btn.disabled)return;btn.disabled=true;
 const r=await SC.sb.rpc("create_thread",{items:it,tpc:topic||null});btn.disabled=false;
 if(r.error)return toast(xErr(r.error));toast(xt("threadPublished"));done()}
function xAddToThread(p){
 const ta=h("textarea",{class:"cta",maxlength:"1500",rows:"4",placeholder:xt("threadPostPh",{n:(p.thread_len|0)+1})});xMention(ta);
 const go=h("button",{class:"pri",type:"button"},xt("publish")),m=modal(h("h3",{},ic("thread"),xt("addToThreadTitle")),ta,go,cancelB({remove:()=>m.remove()}));
 go.onclick=async()=>{const b=ta.value.trim();if(!b)return toast(xt("quoteEmpty"));if(go.disabled)return;go.disabled=true;
  const r=await SC.sb.from("posts").insert({user_id:SC.user.id,kind:"post",title:xNorm(b).slice(0,80),body:b,thread_root:p.id});
  if(r.error){go.disabled=false;return toast(xErr(r.error))}m.remove();toast(xt("threadAdded"));render()};setTimeout(()=>ta.focus(),50)}

// ===================== 9) تغليف بطاقة المنشور =====================
function xDecorate(c,p){
 const h3=c.querySelector(":scope>h3"),pb=c.querySelector(":scope>.pbody");
 if(h3){if((p.kind==="quote"||p.thread_root)&&p.body&&xNorm(p.body).startsWith(xNorm(p.title)))h3.remove();else if((p.title||"").includes("@"))h3.replaceChildren(mentionize(p.title))}
 if(pb&&(p.body||"").includes("@"))pb.replaceChildren(mentionize(p.body))}
{const _pc=postCard;postCard=function(p,l){
 if(XF.ready&&p.kind==="repost"&&p._orig)return xRepostCard(p);
 const c=_pc(p,l);xDecorate(c,p);if(!XF.ready||p.kind==="repost")return c;
 const foot=c.querySelector(".pfoot"),kc=c.querySelector(".kchip");
 if(p.kind==="quote"&&kc)kc.replaceChildren(ic("quote"),xt("quote"));
 if(p.thread_root&&p._inThread&&kc)kc.replaceChildren(ic("thread"),xt("threadPart",{n:p.thread_pos,t:p._tlen||p.thread_len||p.thread_pos}));
 // الاقتباس: المنشور الأصلي داخل المنشور المقتبس
 if(p.kind==="quote"&&!p._noEmbed&&foot){
  if(p._orig!==undefined||!p.quote_of)foot.before(xEmbed(p._orig||null));
  else{const ph=h("div",{class:"xq gone"},"⏳");foot.before(ph);xFetchPosts([p.quote_of]).then(m=>{const o=m.get(p.quote_of);ph.replaceWith(xEmbed(o&&!SC.blocked.has(o.user_id)?o:null))})}}
 // أزرار: إعادة النشر/الاقتباس
 const cb=c.querySelector('.pacts [data-k="com"]');if(cb)cb.after(xRepostBtn(p));
 // السلاسل
 const isRoot=p.thread_root&&p.thread_root===p.id,bar=h("div",{class:"xtbar"});let box=null;
 if(isRoot&&!p._inThread&&(p.thread_len|0)>1){
  let open=false,loaded=false;box=h("div",{class:"xthread",hidden:true});
  const tg=h("button",{class:"xtoggle",type:"button","aria-expanded":"false"}),paint=()=>{tg.setAttribute("aria-expanded",open?"true":"false");tg.replaceChildren(ic("thread"),h("span",{},open?xt("hideThread"):xt("showThread",{n:p.thread_len-1})),ic(open?"chevron-up":"chevron-down"))};paint();
  tg.onclick=async()=>{open=!open;box.hidden=!open;paint();if(open&&!loaded){loaded=true;box.replaceChildren(h("div",{class:"meta",style:"padding:8px"},"⏳"));
    const rows=(await xFetchThread(p.id)).filter(x=>x.thread_pos>1&&!SC.blocked.has(x.user_id));await xPrep(rows);rows.forEach(x=>{x._inThread=true});box.replaceChildren(...rows.map(x=>postCard(x,!!x._liked)))}};
  bar.append(tg)}
 else if(p.thread_root&&p.thread_pos>1&&!p._inThread)bar.append(h("button",{class:"xtoggle",type:"button",onclick:()=>xOpenPost(p.thread_root)},ic("thread"),h("span",{},xt("viewThread"))));
 if(isRoot&&!p._inThread&&SC.user&&SC.user.id===p.user_id&&(p.thread_len|0)<20)bar.append(h("button",{class:"xtoggle alt",type:"button",onclick:()=>xAddToThread(p)},ic("plus"),h("span",{},xt("addToThread"))));
 if(bar.childNodes.length&&foot)foot.before(bar);
 return box?h("div",{class:"xtwrap"},c,box):c}}

// ===================== 10) التعليقات والردود المتفرعة =====================
XC.open=new Set();
loadComments=async function(p,box){
 await xReady();const tree=!!XF.ready;
 const r=await SC.sb.from("comments").select("*,profiles(id,username,name,avatar_url,verified)").eq("post_id",p.id).order("created_at").limit(300);
 if(r.error){box.replaceChildren(h("div",{class:"meta"},"⚠ "+r.error.message));return}
 const rows=r.data||[],art=box.closest("article"),cs=art&&art.querySelector('[data-k="com"] span');if(cs)cs.textContent=String(rows.length);
 const byId=new Map(rows.map(c=>[c.id,Object.assign(c,{kids:[]})])),roots=[];
 rows.forEach(c=>{const par=tree&&c.parent_id&&byId.get(c.parent_id);(par?par.kids:roots).push(c)});
 const reload=()=>loadComments(p,box),count=c=>c.kids.reduce((n,k)=>n+1+count(k),0);
 const chain=c=>{const ids=[];let x=c;while(x){ids.push(x.id);x=x.parent_id&&byId.get(x.parent_id)}return ids};
 const node=(c,depth,par)=>{
  const a=c.profiles||{},mine=SC.user&&SC.user.id===c.user_id,blocked=SC.blocked.has(c.user_id),n=count(c),expanded=depth<2||XC.open.has(c.id);
  const el=h("div",{class:"xc"+(blocked?" blocked":""),"data-cid":c.id});
  if(blocked)el.append(h("div",{class:"xcb meta"},ic("ban"),xt("blockedComment")));
  else{
   const out=h("div",{class:"trout",dir:"auto"}),slot=h("div",{class:"xcslot"}),acts=h("div",{class:"xca"});
   el.append(...[h("div",{class:"xch"},h("span",{class:"xcav",onclick:()=>a.id&&openProf(a.id)},av(a,30)),
     h("div",{class:"xcw"},h("a",{class:"xcn",href:"#",dir:"auto",onclick:e=>{e.preventDefault();a.id&&openProf(a.id)}},a.name||a.username||"?",a.verified?h("span",{class:"premium-badge","aria-hidden":"true"},ic("check",{w:2.6})):null),
      h("span",{class:"meta"},h("span",{class:"ltr-handle"},"@"+(a.username||""))," · "+new Date(c.created_at).toLocaleDateString(S.lang)))),
    depth>=3&&par?h("div",{class:"xcre"},ic("corner-down-right"),xt("inReplyTo",{u:(par.profiles&&par.profiles.username)||"?"})):null,
    h("div",{class:"xcb",dir:"auto"},mentionize(c.body)),out].filter(Boolean));
   if(tree)acts.append(h("button",{class:"xcbtn",type:"button",onclick:()=>{if(!SC.user)return authModal();if(slot.firstChild)return slot.replaceChildren();
      const inp=h("input",{class:"cin",maxlength:"500",value:depth>=1&&a.username?"@"+a.username+" ":"",placeholder:xt("replyToUser",{name:a.name||a.username||""}),"aria-label":xt("reply")});xMention(inp);
      const go=h("button",{class:"sendb",type:"button","aria-label":xt("sendIt"),title:xt("sendIt")},ic("send"));
      const send=async()=>{const b=inp.value.trim();if(!b||go.disabled)return;go.disabled=true;
       const x=await SC.sb.from("comments").insert({post_id:p.id,user_id:SC.user.id,body:b,parent_id:c.id});
       if(x.error){go.disabled=false;return toast(xErr(x.error))}chain(c).forEach(id=>XC.open.add(id));reload()};
      go.onclick=send;inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.isComposing&&!e.defaultPrevented)send()});
      slot.replaceChildren(h("div",{class:"ccomp"},inp,go));inp.focus();const L=inp.value.length;try{inp.setSelectionRange(L,L)}catch(e){}}},ic("reply"),h("span",{},xt("reply"))));
   acts.append(trBtn(()=>c.body,out,"flag"));
   if(mine)acts.append(h("button",{class:"flag",type:"button","aria-label":xt("delComment"),title:xt("delComment"),onclick:async()=>{if(!confirm(n?xt("confirmDelReplies"):xt("confirmDelComment")))return;
      const x=await SC.sb.from("comments").delete().eq("id",c.id);if(x.error)return toast(x.error.message);reload()}},ic("trash")));
   el.append(acts,slot)}
  if(c.kids.length){
   const kids=h("div",{class:"xckids"+(depth>=3?" flat":"")}),tg=h("button",{class:"xcbtn xctog",type:"button"});let open=expanded;
   const paint=()=>{kids.hidden=!open;tg.setAttribute("aria-expanded",open?"true":"false");tg.replaceChildren(ic(open?"chevron-up":"chevron-down"),h("span",{},open?xt("hideReplies"):xt("showReplies",{n})))};
   c.kids.forEach(k=>kids.append(node(k,depth+1,c)));paint();tg.onclick=()=>{open=!open;if(open)XC.open.add(c.id);else XC.open.delete(c.id);paint()};
   el.append(tg,kids)}
  return el};
 const inp=h("input",{class:"cin",placeholder:xt("writeComment"),maxlength:"500","aria-label":xt("writeComment")});xMention(inp);
 const go=h("button",{class:"sendb",type:"button","aria-label":xt("sendIt"),title:xt("sendIt")},ic("send"));
 const send=async()=>{const b=inp.value.trim();if(!b||go.disabled)return;if(!SC.user)return authModal();go.disabled=true;
  const x=await SC.sb.from("comments").insert({post_id:p.id,user_id:SC.user.id,body:b});if(x.error){go.disabled=false;return toast(x.error.message)}reload()};
 go.onclick=send;inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.isComposing&&!e.defaultPrevented)send()});
 box.replaceChildren(h("div",{class:"xclist"},roots.length?roots.map(c=>node(c,0,null)):h("div",{class:"meta xempty"},xt("noComments"))),h("div",{class:"ccomp"},inp,go))};
