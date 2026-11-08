// صيغ المنشورات الجديدة: مرفق / لوحة / خريطة. يُحمَّل بعد rank.js.
const KN={post:"💬 منشور",question:"❓ سؤال",deck:"🃏 حزمة",attachment:"📎 مرفق",board:"🖼 لوحة",map:"🗺 خريطة"};
const pubUrl=p=>SC.sb.storage.from("posts").getPublicUrl(p).data.publicUrl;
const fmtSz=n=>n>52428800?(n/1073741824).toFixed(2)+" GB":n>1048576?(n/1048576).toFixed(1)+" MB":Math.max(1,Math.round(n/1024))+" KB";

// ضغط الفيديو داخل المتصفح (720p، WebM) ليتّسع في حدّ 50MB. يعمل بزمن الفيديو تقريبًا ولا يُرسل شيئًا لأي جهة.
async function compressVideo(f,maxBytes,onp){
 if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw new Error("unsupported");
 const mt=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(t=>MediaRecorder.isTypeSupported(t));if(!mt)throw new Error("unsupported");
 const url=URL.createObjectURL(f),v=document.createElement("video");v.src=url;v.playsInline=true;v.preload="auto";
 let ac;try{
  await new Promise((ok,no)=>{v.onloadedmetadata=ok;v.onerror=()=>no(new Error("read"))});
  const dur=v.duration;if(!isFinite(dur)||dur<=0)throw new Error("read");
  const H=Math.min(720,v.videoHeight),W=Math.round(v.videoWidth*H/v.videoHeight/2)*2,cv=document.createElement("canvas");cv.width=W;cv.height=H;const cx=cv.getContext("2d");
  const ab=96000,vb=Math.max(250000,Math.min(2500000,Math.floor((maxBytes*0.9*8)/dur)-ab));
  if((vb+ab)*dur/8>maxBytes)throw new Error("long");
  const out=cv.captureStream(30);ac=new (window.AudioContext||window.webkitAudioContext)();const src=ac.createMediaElementSource(v),dst=ac.createMediaStreamDestination();src.connect(dst);dst.stream.getAudioTracks().forEach(t=>out.addTrack(t));
  const rec=new MediaRecorder(out,{mimeType:mt,videoBitsPerSecond:vb,audioBitsPerSecond:ab}),ch=[];rec.ondataavailable=e=>{if(e.data.size)ch.push(e.data)};
  const done=new Promise(ok=>{rec.onstop=ok});let run=true;
  const draw=()=>{if(!run)return;cx.drawImage(v,0,0,W,H);onp&&onp(Math.min(99,Math.round(v.currentTime/dur*100)));requestAnimationFrame(draw)};
  v.onended=()=>{run=false;rec.stop()};await ac.resume();rec.start(1000);await v.play();draw();await done;
  return new Blob(ch,{type:"video/webm"});
 }finally{URL.revokeObjectURL(url);try{ac&&ac.close()}catch(_){}}}
const shrink=(f,max)=>new Promise((ok,no)=>{const i=new Image(),u=URL.createObjectURL(f);i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext("2d").drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?ok(b):no(new Error("img")),"image/jpeg",.85)};i.onerror=()=>no(new Error("img"));i.src=u});
{const _pc=postCard;postCard=function(p,l){const c=_pc(p,l);const bd=c.querySelector(".badge");if(bd&&KN[p.kind])bd.textContent=KN[p.kind];let m=null;
 if(p.file_path){const u=pubUrl(p.file_path);if(okU(u))m=/^video\//.test(p.file_type||"")?h("video",{src:u,controls:"controls",preload:"metadata",style:"width:100%;max-height:360px"}):p.kind==="board"?h("img",{class:"board",src:u,alt:p.title,loading:"lazy",onclick:()=>window.open(u,"_blank","noopener")}):h("div",{class:"btns"},h("a",{class:"btn",href:u,target:"_blank",rel:"noopener noreferrer"},"📎 "+(p.file_name||"ملف")+(p.file_size?" · "+fmtSz(p.file_size):"")))}
 if(p.kind==="map"&&p.lat!=null&&p.lng!=null){const d=.01,la=+p.lat,ln=+p.lng;m=h("div",{},p.place?h("div",{class:"meta",dir:"auto"},"📍 "+p.place):null,
  h("iframe",{class:"mapf",src:"https://www.openstreetmap.org/export/embed.html?bbox="+[ln-d,la-d,ln+d,la+d].join(",")+"&layer=mapnik&marker="+la+","+ln,loading:"lazy",referrerpolicy:"no-referrer",title:"map"}),
  h("div",{class:"btns"},h("a",{class:"btn",href:"https://www.openstreetmap.org/?mlat="+la+"&mlon="+ln+"#map=15/"+la+"/"+ln,target:"_blank",rel:"noopener noreferrer"},"🗺 افتح الخريطة")))}
 if(p.kind==="deck")m=deckPanel(p);
 if(m){const t=c.querySelector(".trout");c.insertBefore(m,t)}return c}}
// ===== مشاركة حزم البطاقات داخل المنشورات =====
const DK_CACHE={};
function deckPanel(p){
 const box=h("div",{class:"card",style:"padding:12px;margin:8px 0;border:1px dashed rgba(128,128,128,.5)"},h("div",{class:"meta"},"⏳ تحميل الحزمة…"));
 (async()=>{try{
  let o=DK_CACHE[p.id];
  if(!o){const r=await SC.sb.from("post_decks").select("data,n").eq("post_id",p.id).maybeSingle();if(r.error||!r.data)throw 0;o=await unpack(r.data.data);
   if(!o||!Array.isArray(o.c))throw 0;o.c=o.c.slice(0,60).filter(x=>x&&typeof x==="object");if(!o.c.length)throw 0;o.k="d";DK_CACHE[p.id]=o}
  const cnt=h("span",{}),oo=Object.assign({},o,{onSave:()=>deckAdded(p,cnt)}),cards=o.c.map(unslim),src=cards.filter(c=>c.src&&(c.src.d||c.src.u)).length;
  box.replaceChildren(
   h("div",{style:"display:flex;gap:10px;align-items:center"},h("span",{style:"font-size:34px"},String(o.e||"📘").slice(0,4)),
    h("div",{},h("b",{dir:"auto"},String(o.t||p.title).slice(0,120)),h("div",{class:"meta"},"🃏 "+cards.length+" بطاقة"+(src?" · 📚 "+src+" موثّقة بمصدر":""),cnt))),
   h("ol",{class:"meta",dir:"auto",style:"margin:8px 0;padding-inline-start:20px"},cards.slice(0,3).map(c=>h("li",{},c.q.slice(0,110)))),
   h("div",{class:"btns"},h("button",{class:"btn",onclick:()=>challengeModal(oo)},"🎯 جرّبها / أضفها إلى حزمي")));
  SC.sb.from("deck_adds").select("post_id",{count:"exact",head:true}).eq("post_id",p.id).then(r=>{if(!r.error&&r.count!=null){cnt.dataset.n=r.count;cnt.textContent=r.count?" · ⬇ أُضيفت "+r.count+" مرة":""}},()=>{})
 }catch(e){box.replaceChildren(h("div",{class:"meta"},"تعذّر تحميل الحزمة"))}})();
 return box}
// تُحتسب إضافة الحزمة مرة واحدة لكل مستخدم (المفتاح الأساسي يمنع التكرار)، ولا تُحتسب لصاحبها
async function deckAdded(p,el){if(!SC.user||SC.user.id===p.user_id)return;
 const r=await SC.sb.from("deck_adds").insert({post_id:p.id});
 if(!r.error&&el){const n=(+el.dataset.n||0)+1;el.dataset.n=n;el.textContent=" · ⬇ أُضيفت "+n+" مرة"}}
// ===== التخصص حر: اقتراحات فقط، ويكتب المستخدم ما يشاء =====
const FIELD_SUG=["الطب","الصيدلة","طب الأسنان","التمريض","علوم الأحياء","الكيمياء","الفيزياء","الرياضيات","الإحصاء","الإعلام الآلي","الذكاء الاصطناعي","الهندسة المدنية","الهندسة الكهربائية","الهندسة الميكانيكية","العمارة","الاقتصاد","التسيير والمحاسبة","التسويق","القانون","العلوم السياسية","علم الاجتماع","علم النفس","علوم التربية","الفلسفة","التاريخ","الجغرافيا","الأدب العربي","اللغة الإنجليزية","الترجمة","علوم الإعلام والاتصال","الشريعة والدراسات الإسلامية","الزراعة","البيطرة","علوم الأرض","علوم الرياضة","الفنون"];
const cleanTopic=s=>String(s||"").replace(/^[#\s]+/,"").replace(/\s+/g," ").trim().slice(0,60);
function fieldDl(){if(!document.getElementById("fieldsDl")){const d=document.createElement("datalist");d.id="fieldsDl";FIELD_SUG.forEach(x=>{const o=document.createElement("option");o.value=x;d.append(o)});document.body.append(d)}return "fieldsDl"}
postModal=function(){
 const kinds=[["post","💬 منشور"],["question","❓ سؤال"],["deck","🃏 حزمة بطاقات"],["research","📄 بحث"],["experience","🧪 تجربة"],["video","🎬 فيديو"],["board","🖼 لوحة"],["attachment","📎 مرفق"],["map","🗺 خريطة"]];if(SC.me&&SC.me.is_teacher)kinds.push(["lesson","🎓 مادة تعليمية"]);if(window.xt&&window.XF&&XF.ready!==false)kinds.splice(2,0,["thread","🧵 "+xt("thread")]);
 const kind=h("select",{class:"cin",onchange:()=>show()},kinds.map(([k,n])=>h("option",{value:k},n)));
 const ti=h("input",{class:"cin",placeholder:"العنوان",maxlength:"150"}),bd=h("textarea",{class:"cta",placeholder:"لخّص بحثك أو اشرح تجربتك…",maxlength:"3000"}),
 vd=h("input",{class:"cin",dir:"ltr",placeholder:"رابط فيديو يوتيوب (اختياري)"}),
 tp=(x=>{x.setAttribute("list",fieldDl());x.maxLength=60;return x})(h("input",{class:"cin",placeholder:"التخصص أو الموضوع (اختياري — اكتب ما تشاء أو اختر من الاقتراحات)",value:cleanTopic(SC.me&&SC.me.field)})),
 file=h("input",{type:"file"}),pl=h("input",{class:"cin",placeholder:"اسم المكان (مختبر، موقع الدراسة…)",maxlength:"120"}),
 la=h("input",{class:"cin",dir:"ltr",type:"number",step:"any",placeholder:"خط العرض lat"}),ln=h("input",{class:"cin",dir:"ltr",type:"number",step:"any",placeholder:"خط الطول lng"}),
 gps=h("button",{class:"btn",onclick:()=>{if(!navigator.geolocation)return toast("غير مدعوم");navigator.geolocation.getCurrentPosition(x=>{la.value=x.coords.latitude.toFixed(5);ln.value=x.coords.longitude.toFixed(5)},()=>toast("تعذّر تحديد موقعك"))}},"📍 استخدم موقعي"),
 sv=h("select",{class:"cin",onchange:()=>{const s=S.saved[sv.value-1];if(s){ti.value=s.title||""}}},h("option",{value:0},"أرفق من مصادري المحفوظة…"),S.saved.map((s,i)=>h("option",{value:i+1},(s.title||"").slice(0,60)))),
 tw=window.xThreadWidget?xThreadWidget():null,
 fw=h("div",{},h("div",{class:"meta"},"الملف (حتى 50MB. الفيديو الأكبر يُضغط تلقائيًا حتى 1GB قبل الضغط؛ وللفيديو الطويل جدًا استخدم رابط يوتيوب). ارفع فقط ما تملك حقوقه أو المسموح بنشره؛ لا ترفع كتبًا أو مقالات محمية بحقوق النشر."),file),mw=h("div",{},pl,la,ln,gps),rw=h("div",{},sv),vw=h("div",{},vd);
 const dks=(S.decks||[]).filter(d=>d&&Array.isArray(d.cards)&&d.cards.length),
  dk=h("select",{class:"cin"},dks.map((d,i)=>h("option",{value:i},(d.emoji||"📘")+" "+String(d.title||"").slice(0,50)+" · "+Math.min(d.cards.length,40)+" بطاقة"))),
  dw=h("div",{},h("div",{class:"meta"},dks.length?"اختر الحزمة التي تريد مشاركتها (حتى 40 بطاقة). سيعاينها الآخرون ويضيفونها إلى حزمهم، وتبقى مصادر بطاقاتك معها.":"لا توجد لديك حزم بعد. أنشئ حزمة من تبويب «حزمي» ثم عُد لمشاركتها."),dks.length?dk:null);
 const show=()=>{const k=kind.value;if(tw){tw.el.style.display=k==="thread"?"":"none";ti.style.display=bd.style.display=k==="thread"?"none":""}dw.style.display=k==="deck"?"":"none";fw.style.display=k==="board"||k==="attachment"?"":"none";mw.style.display=k==="map"?"":"none";rw.style.display=k==="research"?"":"none";vw.style.display=(k==="research"||k==="experience"||k==="video"||k==="lesson")?"":"none";
  const gen=k==="post"||k==="question";bd.placeholder=k==="question"?"اكتب سؤالك…":gen?"ماذا تريد أن تشاركه؟":(k==="research"||k==="lesson")?"لخّص بحثك أو درسك…":"شارك تجربتك أو ما تعلمته…";ti.placeholder=(gen||k==="deck")?"العنوان (اختياري)":"العنوان";if(k==="deck")bd.placeholder="لمن تصلح هذه الحزمة؟ وماذا تغطي؟ (اختياري)";
  file.accept=k==="board"?"image/*":".pdf,.docx,.xlsx,.txt,.csv,image/*,video/mp4,video/webm"};show();if(window.xMention)xMention(bd);
 const m=modal(h("h3",{},"＋ منشور جديد"),kind,ti,bd,tw?tw.el:null,dw,fw,mw,rw,vw,h("div",{class:"meta"},"🏷 التخصص حر الاختيار — يساعد الآخرين في إيجاد منشورك"),tp,h("button",{class:"pri",onclick:async e=>{const btn=e.target,k=kind.value,vu=vd.value.trim();
  if(k==="thread")return xPublishThread(btn,tw.get(),cleanTopic(tp.value),()=>{m.remove();SC.view="feed";render()});
  const DK=k==="deck"?dks[+dk.value]:null;if(k==="deck"&&!DK)return toast("اختر حزمة أولًا");
  const T=(ti.value.trim()||((k==="post"||k==="question")?bd.value.trim().replace(/\s+/g," ").slice(0,80):(DK?String(DK.title||"حزمة بطاقات"):""))).slice(0,150);if(!T)return toast(k==="post"||k==="question"?"اكتب شيئًا لتشاركه":"اكتب عنوانًا");if(vu&&!okU(vu))return toast("الرابط يجب أن يبدأ بـ https://");
  const tpv=cleanTopic(tp.value);if(tpv&&tpv.length<2)return toast("التخصص حرفان على الأقل أو اتركه فارغًا");
  const row={user_id:SC.user.id,kind:k,title:T,body:bd.value.trim()||null,video_url:vw.style.display==="none"?null:(vu||null)};if(tpv)row.topic=tpv;
  let dcode=null,dn=0;if(DK){const cs=DK.cards.slice(0,40);dn=cs.length;dcode=await pack({v:1,k:"d",n:(SC.me&&SC.me.username)||"",t:String(DK.title||"").slice(0,150),e:DK.emoji||"📘",c:cs.map(slim)});if(dcode.length>110000)return toast("الحزمة كبيرة جدًا للمشاركة؛ اختر حزمة أقل بطاقات");row.id=(crypto.randomUUID?crypto.randomUUID():null)||undefined;if(!row.id)delete row.id}
  if(k==="map"){const a=parseFloat(la.value),b=parseFloat(ln.value);if(!(a>=-90&&a<=90&&b>=-180&&b<=180))return toast("أدخل إحداثيات صحيحة أو اضغط «استخدم موقعي»");row.lat=a;row.lng=b;row.place=pl.value.trim()||null}
  if(k==="board"||k==="attachment"){const f=file.files[0];if(!f)return toast(k==="board"?"اختر صورة اللوحة":"اختر ملفًا");const isV=/^video\//.test(f.type);if(f.size>(isV?1073741824:52428800))return toast(isV?"الفيديو كبير جدًا (الحد 1GB قبل الضغط). استخدم رابط يوتيوب":"الحد الأقصى للملف 50MB");
   btn.disabled=true;let blob=f,type=f.type,ext=(f.name.match(/\.(\w{1,5})$/)||[])[1]||"bin";
   if(isV&&f.size>52428800){if(!confirm("الفيديو أكبر من 50MB. هل تريد ضغطه تلقائيًا إلى 720p؟ يستغرق تقريبًا بمدة الفيديو، فأبقِ الصفحة مفتوحة."))return btn.disabled=false;
     try{blob=await compressVideo(f,52428800,p=>{setT(btn,"⏳ ضغط الفيديو "+p+"%")});type="video/webm";ext="webm"}catch(e){btn.disabled=false;btn.textContent="نشر";return toast(e.message==="long"?"الفيديو طويل جدًا للضغط في 50MB؛ استخدم رابط يوتيوب":"تعذّر ضغط الفيديو في هذا المتصفح؛ استخدم رابط يوتيوب أو اضغطه يدويًا");}
     setT(btn,"⏳ جارٍ الرفع…");if(blob.size>52428800){btn.disabled=false;btn.textContent="نشر";return toast("ما زال أكبر من 50MB؛ استخدم رابط يوتيوب")}}
    if(k==="board"){if(!/^image\//.test(f.type)){btn.disabled=false;return toast("اللوحة يجب أن تكون صورة")}try{blob=await shrink(f,1600);type="image/jpeg";ext="jpg"}catch(_){btn.disabled=false;return toast("تعذّرت قراءة الصورة")}}
   const path=SC.user.id+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext.toLowerCase(),up=await SC.sb.storage.from("posts").upload(path,blob,{contentType:type});
   if(up.error){btn.disabled=false;return toast(up.error.message)}Object.assign(row,{file_path:path,file_name:f.name.slice(0,100),file_type:type,file_size:blob.size})}
  let r=await SC.sb.from("posts").insert(row),noTopic=false;
  if(r.error&&row.topic&&/topic/i.test(r.error.message||"")){delete row.topic;noTopic=true;r=await SC.sb.from("posts").insert(row)}
  if(r.error){btn.disabled=false;return toast(/posts_kind_check/i.test(r.error.message||"")?"لتفعيل المنشور العام والأسئلة والحزم شغّل v19m-topic.sql ثم v19n-decks.sql في Supabase":r.error.message)}
  if(DK){if(!row.id){btn.disabled=false;return toast("متصفحك لا يدعم مشاركة الحزم")}const dr=await SC.sb.from("post_decks").insert({post_id:row.id,data:dcode,n:dn});if(dr.error){await SC.sb.from("posts").delete().eq("id",row.id);btn.disabled=false;return toast(/post_decks|relation|schema cache/i.test(dr.error.message||"")?"لتفعيل مشاركة الحزم شغّل v19n-decks.sql في Supabase":dr.error.message)}}m.remove();SC.view="feed";render();if(noTopic)toast("نُشر دون التخصص — شغّل v19m-topic.sql في Supabase لتفعيله")}},"نشر"),cancelB({remove:()=>m.remove()}))}
// وسم التخصص على بطاقة المنشور: ضغطه يبحث عن كل المنشورات بنفس التخصص
{const _pc2=postCard;postCard=function(p,l){const c=_pc2(p,l);if(p&&p.topic){const bd=c.querySelector(".badge");const chip=h("button",{class:"chip",style:"margin-inline-start:6px",onclick:e=>{e.stopPropagation();SC.q=sq(p.topic);SC.view="search";render()}},"# "+p.topic);if(bd)bd.after(chip);else c.prepend(chip)}return c}}
