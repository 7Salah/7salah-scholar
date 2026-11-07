// ===== القصص ⏳ (24 ساعة) — يتطلب v19p-stories.sql =====
// الانتهاء مفروض من القاعدة. «المشاهَد» يُحفظ محليًا فقط (لا نتتبّع من شاهد قصتك).
const ST_BG=["linear-gradient(135deg,#6a11cb,#2575fc)","linear-gradient(135deg,#f12711,#f5af19)","linear-gradient(135deg,#11998e,#38ef7d)","linear-gradient(135deg,#ee0979,#ff6a00)","linear-gradient(135deg,#232526,#414345)","linear-gradient(135deg,#1e3c72,#2a5298)"];
const stSeen=()=>{try{return JSON.parse(localStorage.getItem("7s_seen")||"{}")||{}}catch(e){return{}}};
const stMark=id=>{try{const s=stSeen();s[id]=Date.now();const ks=Object.keys(s);if(ks.length>400)ks.sort((a,b)=>s[a]-s[b]).slice(0,ks.length-400).forEach(k=>delete s[k]);localStorage.setItem("7s_seen",JSON.stringify(s))}catch(e){}};
const stAgo=iso=>{const m=Math.max(0,(Date.now()-new Date(iso).getTime())/6e4);return m<60?Math.max(1,Math.round(m))+" د":Math.round(m/60)+" س"};
const stImg=p=>{try{if(!/^[^\/]+\/[A-Za-z0-9._-]{1,120}$/.test(p||"")||String(p).includes(".."))return"";const u=pubUrl(p);return u&&window.SUPA&&u.startsWith(SUPA.url+"/")?u:""}catch(e){return""}};
const stMissing=e=>/stories|relation|schema cache|does not exist/i.test((e&&e.message)||"");

async function stLoad(){
 const me=SC.user.id,now=new Date().toISOString();
 const [fl,rs]=await Promise.all([SC.sb.from("follows").select("followee").eq("follower",me),SC.sb.from("stories").select("*").gt("expires_at",now).order("created_at",{ascending:true}).limit(300)]);
 if(rs.error)throw rs.error;
 const fol=new Set((fl.data||[]).map(x=>x.followee));fol.add(me);
 const rows=(rs.data||[]).filter(s=>fol.has(s.user_id)&&!SC.blocked.has(s.user_id));
 const ids=[...new Set(rows.map(s=>s.user_id))],P={};
 if(ids.length){const pr=await SC.sb.from("profiles").select("id,name,username,avatar_url").in("id",ids);(pr.data||[]).forEach(p=>{P[p.id]=p})}
 const seen=stSeen(),g={};
 rows.forEach(s=>{(g[s.user_id]=g[s.user_id]||{uid:s.user_id,p:P[s.user_id]||{},items:[]}).items.push(s)});
 const out=Object.values(g);out.forEach(x=>{x.unseen=x.items.some(i=>!seen[i.id])});
 const last=x=>new Date(x.items[x.items.length-1].created_at).getTime();
 out.sort((a,b)=>(a.uid===me?-1:b.uid===me?1:0)||(b.unseen-a.unseen)||(last(b)-last(a)));
 return out}

// تنظيف قصصي المنتهية (الصور من الدلو ثم الصفوف)
async function stCleanOwn(){try{const r=await SC.sb.from("stories").select("id,file_path").eq("user_id",SC.user.id).lt("expires_at",new Date().toISOString()).limit(50),rows=r.data||[];if(!rows.length)return;
 const fp=rows.map(x=>x.file_path).filter(Boolean);if(fp.length)await SC.sb.storage.from("posts").remove(fp);await SC.sb.from("stories").delete().in("id",rows.map(x=>x.id))}catch(e){}}

function storiesBar(){
 const bar=h("div",{style:"display:flex;gap:12px;overflow-x:auto;padding:4px 16px 10px;align-items:flex-start"});
 let groups=[];
 const ring=(g,idx)=>h("button",{style:"background:none;border:0;padding:0;text-align:center;cursor:pointer;min-width:68px;color:inherit",onclick:()=>stView(groups,idx,0,refill)},
  h("div",{style:"display:inline-block;padding:3px;border-radius:50%;background:"+(g.unseen?"linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)":"rgba(128,128,128,.45)")},h("div",{style:"padding:2px;border-radius:50%;background:var(--bg,#fff)"},av(g.p,54))),
  h("div",{class:"meta",style:"font-size:11px;max-width:68px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"},g.uid===SC.user.id?"قصتي":(g.p.name||g.p.username||"")));
 const add=h("button",{style:"background:none;border:0;padding:0;text-align:center;cursor:pointer;min-width:68px;color:inherit",onclick:()=>stCompose(refill)},
  h("div",{style:"width:62px;height:62px;border-radius:50%;border:2px dashed rgba(128,128,128,.6);display:inline-flex;align-items:center;justify-content:center;font-size:26px"},"＋"),h("div",{class:"meta",style:"font-size:11px"},"قصة جديدة"));
 async function refill(){
  try{groups=await stLoad();bar.replaceChildren(add,...groups.map(ring));stCleanOwn()}
  catch(e){if(stMissing(e))bar.replaceChildren(SC.me&&SC.me.is_admin?h("div",{class:"meta"},"لتفعيل القصص شغّل v19p-stories.sql في Supabase"):h("div",{}));else bar.replaceChildren(add)}}
 bar.replaceChildren(add);refill();return bar}

function stView(groups,gi,ii,done){
 let g=gi,i=ii||0,timer=null;
 const frame=h("div",{style:"position:relative;width:min(100vw,460px);height:min(100vh,820px);background:#000;overflow:hidden;display:flex;flex-direction:column;color:#fff"});
 const root=h("div",{style:"position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.94);display:flex;align-items:center;justify-content:center"},frame);
 const onKey=e=>{if(e.key==="Escape")close();else if(e.key==="ArrowLeft")next();else if(e.key==="ArrowRight")prev()};
 function close(){clearTimeout(timer);document.removeEventListener("keydown",onKey);root.remove();if(done)done()}
 function next(){const G=groups[g];if(G&&i<G.items.length-1){i++;draw()}else if(g<groups.length-1){g++;i=0;draw()}else close()}
 function prev(){if(i>0){i--;draw()}else if(g>0){g--;i=Math.max(0,groups[g].items.length-1);draw()}else draw()}
 async function del(s,G){if(!confirm("حذف هذه القصة؟"))return;clearTimeout(timer);
  try{if(s.file_path)await SC.sb.storage.from("posts").remove([s.file_path]);await SC.sb.from("stories").delete().eq("id",s.id)}catch(e){}
  drop(s,G)}
 async function rep(s,G){clearTimeout(timer);const r=await SC.sb.from("story_reports").insert({story_id:s.id});toast(r.error?(stMissing(r.error)?"لتفعيل القصص شغّل v19p-stories.sql":"تعذّر إرسال البلاغ"):"شكرًا، وصلنا بلاغك وأخفينا القصة عنك");drop(s,G)}
 function drop(s,G){G.items=G.items.filter(x=>x.id!==s.id);if(!G.items.length){groups.splice(g,1);if(g>=groups.length){close();return}i=0}else if(i>=G.items.length)i=G.items.length-1;draw()}
 function draw(){clearTimeout(timer);const G=groups[g];if(!G||!G.items[i]){close();return}
  const s=G.items[i],own=G.uid===SC.user.id;stMark(s.id);G.unseen=G.items.some(x=>!stSeen()[x.id]);
  const img=s.kind==="image"?stImg(s.file_path):"";
  frame.replaceChildren(
   h("div",{style:"display:flex;gap:4px;padding:8px 10px 4px"},G.items.map((_,k)=>h("div",{style:"flex:1;height:3px;border-radius:2px;background:"+(k<=i?"#fff":"rgba(255,255,255,.3)")}))),
   h("div",{style:"display:flex;align-items:center;gap:8px;padding:4px 10px;z-index:3"},av(G.p,34),h("div",{style:"flex:1;min-width:0",dir:"auto"},h("b",{},G.p.name||G.p.username||""),h("span",{style:"opacity:.7;font-size:12px;margin-inline-start:8px"},stAgo(s.created_at))),
    h("button",{class:"btn",title:own?"حذف":"بلاغ",onclick:()=>own?del(s,G):rep(s,G)},own?"🗑":"⚑"),h("button",{class:"btn",title:"إغلاق",onclick:close},"✕")),
   h("div",{style:"flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;text-align:center;"+(s.kind==="image"?"background:#000":"background:"+ST_BG[s.bg||0])},
    s.kind==="image"?(img?h("img",{src:img,alt:"",style:"max-width:100%;max-height:100%;object-fit:contain;flex:1;min-height:0"}):h("div",{class:"meta"},"تعذّر عرض الصورة")):null,
    s.kind==="study"?h("div",{style:"margin-bottom:12px"},ic("book",{s:54,cls:"gold"})):null,
    s.body?h("div",{dir:"auto",style:"white-space:pre-wrap;word-break:break-word;font-weight:700;"+(s.kind==="image"?"font-size:15px;padding-top:10px":"font-size:"+(s.body.length>120?"20px":"28px")+";line-height:1.5")},s.body):null),
   h("div",{style:"position:absolute;inset:92px 0 0 0;display:flex;z-index:2"},h("div",{style:"flex:1",onclick:prev}),h("div",{style:"flex:1",onclick:next})));
  timer=setTimeout(next,s.kind==="image"?7000:Math.min(9000,4000+(s.body||"").length*40))}
 document.addEventListener("keydown",onKey);document.body.append(root);draw()}

function stCompose(done){
 const type=h("select",{class:"cin",onchange:()=>sync()},h("option",{value:"text"},"✍️ نص"),h("option",{value:"study"},"📚 ما راجعته اليوم"),h("option",{value:"image"},"🖼 صورة"));
 const ta=h("textarea",{class:"cin",maxlength:"280",placeholder:"اكتب قصتك (حتى 280 حرفًا)…",style:"min-height:90px"}),file=h("input",{type:"file",accept:"image/*"});
 let bg=0;const sw=h("div",{class:"btns"},ST_BG.map((c,k)=>h("button",{class:"btn",style:"width:34px;height:34px;border-radius:50%;background:"+c+";border:2px solid transparent",onclick:()=>{bg=k;[...sw.children].forEach((x,j)=>{x.style.borderColor=j===k?"#fff":"transparent"});prev.style.background=ST_BG[bg]}})));
 const prev=h("div",{style:"border-radius:12px;padding:16px;text-align:center;color:#fff;font-weight:700;min-height:70px;display:flex;align-items:center;justify-content:center;background:"+ST_BG[0]},"معاينة");
 const fw=h("div",{},h("div",{class:"meta"},"تُضغط الصورة تلقائيًا. ارفع ما تملك حقوقه فقط."),file);
 function sync(){const k=type.value;fw.style.display=k==="image"?"":"none";sw.style.display=prev.style.display=k==="image"?"none":"";
  if(k==="study"){const n=(typeof todayN==="function"?todayN("review"):0)||0,sk=(typeof streak==="function"?streak():0)||0;if(n>0)ta.value="راجعت "+n+" بطاقة اليوم"+(sk>1?" · 🔥 "+sk+" أيام متتالية":"")+" 💪";else{ta.value="";ta.placeholder="لم تراجع بطاقات اليوم بعد. راجع بعضها ثم عُد لتشارك إنجازك 💪";return}}
  ta.placeholder=k==="image"?"تعليق (اختياري)":"اكتب قصتك (حتى 280 حرفًا)…"}
 sync();
 const m=modal(h("h3",{},"⏳ قصة جديدة"),h("div",{class:"meta"},"تختفي بعد 24 ساعة. يراها من يتابعك."),type,ta,sw,prev,fw,
  h("button",{class:"pri",onclick:async e=>{const btn=e.target,k=type.value;let path=null;
   const row={user_id:SC.user.id,kind:k,bg:k==="image"?0:bg};const body=ta.value.trim().slice(0,280);
   if(k==="image"){const f=file.files[0];if(!f)return toast("اختر صورة");if(!/^image\//.test(f.type))return toast("الملف ليس صورة");if(f.size>20971520)return toast("الصورة كبيرة جدًا");
    btn.disabled=true;let blob;try{blob=await shrink(f,1080)}catch(_){btn.disabled=false;return toast("تعذّرت قراءة الصورة")}
    path=SC.user.id+"/story-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+".jpg";const up=await SC.sb.storage.from("posts").upload(path,blob,{contentType:"image/jpeg"});
    if(up.error){btn.disabled=false;return toast(up.error.message)}row.file_path=path;row.body=body||null}
   else{if(!body)return toast("اكتب شيئًا");row.body=body}
   btn.disabled=true;const r=await SC.sb.from("stories").insert(row);
   if(r.error){btn.disabled=false;if(path)try{await SC.sb.storage.from("posts").remove([path])}catch(_){}
    return toast(/stories_limit/.test(r.error.message||"")?"وصلت حدّ 10 قصص خلال 24 ساعة":stMissing(r.error)?"لتفعيل القصص شغّل v19p-stories.sql في Supabase":r.error.message)}
   m.remove();toast("نُشرت قصتك ⏳");if(done)done()}}),h("div",{class:"acts"},h("button",{class:"btn",onclick:()=>m.remove()},"إلغاء")));
 return m}
