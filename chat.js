// الدردشة المباشرة والمجموعات (Supabase Realtime). يُحمَّل بعد social.js.
let _ch=null;
function stopChat(){if(_ch&&SC.sb){SC.sb.removeChannel(_ch);_ch=null}}
function openChat(id,name){SC.view="chat";SC.cid=id;SC.cname=name;render();window.scrollTo(0,0)}
async function chatList(v){
 if(!SC.user){v.append(h("div",{class:"card"},h("div",{class:"meta"},"سجّل الدخول لتراسل الباحثين."),h("button",{class:"pri",onclick:authModal},"دخول / تسجيل")));return}
 v.append(h("div",{class:"btns",style:"padding:0 16px"},h("button",{class:"btn",onclick:newGroupModal},"＋ مجموعة بحثية"),h("button",{class:"btn",onclick:discoverModal},"🔎 اكتشف مجموعات"),("Notification" in window&&Notification.permission==="default")?h("button",{class:"btn",onclick:async()=>{await Notification.requestPermission();render()}},"🔔 فعّل الإشعارات"):null));
 const box=h("div",{});v.append(box);
 const {data,error}=await SC.sb.from("members").select("conversations(id,kind,title,last_at)").eq("user_id",SC.user.id);
 if(error)return box.append(h("div",{class:"card"},"⚠ "+error.message));
 const cs=(data||[]).map(x=>x.conversations).filter(Boolean).sort((a,b)=>new Date(b.last_at)-new Date(a.last_at)),peer={},dm=cs.filter(c=>c.kind==="dm").map(c=>c.id);
 if(dm.length)((await SC.sb.from("members").select("conv_id,profiles(id,username,name,avatar_url)").in("conv_id",dm).neq("user_id",SC.user.id)).data||[]).forEach(x=>peer[x.conv_id]=x.profiles);
 if(!cs.length)box.append(h("div",{class:"meta",style:"text-align:center;padding:20px"},"لا محادثات بعد. افتح صفحة باحث واضغط «راسل»، أو أنشئ مجموعة."));
 cs.forEach(c=>{const p=c.kind==="dm"?peer[c.id]:null,name=p?(p.name||p.username):c.title;if(p&&SC.blocked.has(p.id))return;
  box.append(h("div",{class:"card phd",onclick:()=>openChat(c.id,(p?"":"👥 ")+name)},p?av(p,42):h("div",{class:"cav",style:"width:42px;height:42px;font-size:20px"},"👥"),h("b",{dir:"auto",style:"flex:1"},name),SC.unread&&SC.unread[c.id]?h("span",{class:"dot2"},SC.unread[c.id]):null))})}
async function chatRoom(v){
 if(!SC.user){SC.view="feed";return authModal()}
 let peer=null;const cid=SC.cid,names={},seen=new Set(),list=h("div",{class:"msgs"}),inp=h("input",{class:"cin",placeholder:"اكتب رسالة…",maxlength:"2000"});
 const add=m=>{if(seen.has(m.id))return;seen.add(m.id);const me=m.user_id===SC.user.id;if(!me&&SC.blocked.has(m.user_id))return;
  if(!me&&!names[m.user_id]){names[m.user_id]="…";SC.sb.from("profiles").select("name,username").eq("id",m.user_id).maybeSingle().then(r=>{names[m.user_id]=r.data?(r.data.name||r.data.username):"?"})}
  const tro=h("div",{class:"trout",dir:"auto"});list.append(h("div",{class:"msg2"+(me?" me":"")},me?null:h("div",{class:"meta",style:"font-weight:700"},names[m.user_id]),m.body?h("div",{dir:"auto",style:"white-space:pre-wrap"},m.body):null,tro,fileBox(m),h("div",{class:"meta"},new Date(m.created_at).toLocaleTimeString(S.lang,{hour:"2-digit",minute:"2-digit"})),m.body?trBtn(()=>m.body,tro,"flag"):null,me?null:h("button",{class:"flag",onclick:()=>reportModal({message_id:m.id,target_user:m.user_id})},"🚩")));list.scrollTop=list.scrollHeight};
 const send=async()=>{const b=inp.value.trim();if(!b)return;inp.value="";const r=await SC.sb.from("messages").insert({conv_id:cid,user_id:SC.user.id,body:b});if(r.error){toast("تعذّر الإرسال (قد يكون هناك حظر بينكما)");inp.value=b}};
 inp.onkeydown=e=>{if(e.key==="Enter")send()};
 const fi=h("input",{type:"file",style:"display:none",accept:"image/jpeg,image/png,image/webp,.pdf,.txt,.csv,.docx,.xlsx",onchange:e=>{const f=e.target.files[0];e.target.value="";if(f)sendFile(cid,f,inp)}});
 const isG=(SC.cname||"").startsWith("👥");
 v.append(h("div",{class:"card"},h("div",{class:"btns",style:"margin:0;align-items:center"},h("button",{class:"btn",onclick:()=>{SC.view="chats";render()}},"→"),h("b",{dir:"auto",style:"flex:1"},SC.cname||""),
  !isG?h("button",{class:"btn",onclick:()=>startCall(cid,SC.cname,false)},"📞"):null,!isG?h("button",{class:"btn",onclick:()=>startCall(cid,SC.cname,true)},"🎥"):null,
  !isG?h("button",{class:"btn",onclick:async()=>{if(!peer||!confirm("حظر هذا المستخدم؟"))return;const r=await SC.sb.from("blocks").insert({blocker:SC.user.id,blocked:peer});if(r.error)return toast(r.error.message);SC.blocked.add(peer);SC.view="chats";render()}},"🚫"):null,
  isG?h("button",{class:"btn",onclick:async()=>{const u=prompt("اسم المستخدم لإضافته (للمشرف فقط):");if(!u)return;const r=await SC.sb.rpc("add_member",{cid,uname:u});toast(r.error?r.error.message:"✅ تمت الإضافة")}},"＋"):null,
  isG?h("button",{class:"btn",onclick:async()=>{if(confirm("مغادرة المجموعة؟")){await SC.sb.from("members").delete().match({conv_id:cid,user_id:SC.user.id});SC.view="chats";render()}}},"🚪"):null)),
  list,h("div",{class:"btns",style:"padding:0 16px"},h("button",{class:"btn",onclick:()=>fi.click()},"📎"),fi,inp,h("button",{class:"btn",onclick:send},"إرسال")));
 ((await SC.sb.from("members").select("profiles(id,name,username)").eq("conv_id",cid)).data||[]).forEach(x=>{if(x.profiles){names[x.profiles.id]=x.profiles.name||x.profiles.username;if(x.profiles.id!==SC.user.id)peer=x.profiles.id}});
 const {data}=await SC.sb.from("messages").select("*").eq("conv_id",cid).order("created_at",{ascending:false}).limit(100);(data||[]).reverse().forEach(add);markRead(cid);
 stopChat();_ch=SC.sb.channel("room-"+cid).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:"conv_id=eq."+cid},p=>{add(p.new);markRead(cid)}).subscribe()}
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
async function sendFile(cid,f,inp){if(f.size>10*1048576)return toast("الحد الأقصى للملف 10 ميغابايت");toast("⏳ جارٍ الرفع…");
 try{let blob=f,type=f.type,ext=(f.name.split(".").pop()||"bin").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,5)||"bin";
  if(/^image\/(jpeg|png|webp)$/.test(f.type)){blob=await fitImg(f,1600);type="image/jpeg";ext="jpg"}
  const path=cid+"/"+crypto.randomUUID()+"."+ext,up=await SC.sb.storage.from("chat").upload(path,blob,{contentType:type});if(up.error)return toast(up.error.message);
  const r=await SC.sb.from("messages").insert({conv_id:cid,user_id:SC.user.id,body:inp.value.trim()||null,file_path:path,file_name:f.name.slice(0,100),file_type:type,file_size:blob.size});
  if(r.error)return toast("تعذّر الإرسال");inp.value=""}catch(e){toast("⚠ تعذّر رفع الملف")}}
function fileBox(m){if(!m.file_path)return null;const b=m.file_size,sz=b?" ("+(b>1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB")+")":"";
 const url=()=>SC.sb.storage.from("chat").createSignedUrl(m.file_path,3600).then(r=>r.data&&r.data.signedUrl);
 if((m.file_type||"").startsWith("image/")){const img=h("img",{class:"cimg",alt:"",loading:"lazy"});url().then(u=>{if(u)img.src=u});img.onclick=async()=>{const u=await url();if(u)window.open(u,"_blank","noopener")};return img}
 return h("button",{class:"btn",onclick:async()=>{const u=await url();u?window.open(u,"_blank","noopener"):toast("تعذّر فتح الملف")}},"📎 "+(m.file_name||"ملف")+sz)}
