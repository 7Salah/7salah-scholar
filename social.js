function authMsg(err){const m=String((err&&err.message)||err||"").toLowerCase(),c=err&&(err.status||err.code);
 if(c===429||/rate limit|too many|over_email|security purposes/.test(m))return "تجاوزتَ عدد المحاولات المسموح مؤقتًا. انتظر بضع دقائق ثم حاول مجددًا.";
 if(/invalid login|invalid credentials/.test(m))return "البريد أو كلمة المرور غير صحيحة.";
 if(/not confirmed/.test(m))return "لم يُؤكَّد بريدك بعد. افتح رسالة التأكيد في بريدك ثم سجّل الدخول.";
 if(/already registered|already been registered|user_already_exists/.test(m))return "هذا البريد مسجّل من قبل. جرّب تسجيل الدخول.";
 if(/password/.test(m)&&/(short|least|weak|characters)/.test(m))return "كلمة المرور ضعيفة أو قصيرة. استخدم 8 أحرف على الأقل.";
 return (err&&err.message)||"تعذّر إكمال العملية.";}

// المجتمع الأكاديمي العالمي: منشورات وتفريغات محاضرات وحزم بطاقات وطلبات تواصل ومجموعات
const SC={blocked:new Set(),sb:null,user:null,me:null,view:"feed",kind:"",field:"",uid:null,q:""};
Object.assign(T.ar,{nCom:"المجتمع"});
Object.assign(T.en,{nCom:"Community"});
Object.assign(T.fr,{nCom:"Communauté"});
TABS.splice(4,0,["com","nCom",icp("users")]);
VIEWS.com=renderCom;buildTabs();

const sTr=(a,e,f)=>S.lang==="ar"?a:S.lang==="fr"?(f||e):e;
const okU=u=>/^https:\/\//i.test(u||"");
const cancelB=m=>h("div",{class:"acts"},h("button",{class:"btn",type:"button",onclick:()=>m.remove()},t("cancel")));

let _lp=null;
const loadSb=()=>{
 if(!(window.SUPA&&SUPA.url&&SUPA.key))return Promise.reject(new Error("no-supa"));
 return _lp||(_lp=new Promise((ok,no)=>{
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
  s.onload=async()=>{
   SC.sb=supabase.createClient(SUPA.url,SUPA.key);
   await setUser((await SC.sb.auth.getSession()).data.session);
   if(window.startNotif)startNotif();
   SC.sb.auth.onAuthStateChange((_e,ss)=>{
    setTimeout(async()=>{await setUser(ss);if(window.startNotif)startNotif();if(S.tab==="com")render()},0);
   });
   ok();
  };
  s.onerror=()=>{_lp=null;no()};
  document.head.append(s);
 }));
};

async function setUser(ss){
 SC.user=ss?ss.user:null;SC.me=null;
 if(SC.user)SC.me=(await SC.sb.from("profiles").select("*").eq("id",SC.user.id).maybeSingle()).data;
 SC.blocked=new Set(((SC.user?(await SC.sb.from("blocks").select("blocked").eq("blocker",SC.user.id)).data:null)||[]).map(x=>x.blocked));
 if(window.Net)Net.syncDirectory();
}

function renderCom(v){
 if(window.SUPA&&SUPA.url&&SUPA.key&&!SC.sb){
  loadSb().then(()=>{if(S.tab==="com")render()}).catch(()=>{});
 }
 v.replaceChildren();
 comBody(v);
 if(SC.view==="chat")return;
 if(window.connBanner&&SC.sb)connBanner(v);
 v.append(h("div",{class:"meta",style:"text-align:center;padding:16px"},h("a",{href:"#",onclick:e=>{e.preventDefault();typeof legalModal==="function"&&legalModal()}},sTr("الشروط وسياسة الخصوصية","Terms & Privacy","Conditions & Confidentialité"))));
}

function comNav(u){
 const unread=typeof unreadTotal==="function"?unreadTotal():0,V=SC.view||"feed";
 const reqCount=(window.Net&&Net.incomingCount)||0;
 const tile=(icon,label,on,fn,badge)=>h("button",{class:"ctile"+(on?" on":""),type:"button","aria-current":on?"page":null,onclick:fn},ic(icon),h("span",{},label),badge?h("i",{class:"cbadge"},badge>99?"99+":String(badge)):null);
 const myId=window.Net?Net.ensurePeerId():(u&&u.id);
 const tiles=[
  tile("home",sTr("المجتمع","Feed","Fil"),V==="feed"||V==="search"||V==="post",()=>{SC.view="feed";render()}),
  tile("user-plus",sTr("التواصل","Network","Réseau"),V==="net",()=>{SC.view="net";render()},reqCount),
  tile("video",sTr("الغرف","Rooms","Salles"),false,()=>{go("rooms")}),
  tile("message",sTr("المجموعات","Groups","Groupes"),V==="chats"||V==="chat",()=>{SC.view="chats";render()},unread),
  tile("user",sTr("ملفي","Profile","Profil"),V==="prof"&&SC.uid===myId,()=>openProf(myId))
 ];
 if(SC.me&&SC.me.is_admin)tiles.push(tile("shield",sTr("الإدارة","Admin","Admin"),V==="admin",()=>{SC.view="admin";render()}));
 const ib=(icon,label,fn)=>h("button",{class:"ibtn",type:"button",title:label,"aria-label":label,onclick:fn},ic(icon));
 return h("nav",{class:"cnav","aria-label":sTr("المجتمع","Community","Communauté")},
  h("div",{class:"cgrid",style:"--n:"+tiles.length},tiles),
  h("div",{class:"cacts"},
   h("button",{class:"cpost",type:"button",onclick:postModal},ic("plus"),sTr("نشر ومشاركة","Post & Share","Publier")),
   u?ib("logout",sTr("خروج","Sign out","Déconnexion"),()=>SC.sb.auth.signOut()):ib("login",sTr("حساب Supabase","Sign in","Connexion"),authModal),
   ib("globe",sTr("لغة الترجمة","Translate language","Langue"),trModal),
   ib("trophy",sTr("التصنيف","Rankings","Classement"),()=>{SC.view="rank";render()})
  )
 );
}

function comBody(v){
 const u=SC.user;
 if(window.stopChat)stopChat();
 if(SC.view!=="chat")v.append(comNav(u));
 if(SC.view==="net")return netView(v);
 if(SC.view==="rank")return typeof rankView==="function"&&rankView(v);
 if(SC.view==="prof")return profView(v);
 if(SC.view==="chats")return chatList(v);
 if(SC.view==="admin")return typeof adminView==="function"&&adminView(v);
 if(SC.view==="search")return searchView(v);
 if(SC.view==="chat")return chatRoom(v);

 v.append(searchBar());
 if(u&&typeof storiesBar==="function")v.append(storiesBar());

 // Academic Field / Discipline filter bar
 if(window.Net){
  v.append(h("div",{class:"tscroll disc-bar"},Net.DISCIPLINES.map(d=>
   h("button",{class:"tchip"+(SC.field===d.id?" on":""),type:"button",onclick:()=>{SC.field=d.id;render()}},d[S.lang]||d.en)
  )));
 }

 const pick=k=>()=>{SC.kind=k;render()};
 if(u)v.append(h("div",{class:"seg",role:"tablist"},[["foryou","sparkles",sTr("لك","For You","Pour vous")],["","layers",sTr("الكل","All","Tout")],["following","user-plus",sTr("متابَعوني","Following","Abonnements")]].map(([k,i,n])=>h("button",{role:"tab","aria-selected":SC.kind===k?"true":"false",class:SC.kind===k?"on":"",onclick:pick(k)},ic(i),n))));
 const TK=[
  ["post","message",sTr("نقاشات","Discussions","Discussions")],
  ["question","help",sTr("أسئلة علمية","Questions","Questions")],
  ["deck","cards",sTr("حزم بطاقات","Flashcards","Fiches")],
  ["transcript","headphones",sTr("تفريغ محاضرات","Transcripts","Transcriptions")],
  ["research","file-text",sTr("أبحاث","Research","Recherches")],
  ["experience","flask",sTr("تجارب","Experiments","Expériences")],
  ["video","video",sTr("فيديو","Video","Vidéo")]
 ];
 v.append(h("div",{class:"tscroll"},(u?[]:[["","layers",sTr("الكل","All","Tout")]]).concat(TK).map(([k,i,n])=>h("button",{class:"tchip"+(SC.kind===k?" on":""),type:"button",onclick:pick(k)},ic(i),n))));

 const box=h("div",{});v.append(box);
 if(SC.kind==="foryou"&&u&&SC.sb)loadForYou(box);
 else if(SC.kind==="topdecks"&&SC.sb)loadTopDecks(box);
 else if(SC.kind==="following"&&u&&SC.sb)SC.sb.from("follows").select("followee").eq("follower",u.id).then(r=>loadPosts(box,{uids:(r.data||[]).map(x=>x.followee)}));
 else loadPosts(box,{kind:SC.kind&&SC.kind!=="following"&&SC.kind!=="foryou"?SC.kind:"",field:SC.field||""});
}

const av=(p,n)=>{
 const d=h("div",{class:"cav",style:"width:"+n+"px;height:"+n+"px;font-size:"+Math.round(n*.46)+"px"});
 if(p&&p.avatar_url&&(typeof SUPA==="undefined"||p.avatar_url.startsWith(SUPA.url+"/")||/^https:\/\//.test(p.avatar_url)))d.append(h("img",{src:p.avatar_url,alt:""}));
 else if(p&&p.authorAvatar)d.textContent=p.authorAvatar;
 else d.textContent=((p&&(p.name||p.username))||"?").slice(0,1).toUpperCase();
 return d;
};

function vid(u){
 const m=(u||"").match(/^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
 return m?h("iframe",{class:"cvid",src:"https://www.youtube-nocookie.com/embed/"+m[1],allowfullscreen:"",loading:"lazy"}):(okU(u)?h("a",{class:"btn",href:u,target:"_blank",rel:"noopener noreferrer"},"▶ "+sTr("مشاهدة الفيديو","Watch video","Voir la vidéo")):null);
}

// Dual-source community post loader (merges collaborative server feed + Supabase posts)
async function loadPosts(box,f){
 f=f||{};
 const items=[];
 // 1) Load collaborative server posts (/api/community/feed)
 if(window.Net&&!f.uids&&!f.ids){
  try{
   const qs=new URLSearchParams();
   if(f.field)qs.set("field",f.field);
   if(f.kind)qs.set("kind",f.kind);
   if(f.q)qs.set("q",f.q);
   const res=await Net.apiGet("/api/community/feed?"+qs.toString());
   (res.posts||[]).forEach(sp=>{
    if(f.uid&&sp.userId!==f.uid)return;
    items.push({
     id:sp.id,
     _server:true,
     user_id:sp.userId,
     kind:sp.kind,
     topic:sp.field,
     title:sp.title,
     body:sp.body,
     doi:sp.doi,
     video_url:sp.videoUrl,
     deckPayload:sp.deckPayload,
     transcriptPayload:sp.transcriptPayload,
     created_at:new Date(sp.createdAt).toISOString(),
     _likes:sp.likes||[],
     _comments:sp.comments||[],
     profiles:{
      id:sp.userId,
      username:sp.authorHandle,
      name:sp.authorName,
      field:sp.authorField,
      university:sp.authorUniversity,
      authorAvatar:sp.authorAvatar
     }
    });
   });
  }catch(e){}
 }

 // 2) Load Supabase posts if configured and reachable
 if(SC.sb&&f.kind!=="transcript"){
  try{
   const mk=tp=>{
    let q=SC.sb.from("posts").select("*,likes(count),comments(count)").order("created_at",{ascending:false}).limit(f.limit||25);
    if(f.kind)q=f.kind==="post"?q.in("kind",["post","quote"]):q.eq("kind",f.kind);
    if(f.field&&tp)q=q.ilike("topic","*"+f.field+"*");
    if(f.q)q=q.neq("kind","repost");
    if(f.ids)q=q.in("id",f.ids);
    if(f.uid)q=q.eq("user_id",f.uid);
    if(f.uids)q=q.in("user_id",f.uids.length?f.uids:["00000000-0000-0000-0000-000000000000"]);
    if(f.q)q=q.or("title.ilike.*"+f.q+"*,body.ilike.*"+f.q+"*"+(tp?",topic.ilike.*"+f.q+"*":""));
    return q;
   };
   let {data,error}=await mk(true);
   if(error&&(f.q||f.field)&&/topic/i.test(error.message||""))({data,error}=await mk(false));
   if(!error&&data){
    if(f.rank)data=f.rank(data).slice(0,30);
    const ids=[...new Set(data.map(p=>p.user_id))];
    if(ids.length){
     const pr=await SC.sb.from("profiles").select("id,username,name,avatar_url,verified,is_teacher,field,university").in("id",ids),m={};
     (pr.data||[]).forEach(x=>m[x.id]=x);
     data.forEach(p=>p.profiles=m[p.user_id]||null);
    }
    if(window.xPrep){try{await xPrep(data)}catch(e){}data=data.filter(p=>!(p.thread_pos>1&&!f.q)&&!p._hide)}
    const mine=new Set();
    if(SC.user&&data.length){
     ((await SC.sb.from("likes").select("post_id").eq("user_id",SC.user.id).in("post_id",data.map(p=>p.id))).data||[]).forEach(x=>mine.add(x.post_id));
    }
    data.forEach(p=>{p._liked=mine.has(p.id);items.push(p)});
   }
  }catch(e){}
 }

 items.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 const visible=items.filter(p=>!SC.blocked.has(p.user_id));
 if(!visible.length){
  box.append(h("div",{class:"card cempty"},
   ic("users",{s:32}),
   h("b",{},sTr("لا منشورات مطابقة بعد","No matching posts yet","Aucune publication")),
   h("div",{class:"meta"},sTr("شارك أول سؤال علمي، حزمة بطاقات، أو تفريغ محاضرة مع زملائك.","Share the first scholarly inquiry, flashcard deck, or lecture transcript.","Partagez la première publication."))
  ));
  return;
 }
 visible.forEach(p=>{
  const c=postCard(p,!!p._liked);
  if(p._why)c.prepend(h("div",{class:"meta",style:"font-size:12px;opacity:.75;margin-bottom:4px"},p._why));
  box.append(c);
 });
}

function serverDeckWidget(p){
 const d=p.deckPayload;if(!d||!Array.isArray(d.cards)||!d.cards.length)return null;
 return h("div",{class:"card",style:"padding:12px;margin:8px 0;border:1px dashed rgba(213,168,62,.6)"},
  h("div",{style:"display:flex;gap:10px;align-items:center"},
   h("span",{style:"font-size:30px"},String(d.emoji||"📘").slice(0,4)),
   h("div",{},h("b",{dir:"auto"},d.title||p.title),h("div",{class:"meta"},"🃏 "+d.cards.length+" "+t("cards")))
  ),
  h("ol",{class:"meta",dir:"auto",style:"margin:8px 0;padding-inline-start:20px"},d.cards.slice(0,3).map(c=>h("li",{},String(c.q||"").slice(0,110)))),
  h("div",{class:"btns"},
   h("button",{class:"btn fill",type:"button",onclick:()=>{newDeck(d.title||p.title,d.cards.map(c=>Object.assign({},c,{id:uid(),sr:undefined})),{emoji:d.emoji||"📘"});toast(t("qDeckSaved"))}},ic("download"),sTr("أضف إلى حزمي","Save to My Decks","Enregistrer")),
   window.openRoomCreator?h("button",{class:"btn",type:"button",onclick:()=>openRoomCreator({title:sTr("مناقشة: ","Review: ","Révision : ")+(d.title||p.title),field:p.topic||"",linkedItem:{kind:"deck",title:d.title||p.title,emoji:d.emoji||"📘",index:0,revealed:false,cards:d.cards.slice(0,40)}})},ic("video"),sTr("ناقش في غرفة فيديو","Discuss in Video Room","Salle vidéo")):null
  )
 );
}

function transcriptWidget(p){
 const tr=p.transcriptPayload;if(!tr)return null;
 const segs=Array.isArray(tr.segments)?tr.segments:[];
 const pts=Array.isArray(tr.summaryPoints)?tr.summaryPoints:[];
 const cards=Array.isArray(tr.cards)?tr.cards:[];
 return h("div",{class:"card transcript-card"},
  h("div",{class:"transcript-head"},
   h("b",{dir:"auto"},ic("headphones",{s:16,cls:"gold"})," ",tr.title||p.title),
   tr.confidence!=null?h("span",{class:"badge g"},tr.confidence+"% "+sTr("دقة التفريغ","Confidence","Confiance")):null
  ),
  tr.lang?h("div",{class:"meta"},tr.lang+(tr.durationMin?" · "+tr.durationMin+" "+sTr("د","min","min"):"")):null,
  pts.length?h("ul",{class:"transcript-pts",dir:"auto"},pts.slice(0,4).map(x=>h("li",{},x))):null,
  segs.length?h("div",{class:"transcript-segs"},segs.slice(0,3).map(sg=>h("p",{dir:"auto"},
   sg.t!=null?h("span",{class:"lec-t"},pad(Math.floor(sg.t/60))+":"+pad(Math.floor(sg.t%60))):null," ",sg.text
  ))):null,
  h("div",{class:"btns"},
   cards.length?h("button",{class:"btn fill",type:"button",onclick:()=>{
    newDeck(tr.title||p.title,cards.map(c=>({id:uid(),t:"q",q:c.q,a:c.a,src:{t:tr.title||p.title,own:1}})),{emoji:"🎙️"});
    toast(t("qDeckSaved"));
   }},ic("cards"),sTr("حفظ البطاقات ("+cards.length+")","Import Cards ("+cards.length+")","Importer ("+cards.length+")")):null,
   window.openRoomCreator?h("button",{class:"btn",type:"button",onclick:()=>openRoomCreator({title:tr.title||p.title,field:p.topic||"",linkedItem:Object.assign({kind:"transcript"},tr)})},ic("video"),sTr("مراجعة في غرفة فيديو","Review in Video Room","Salle vidéo")):null
  )
 );
}

function postCard(p,liked){
 const a=p.profiles||{};
 const isSrv=!!p._server;
 const myId=window.Net?Net.ensurePeerId():(SC.user&&SC.user.id);
 const cnt=x=>isSrv?(x==="likes"?(p._likes||[]).length:(p._comments||[]).length):((p[x]&&p[x][0]&&p[x][0].count)||0);
 let lk=cnt("likes"),lked=isSrv?(p._likes||[]).includes(myId):liked;

 const lb=h("button",{class:"pbtn like","aria-label":sTr("إعجاب","Like","J'aime")}),cb=h("div",{}),tr=h("div",{class:"trout",dir:"auto"});
 const paint=()=>{lb.className="pbtn like"+(lked?" on":"");lb.setAttribute("aria-pressed",lked?"true":"false");lb.replaceChildren(ic("heart",{fill:lked}),h("span",{},String(lk)))};
 paint();

 lb.onclick=async()=>{
  if(isSrv){
   try{
    const res=await Net.apiPost("/api/community/posts/"+encodeURIComponent(p.id)+"/like",{userId:myId});
    p._likes=res.likes||[];lk=p._likes.length;lked=p._likes.includes(myId);paint();
   }catch(e){}
   return;
  }
  if(!SC.user)return authModal();
  lked=!lked;lk+=lked?1:-1;paint();
  const r=lked?await SC.sb.from("likes").insert({post_id:p.id,user_id:SC.user.id}):await SC.sb.from("likes").delete().match({post_id:p.id,user_id:SC.user.id});
  if(r.error){lked=!lked;lk+=lked?1:-1;paint()}
 };

 const own=(isSrv&&p.user_id===myId)||(SC.user&&SC.user.id===p.user_id);
 const K={
  post:["message",sTr("نقاش","Discussion","Discussion")],
  question:["help",sTr("سؤال","Question","Question")],
  deck:["cards",sTr("حزمة","Deck","Paquet")],
  transcript:["headphones",sTr("تفريغ محاضرة","Transcript","Transcription")],
  research:["file-text",sTr("بحث","Research","Recherche")],
  experience:["flask",sTr("تجربة","Experiment","Expérience")],
  video:["video",sTr("فيديو","Video","Vidéo")],
  lesson:["cap",sTr("مادة تعليمية","Lesson","Cours")]
 },kk=K[p.kind];
 const tb=trBtn(()=>p.title+(p.body?"\n\n"+p.body:""),tr,"pbtn");tb.setAttribute("aria-label",sTr("ترجمة","Translate","Traduire"));

 const extra=p.deckPayload?serverDeckWidget(p):p.transcriptPayload?transcriptWidget(p):null;

 return h("article",{class:"card post","data-pid":p.id},
  h("div",{class:"phead"},
   h("div",{class:"phd",onclick:()=>openProf(a.id||p.user_id)},av(a,44),
    h("div",{class:"pwho"},
     h("b",{dir:"auto"},(a.name||a.username||"?"),a.verified?h("span",{class:"premium-badge","aria-label":sTr("حساب موثّق","Verified","Vérifié")},ic("check",{w:2.6})):null,a.is_teacher?h("span",{class:"teacher-badge"},ic("cap"),sTr("أستاذ","Professor","Professeur")):null),
     h("div",{class:"meta"},h("span",{class:"ltr-handle"},"@"+(a.username||"")),p.topic?" · "+Net.discLabel(p.topic):""," · "+new Date(p.created_at).toLocaleDateString(S.lang))
    )
   ),
   h("span",{class:"kchip"},kk?[ic(kk[0]),kk[1]]:p.kind)
  ),
  h("h3",{dir:"auto"},p.title),
  p.body?h("div",{class:"pbody",dir:"auto"},p.body):null,
  extra,
  tr,
  p.doi?h("div",{class:"btns"},h("a",{class:"btn",href:"https://doi.org/"+encodeURI(p.doi),target:"_blank",rel:"noopener noreferrer"},ic("link"),"DOI: "+p.doi)):null,
  vid(p.video_url),
  h("div",{class:"pfoot"},
   h("div",{class:"pacts"},
    lb,
    h("button",{class:"pbtn","data-k":"com","aria-label":sTr("التعليقات","Comments","Commentaires"),onclick:()=>cb.childNodes.length?cb.replaceChildren():loadComments(p,cb)},ic("message"),h("span",{},String(cnt("comments")))),
    tb
   ),
   own?h("button",{class:"pbtn danger","aria-label":sTr("حذف","Delete","Supprimer"),onclick:async()=>{
    if(!confirm(sTr("حذف المنشور؟","Delete this post?","Supprimer ?")))return;
    if(isSrv){await Net.apiDel("/api/community/posts/"+encodeURIComponent(p.id)+"?userId="+encodeURIComponent(myId));render();return}
    if(p.file_path)await SC.sb.storage.from("posts").remove([p.file_path]);
    await SC.sb.from("posts").delete().eq("id",p.id);render();
   }},ic("trash")):
   (!isSrv?h("button",{class:"pbtn","aria-label":sTr("إبلاغ","Report","Signaler"),onclick:()=>reportModal({post_id:p.id,target_user:p.user_id})},ic("flag")):null)
  ),
  cb
 );
}

async function loadComments(p,box){
 if(p._server){
  const me=Net.myIdentity();
  const rows=p._comments||[];
  box.replaceChildren(...rows.map(c=>h("div",{class:"meta",dir:"auto",style:"padding:4px 0"},h("b",{},c.authorName||c.authorHandle||"?"),": "+c.body)));
  const inp=h("input",{class:"cin",placeholder:sTr("اكتب تعليقًا…","Write a comment…","Écrire un commentaire…"),maxlength:"500"});
  const go=async()=>{
   const b=inp.value.trim();if(!b)return;
   const r=await Net.apiPost("/api/community/posts/"+encodeURIComponent(p.id)+"/comments",{userId:me.id,authorName:me.name,authorHandle:me.username,body:b});
   p._comments=r.comments||[];
   const cntSpan=box.closest("article")&&box.closest("article").querySelector('[data-k="com"] span');
   if(cntSpan)cntSpan.textContent=String(p._comments.length);
   loadComments(p,box);
  };
  inp.onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)go()};
  box.append(h("div",{class:"ccomp"},inp,h("button",{class:"sendb",type:"button","aria-label":sTr("إرسال","Send","Envoyer"),onclick:go},ic("send"))));
  return;
 }
 const {data}=await SC.sb.from("comments").select("*,profiles(username,name)").eq("post_id",p.id).order("created_at").limit(50);
 box.replaceChildren(...(data||[]).filter(c=>!SC.blocked.has(c.user_id)).map(c=>{const o=h("div",{class:"trout"});return h("div",{class:"meta",dir:"auto"},h("b",{},(c.profiles&&(c.profiles.name||c.profiles.username))||"?"),": "+c.body,trBtn(()=>c.body,o,"flag"),o)}));
 const inp=h("input",{class:"cin",placeholder:sTr("اكتب تعليقًا…","Write a comment…","Commenter…"),maxlength:"500"});
 box.append(h("div",{class:"ccomp"},inp,h("button",{class:"sendb","aria-label":sTr("إرسال","Send","Envoyer"),onclick:async()=>{const b=inp.value.trim();if(!b)return;if(!SC.user)return authModal();
  const r=await SC.sb.from("comments").insert({post_id:p.id,user_id:SC.user.id,body:b});if(r.error)return toast(r.error.message);loadComments(p,box)}},ic("send"))));
}

// ---- Global Network & Connection Requests Sub-view ----
async function netView(v){
 const myId=Net.ensurePeerId();
 const box=h("div",{});v.append(box);
 box.append(h("div",{class:"msg"},"⏳"));
 const [connData,dirData]=await Promise.all([
  Net.apiGet("/api/connections?peerId="+encodeURIComponent(myId)).catch(()=>({incoming:[],outgoing:[],accepted:[]})),
  Net.apiGet("/api/directory").catch(()=>({profiles:[]}))
 ]);
 if(S.tab!=="com"||SC.view!=="net")return;
 box.replaceChildren();

 const onlineSet=new Set((Net.onlinePeers||[]).map(x=>x.peerId));
 const incoming=connData.incoming||[],accepted=connData.accepted||[],outgoing=connData.outgoing||[];
 const connMap=new Map();
 (connData.connections||[]).forEach(c=>{
  const otherId=c.fromId===myId?c.toId:c.fromId;
  connMap.set(otherId,c);
 });

 // Share My Profile banner
 const me=Net.myIdentity();
 box.append(h("div",{class:"card net-banner"},
  h("div",{style:"display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"},
   h("div",{},
    h("b",{dir:"auto"},me.avatar+" "+me.name," ",h("span",{class:"meta ltr-handle"},"@"+me.username)),
    h("div",{class:"meta"},[Net.discLabel(me.field),me.university].filter(Boolean).join(" · ")||sTr("أكمل ملفك الأكاديمي ليتعرّف عليك الباحثون","Complete your academic profile so peers can connect","Complétez votre profil"))
   ),
   h("div",{class:"btns",style:"margin-top:0"},
    h("button",{class:"btn",type:"button",onclick:()=>Net.shareProfile(me)},ic("share"),sTr("مشاركة ملفي","Share Profile","Partager")),
    h("button",{class:"btn fill",type:"button",onclick:()=>editModal(Object.assign({id:me.id,name:me.name,username:me.username,field:me.field,university:me.university,bio:me.bio},SC.me||{}))},ic("pencil"),sTr("تعديل","Edit","Modifier"))
   )
  )
 ));

 // Incoming requests
 if(incoming.length){
  box.append(h("div",{class:"sec"},sTr("طلبات التواصل الواردة ("+incoming.length+")","Incoming Connection Requests ("+incoming.length+")","Demandes reçues")));
  incoming.forEach(req=>{
   box.append(h("div",{class:"card phd"},
    h("div",{class:"cav",style:"width:44px;height:44px;font-size:20px"},(req.fromName||"?").slice(0,1)),
    h("div",{style:"flex:1;min-width:0"},
     h("b",{dir:"auto"},req.fromName," ",h("span",{class:"meta ltr-handle"},"@"+req.fromHandle)),
     h("div",{class:"meta",dir:"auto"},[req.fromField&&Net.discLabel(req.fromField),req.fromUniversity].filter(Boolean).join(" · "))
    ),
    h("div",{class:"btns",style:"margin-top:0"},
     h("button",{class:"btn fill",type:"button",onclick:async()=>{await Net.apiPost("/api/connections/respond",{id:req.id,peerId:myId,action:"accept"});Net.refreshConnectionCount();render()}},ic("check"),sTr("قبول","Accept","Accepter")),
     h("button",{class:"btn",type:"button",onclick:async()=>{await Net.apiPost("/api/connections/respond",{id:req.id,peerId:myId,action:"decline"});Net.refreshConnectionCount();render()}},ic("x"))
    )
   ));
  });
 }

 // Connected Peers
 box.append(h("div",{class:"sec"},sTr("شبكة زملائي ("+accepted.length+")","My Academic Connections ("+accepted.length+")","Mes connexions ("+accepted.length+")")));
 if(!accepted.length){
  box.append(h("div",{class:"card meta"},sTr("لا توجد اتصالات مقبولة بعد. أرسل طلب تواصل لأي باحث أدناه أو شارك رابط ملفك.","No accepted connections yet. Send a request below or share your profile link.","Aucune connexion pour l'instant.")));
 }else{
  accepted.forEach(c=>{
   const isFrom=c.fromId===myId;
   const pid=isFrom?c.toId:c.fromId,pname=isFrom?c.toName:c.fromName,phandle=isFrom?c.toHandle:c.fromHandle,pfield=isFrom?c.toField:c.fromField;
   const isOn=onlineSet.has(pid);
   box.append(h("div",{class:"card phd"},
    h("div",{class:"cav",style:"width:42px;height:42px;font-size:18px;cursor:pointer",onclick:()=>openProf(pid)},(pname||"?").slice(0,1)),
    h("div",{style:"flex:1;min-width:0;cursor:pointer",onclick:()=>openProf(pid)},
     h("b",{dir:"auto"},pname," ",isOn?h("span",{class:"online-dot",title:sTr("متصل الآن","Online","En ligne")}):null),
     h("div",{class:"meta",dir:"auto"},h("span",{class:"ltr-handle"},"@"+phandle),pfield?" · "+Net.discLabel(pfield):"")
    ),
    h("div",{class:"btns",style:"margin-top:0"},
     h("button",{class:"ibtn",type:"button",title:sTr("مكالمة فيديو","Video Call","Appel vidéo"),onclick:()=>window.startPeerCall&&startPeerCall(pid,pname,true)},ic("video")),
     h("button",{class:"ibtn",type:"button",title:sTr("مكالمة صوتية","Voice Call","Appel audio"),onclick:()=>window.startPeerCall&&startPeerCall(pid,pname,false)},ic("phone"))
    )
   ));
  });
 }

 // Global Researcher Directory
 const qInp=h("input",{class:"cin",type:"search",placeholder:sTr("ابحث عن باحثين بالاسم أو الجامعة أو التخصص…","Search global directory by name, university, field…","Rechercher un chercheur…")});
 const dirBox=h("div",{});
 const paintDir=()=>{
  const q=qInp.value.trim().toLowerCase();
  const rows=(dirData.profiles||[]).filter(p=>p.id!==myId&&(!q||[p.name,p.username,p.field,p.university].some(x=>(x||"").toLowerCase().includes(q))));
  if(!rows.length){
   dirBox.replaceChildren(h("div",{class:"card meta"},sTr("لا يوجد باحثون آخرون مسجلون حالياً في الدليل. شارك رابط ملفك لدعوة زملائك.","No other researchers in the directory yet. Share your profile link to invite peers.","Aucun autre chercheur dans l'annuaire.")));
   return;
  }
  dirBox.replaceChildren(...rows.map(p=>{
   const c=connMap.get(p.id);
   const isOn=p.online||onlineSet.has(p.id);
   let actBtn;
   if(c&&c.status==="accepted")actBtn=h("span",{class:"badge g"},ic("user-check",{s:12}),sTr("متصلان","Connected","Connecté"));
   else if(c&&c.status==="pending"&&c.fromId===myId)actBtn=h("span",{class:"badge n"},sTr("تم الإرسال","Pending","En attente"));
   else if(c&&c.status==="pending"&&c.toId===myId)actBtn=h("button",{class:"btn fill",type:"button",onclick:async()=>{await Net.apiPost("/api/connections/respond",{id:c.id,peerId:myId,action:"accept"});Net.refreshConnectionCount();render()}},ic("check"),sTr("قبول","Accept","Accepter"));
   else actBtn=h("button",{class:"btn",type:"button",onclick:async()=>{await Net.apiPost("/api/connections/request",{fromId:myId,fromName:me.name,fromHandle:me.username,fromField:me.field,fromUniversity:me.university,toId:p.id,toName:p.name,toHandle:p.username,toField:p.field});toast(sTr("أُرسل طلب التواصل ✓","Connection request sent ✓","Demande envoyée ✓"));render()}},ic("user-plus"),sTr("تواصل","Connect","Se connecter"));

   return h("div",{class:"card phd"},
    h("div",{class:"cav",style:"width:44px;height:44px;font-size:20px;cursor:pointer",onclick:()=>openProf(p.id)},p.avatar||(p.name||"?").slice(0,1)),
    h("div",{style:"flex:1;min-width:0;cursor:pointer",onclick:()=>openProf(p.id)},
     h("b",{dir:"auto"},p.name," ",isOn?h("span",{class:"online-dot"}):null),
     h("div",{class:"meta",dir:"auto"},h("span",{class:"ltr-handle"},"@"+p.username)," · ",[p.field&&Net.discLabel(p.field),p.university].filter(Boolean).join(" · "))
    ),
    h("div",{class:"btns",style:"margin-top:0"},
     actBtn,
     h("button",{class:"ibtn",type:"button",title:sTr("مكالمة فيديو","Video Call","Vidéo"),onclick:()=>window.startPeerCall&&startPeerCall(p.id,p.name,true)},ic("video"))
    )
   );
  }));
 };
 qInp.oninput=paintDir;
 box.append(h("div",{class:"sec"},sTr("دليل الباحثين العالمي","Global Researcher Directory","Annuaire des chercheurs")),h("div",{style:"padding:6px 16px"},qInp),dirBox);
 paintDir();
}

function openProf(id){SC.view="prof";SC.uid=id;render();window.scrollTo(0,0)}

async function profView(v){
 const box=h("div",{});v.append(box);
 const myId=window.Net?Net.ensurePeerId():(SC.user&&SC.user.id);
 let p=null,f1={count:0},f2={count:0},f3={count:0},pc={count:0},isSupa=false;

 if(SC.sb){
  const cn=(c,k,id)=>SC.sb.from("follows").select("*",{count:"exact",head:true}).eq(c,id);
  const res=await Promise.all([
   SC.sb.from("profiles").select("*").eq("id",SC.uid).maybeSingle(),
   cn("followee",0,SC.uid),cn("follower",0,SC.uid),
   SC.user?cn("follower",0,SC.user.id).eq("followee",SC.uid):{count:0},
   SC.sb.from("posts").select("*",{count:"exact",head:true}).eq("user_id",SC.uid)
  ]);
  if(res[0]&&res[0].data){p=res[0].data;f1=res[1];f2=res[2];f3=res[3];pc=res[4];isSupa=true}
 }

 if(!p&&window.Net){
  if(SC.uid===myId){
   const me=Net.myIdentity();
   p={id:me.id,username:me.username,name:me.name,field:me.field,university:me.university,academic_level:me.level,bio:me.bio,authorAvatar:me.avatar};
  }else{
   try{const r=await Net.apiGet("/api/directory/"+encodeURIComponent(SC.uid));if(r.profile)p={id:r.profile.id,username:r.profile.username,name:r.profile.name,field:r.profile.field,university:r.profile.university,academic_level:r.profile.level,bio:r.profile.bio,authorAvatar:r.profile.avatar,verified:r.profile.verified}}catch(e){}
  }
 }

 if(!p){box.append(h("div",{class:"card"},sTr("الصفحة غير موجودة","Profile not found","Profil introuvable")));return}

 const own=(SC.user&&SC.user.id===p.id)||(p.id===myId);
 let fol=!!f3.count,nf=f1.count||0;const sf=h("b",{},"0"),fb=h("button",{class:"pri pfollow"});
 const paint=()=>{sf.textContent=String(nf);fb.className="pri pfollow"+(fol?" on":"");fb.setAttribute("aria-pressed",fol?"true":"false");fb.replaceChildren(ic(fol?"check":"user-plus"),fol?sTr("تتابعه","Following","Abonné"):sTr("متابعة","Follow","Suivre"))};
 paint();
 fb.onclick=async()=>{
  if(!SC.user||!isSupa)return authModal();
  fol=!fol;nf+=fol?1:-1;paint();
  const r=fol?await SC.sb.from("follows").insert({follower:SC.user.id,followee:p.id}):await SC.sb.from("follows").delete().match({follower:SC.user.id,followee:p.id});
  if(r.error){fol=!fol;nf+=fol?1:-1;paint()}
 };

 // Connection request state
 let conn=null;
 if(!own&&window.Net){
  try{
   const cr=await Net.apiGet("/api/connections?peerId="+encodeURIComponent(myId));
   conn=(cr.connections||[]).find(c=>(c.fromId===myId&&c.toId===p.id)||(c.toId===myId&&c.fromId===p.id))||null;
  }catch(e){}
 }
 const connBtn=(()=>{
  if(own||!window.Net)return null;
  const me=Net.myIdentity();
  if(conn&&conn.status==="accepted")return h("button",{class:"btn",type:"button",disabled:true},ic("user-check"),sTr("متصلان","Connected","Connecté"));
  if(conn&&conn.status==="pending"&&conn.fromId===myId)return h("button",{class:"btn",type:"button",disabled:true},ic("clock"),sTr("طلب مرسل","Pending","En attente"));
  if(conn&&conn.status==="pending"&&conn.toId===myId)return h("button",{class:"btn fill",type:"button",onclick:async()=>{await Net.apiPost("/api/connections/respond",{id:conn.id,peerId:myId,action:"accept"});Net.refreshConnectionCount();render()}},ic("check"),sTr("قبول الطلب","Accept Request","Accepter"));
  return h("button",{class:"btn fill",type:"button",onclick:async()=>{await Net.apiPost("/api/connections/request",{fromId:myId,fromName:me.name,fromHandle:me.username,fromField:me.field,fromUniversity:me.university,toId:p.id,toName:p.name,toHandle:p.username,toField:p.field});toast(sTr("أُرسل طلب التواصل ✓","Connection request sent ✓","Demande envoyée ✓"));render()}},ic("user-plus"),sTr("طلب تواصل","Connect","Se connecter"));
 })();

 const lvl=p.academic_level?AVC[Math.max(0,LVCODE.indexOf(p.academic_level))][0]:null;
 const meta=[lvl&&["cap",lvl],p.field&&["book",Net.discLabel(p.field)],p.university&&["pin",p.university]].filter(Boolean);
 const stat=(n,l)=>h("div",{class:"pst"},h("b",{},String(n)),h("span",{},l));

 const dmB=isSupa?h("button",{class:"btn pmsg",type:"button",onclick:async()=>{if(!SC.user)return authModal();const r=await SC.sb.rpc("start_dm",{other:p.id});if(r.error)return toast(r.error.message);openChat(r.data,p.name||p.username)}},ic("message"),sTr("راسل","Message","Message")):null;
 const videoB=h("button",{class:"btn",type:"button",onclick:()=>window.startPeerCall&&startPeerCall(p.id,p.name||p.username,true)},ic("video"),sTr("مكالمة فيديو","Video Call","Appel vidéo"));
 const audioB=h("button",{class:"btn",type:"button",onclick:()=>window.startPeerCall&&startPeerCall(p.id,p.name||p.username,false)},ic("phone"),sTr("صوت","Voice","Vocal"));
 const shareB=h("button",{class:"btn",type:"button",onclick:()=>Net.shareProfile(p)},ic("share"),sTr("مشاركة الملف","Share Profile","Partager"));

 const blB=isSupa?h("button",{class:"btn danger",onclick:async()=>{if(!SC.user)return authModal();const bl=SC.blocked.has(p.id);if(!bl&&!confirm("حظر هذا المستخدم؟"))return;const r=bl?await SC.sb.from("blocks").delete().match({blocker:SC.user.id,blocked:p.id}):await SC.sb.from("blocks").insert({blocker:SC.user.id,blocked:p.id});if(r.error)return toast(r.error.message);bl?SC.blocked.delete(p.id):SC.blocked.add(p.id);render()}},ic("ban"),SC.blocked.has(p.id)?sTr("إلغاء الحظر","Unblock","Débloquer"):sTr("حظر","Block","Bloquer")):null;
 const rpB=isSupa?h("button",{class:"btn",onclick:()=>reportModal({target_user:p.id})},ic("flag"),sTr("إبلاغ","Report","Signaler")):null;
 const vfB=SC.me&&SC.me.is_admin?h("button",{class:"btn",onclick:async()=>{const x=await SC.sb.rpc("admin_act",{act:p.verified?"unverify":"verify",tid:p.id});if(x.error)return toast(x.error.message);render()}},ic("star"),p.verified?"إلغاء التوثيق":"توثيق مميز"):null;
 const tcB=SC.me&&SC.me.is_admin?h("button",{class:"btn",onclick:async()=>{const x=await SC.sb.rpc("admin_act",{act:p.is_teacher?"unset_teacher":"set_teacher",tid:p.id});if(x.error)return toast(x.error.message);render()}},ic("cap"),p.is_teacher?"إزالة صفة الأستاذ":"اعتماد كأستاذ"):null;

 box.append(h("section",{class:"card pcard"},h("div",{class:"pcover"}),
  h("div",{class:"pid"},h("div",{class:"pav"},av(p,88)),
   h("h3",{dir:"auto"},(p.name||p.username),p.verified?h("span",{class:"premium-badge"},ic("check",{w:2.6}),sTr("حساب مميز","Verified","Vérifié")):null,p.is_teacher?h("span",{class:"teacher-badge"},ic("cap"),sTr("أستاذ","Professor","Professeur")):null),
   h("div",{class:"meta ltr-handle"},"@"+p.username),p.researcher_uid?uidChip(p.researcher_uid):null,
   meta.length?h("ul",{class:"pmeta"},meta.map(([i,tx])=>h("li",{dir:"auto"},ic(i),h("span",{},tx)))):null,
   p.bio?h("p",{class:"pbio",dir:"auto"},p.bio):null),
  isSupa?h("div",{class:"pstats"},stat(pc.count||0,sTr("منشور","Posts","Posts")),h("div",{class:"pst"},sf,h("span",{},sTr("متابِع","Followers","Abonnés"))),stat(f2.count||0,sTr("يتابع","Following","Abonnements"))):null,
  own?h("div",{class:"pact"},h("button",{class:"pri",type:"button",onclick:()=>editModal(p)},ic("pencil"),sTr("تعديل ملفي","Edit Profile","Modifier")),shareB):[
   isSupa?h("div",{class:"pact"},fb,dmB):null,
   h("div",{class:"pgrid"},connBtn,videoB,audioB,shareB),
   isSupa?h("div",{class:"pgrid"},blB,rpB):null,
   vfB?h("div",{class:"padmin"},h("div",{class:"plabel"},ic("shield"),"أدوات الإدارة"),h("div",{class:"pgrid"},vfB,tcB)):null
  ]));
 const lst=h("div",{});box.append(lst);loadPosts(lst,{uid:p.id});
}

const square=(f,n)=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const c=document.createElement("canvas");c.width=c.height=n;const s=Math.min(i.width,i.height);
 c.getContext("2d").drawImage(i,(i.width-s)/2,(i.height-s)/2,s,s,0,0,n,n);c.toBlob(ok,"image/jpeg",.85)};i.onerror=no;i.src=URL.createObjectURL(f)});

function editModal(p){
 const I=(v,ph)=>h("input",{class:"cin",value:v||"",placeholder:ph}),
  nm=I(p.name,sTr("الاسم","Display Name","Nom")),
  fl=h("select",{class:"cin"},Net.DISCIPLINES.map(d=>h("option",{value:d.id,selected:(p.field||"")===d.id?"selected":null},d.id?(d[S.lang]||d.en):sTr("اختر تخصصك…","Select your field…","Discipline…")))),
  un=I(p.university,sTr("الجامعة / المؤسسة","University / Institution","Université")),
  bio=h("textarea",{class:"cta",maxlength:"300",placeholder:sTr("نبذة عن أبحاثك واهتماماتك","Academic bio & research interests","Biographie académique")},p.bio||""),
  file=SC.user?h("input",{type:"file",accept:"image/*"}):null;

 const m=modal(
  h("h3",{},ic("pencil")," ",sTr("ملفي الأكاديمي","My Academic Profile","Mon profil académique")),
  file?[h("div",{class:"meta"},sTr("الصورة الشخصية","Avatar","Photo")),file]:null,
  nm,fl,un,bio,
  h("button",{class:"pri",type:"button",onclick:async()=>{
   const name=nm.value.trim()||p.name||"Scholar";
   const field=fl.value;
   const univ=un.value.trim();
   const b=bio.value.trim();
   S.prof.name=name;S.prof.field=field;S.prof.university=univ;S.prof.bio=b;persist();
   if(SC.user&&SC.sb){
    let url=p.avatar_url;const f=file&&file.files[0];
    if(f){const bl=await square(f,256),path=SC.user.id+"/avatar-"+Date.now()+".jpg",up=await SC.sb.storage.from("avatars").upload(path,bl,{contentType:"image/jpeg"});
     if(up.error)return toast(up.error.message);url=SC.sb.storage.from("avatars").getPublicUrl(path).data.publicUrl}
    const r=await SC.sb.from("profiles").update({name,field,university:univ,bio:b,avatar_url:url}).eq("id",p.id);
    if(r.error)return toast(r.error.message);
    await setUser((await SC.sb.auth.getSession()).data.session);
   }
   await Net.syncDirectory();
   m.remove();toast(sTr("تم حفظ الملف الأكاديمي ✓","Academic profile saved ✓","Profil enregistré ✓"));render();
  }},sTr("حفظ","Save","Enregistrer")),
  SC.user&&typeof deleteAccount==="function"?h("button",{class:"btn danger",style:"margin-top:8px",onclick:deleteAccount},"🗑 حذف حسابي نهائيًا"):null,
  cancelB({remove:()=>m.remove()})
 );
}

function postModal(){
 const kinds=[
  ["post",sTr("💬 نقاش أكاديمي","💬 Academic Discussion","💬 Discussion")],
  ["question",sTr("❓ استفسار علمي","❓ Research Question","❓ Question")],
  ["deck",sTr("🃏 مشاركة حزمة بطاقات","🃏 Share Flashcard Deck","🃏 Partager des fiches")],
  ["transcript",sTr("🎙️ تبادل تفريغ محاضرة","🎙️ Share Lecture Transcript","🎙️ Partager transcription")],
  ["research",sTr("📄 ملخص بحث علمي","📄 Research Summary","📄 Résumé de recherche")],
  ["experience",sTr("🧪 تجربة / ملاحظات مخبرية","🧪 Lab / Field Notes","🧪 Expérience")],
  ["video",sTr("🎬 فيديو تعليمي","🎬 Educational Video","🎬 Vidéo")]
 ];
 const kind=h("select",{class:"cin"},kinds.map(([k,n])=>h("option",{value:k},n)));
 const fd=h("select",{class:"cin"},Net.DISCIPLINES.map(d=>h("option",{value:d.id||(S.prof&&S.prof.field)||"Sociology",selected:((SC.field||(S.prof&&S.prof.field))===d.id)?"selected":null},d.id?(d[S.lang]||d.en):sTr("عام","General","Général"))));
 const ti=h("input",{class:"cin",placeholder:sTr("العنوان","Title","Titre"),maxlength:"150"});
 const bd=h("textarea",{class:"cta",placeholder:sTr("اكتب أفكارك أو ملخصك أو سؤالك للباحثين…","Write your inquiry, summary, or lecture notes…","Rédigez votre message…"),maxlength:"3000"});
 const vd=h("input",{class:"cin",dir:"ltr",placeholder:sTr("رابط فيديو يوتيوب أو DOI (اختياري)","YouTube link (optional)","Lien vidéo (optionnel)")});

 const dks=(S.decks||[]).filter(d=>d&&Array.isArray(d.cards)&&d.cards.length);
 const dkSel=h("select",{class:"cin"},dks.map((d,i)=>h("option",{value:i},(d.emoji||"📘")+" "+String(d.title||"").slice(0,50)+" · "+d.cards.length)));
 const dw=h("div",{style:"display:none"},
  h("div",{class:"meta"},dks.length?sTr("اختر حزمة البطاقات لمشاركتها في المجتمع:","Select a flashcard deck to share:","Choisissez un paquet :"):sTr("أنشئ حزمة من تبويب «حزمي» أولًا.","Create a deck from My Decks first.","Créez d'abord un paquet.")),
  dks.length?dkSel:null
 );
 const trBox=h("div",{style:"display:none"},
  h("div",{class:"meta"},sTr("الصق نص تفريغ المحاضرة أو نقاطها (ستُنشأ بطاقات تلقائيًا للمجتمع):","Paste lecture transcript or timestamped notes (flashcards will be attached automatically):","Collez la transcription du cours :")),
  h("textarea",{class:"cta",rows:"4",placeholder:sTr("00:15 مفهوم التنشئة الاجتماعية…","00:15 Key concept…","00:15 Concept clé…")})
 );
 const show=()=>{
  dw.style.display=kind.value==="deck"?"":"none";
  trBox.style.display=kind.value==="transcript"?"":"none";
  vd.style.display=(kind.value==="video"||kind.value==="research"||kind.value==="experience")?"":"none";
 };
 kind.onchange=show;show();

 const m=modal(
  h("h3",{},ic("plus")," ",sTr("نشر في المجتمع العلمي","Post to Academic Community","Publier dans la communauté")),
  kind,fd,ti,bd,dw,trBox,vd,
  h("button",{class:"pri",type:"button",onclick:async()=>{
   const k=kind.value,DK=k==="deck"?dks[+dkSel.value]:null;
   if(k==="deck"&&!DK)return toast(sTr("اختر حزمة أولًا","Select a deck first","Choisissez un paquet"));
   const trRaw=k==="transcript"?trBox.querySelector("textarea").value.trim():"";
   const title=(ti.value.trim()||(DK?DK.title:bd.value.trim().slice(0,90))||(trRaw?trRaw.slice(0,80):"")).slice(0,150);
   if(!title)return toast(sTr("اكتب عنوانًا أو محتوى","Enter a title or content","Entrez un titre"));
   const me=Net.myIdentity();

   let transcriptPayload=null;
   if(k==="transcript"){
    const lines=(trRaw||bd.value.trim()).split(/\r?\n/).filter(Boolean);
    const segs=lines.slice(0,12).map((ln,i)=>({t:i*45,text:ln}));
    const cards=notesToCards(trRaw||bd.value.trim(),title).slice(0,25);
    transcriptPayload={title,lang:S.lang,confidence:94,segments:segs,summaryPoints:lines.slice(0,4),cards};
   }

   await Net.apiPost("/api/community/posts",{
    userId:me.id,authorName:me.name,authorHandle:me.username,authorField:me.field,authorUniversity:me.university,authorAvatar:me.avatar,
    kind:k,field:fd.value,title,body:bd.value.trim(),videoUrl:vd.value.trim()||undefined,
    deckPayload:DK?{title:DK.title,emoji:DK.emoji||"📘",cards:DK.cards.slice(0,40)}:null,
    transcriptPayload
   });

   if(SC.user&&SC.sb&&k!=="transcript"){
    try{
     await SC.sb.from("posts").insert({user_id:SC.user.id,kind:k==="post"||k==="question"||k==="deck"||k==="research"||k==="experience"||k==="video"?k:"post",title,body:bd.value.trim()||null,topic:fd.value||null,video_url:okU(vd.value.trim())?vd.value.trim():null});
    }catch(e){}
   }
   m.remove();SC.view="feed";toast(sTr("تم النشر في المجتمع ✓","Published to Community ✓","Publié ✓"));render();
  }},sTr("نشر","Publish","Publier")),
  cancelB({remove:()=>m.remove()})
 );
}

function authModal(){
 if(!(window.SUPA&&SUPA.url&&SUPA.key))return toast(sTr("وضع الشبكة المباشر مفعّل بالفعل دون حاجة لتسجيل بريد.","Live network mode is already active without email sign-in."));
 let up=false;const I=(ph,o)=>h("input",Object.assign({class:"cin",placeholder:ph},o||{}));
 const em=I(sTr("البريد الإلكتروني","Email","E-mail"),{type:"email",dir:"ltr"}),pw=I(sTr("كلمة المرور (8 أحرف على الأقل)","Password (8+ chars)","Mot de passe"),{type:"password"}),nm=I(sTr("الاسم الظاهر","Display Name","Nom")),un=I(sTr("اسم المستخدم بالإنجليزية: salah_01","Username (e.g. salah_01)","Identifiant"),{dir:"ltr"});
 const ag=h("input",{type:"checkbox"}),ex=h("div",{style:"display:none"},nm,un,h("label",{class:"meta",style:"display:flex;gap:6px;align-items:center"},ag,h("span",{},"أوافق على ",h("a",{href:"#",onclick:e=>{e.preventDefault();typeof legalModal==="function"&&legalModal()}},"الشروط وسياسة الخصوصية"),"، وعمري 16 سنة فأكثر"))),go=h("button",{class:"pri"},sTr("دخول","Sign in","Connexion")),sw=h("button",{class:"btn"},sTr("ليس لديك حساب؟ سجّل","Create account","Créer un compte"));
 sw.onclick=()=>{up=!up;ex.style.display=up?"":"none";go.textContent=up?sTr("إنشاء حساب","Sign up","S'inscrire"):sTr("دخول","Sign in","Connexion");sw.textContent=up?sTr("لديك حساب؟ ادخل","Already have an account?","Déjà un compte ?"):sTr("ليس لديك حساب؟ سجّل","Create account","Créer un compte")};
 go.onclick=async()=>{await loadSb();const e=em.value.trim(),p=pw.value;if(!e||p.length<8)return toast("أدخل بريدًا صحيحًا وكلمة مرور من 8 أحرف على الأقل");
  if(up){if(!ag.checked)return toast("يجب الموافقة على الشروط وسياسة الخصوصية");const u=un.value.trim().toLowerCase();if(!/^[a-z0-9_]{3,20}$/.test(u))return toast("اسم المستخدم: 3–20 حرفًا إنجليزيًا أو أرقامًا أو _");
   const r=await SC.sb.auth.signUp({email:e,password:p,options:{data:{username:u,name:nm.value.trim()||u},emailRedirectTo:location.origin+location.pathname}});if(r.error)return toast(authMsg(r.error));if(!r.data.session){toast("أرسلنا رابط تأكيد إلى بريدك الإلكتروني.");return}}
  else{const r=await SC.sb.auth.signInWithPassword({email:e,password:p});if(r.error)return toast(authMsg(r.error))}m.remove()};
 const m=modal(h("h3",{},sTr("👤 حساب Supabase الأكاديمي","👤 Supabase Academic Account","👤 Compte Supabase")),em,pw,ex,go,h("div",{class:"acts"},sw,h("button",{class:"btn",onclick:()=>m.remove()},t("cancel"))));
}
