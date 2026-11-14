// 7Salah Scholar — Integrated Skype-Style Video & Voice Calls (WebRTC + Screen Share)
// Supports both Supabase DM call_signals AND real-time WebSocket peer-to-peer signaling via Net.
const ICE=()=>({iceServers:(window.APP&&APP.ice)||[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]});
let CALL=null,INC=null,_sch=null;
const cTr=(a,e,f)=>S.lang==="ar"?a:S.lang==="fr"?(f||e):e;

function startCalls(){
 if(_sch&&window.SC&&SC.sb){SC.sb.removeChannel(_sch);_sch=null}
 if(window.SC&&SC.user&&SC.sb){
  _sch=SC.sb.channel("signals").on("postgres_changes",{event:"INSERT",schema:"public",table:"call_signals"},p=>onSignal(p.new)).subscribe();
 }
}
const _sn=typeof startNotif==="function"?startNotif:()=>{};
startNotif=function(){_sn();startCalls()};

const sendSig=(cid,id,kind,pl)=>SC.sb.from("call_signals").insert({conv_id:cid,user_id:SC.user.id,kind,payload:Object.assign({call:id},pl||{})});
const mmss=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");

function callSend(kind,pl){
 const C=CALL;if(!C)return Promise.resolve();
 if(C.mode==="ws"){
  Net.send(Object.assign({type:"call:"+kind,callId:C.id,toPeerId:C.peerId},pl||{}));
  return Promise.resolve({});
 }
 return sendSig(C.cid,C.id,kind,pl);
}

function incSend(I,kind,pl){
 if(!I)return Promise.resolve();
 if(I.mode==="ws"){
  Net.send(Object.assign({type:"call:"+kind,callId:I.id,toPeerId:I.peerId},pl||{}));
  return Promise.resolve({});
 }
 return sendSig(I.cid,I.id,kind,pl);
}

function callUI(status){
 const rv=h("video",{autoplay:"",playsinline:""});
 const lv=h("video",{autoplay:"",playsinline:"",class:"lv"});
 lv.muted=true;
 if(CALL.stream)lv.srcObject=CALL.stream;
 const st=h("div",{class:"cst"},status);

 const mic=h("button",{class:"cb","aria-label":cTr("الميكروفون","Microphone","Micro"),title:cTr("الميكروفون","Microphone","Micro"),onclick:()=>{
  const t=CALL.stream&&CALL.stream.getAudioTracks()[0];
  if(t){t.enabled=!t.enabled;mic.classList.toggle("off",!t.enabled);mic.replaceChildren(ic(t.enabled?"mic":"mic-off"))}
 }},ic("mic"));

 const hasCam=CALL.stream&&CALL.stream.getVideoTracks().length>0;
 const cam=hasCam?h("button",{class:"cb","aria-label":cTr("الكاميرا","Camera","Caméra"),title:cTr("الكاميرا","Camera","Caméra"),onclick:()=>{
  const t=CALL.stream.getVideoTracks()[0];
  if(t){t.enabled=!t.enabled;cam.classList.toggle("off",!t.enabled);cam.replaceChildren(ic(t.enabled?"camera":"camera-off"))}
 }},ic("camera")):null;

 const scr=h("button",{class:"cb","aria-label":cTr("مشاركة الشاشة","Share screen","Partager l'écran"),title:cTr("مشاركة الشاشة","Share screen","Partager l'écran"),onclick:()=>toggleCallScreen(scr)},ic("monitor"));

 const ov=h("div",{class:"callov callov-navy"},
  h("div",{class:"callov-head"},
   h("span",{class:"callov-brand"},"7Salah Video"),
   h("div",{class:"cnm",dir:"auto"},CALL.name||""),
   st
  ),
  h("div",{class:"callov-stage"},rv,hasCam||CALL.screenStream?lv:null),
  h("div",{class:"cbar"},mic,cam,scr,h("button",{class:"cb red","aria-label":cTr("إنهاء المكالمة","End call","Raccrocher"),onclick:()=>endCall(true)},ic("phone")))
 );
 document.body.append(ov);
 Object.assign(CALL,{ov,rv,lv,status:st,scrBtn:scr});
}

async function toggleCallScreen(btn){
 const C=CALL;if(!C||!C.pc)return;
 if(C.screenStream){
  stopCallScreen();
  return;
 }
 if(!navigator.mediaDevices||!navigator.mediaDevices.getDisplayMedia){
  toast(cTr("مشاركة الشاشة غير مدعومة في هذا المتصفح","Screen sharing is not supported in this browser","Partage d'écran non pris en charge"));
  return;
 }
 try{
  const ss=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
  const track=ss.getVideoTracks()[0];
  if(!track)return;
  C.screenStream=ss;
  if(btn){btn.classList.add("gold-on");btn.replaceChildren(ic("monitor-off"))}
  const sender=C.pc.getSenders().find(s=>s.track&&s.track.kind==="video");
  if(sender){
   await sender.replaceTrack(track);
  }else{
   C.pc.addTrack(track,ss);
   if(C.pc.signalingState==="stable"){
    const o=await C.pc.createOffer();await C.pc.setLocalDescription(o);
    await callSend("offer",{sdp:o.sdp,video:true});
   }
  }
  if(C.lv){C.lv.srcObject=ss}
  track.onended=()=>stopCallScreen();
 }catch(e){
  if(e&&e.name!=="AbortError"&&e.name!=="NotAllowedError"){
   toast(cTr("تعذّرت مشاركة الشاشة","Could not share screen","Impossible de partager l'écran"));
  }
 }
}

function stopCallScreen(){
 const C=CALL;if(!C||!C.screenStream)return;
 const ss=C.screenStream;C.screenStream=null;
 ss.getTracks().forEach(t=>t.stop());
 if(C.scrBtn){C.scrBtn.classList.remove("gold-on");C.scrBtn.replaceChildren(ic("monitor"))}
 const camTrack=C.stream&&C.stream.getVideoTracks()[0];
 if(C.pc){
  const sender=C.pc.getSenders().find(s=>s.track&&s.track.kind==="video");
  if(sender&&camTrack)sender.replaceTrack(camTrack).catch(()=>{});
 }
 if(C.lv&&C.stream)C.lv.srcObject=C.stream;
}

function mkPc(){
 const pc=CALL.pc=new RTCPeerConnection(ICE()),C=CALL;
 if(C.stream)C.stream.getTracks().forEach(t=>pc.addTrack(t,C.stream));
 pc.onicecandidate=e=>{if(e.candidate&&CALL===C)callSend("ice",{c:e.candidate.toJSON()})};
 pc.ontrack=e=>{C.rv.srcObject=e.streams[0]};
 pc.onconnectionstatechange=()=>{
  if(CALL!==C)return;
  const s=pc.connectionState;
  if(s==="connected"){
   C.connected=true;clearTimeout(C.to);let n=0;C.status.textContent="0:00";
   C.tm=setInterval(()=>{C.status.textContent=mmss(++n)},1000);
  }
  if(s==="failed")endCall(false,cTr("تعذّر الاتصال (قد تحتاج الشبكة خادم TURN)","Connection failed (network may need TURN)","Échec de connexion"));
  else if(s==="closed"||(s==="disconnected"&&!C.connected))endCall(false,cTr("انتهت المكالمة","Call ended","Appel terminé"));
 };
}

function endCall(send,msg){
 const C=CALL;if(!C)return;
 CALL=null;clearTimeout(C.to);clearInterval(C.tm);
 if(send){
  if(C.mode==="ws")Net.send({type:"call:bye",callId:C.id,toPeerId:C.peerId});
  else sendSig(C.cid,C.id,"bye");
 }
 try{C.pc&&C.pc.close()}catch(e){}
 if(C.screenStream)C.screenStream.getTracks().forEach(t=>t.stop());
 if(C.stream)C.stream.getTracks().forEach(t=>t.stop());
 C.ov&&C.ov.remove();
 if(msg)toast(msg);
}

async function getMedia(video){
 try{
  return await navigator.mediaDevices.getUserMedia({audio:true,video:!!video});
 }catch(e){
  if(video){
   try{
    const audioOnly=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    toast(cTr("الكاميرا غير متاحة — تم الاتصال بالصوت فقط","Camera unavailable — using audio only","Caméra indisponible — audio uniquement"));
    return audioOnly;
   }catch(_){}
  }
  toast(cTr("تعذّر الوصول للميكروفون"+(video?" أو الكاميرا":"")+". امنح الإذن من إعدادات المتصفح.","Could not access microphone"+(video?" or camera":"")+". Check browser permissions.","Accès micro/caméra refusé."));
  return null;
 }
}

// 1) Supabase DM Call
async function startCall(cid,name,video){
 if(CALL||INC)return toast(cTr("أنت في مكالمة بالفعل","Already in a call","Déjà en appel"));
 if(!navigator.mediaDevices||!window.RTCPeerConnection)return toast(cTr("متصفحك لا يدعم المكالمات","WebRTC not supported","WebRTC non supporté"));
 const st=await getMedia(video);if(!st)return;
 CALL={id:crypto.randomUUID(),mode:"supa",cid,name:(name||"").replace(/^👥\s*/,""),video:st.getVideoTracks().length>0,caller:true,stream:st,ice:[]};
 callUI(cTr("يتصل…","Calling…","Appel en cours…"));mkPc();const C=CALL;
 try{
  const o=await C.pc.createOffer();await C.pc.setLocalDescription(o);
  const r=await sendSig(cid,C.id,"offer",{sdp:o.sdp,video});if(r.error)throw r.error;
 }catch(e){endCall(false,cTr("تعذّر بدء المكالمة","Could not start call","Impossible de démarrer l'appel"));return}
 C.to=setTimeout(()=>{if(CALL===C&&!C.connected)endCall(true,cTr("لم يردّ","No answer","Pas de réponse"))},45000);
}

// 2) Direct WebSocket Skype-style Call (works from Profiles, Connections, Directory)
async function startPeerCall(peerId,name,video){
 if(!peerId||peerId===Net.ensurePeerId())return toast(cTr("لا يمكنك الاتصال بنفسك","Cannot call yourself","Impossible de vous appeler"));
 if(CALL||INC)return toast(cTr("أنت في مكالمة بالفعل","Already in a call","Déjà en appel"));
 if(!navigator.mediaDevices||!window.RTCPeerConnection)return toast(cTr("متصفحك لا يدعم المكالمات","WebRTC not supported","WebRTC non supporté"));
 const st=await getMedia(video);if(!st)return;
 CALL={id:crypto.randomUUID(),mode:"ws",peerId,name:name||"Scholar",video:st.getVideoTracks().length>0,caller:true,stream:st,ice:[]};
 callUI(cTr("جاري الرنين…","Ringing…","Sonnerie…"));mkPc();const C=CALL;
 try{
  const o=await C.pc.createOffer();await C.pc.setLocalDescription(o);
  Net.send({type:"call:offer",callId:C.id,toPeerId:peerId,payload:{sdp:o.sdp,video:C.video}});
 }catch(e){endCall(false,cTr("تعذّر بدء المكالمة","Could not start call","Impossible de démarrer l'appel"));return}
 C.to=setTimeout(()=>{if(CALL===C&&!C.connected)endCall(true,cTr("لم يردّ","No answer","Pas de réponse"))},45000);
}
window.startPeerCall=startPeerCall;

// Handle incoming Supabase call_signals
async function onSignal(s){
 if(!SC.user||s.user_id===SC.user.id||SC.blocked.has(s.user_id)||Date.now()-new Date(s.created_at)>60000)return;
 const pl=s.payload||{};
 if(s.kind==="offer"){
  if(CALL&&CALL.id===pl.call){
   await CALL.pc.setRemoteDescription({type:"offer",sdp:pl.sdp});
   const a=await CALL.pc.createAnswer();await CALL.pc.setLocalDescription(a);
   await sendSig(s.conv_id,CALL.id,"answer",{sdp:a.sdp});
   return;
  }
  if(CALL||INC)return;
  const pr=(await SC.sb.from("profiles").select("name,username").eq("id",s.user_id).maybeSingle()).data;
  INC={id:pl.call,mode:"supa",cid:s.conv_id,sdp:pl.sdp,video:!!pl.video,ice:[],name:pr?(pr.name||pr.username):"باحث"};
  incomingUI();return;
 }
 if(INC&&pl.call===INC.id){
  if(s.kind==="ice")INC.ice.push(pl.c);
  else if(s.kind==="bye"){closeIncoming();toast("📞 "+cTr("مكالمة فائتة من ","Missed call from ","Appel manqué de ")+INC_NAME)}
  return;
 }
 if(!CALL||pl.call!==CALL.id)return;
 if(s.kind==="answer"&&CALL.caller){await CALL.pc.setRemoteDescription({type:"answer",sdp:pl.sdp});CALL.remote=true;CALL.ice.forEach(c=>CALL.pc.addIceCandidate(c).catch(()=>{}));CALL.ice=[]}
 else if(s.kind==="ice"){if(CALL.remote)CALL.pc.addIceCandidate(pl.c).catch(()=>{});else CALL.ice.push(pl.c)}
 else if(s.kind==="bye")endCall(false,cTr("انتهت المكالمة","Call ended","Appel terminé"));
}

// Handle incoming WebSocket 1:1 call signaling
if(window.Net){
 Net.on("call:offer",async msg=>{
  const pl=msg.payload||{};
  if(CALL&&CALL.id===msg.callId&&CALL.mode==="ws"){
   await CALL.pc.setRemoteDescription({type:"offer",sdp:pl.sdp});
   const a=await CALL.pc.createAnswer();await CALL.pc.setLocalDescription(a);
   Net.send({type:"call:answer",callId:CALL.id,toPeerId:CALL.peerId,payload:{sdp:a.sdp}});
   return;
  }
  if(CALL||INC)return;
  INC={id:msg.callId,mode:"ws",peerId:msg.fromPeerId,sdp:pl.sdp,video:!!pl.video,ice:[],name:msg.fromName||msg.fromHandle||"Scholar"};
  incomingUI();
 });
 Net.on("call:answer",async msg=>{
  if(!CALL||CALL.id!==msg.callId||CALL.mode!=="ws")return;
  const pl=msg.payload||{};
  await CALL.pc.setRemoteDescription({type:"answer",sdp:pl.sdp});
  CALL.remote=true;
  CALL.ice.forEach(c=>CALL.pc.addIceCandidate(c).catch(()=>{}));
  CALL.ice=[];
 });
 Net.on("call:ice",msg=>{
  const c=msg.payload&&msg.payload.c;if(!c)return;
  if(INC&&INC.id===msg.callId&&INC.mode==="ws"){INC.ice.push(c);return}
  if(CALL&&CALL.id===msg.callId&&CALL.mode==="ws"){
   if(CALL.remote)CALL.pc.addIceCandidate(c).catch(()=>{});else CALL.ice.push(c);
  }
 });
 Net.on("call:bye",msg=>{
  if(INC&&INC.id===msg.callId){closeIncoming();toast("📞 "+cTr("مكالمة فائتة من ","Missed call from ","Appel manqué de ")+INC_NAME);return}
  if(CALL&&CALL.id===msg.callId)endCall(false,cTr("انتهت المكالمة","Call ended","Appel terminé"));
 });
 Net.on("call:unavailable",msg=>{
  if(CALL&&CALL.id===msg.callId){
   endCall(false,cTr("الباحث غير متصل حاليًا — يمكنك دعوته لغرفة دراسة أو مراسلته","Peer is offline right now — invite them to a study room or message them","Chercheur hors ligne"));
  }
 });
}

let INC_NAME="",_incEl=null,_incT=null;
function incomingUI(){
 INC_NAME=INC.name;
 if(navigator.vibrate)navigator.vibrate([400,200,400,200,400]);
 if(document.hidden&&window.Notification&&Notification.permission==="granted"){
  navigator.serviceWorker.getRegistration().then(r=>r&&r.showNotification("7Salah Scholar",{body:"📞 "+INC.name+" "+cTr("يتصل بك","is calling you","vous appelle"),icon:"icon-192.png",tag:"call"})).catch(()=>{});
 }
 _incEl=h("div",{class:"callov callov-navy"},
  h("div",{class:"callov-brand"},"7Salah Video"),
  h("div",{class:"cnm",dir:"auto"},INC.name),
  h("div",{class:"cst"},INC.video?cTr("🎥 مكالمة فيديو واردة","🎥 Incoming video call","🎥 Appel vidéo entrant"):cTr("📞 مكالمة صوتية واردة","📞 Incoming voice call","📞 Appel vocal entrant")),
  h("div",{style:"flex:1"}),
  h("div",{class:"cbar"},
   h("button",{class:"cb green","aria-label":cTr("قبول","Accept","Accepter"),onclick:acceptCall},ic("phone")),
   h("button",{class:"cb red","aria-label":cTr("رفض","Decline","Refuser"),onclick:declineCall},ic("x"))
  )
 );
 document.body.append(_incEl);
 _incT=setTimeout(()=>{if(INC)declineCall()},45000);
}
function closeIncoming(){clearTimeout(_incT);if(_incEl)_incEl.remove();_incEl=null;INC=null}
function declineCall(){const I=INC;closeIncoming();if(I)incSend(I,"bye")}
async function acceptCall(){
 const I=INC;closeIncoming();
 const st=await getMedia(I.video);if(!st){incSend(I,"bye");return}
 CALL={id:I.id,mode:I.mode,cid:I.cid,peerId:I.peerId,name:I.name,video:st.getVideoTracks().length>0,caller:false,stream:st,ice:[]};
 callUI(cTr("جارٍ الاتصال…","Connecting…","Connexion…"));mkPc();const C=CALL;
 try{
  await C.pc.setRemoteDescription({type:"offer",sdp:I.sdp});C.remote=true;
  I.ice.forEach(c=>C.pc.addIceCandidate(c).catch(()=>{}));
  const a=await C.pc.createAnswer();await C.pc.setLocalDescription(a);
  await callSend("answer",{sdp:a.sdp});
 }catch(e){endCall(true,cTr("تعذّر الرد على المكالمة","Could not answer call","Impossible de répondre"))}
}
