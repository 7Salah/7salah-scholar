// الدردشة المباشرة والمجموعات (Supabase Realtime). يُحمَّل بعد social.js.
let _ch=null;
let _rt=null;
function stopChat(){if(_ch&&SC.sb){SC.sb.removeChannel(_ch);_ch=null}if(_rt){clearInterval(_rt);_rt=null}document.body.classList.remove("inchat")}
function openChat(id,name){SC.view="chat";SC.cid=id;SC.cname=name;SC.chatLimit=0;SC.jump=null;render();window.scrollTo(0,0)}
// ---- أدوات عرض مشتركة للمحادثات ----
const isGrp=n=>(n||"").startsWith("👥");                       // منطق التعرّف على المجموعة محفوظ كما كان
const cleanName=n=>(n||"").replace(/^👥\s*/,"");
const ar=()=>S.lang==="ar";
const fmtTime=d=>new Date(d).toLocaleTimeString(S.lang,{hour:"2-digit",minute:"2-digit"});
function fmtAgo(d){const t=new Date(d),n=new Date(),df=Math.round((sod(n)-sod(t))/DAY);if(df<=0)return fmtTime(t);if(df===1)return ar()?"أمس":"Yesterday";if(df<7)return t.toLocaleDateString(S.lang,{weekday:"short"});return t.toLocaleDateString(S.lang,{day:"numeric",month:"short"})}
function dayLabel(d){const df=Math.round((sod(new Date())-sod(new Date(d)))/DAY);if(df<=0)return ar()?"اليوم":"Today";if(df===1)return ar()?"أمس":"Yesterday";return new Date(d).toLocaleDateString(S.lang,{weekday:"long",day:"numeric",month:"long"})}
const grpAv=n=>h("div",{class:"cav gav",style:"width:"+n+"px;height:"+n+"px"},ic("users",{s:Math.round(n*.5)}));

async function chatList(v){
 if(!SC.user){v.append(h("div",{class:"card cempty"},ic("lock",{s:30}),h("div",{class:"meta"},"سجّل الدخول لتراسل الباحثين."),h("button",{class:"pri",onclick:authModal},"دخول / تسجيل")));return}
 const canNotif=("Notification" in window&&Notification.permission==="default");
 v.append(h("div",{class:"cquick",style:"--n:"+(canNotif?3:2)},
  h("button",{class:"qtile",onclick:newGroupModal},h("i",{},ic("users")),h("span",{},"مجموعة بحثية جديدة")),
  h("button",{class:"qtile",onclick:discoverModal},h("i",{},ic("compass")),h("span",{},"اكتشف مجموعات")),
  canNotif?h("button",{class:"qtile",onclick:async()=>{await Notification.requestPermission();render()}},h("i",{},ic("bell")),h("span",{},"فعّل الإشعارات")):null));
 const box=h("div",{class:"clist"});v.append(box);
 const {data,error}=await SC.sb.from("members").select("conversations(id,kind,title,last_at)").eq("user_id",SC.user.id);
 if(error)return box.append(h("div",{class:"card"},ic("alert"),error.message));
 const cs=(data||[]).map(x=>x.conversations).filter(Boolean).sort((a,b)=>new Date(b.last_at)-new Date(a.last_at)),peer={},dm=cs.filter(c=>c.kind==="dm").map(c=>c.id);
 if(dm.length)((await SC.sb.from("members").select("conv_id,profiles(id,username,name,avatar_url)").in("conv_id",dm).neq("user_id",SC.user.id)).data||[]).forEach(x=>peer[x.conv_id]=x.profiles);
 if(!cs.length)box.append(h("div",{class:"cempty"},ic("message",{s:34}),h("b",{},"لا محادثات بعد"),h("div",{class:"meta"},"افتح صفحة باحث واضغط «راسل»، أو أنشئ مجموعة.")));
 cs.forEach(c=>{const p=c.kind==="dm"?peer[c.id]:null,name=p?(p.name||p.username):c.title;if(p&&SC.blocked.has(p.id))return;const n=SC.unread&&SC.unread[c.id]||0;
  box.append(h("button",{class:"crow"+(n?" unread":""),onclick:()=>openChat(c.id,(p?"":"👥 ")+name)},p?av(p,48):grpAv(48),
   h("div",{class:"cmain"},h("b",{dir:"auto"},name),h("span",{class:"meta"},p?(ar()?"محادثة خاصة":"Direct message"):(ar()?"مجموعة بحثية":"Research group"))),
   h("div",{class:"cside"},h("time",{class:"ctime"},fmtAgo(c.last_at)),n?h("span",{class:"dot2"},n>99?"99+":String(n)):null)))})}

async function chatRoom(v){
 if(!SC.user){SC.view="feed";return authModal()}
 document.body.classList.add("inchat");
 let peer=null,peerRead=0;const cid=SC.cid,P={},seen=new Set(),isG=isGrp(SC.cname),title=cleanName(SC.cname),list=h("div",{class:"msgs no-swipe",role:"log","aria-live":"polite"}),
  inp=h("input",{class:"cin cmsg",placeholder:"اكتب رسالة…",maxlength:"2000",enterkeyhint:"send",autocomplete:"off"}),
  sendB=h("button",{class:"sendb dis","aria-label":"إرسال",title:"إرسال"},ic("send")),subEl=h("span",{class:"csub"},isG?"":(ar()?"محادثة خاصة":"Direct message"));
 if(window.xMention)xMention(inp);
 let prev=null,lastDay="";                                  // آخر رسالة معروضة (لتجميع الرسائل المتتالية)
 // ---- v20: الرد على رسالة محددة (اقتباس) ----
 let replyTo=null;const MSG={},QC={},X=(k,o)=>window.xt?xt(k,o):k;
 const snip=o=>o?(o.body?o.body.replace(/\s+/g," ").slice(0,140):(o.file_type||"").startsWith("image/")?"🖼 "+X("photo"):"📎 "+(o.file_name||X("file"))):"";
 const nameOf=u=>u===SC.user.id?X("you"):((P[u]&&P[u].name)||"…");
 const rbar=h("div",{class:"replybar",hidden:true});
 const clearReply=()=>{replyTo=null;rbar.hidden=true;rbar.replaceChildren()};
 const setReply=m=>{replyTo=m;rbar.hidden=false;rbar.replaceChildren(ic("reply"),h("div",{class:"rtxt"},h("b",{dir:"auto"},X("replyingTo",{name:nameOf(m.user_id)})),h("span",{dir:"auto"},snip(m))),
  h("button",{class:"ibtn",type:"button","aria-label":X("cancelReply"),title:X("cancelReply"),onclick:clearReply},ic("x")));inp.focus()};
 const jumpTo=id=>{const row=list.querySelector('[data-mid="'+id+'"]');
  if(row){row.scrollIntoView({block:"center",behavior:"smooth"});row.classList.remove("flash");void row.offsetWidth;row.classList.add("flash");setTimeout(()=>row.classList.remove("flash"),1900);return}
  if((SC.chatLimit||100)>=1000)return toast(X("origFar"));SC.jump=id;SC.chatLimit=1000;render()};
 const fillQuote=(el,m)=>{const paint=o=>{el.classList.toggle("gone",!o);el.replaceChildren(h("b",{dir:"auto"},o?nameOf(o.user_id):""),h("span",{dir:"auto"},o?snip(o):X("deletedMsg")))};
  if(MSG[m.reply_to])return paint(MSG[m.reply_to]);
  (QC[m.reply_to]=QC[m.reply_to]||SC.sb.from("messages").select("id,user_id,body,file_name,file_type").eq("id",m.reply_to).eq("conv_id",cid).maybeSingle().then(r=>r.data||null,()=>null)).then(paint)};
 const quoteEl=m=>{if(!m.reply_to)return null;const el=h("button",{class:"mquote",type:"button","aria-label":X("goOriginal"),title:X("goOriginal"),onclick:()=>el.classList.contains("gone")?toast(X("deletedMsg")):jumpTo(m.reply_to)},h("span",{},"…"));fillQuote(el,m);return el};
 const near=()=>list.scrollHeight-list.scrollTop-list.clientHeight<140,toEnd=()=>{list.scrollTop=list.scrollHeight};
 const who=id=>P[id]||(P[id]={name:"…"});
 const tickFor=m=>!isG&&peerRead&&new Date(m.created_at).getTime()<=peerRead?"seen":"sent";
 const paintTick=(el,m)=>{const k=tickFor(m);el.className="tick "+k;el.replaceChildren(ic(k==="seen"?"checks":"check",{w:2.2}));el.setAttribute("aria-label",k==="seen"?(ar()?"تمت القراءة":"Seen"):(ar()?"أُرسلت":"Sent"))};
 const ticks=[];
 const add=m=>{if(seen.has(m.id))return;seen.add(m.id);MSG[m.id]=m;const me=m.user_id===SC.user.id;if(!me&&SC.blocked.has(m.user_id))return;
  if(!me&&!P[m.user_id]){P[m.user_id]={name:"…"};SC.sb.from("profiles").select("name,username,avatar_url").eq("id",m.user_id).maybeSingle().then(r=>{const d=r.data;P[m.user_id]=d?{name:d.name||d.username,username:d.username,avatar_url:d.avatar_url}:{name:"?"};list.querySelectorAll('[data-u="'+m.user_id+'"] .mname').forEach(e=>e.textContent=P[m.user_id].name);list.querySelectorAll('[data-u="'+m.user_id+'"] .mav').forEach(e=>e.replaceChildren(av(P[m.user_id],30)))})}
  const stick=near()||me,day=dkey(new Date(m.created_at));
  if(day!==lastDay){lastDay=day;list.append(h("div",{class:"dsep"},h("span",{},dayLabel(m.created_at))));prev=null}
  const cont=prev&&prev.u===m.user_id&&(new Date(m.created_at)-prev.t)<5*60000;
  if(prev&&cont)prev.el.classList.remove("last");
  const tro=h("div",{class:"trout",dir:"auto"}),pf=who(m.user_id),tk=me?h("span",{class:"tick"}):null,fb=fileBox(m);if(tk){paintTick(tk,m);ticks.push([tk,m])}
  const tb=m.body?trBtn(()=>m.body,tro,"flag"):null;if(tb){tb.setAttribute("aria-label","ترجمة");tb.title="ترجمة"}
  const rb=h("button",{class:"flag rbtn",type:"button","aria-label":X("reply"),title:X("reply"),onclick:()=>setReply(m)},ic("reply"));
  const rp=me?null:h("button",{class:"flag","aria-label":"إبلاغ",title:"إبلاغ",onclick:()=>reportModal({message_id:m.id,target_user:m.user_id})},ic("flag"));
  const row=h("div",{class:"mrow"+(me?" me":"")+(cont?"":" first")+" last","data-u":m.user_id,"data-mid":m.id},
   me?null:h("div",{class:"mav"},av(pf,30)),
   h("div",{class:"bub"},(!me&&isG)?h("div",{class:"mname",dir:"auto"},pf.name):null,
    quoteEl(m),m.body?h("div",{class:"mtxt",dir:"auto"},window.mentionize?mentionize(m.body):m.body):null,tro,fb,
    h("div",{class:"mmeta"},rb,tb,rp,h("time",{},fmtTime(m.created_at)),tk)));
  list.append(row);prev={u:m.user_id,t:new Date(m.created_at),el:row};
  const im=row.querySelector("img.cimg");if(im)im.addEventListener("load",()=>{if(stick)toEnd()});
  if(stick)toEnd()};
 const send=async()=>{const b=inp.value.trim();if(!b)return;inp.value="";sendB.classList.add("dis");const row={conv_id:cid,user_id:SC.user.id,body:b};if(replyTo)row.reply_to=replyTo.id;
  let r=await SC.sb.from("messages").insert(row);
  if(r.error&&row.reply_to&&/reply_to/i.test(r.error.message||"")&&/column|schema cache/i.test(r.error.message||"")){delete row.reply_to;r=await SC.sb.from("messages").insert(row);if(!r.error)toast(X("needMigration"))}
  if(r.error){toast(/reply target/i.test(r.error.message||"")?X("replyGone"):X("sendFail"));if(/reply target/i.test(r.error.message||""))clearReply();inp.value=b;sendB.classList.remove("dis")}else clearReply()};
 inp.onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)send();else if(e.key==="Escape"&&replyTo)clearReply()};inp.oninput=()=>sendB.classList.toggle("dis",!inp.value.trim());sendB.onclick=send;
 {let sx=0,sy=0,row=null,on=false,dx=0;
  list.addEventListener("touchstart",e=>{row=e.touches.length===1?e.target.closest(".mrow[data-mid]"):null;if(!row)return;sx=e.touches[0].clientX;sy=e.touches[0].clientY;on=false;dx=0},{passive:true});
  list.addEventListener("touchmove",e=>{if(!row)return;const x=e.touches[0].clientX-sx,y=e.touches[0].clientY-sy;
   if(!on){if(Math.abs(x)>14&&Math.abs(x)>Math.abs(y)*1.6){on=true;row.style.transition="none"}else if(Math.abs(y)>14){row=null;return}}
   if(on){dx=Math.max(-90,Math.min(90,x));row.style.transform="translateX("+dx+"px)"}},{passive:true});
  const end=()=>{if(!row)return;row.style.transition="";row.style.transform="";if(on&&Math.abs(dx)>=60&&MSG[row.dataset.mid])setReply(MSG[row.dataset.mid]);row=null;on=false};
  list.addEventListener("touchend",end);list.addEventListener("touchcancel",end)}
 const fi=h("input",{type:"file",style:"display:none",accept:"image/jpeg,image/png,image/webp,.pdf,.txt,.csv,.docx,.xlsx",onchange:e=>{const f=e.target.files[0];e.target.value="";if(f)sendFile(cid,f,inp,replyTo&&replyTo.id).then(ok=>{if(ok)clearReply()})}});
 // قائمة الخيارات (حظر / إضافة عضو / مغادرة) — نفس الإجراءات القديمة في مكان ثابت واحد
 const menu=h("div",{class:"cmenu",hidden:true,role:"menu"}),closeMenu=()=>{menu.hidden=true;document.removeEventListener("click",outside,true)},
  outside=e=>{if(!menu.contains(e.target)&&!moreB.contains(e.target))closeMenu()};
 const mi=(icon,label,fn,danger)=>h("button",{class:"mitem"+(danger?" danger":""),role:"menuitem",onclick:()=>{closeMenu();fn()}},ic(icon),label);
 const moreB=h("button",{class:"ibtn","aria-label":"خيارات",title:"خيارات","aria-haspopup":"menu",onclick:()=>{if(menu.hidden){menu.hidden=false;setTimeout(()=>document.addEventListener("click",outside,true),0)}else closeMenu()}},ic("more"));
 if(!isG)menu.append(mi("ban","حظر هذا المستخدم",async()=>{if(!peer||!confirm("حظر هذا المستخدم؟"))return;const r=await SC.sb.from("blocks").insert({blocker:SC.user.id,blocked:peer});if(r.error)return toast(r.error.message);SC.blocked.add(peer);SC.view="chats";render()},true));
 else{menu.append(mi("user-plus","إضافة عضو",async()=>{const u=prompt("اسم المستخدم لإضافته (للمشرف فقط):");if(!u)return;const r=await SC.sb.rpc("add_member",{cid,uname:u});toast(r.error?r.error.message:"✅ تمت الإضافة")}),
  mi("logout","مغادرة المجموعة",async()=>{if(confirm("مغادرة المجموعة؟")){await SC.sb.from("members").delete().match({conv_id:cid,user_id:SC.user.id});SC.view="chats";render()}},true))}
 const showCall=!isG&&!(window.APP&&APP.pilot),hAv=h("div",{class:"hav"},isG?grpAv(40):h("div",{class:"cav",style:"width:40px;height:40px"},"…"));
 v.append(h("section",{class:"chatwrap"},
  h("header",{class:"chead"},h("button",{class:"ibtn back","aria-label":"رجوع",title:"رجوع",onclick:()=>{SC.view="chats";render()}},ic("arrow-right",{cls:"flip"})),hAv,
   h("div",{class:"ctitle"},h("b",{dir:"auto"},title),subEl),
   h("div",{class:"cops"},showCall?h("button",{class:"ibtn","aria-label":"مكالمة صوتية",title:"مكالمة صوتية",onclick:()=>startCall(cid,SC.cname,false)},ic("phone")):null,
    showCall?h("button",{class:"ibtn","aria-label":"مكالمة فيديو",title:"مكالمة فيديو",onclick:()=>startCall(cid,SC.cname,true)},ic("video")):null,moreB),menu),
  list,rbar,
  h("div",{class:"composer"},h("button",{class:"ibtn att","aria-label":"إرفاق ملف",title:"إرفاق ملف",onclick:()=>fi.click()},ic("paperclip")),fi,inp,sendB)));
 const ms=((await SC.sb.from("members").select("profiles(id,name,username,avatar_url)").eq("conv_id",cid)).data||[]);
 ms.forEach(x=>{const q=x.profiles;if(q){P[q.id]={name:q.name||q.username,username:q.username,avatar_url:q.avatar_url};if(q.id!==SC.user.id)peer=q.id}});
 if(isG)subEl.textContent=ms.length+(ar()?" عضو":" members");else if(peer&&P[peer]){hAv.replaceChildren(av(P[peer],40))}
 // حالة القراءة (علامتان) للمحادثات الخاصة: قراءة فقط من members.last_read إن وُجد؛ أي فشل يُتجاهل ويبقى الظاهر «أُرسلت»
 const readState=async()=>{if(isG||!peer)return;try{const r=await SC.sb.from("members").select("last_read").eq("conv_id",cid).eq("user_id",peer).maybeSingle();const t=r&&r.data&&r.data.last_read?new Date(r.data.last_read).getTime():0;if(t!==peerRead){peerRead=t;ticks.forEach(([e,m])=>paintTick(e,m))}}catch(e){}};
 const {data}=await SC.sb.from("messages").select("*").eq("conv_id",cid).order("created_at",{ascending:false}).limit(SC.chatLimit||100);await readState();(data||[]).reverse().forEach(add);markRead(cid);toEnd();
 if(SC.jump){const j=SC.jump;SC.jump=null;setTimeout(()=>jumpTo(j),80)}
 stopChat();document.body.classList.add("inchat");_rt=setInterval(readState,15000);
 _ch=SC.sb.channel("room-"+cid).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:"conv_id=eq."+cid},p=>{add(p.new);markRead(cid);readState()}).subscribe()}
function newGroupModal(){const ti=h("input",{class:"cin",placeholder:"اسم المجموعة: مثال، بحث التكيّف المناخي",maxlength:"80"}),pub=h("input",{type:"checkbox",checked:true});
 const m=modal(h("h3",{},"👥 مجموعة بحثية جديدة"),ti,h("label",{class:"meta",style:"display:flex;gap:6px;align-items:center"},pub,"عامة: يستطيع أي باحث اكتشافها والانضمام"),
  h("button",{class:"pri",onclick:async()=>{if(!ti.value.trim())return toast("اكتب اسمًا");const r=await SC.sb.rpc("create_group",{ttl:ti.value.trim(),pub:pub.checked});if(r.error)return toast(r.error.message);m.remove();openChat(r.data,"👥 "+ti.value.trim())}},"إنشاء"),cancelB({remove:()=>m.remove()}))}
async function discoverModal(){const box=h("div",{},"⏳"),m=modal(h("h3",{},"🔎 مجموعات عامة"),box,cancelB({remove:()=>m.remove()}));
 const {data,error}=await SC.sb.from("conversations").select("id,title").eq("kind","group").eq("is_public",true).order("last_at",{ascending:false}).limit(30);
 box.replaceChildren(...(error?[h("div",{},"⚠ "+error.message)]:(data&&data.length?data:[]).map(g=>h("div",{class:"btns",style:"align-items:center"},h("b",{dir:"auto",style:"flex:1"},g.title),
  h("button",{class:"btn",onclick:async()=>{const r=await SC.sb.rpc("join_group",{cid:g.id});if(r.error)return toast(r.error.message);m.remove();openChat(g.id,"👥 "+g.title)}},"انضم")))));
 if(!error&&!(data||[]).length)box.textContent="لا مجموعات عامة بعد."}

function reportModal(t0){if(!SC.user)return authModal();
 const sel=h("select",{class:"cin"},["spam: رسائل مزعجة أو إعلانات","abuse: إساءة أو تحرّش","unsafe: محتوى غير لائق أو خطير","fake: انتحال أو معلومات مضلّلة","other: سبب آخر"].map(x=>h("option",{value:x.split(":")[0]},x.split(":")[1].trim())));
 const m=modal(h("h3",{},"🚩 إبلاغ"),sel,h("button",{class:"pri",onclick:async()=>{const r=await SC.sb.from("reports").insert(Object.assign({user_id:SC.user.id,reason:sel.value},t0));
  if(r.error)return toast(r.error.message);m.remove();toast("🚩 شكرًا، وصل بلاغك وسنراجعه")}},"إرسال البلاغ"),cancelB({remove:()=>m.remove()}))}

// ---- الرسائل غير المقروءة والإشعارات ----
let _nch=null;
const unreadTotal=()=>Object.values(SC.unread||{}).reduce((a,b)=>a+b,0);
function paintDot(){const i=TABS.findIndex(x=>x[0]==="com"),b=$("tabs").children[i];if(!b)return;const o=b.querySelector(".dot");if(o)o.remove();const n=unreadTotal();if(n)b.append(h("span",{class:"dot"},n>99?"99+":n))}
const _bt=buildTabs;buildTabs=function(){_bt();paintDot()};
const markRead=async cid=>{SC.unread=SC.unread||{};SC.unread[cid]=0;paintDot();await SC.sb.rpc("mark_read",{cid})};
async function refreshUnread(){SC.unread={};if(SC.user)((await SC.sb.rpc("unread_counts")).data||[]).forEach(x=>SC.unread[x.conv_id]=Number(x.n));paintDot()}
function startNotif(){if(_nch){SC.sb.removeChannel(_nch);_nch=null}if(!SC.user){SC.unread={};paintDot();return}refreshUnread();
 _nch=SC.sb.channel("inbox").on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},async p=>{const m=p.new;if(m.user_id===SC.user.id||SC.blocked.has(m.user_id))return;
  if(S.tab==="com"&&SC.view==="chat"&&SC.cid===m.conv_id&&!document.hidden)return;
  SC.unread[m.conv_id]=(SC.unread[m.conv_id]||0)+1;paintDot();if(S.tab==="com"&&SC.view==="chats")render();
  const pr=(await SC.sb.from("profiles").select("name,username").eq("id",m.user_id).maybeSingle()).data,txt="💬 "+(pr?(pr.name||pr.username):"")+": "+(m.body||"📎 ملف").slice(0,80);
  if(document.hidden&&window.Notification&&Notification.permission==="granted"){try{const reg=await navigator.serviceWorker.getRegistration();reg?reg.showNotification("7salah-scholar",{body:txt,icon:"icon-192.png",tag:"msg-"+m.conv_id}):new Notification("7salah-scholar",{body:txt})}catch(e){}}
  else toast(txt)}).subscribe()}
try{if(window.SUPA&&SUPA.url&&SUPA.key&&Object.keys(localStorage).some(k=>/^sb-.*-auth-token$/.test(k)))setTimeout(()=>loadSb().catch(()=>{}),1500)}catch(e){}

// ---- صور وملفات في الدردشة ----
const fitImg=(f,mx)=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const k=Math.min(1,mx/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext("2d").drawImage(i,0,0,c.width,c.height);c.toBlob(ok,"image/jpeg",.85)};i.onerror=no;i.src=URL.createObjectURL(f)});
async function sendFile(cid,f,inp,replyId){if(f.size>10*1048576){toast("الحد الأقصى للملف 10 ميغابايت");return false}toast("⏳ جارٍ الرفع…");
 try{let blob=f,type=f.type,ext=(f.name.split(".").pop()||"bin").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,5)||"bin";
  if(/^image\/(jpeg|png|webp)$/.test(f.type)){blob=await fitImg(f,1600);type="image/jpeg";ext="jpg"}
  const path=cid+"/"+crypto.randomUUID()+"."+ext,up=await SC.sb.storage.from("chat").upload(path,blob,{contentType:type});if(up.error){toast(up.error.message);return false}
  const row={conv_id:cid,user_id:SC.user.id,body:inp.value.trim()||null,file_path:path,file_name:f.name.slice(0,100),file_type:type,file_size:blob.size};if(replyId)row.reply_to=replyId;
  let r=await SC.sb.from("messages").insert(row);
  if(r.error&&row.reply_to&&/reply_to/i.test(r.error.message||"")&&/column|schema cache/i.test(r.error.message||"")){delete row.reply_to;r=await SC.sb.from("messages").insert(row);if(!r.error&&window.xt)toast(xt("needMigration"))}
  if(r.error){toast("تعذّر الإرسال");return false}inp.value="";return true}catch(e){toast("⚠ تعذّر رفع الملف");return false}}
function fileBox(m){if(!m.file_path)return null;const b=m.file_size,sz=b?" ("+(b>1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB")+")":"";
 const url=()=>SC.sb.storage.from("chat").createSignedUrl(m.file_path,3600).then(r=>r.data&&r.data.signedUrl);
 if((m.file_type||"").startsWith("image/")){const img=h("img",{class:"cimg",alt:"",loading:"lazy"});url().then(u=>{if(u)img.src=u});img.onclick=async()=>{const u=await url();if(u)window.open(u,"_blank","noopener")};return img}
 return h("button",{class:"fbox",onclick:async()=>{const u=await url();u?window.open(u,"_blank","noopener"):toast("تعذّر فتح الملف")}},h("i",{},ic("file-text")),h("span",{class:"fname"},h("span",{dir:"auto"},m.file_name||"ملف"),sz?h("small",{dir:"ltr"},sz.replace(/[()]/g,"").trim()):null))}
