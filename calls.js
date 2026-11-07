// مكالمات صوت وفيديو بين باحثَين (WebRTC مباشر). الإشارات عبر جدول call_signals. تُحمَّل بعد translate.js.
const ICE=()=>({iceServers:(window.APP&&APP.ice)||[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]});
let CALL=null,INC=null,_sch=null;
function startCalls(){if(_sch){SC.sb.removeChannel(_sch);_sch=null}if(!SC.user)return;_sch=SC.sb.channel("signals").on("postgres_changes",{event:"INSERT",schema:"public",table:"call_signals"},p=>onSignal(p.new)).subscribe()}
const _sn=startNotif;startNotif=function(){_sn();startCalls()};
const sendSig=(cid,id,kind,pl)=>SC.sb.from("call_signals").insert({conv_id:cid,user_id:SC.user.id,kind,payload:Object.assign({call:id},pl||{})});
const mmss=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
function callUI(status){const rv=h("video",{autoplay:"",playsinline:""}),lv=h("video",{autoplay:"",playsinline:"",class:"lv"});lv.muted=true;lv.srcObject=CALL.stream;
 const st=h("div",{class:"cst"},status),mic=h("button",{class:"cb","aria-label":"الميكروفون",onclick:()=>{const t=CALL.stream.getAudioTracks()[0];if(t){t.enabled=!t.enabled;mic.classList.toggle("off",!t.enabled);mic.replaceChildren(ic(t.enabled?"mic":"mic-off"))}}},ic("mic")),
 cam=CALL.video?h("button",{class:"cb","aria-label":"الكاميرا",onclick:()=>{const t=CALL.stream.getVideoTracks()[0];if(t){t.enabled=!t.enabled;cam.classList.toggle("off",!t.enabled);cam.replaceChildren(ic(t.enabled?"camera":"camera-off"))}}},ic("camera")):null;
 const ov=h("div",{class:"callov"},h("div",{class:"cnm",dir:"auto"},CALL.name||""),st,rv,CALL.video?lv:null,h("div",{class:"cbar"},mic,cam,h("button",{class:"cb red","aria-label":"إنهاء المكالمة",onclick:()=>endCall(true)},ic("phone"))));
 document.body.append(ov);Object.assign(CALL,{ov,rv,status:st})}
function mkPc(){const pc=CALL.pc=new RTCPeerConnection(ICE()),C=CALL;C.stream.getTracks().forEach(t=>pc.addTrack(t,C.stream));
 pc.onicecandidate=e=>{if(e.candidate&&CALL===C)sendSig(C.cid,C.id,"ice",{c:e.candidate.toJSON()})};
 pc.ontrack=e=>{C.rv.srcObject=e.streams[0]};
 pc.onconnectionstatechange=()=>{if(CALL!==C)return;const s=pc.connectionState;
  if(s==="connected"){C.connected=true;clearTimeout(C.to);let n=0;C.status.textContent="0:00";C.tm=setInterval(()=>{C.status.textContent=mmss(++n)},1000)}
  if(s==="failed")endCall(false,"تعذّر الاتصال (شبكتك قد تحتاج خادم TURN)");else if(s==="closed"||s==="disconnected"&&!C.connected)endCall(false,"انتهت المكالمة")}}
function endCall(send,msg){const C=CALL;if(!C)return;CALL=null;clearTimeout(C.to);clearInterval(C.tm);if(send)sendSig(C.cid,C.id,"bye");try{C.pc&&C.pc.close()}catch(e){}C.stream.getTracks().forEach(t=>t.stop());C.ov&&C.ov.remove();if(msg)toast(msg)}
async function getMedia(video){try{return await navigator.mediaDevices.getUserMedia({audio:true,video:video})}catch(e){toast("تعذّر الوصول للميكروفون"+(video?" أو الكاميرا":"")+". امنح الإذن من إعدادات المتصفح.");return null}}
async function startCall(cid,name,video){if(CALL||INC)return toast("أنت في مكالمة بالفعل");if(!navigator.mediaDevices||!window.RTCPeerConnection)return toast("متصفحك لا يدعم المكالمات");
 const st=await getMedia(video);if(!st)return;CALL={id:crypto.randomUUID(),cid,name:(name||"").replace(/^👥 /,""),video,caller:true,stream:st,ice:[]};callUI("يتصل…");mkPc();const C=CALL;
 try{const o=await C.pc.createOffer();await C.pc.setLocalDescription(o);const r=await sendSig(cid,C.id,"offer",{sdp:o.sdp,video});if(r.error)throw r.error}catch(e){endCall(false,"تعذّر بدء المكالمة (قد يكون هناك حظر)");return}
 C.to=setTimeout(()=>{if(CALL===C&&!C.connected)endCall(true,"لم يردّ")},45000)}
async function onSignal(s){if(s.user_id===SC.user.id||SC.blocked.has(s.user_id)||Date.now()-new Date(s.created_at)>60000)return;const pl=s.payload||{};
 if(s.kind==="offer"){if(CALL||INC)return;const pr=(await SC.sb.from("profiles").select("name,username").eq("id",s.user_id).maybeSingle()).data;
  INC={id:pl.call,cid:s.conv_id,sdp:pl.sdp,video:!!pl.video,ice:[],name:pr?(pr.name||pr.username):"باحث"};incomingUI();return}
 if(INC&&pl.call===INC.id){if(s.kind==="ice")INC.ice.push(pl.c);else if(s.kind==="bye"){closeIncoming();toast("📞 مكالمة فائتة من "+INC_NAME)}return}
 if(!CALL||pl.call!==CALL.id)return;
 if(s.kind==="answer"&&CALL.caller){await CALL.pc.setRemoteDescription({type:"answer",sdp:pl.sdp});CALL.remote=true;CALL.ice.forEach(c=>CALL.pc.addIceCandidate(c).catch(()=>{}));CALL.ice=[]}
 else if(s.kind==="ice"){if(CALL.remote)CALL.pc.addIceCandidate(pl.c).catch(()=>{});else CALL.ice.push(pl.c)}
 else if(s.kind==="bye")endCall(false,"انتهت المكالمة")}
let INC_NAME="",_incEl=null,_incT=null;
function incomingUI(){INC_NAME=INC.name;if(navigator.vibrate)navigator.vibrate([400,200,400,200,400]);
 if(document.hidden&&window.Notification&&Notification.permission==="granted"){navigator.serviceWorker.getRegistration().then(r=>r&&r.showNotification("7salah-scholar",{body:"📞 "+INC.name+" يتصل بك",icon:"icon-192.png",tag:"call"})).catch(()=>{})}
 _incEl=h("div",{class:"callov"},h("div",{class:"cnm",dir:"auto"},INC.name),h("div",{class:"cst"},INC.video?"🎥 مكالمة فيديو واردة":"📞 مكالمة صوتية واردة"),h("div",{style:"flex:1"}),
  h("div",{class:"cbar"},h("button",{class:"cb green","aria-label":"قبول",onclick:acceptCall},ic("phone")),h("button",{class:"cb red","aria-label":"رفض",onclick:declineCall},ic("x"))));document.body.append(_incEl);
 _incT=setTimeout(()=>{if(INC)declineCall()},45000)}
function closeIncoming(){clearTimeout(_incT);if(_incEl)_incEl.remove();_incEl=null;INC=null}
function declineCall(){const I=INC;closeIncoming();if(I)sendSig(I.cid,I.id,"bye")}
async function acceptCall(){const I=INC;closeIncoming();const st=await getMedia(I.video);if(!st){sendSig(I.cid,I.id,"bye");return}
 CALL={id:I.id,cid:I.cid,name:I.name,video:I.video,caller:false,stream:st,ice:[]};callUI("جارٍ الاتصال…");mkPc();const C=CALL;
 try{await C.pc.setRemoteDescription({type:"offer",sdp:I.sdp});C.remote=true;I.ice.forEach(c=>C.pc.addIceCandidate(c).catch(()=>{}));
  const a=await C.pc.createAnswer();await C.pc.setLocalDescription(a);await sendSig(C.cid,C.id,"answer",{sdp:a.sdp})}catch(e){endCall(true,"تعذّر الرد على المكالمة")}}
