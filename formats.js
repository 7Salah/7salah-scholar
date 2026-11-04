// صيغ المنشورات الجديدة: مرفق / لوحة / خريطة. يُحمَّل بعد rank.js.
const KN={attachment:"📎 مرفق",board:"🖼 لوحة",map:"🗺 خريطة"};
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
 if(m){const t=c.querySelector(".trout");c.insertBefore(m,t)}return c}}
postModal=function(){
 const kinds=[["research","📄 بحث"],["experience","🧪 تجربة"],["video","🎬 فيديو"],["board","🖼 لوحة"],["attachment","📎 مرفق"],["map","🗺 خريطة"]];if(SC.me&&SC.me.is_teacher)kinds.push(["lesson","🎓 مادة تعليمية"]);
 const kind=h("select",{class:"cin",onchange:()=>show()},kinds.map(([k,n])=>h("option",{value:k},n)));
 const ti=h("input",{class:"cin",placeholder:"العنوان",maxlength:"150"}),bd=h("textarea",{class:"cta",placeholder:"لخّص بحثك أو اشرح تجربتك…",maxlength:"3000"}),
 doi=h("input",{class:"cin",dir:"ltr",placeholder:"DOI (اختياري) 10.1000/xyz"}),vd=h("input",{class:"cin",dir:"ltr",placeholder:"رابط فيديو يوتيوب (اختياري)"}),
 file=h("input",{type:"file"}),pl=h("input",{class:"cin",placeholder:"اسم المكان (مختبر، موقع الدراسة…)",maxlength:"120"}),
 la=h("input",{class:"cin",dir:"ltr",type:"number",step:"any",placeholder:"خط العرض lat"}),ln=h("input",{class:"cin",dir:"ltr",type:"number",step:"any",placeholder:"خط الطول lng"}),
 gps=h("button",{class:"btn",onclick:()=>{if(!navigator.geolocation)return toast("غير مدعوم");navigator.geolocation.getCurrentPosition(x=>{la.value=x.coords.latitude.toFixed(5);ln.value=x.coords.longitude.toFixed(5)},()=>toast("تعذّر تحديد موقعك"))}},"📍 استخدم موقعي"),
 sv=h("select",{class:"cin",onchange:()=>{const s=S.saved[sv.value-1];if(s){ti.value=s.title||"";doi.value=s.doi||""}}},h("option",{value:0},"أرفق من مصادري المحفوظة…"),S.saved.map((s,i)=>h("option",{value:i+1},(s.title||"").slice(0,60)))),
 fw=h("div",{},h("div",{class:"meta"},"الملف (حتى 50MB. الفيديو الأكبر يُضغط تلقائيًا حتى 1GB قبل الضغط؛ وللفيديو الطويل جدًا استخدم رابط يوتيوب). ارفع فقط ما تملك حقوقه أو المسموح بنشره؛ لا ترفع كتبًا أو مقالات محمية بحقوق النشر."),file),mw=h("div",{},pl,la,ln,gps),rw=h("div",{},sv,doi,vd);
 const show=()=>{const k=kind.value;fw.style.display=k==="board"||k==="attachment"?"":"none";mw.style.display=k==="map"?"":"none";rw.style.display=k==="board"||k==="attachment"||k==="map"?"none":"";
  file.accept=k==="board"?"image/*":".pdf,.docx,.xlsx,.txt,.csv,image/*,video/mp4,video/webm"};show();
 const m=modal(h("h3",{},"＋ منشور جديد"),kind,ti,bd,fw,mw,rw,h("button",{class:"pri",onclick:async e=>{const btn=e.target,k=kind.value,d=doi.value.trim(),vu=vd.value.trim();
  if(!ti.value.trim())return toast("اكتب عنوانًا");if(d&&!/^10\.\d{4,9}\/\S+$/.test(d))return toast("صيغة DOI غير صحيحة");if(vu&&!okU(vu))return toast("الرابط يجب أن يبدأ بـ https://");
  const row={user_id:SC.user.id,kind:k,title:ti.value.trim(),body:bd.value.trim()||null,doi:d||null,video_url:vu||null};
  if(k==="map"){const a=parseFloat(la.value),b=parseFloat(ln.value);if(!(a>=-90&&a<=90&&b>=-180&&b<=180))return toast("أدخل إحداثيات صحيحة أو اضغط «استخدم موقعي»");row.lat=a;row.lng=b;row.place=pl.value.trim()||null}
  if(k==="board"||k==="attachment"){const f=file.files[0];if(!f)return toast(k==="board"?"اختر صورة اللوحة":"اختر ملفًا");const isV=/^video\//.test(f.type);if(f.size>(isV?1073741824:52428800))return toast(isV?"الفيديو كبير جدًا (الحد 1GB قبل الضغط). استخدم رابط يوتيوب":"الحد الأقصى للملف 50MB");
   btn.disabled=true;let blob=f,type=f.type,ext=(f.name.match(/\.(\w{1,5})$/)||[])[1]||"bin";
   if(isV&&f.size>52428800){if(!confirm("الفيديو أكبر من 50MB. هل تريد ضغطه تلقائيًا إلى 720p؟ يستغرق تقريبًا بمدة الفيديو، فأبقِ الصفحة مفتوحة."))return btn.disabled=false;
     try{blob=await compressVideo(f,52428800,p=>{btn.textContent="⏳ ضغط الفيديو "+p+"%"});type="video/webm";ext="webm"}catch(e){btn.disabled=false;btn.textContent="نشر";return toast(e.message==="long"?"الفيديو طويل جدًا للضغط في 50MB؛ استخدم رابط يوتيوب":"تعذّر ضغط الفيديو في هذا المتصفح؛ استخدم رابط يوتيوب أو اضغطه يدويًا");}
     btn.textContent="⏳ جارٍ الرفع…";if(blob.size>52428800){btn.disabled=false;btn.textContent="نشر";return toast("ما زال أكبر من 50MB؛ استخدم رابط يوتيوب")}}
    if(k==="board"){if(!/^image\//.test(f.type)){btn.disabled=false;return toast("اللوحة يجب أن تكون صورة")}try{blob=await shrink(f,1600);type="image/jpeg";ext="jpg"}catch(_){btn.disabled=false;return toast("تعذّرت قراءة الصورة")}}
   const path=SC.user.id+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext.toLowerCase(),up=await SC.sb.storage.from("posts").upload(path,blob,{contentType:type});
   if(up.error){btn.disabled=false;return toast(up.error.message)}Object.assign(row,{file_path:path,file_name:f.name.slice(0,100),file_type:type,file_size:blob.size})}
  const r=await SC.sb.from("posts").insert(row);if(r.error){btn.disabled=false;return toast(r.error.message)}m.remove();SC.view="feed";render()}},"نشر"),cancelB({remove:()=>m.remove()}))}
