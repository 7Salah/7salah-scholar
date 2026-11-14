// 7Salah Scholar — Live Study Rooms, WebRTC Video Conferencing, Screen Share & Session Scheduling
(function(){
 "use strict";

 const rTr=(a,e,f)=>S.lang==="ar"?a:S.lang==="fr"?(f||e):e;

 Object.assign(T.ar,{nRooms:"الغرف"});
 Object.assign(T.en,{nRooms:"Study Rooms"});
 Object.assign(T.fr,{nRooms:"Salles"});

 // Insert Study Rooms right after Community in main bottom navigation
 const comIdx=TABS.findIndex(x=>x[0]==="com");
 if(comIdx!==-1)TABS.splice(comIdx+1,0,["rooms","nRooms",icp("video")]);
 else TABS.splice(4,0,["rooms","nRooms",icp("video")]);

 const RM={
  rooms:[],
  loading:false,
  filterField:"",
  filterMode:"all", // all | live | scheduled
  active:null, // { room, participants, messages, shared, mic, cam, screen, localStream, screenStream, pcs, remoteStreams, subTab }
  _listenersBound:false
 };

 const ICE_CFG=()=>({iceServers:(window.APP&&APP.ice)||[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]});

 function escapeIcs(x){return String(x||"").replace(/[\\;,]/g,m=>"\\"+m).replace(/\n/g,"\\n")}
 function downloadRoomIcs(room){
  const start=room.scheduledAt?new Date(room.scheduledAt):new Date(Date.now()+3600000);
  if(isNaN(start.getTime()))return toast(rTr("تاريخ غير صالح","Invalid date","Date invalide"));
  const end=new Date(start.getTime()+(room.durationMin||60)*60000);
  const f=d=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
  const url=baseUrl()+"#room="+encodeURIComponent(room.code);
  const lines=[
   "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//7SalahScholar//StudyRoom//EN","BEGIN:VEVENT",
   "UID:"+room.id+"@7salah-scholar",
   "DTSTAMP:"+f(new Date()),
   "DTSTART:"+f(start),
   "DTEND:"+f(end),
   "SUMMARY:"+escapeIcs(room.title+" ("+Net.discLabel(room.field)+")"),
   "DESCRIPTION:"+escapeIcs((room.description||"")+"\nJoin link: "+url+"\nCode: "+room.code),
   "URL:"+url,
   "END:VEVENT","END:VCALENDAR"
  ];
  const blob=new Blob([lines.join("\r\n")],{type:"text/calendar;charset=utf-8"});
  const a=h("a",{href:URL.createObjectURL(blob),download:"study-room-"+room.code+".ics"});
  document.body.append(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
 }

 async function loadRooms(){
  RM.loading=true;
  try{
   const q=new URLSearchParams();
   if(RM.filterField)q.set("field",RM.filterField);
   q.set("peerId",Net.ensurePeerId());
   const r=await Net.apiGet("/api/rooms?"+q.toString());
   RM.rooms=r.rooms||[];
  }catch(e){RM.rooms=[]}
  RM.loading=false;
  if(S.tab==="rooms"&&!RM.active)render();
 }

 function copyRoomInvite(room){
  const url=baseUrl()+"#room="+encodeURIComponent(room.code);
  shareLink(url,rTr("انضم إلى غرفة الدراسة «"+room.title+"» (الرمز: "+room.code+") على 7Salah Scholar:","Join study room “"+room.title+"” (Code: "+room.code+") on 7Salah Scholar:","Rejoignez la salle d'étude « "+room.title+" » (Code : "+room.code+") :"));
 }

 // ---- Modal: Create Instant or Scheduled Study Room ----
 function openRoomCreator(preset){
  preset=preset||{};
  const ti=h("input",{class:"cin",maxlength:"120",value:preset.title||"",placeholder:rTr("عنوان الغرفة: مثال، مراجعة الفلسفة الحديثة","Room title: e.g., Modern Philosophy Seminar","Titre de la salle")});
  const fd=h("select",{class:"cin"},Net.DISCIPLINES.map(d=>h("option",{value:d.id||"General",selected:(preset.field||"")===d.id?"selected":null},d.id?(d[S.lang]||d.en):rTr("عام / متعدد التخصصات","General / Interdisciplinary","Général"))));
  const vis=h("select",{class:"cin"},
   h("option",{value:"public"},rTr("🌐 غرفة عامة (متاحة للباحثين)","🌐 Public Room (open to scholars)","🌐 Salle publique")),
   h("option",{value:"private"},rTr("🔒 غرفة خاصة (بالرابط والرمز فقط)","🔒 Private Room (invite code only)","🔒 Salle privée"))
  );
  const desc=h("textarea",{class:"cta",rows:"2",maxlength:"400",placeholder:rTr("وصف الجلسة أو المراجع التي ستُناقش…","Session agenda or papers to discuss…","Ordre du jour…")},preset.description||"");

  const isSched=h("input",{type:"checkbox",checked:!!preset.scheduled});
  const nowPlus=new Date(Date.now()+3600000);
  const defDt=nowPlus.getFullYear()+"-"+pad(nowPlus.getMonth()+1)+"-"+pad(nowPlus.getDate())+"T"+pad(nowPlus.getHours())+":00";
  const dt=h("input",{class:"cin",type:"datetime-local",value:defDt});
  const dur=h("select",{class:"cin"},[30,45,60,90,120].map(n=>h("option",{value:String(n),selected:n===60?"selected":null},n+" "+rTr("دقيقة","min","min"))));
  const schedBox=h("div",{style:preset.scheduled?"":"display:none"},
   h("label",{class:"lbl"},rTr("موعد الجلسة","Session date & time","Date et heure")),dt,
   h("label",{class:"lbl"},rTr("المدة","Duration","Durée")),dur
  );
  isSched.onchange=()=>{schedBox.style.display=isSched.checked?"":"none"};

  // Optional pre-attached deck
  const decks=S.decks||[];
  const deckSel=h("select",{class:"cin"},
   h("option",{value:""},rTr("— بدون حزمة مرفقة —","— No linked deck —","— Aucun paquet —")),
   decks.map((d,i)=>h("option",{value:String(i)},(d.emoji||"📘")+" "+d.title+" ("+d.cards.length+")"))
  );

  const createBtn=h("button",{class:"pri",type:"button",onclick:async()=>{
   const title=ti.value.trim();
   if(!title)return toast(rTr("أدخل عنوان الغرفة","Enter a room title","Entrez un titre"));
   createBtn.disabled=true;
   const me=Net.myIdentity();
   let linkedItem=preset.linkedItem||null;
   if(!linkedItem&&deckSel.value!==""){
    const dk=decks[+deckSel.value];
    if(dk)linkedItem={kind:"deck",title:dk.title,emoji:dk.emoji||"📘",index:0,revealed:false,cards:dk.cards.slice(0,40)};
   }
   try{
    const res=await Net.apiPost("/api/rooms",{
     title,
     field:fd.value,
     description:desc.value.trim(),
     hostId:me.id,
     hostName:me.name,
     hostHandle:me.username,
     visibility:vis.value,
     scheduledAt:isSched.checked&&dt.value?new Date(dt.value).toISOString():null,
     durationMin:+dur.value||60,
     linkedItem
    });
    m.remove();
    toast(rTr("تم إنشاء غرفة الدراسة ✓ (الرمز: "+res.room.code+")","Study room created ✓ (Code: "+res.room.code+")","Salle créée ✓"));
    if(isSched.checked){
     await loadRooms();
     render();
    }else{
     await joinStudyRoom(res.room.id);
    }
   }catch(e){
    createBtn.disabled=false;
    toast(e.message||rTr("تعذّر إنشاء الغرفة","Could not create room","Erreur"));
   }
  }},preset.scheduled?rTr("جدولة الغرفة","Schedule Room","Planifier"):rTr("إنشاء وبدء الجلسة","Create & Start Room","Créer et lancer"));

  const m=modal(
   h("h3",{},ic("video")," ",rTr("غرفة دراسة واستشارة مباشرة","Live Study & Consultation Room","Salle d'étude en direct")),
   h("label",{class:"lbl"},rTr("العنوان","Title","Titre")),ti,
   h("label",{class:"lbl"},rTr("التخصص العلمي","Academic Discipline","Discipline")),fd,
   h("label",{class:"lbl"},rTr("الخصوصية","Visibility","Visibilité")),vis,
   !preset.linkedItem?[h("label",{class:"lbl"},rTr("إرفاق حزمة بطاقات للمراجعة الجماعية","Attach flashcard deck (optional)","Joindre un paquet")),deckSel]:null,
   h("label",{class:"meta",style:"display:flex;align-items:center;gap:8px;margin-top:8px;cursor:pointer"},isSched,h("span",{},rTr("جدولة لوقت لاحق (مع تصدير للتقويم)","Schedule for later (with calendar export)","Planifier pour plus tard"))),
   schedBox,
   h("label",{class:"lbl"},rTr("تفاصيل الجلسة","Agenda / Notes","Notes")),desc,
   createBtn,
   h("div",{class:"acts"},h("button",{class:"btn",type:"button",onclick:()=>m.remove()},t("cancel")))
  );
 }

 // ---- WebRTC Multi-Peer Study Room Engine ----
 function bindWsRoomHandlers(){
  if(RM._listenersBound)return;
  RM._listenersBound=true;

  Net.on("room:state",msg=>{
   if(!RM.active||RM.active.room.id!==msg.roomId)return;
   RM.active.participants=msg.participants||[];
   RM.active.messages=msg.messages||[];
   if(msg.sharedMaterial)RM.active.shared=msg.sharedMaterial;
   syncPeerConnections();
   renderActiveRoomUI();
  });

  Net.on("room:peer-joined",msg=>{
   if(!RM.active||RM.active.room.id!==msg.roomId)return;
   RM.active.participants=msg.participants||[];
   syncPeerConnections();
   renderActiveRoomUI();
  });

  Net.on("room:peer-left",msg=>{
   if(!RM.active||RM.active.room.id!==msg.roomId)return;
   RM.active.participants=msg.participants||[];
   closePeerConnection(msg.peerId);
   renderActiveRoomUI();
  });

  Net.on("room:presence",msg=>{
   if(!RM.active||RM.active.room.id!==msg.roomId)return;
   RM.active.participants=msg.participants||[];
   renderActiveRoomUI();
  });

  Net.on("chat:message",msg=>{
   if(!RM.active||RM.active.room.id!==msg.roomId)return;
   if(!RM.active.messages.some(x=>x.id===msg.message.id)){
    RM.active.messages.push(msg.message);
    paintRoomChat();
   }
  });

  Net.on("study:synced",msg=>{
   if(!RM.active||RM.active.room.id!==msg.roomId)return;
   RM.active.shared=msg.item||null;
   paintSharedStage();
  });

  Net.on("room:closed",msg=>{
   if(!RM.active||RM.active.room.id!==msg.roomId)return;
   toast(rTr("أُغلقت غرفة الدراسة","Study room closed","Salle fermée"));
   leaveStudyRoom(true);
  });

  Net.on("rtc:offer",async msg=>{
   if(!RM.active||RM.active.room.id!==msg.roomId)return;
   const fromId=msg.fromPeerId;
   const pc=ensurePeerConnection(fromId);
   try{
    await pc.setRemoteDescription({type:"offer",sdp:msg.payload.sdp});
    const ans=await pc.createAnswer();
    await pc.setLocalDescription(ans);
    Net.send({type:"rtc:answer",roomId:RM.active.room.id,toPeerId:fromId,payload:{sdp:ans.sdp}});
   }catch(e){console.warn("[rtc:offer]",e)}
  });

  Net.on("rtc:answer",async msg=>{
   if(!RM.active||RM.active.room.id!==msg.roomId)return;
   const pc=RM.active.pcs.get(msg.fromPeerId);
   if(pc){
    try{await pc.setRemoteDescription({type:"answer",sdp:msg.payload.sdp})}catch(e){console.warn("[rtc:answer]",e)}
   }
  });

  Net.on("rtc:ice",async msg=>{
   if(!RM.active||RM.active.room.id!==msg.roomId)return;
   const pc=RM.active.pcs.get(msg.fromPeerId);
   if(pc&&msg.payload&&msg.payload.c){
    try{await pc.addIceCandidate(msg.payload.c)}catch(e){}
   }
  });
 }

 function activeVideoTrack(){
  const A=RM.active;if(!A)return null;
  if(A.screenStream&&A.screenStream.getVideoTracks()[0])return A.screenStream.getVideoTracks()[0];
  if(A.localStream&&A.localStream.getVideoTracks()[0])return A.localStream.getVideoTracks()[0];
  return null;
 }

 function attachLocalTracksToPc(pc){
  const A=RM.active;if(!A)return;
  const existingKinds=new Set(pc.getSenders().map(s=>s.track&&s.track.kind).filter(Boolean));
  const at=A.localStream&&A.localStream.getAudioTracks()[0];
  if(at&&!existingKinds.has("audio"))pc.addTrack(at,A.localStream);
  const vt=activeVideoTrack();
  if(vt&&!existingKinds.has("video"))pc.addTrack(vt,A.screenStream||A.localStream);
 }

 function ensurePeerConnection(remotePeerId){
  const A=RM.active;
  let pc=A.pcs.get(remotePeerId);
  if(pc)return pc;
  pc=new RTCPeerConnection(ICE_CFG());
  A.pcs.set(remotePeerId,pc);
  attachLocalTracksToPc(pc);
  pc.onicecandidate=e=>{
   if(e.candidate&&RM.active===A){
    Net.send({type:"rtc:ice",roomId:A.room.id,toPeerId:remotePeerId,payload:{c:e.candidate.toJSON()}});
   }
  };
  pc.ontrack=e=>{
   if(RM.active!==A)return;
   const stream=e.streams[0]||new MediaStream([e.track]);
   A.remoteStreams.set(remotePeerId,stream);
   paintVideoGrid();
  };
  pc.onconnectionstatechange=()=>{
   if(pc.connectionState==="failed"||pc.connectionState==="closed"){
    if(A.remoteStreams.has(remotePeerId)){A.remoteStreams.delete(remotePeerId);paintVideoGrid()}
   }
  };
  return pc;
 }

 function closePeerConnection(remotePeerId){
  const A=RM.active;if(!A)return;
  const pc=A.pcs.get(remotePeerId);
  if(pc){try{pc.close()}catch(e){}A.pcs.delete(remotePeerId)}
  A.remoteStreams.delete(remotePeerId);
 }

 async function syncPeerConnections(){
  const A=RM.active;if(!A)return;
  const myId=Net.ensurePeerId();
  const remoteIds=new Set((A.participants||[]).map(p=>p.peerId).filter(id=>id!==myId));
  for(const pid of [...A.pcs.keys()]){
   if(!remoteIds.has(pid))closePeerConnection(pid);
  }
  for(const pid of remoteIds){
   const had=A.pcs.has(pid);
   const pc=ensurePeerConnection(pid);
   // Deterministic offer side: lexicographically smaller peerId initiates
   if(!had&&myId<pid){
    try{
     const o=await pc.createOffer();
     await pc.setLocalDescription(o);
     Net.send({type:"rtc:offer",roomId:A.room.id,toPeerId:pid,payload:{sdp:o.sdp}});
    }catch(e){console.warn("[syncPeer]",e)}
   }
  }
 }

 async function negotiateAllPeers(){
  const A=RM.active;if(!A)return;
  for(const [pid,pc] of A.pcs.entries()){
   attachLocalTracksToPc(pc);
   if(pc.signalingState==="stable"){
    try{
     const o=await pc.createOffer();
     await pc.setLocalDescription(o);
     Net.send({type:"rtc:offer",roomId:A.room.id,toPeerId:pid,payload:{sdp:o.sdp}});
    }catch(e){}
   }
  }
 }

 async function replaceVideoTrackAcrossPeers(track,stream){
  const A=RM.active;if(!A)return;
  for(const pc of A.pcs.values()){
   const sender=pc.getSenders().find(s=>s.track&&s.track.kind==="video");
   if(sender){
    await sender.replaceTrack(track).catch(()=>{});
   }else if(track&&stream){
    pc.addTrack(track,stream);
   }
  }
  await negotiateAllPeers();
 }

 async function toggleRoomMic(){
  const A=RM.active;if(!A)return;
  if(!A.localStream||!A.localStream.getAudioTracks().length){
   try{
    const st=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    if(!A.localStream)A.localStream=st;
    else st.getAudioTracks().forEach(t=>A.localStream.addTrack(t));
    for(const pc of A.pcs.values())attachLocalTracksToPc(pc);
    await negotiateAllPeers();
    A.mic=true;
   }catch(e){return toast(rTr("تعذّر تشغيل الميكروفون","Microphone permission required","Micro requis"))}
  }else{
   const t=A.localStream.getAudioTracks()[0];
   t.enabled=!t.enabled;
   A.mic=t.enabled;
  }
  Net.send({type:"rtc:media",roomId:A.room.id,mic:A.mic,cam:A.cam,screen:A.screen});
  paintRoomControls();
 }

 async function toggleRoomCam(){
  const A=RM.active;if(!A)return;
  if(!A.localStream||!A.localStream.getVideoTracks().length){
   try{
    const st=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
    const vt=st.getVideoTracks()[0];
    if(!A.localStream)A.localStream=new MediaStream([vt]);
    else A.localStream.addTrack(vt);
    A.cam=true;
    if(!A.screen)await replaceVideoTrackAcrossPeers(vt,A.localStream);
   }catch(e){return toast(rTr("الكاميرا غير متاحة أو مرفوضة","Camera unavailable or denied","Caméra indisponible"))}
  }else{
   const vt=A.localStream.getVideoTracks()[0];
   vt.enabled=!vt.enabled;
   A.cam=vt.enabled;
  }
  Net.send({type:"rtc:media",roomId:A.room.id,mic:A.mic,cam:A.cam,screen:A.screen});
  paintVideoGrid();paintRoomControls();
 }

 async function toggleRoomScreen(){
  const A=RM.active;if(!A)return;
  if(A.screen&&A.screenStream){
   A.screenStream.getTracks().forEach(t=>t.stop());
   A.screenStream=null;
   A.screen=false;
   const camTrack=(A.localStream&&A.localStream.getVideoTracks()[0])||null;
   await replaceVideoTrackAcrossPeers(camTrack,A.localStream);
   Net.send({type:"rtc:media",roomId:A.room.id,mic:A.mic,cam:A.cam,screen:false});
   paintVideoGrid();paintRoomControls();
   return;
  }
  if(!navigator.mediaDevices||!navigator.mediaDevices.getDisplayMedia){
   return toast(rTr("مشاركة الشاشة غير مدعومة في هذا المتصفح","Screen sharing not supported","Partage d'écran non pris en charge"));
  }
  try{
   const ss=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
   const track=ss.getVideoTracks()[0];
   if(!track)return;
   A.screenStream=ss;
   A.screen=true;
   await replaceVideoTrackAcrossPeers(track,ss);
   Net.send({type:"rtc:media",roomId:A.room.id,mic:A.mic,cam:A.cam,screen:true});
   track.onended=()=>{if(RM.active===A&&A.screen)toggleRoomScreen()};
   paintVideoGrid();paintRoomControls();
  }catch(e){
   if(e&&e.name!=="AbortError"&&e.name!=="NotAllowedError"){
    toast(rTr("تعذّرت مشاركة الشاشة","Could not share screen","Erreur de partage"));
   }
  }
 }

 async function joinStudyRoom(idOrCode,opts){
  opts=opts||{};
  bindWsRoomHandlers();
  if(RM.active)leaveStudyRoom(true);
  let detail;
  try{
   detail=await Net.apiGet("/api/rooms/"+encodeURIComponent(idOrCode));
  }catch(e){
   toast(rTr("الغرفة غير موجودة أو أُغلقت","Study room not found or closed","Salle introuvable"));
   return;
  }
  let localStream=null,mic=false,cam=false;
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&!opts.observer){
   try{
    localStream=await navigator.mediaDevices.getUserMedia({audio:true,video:!!opts.video});
    mic=localStream.getAudioTracks().length>0;
    cam=localStream.getVideoTracks().length>0;
   }catch(e){
    try{
     localStream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
     mic=localStream.getAudioTracks().length>0;
    }catch(_){
     toast(rTr("انضممت في وضع الاستماع (بلا ميكروفون/كاميرا)","Joined in listen mode (no mic/camera)","Rejoint en mode écoute"));
    }
   }
  }
  RM.active={
   room:detail.room,
   participants:detail.room.activeParticipants||[],
   messages:detail.messages||[],
   shared:detail.sharedMaterial||null,
   mic,cam,screen:false,
   localStream,
   screenStream:null,
   pcs:new Map(),
   remoteStreams:new Map(),
   subTab:"stage"
  };
  S.tab="rooms";
  Net.sendHello();
  Net.send({type:"room:join",roomId:detail.room.id,mic,cam,screen:false});
  render();
 }
 window.joinStudyRoom=joinStudyRoom;
 window.openRoomCreator=openRoomCreator;

 function leaveStudyRoom(silent){
  const A=RM.active;if(!A)return;
  RM.active=null;
  Net.send({type:"room:leave",roomId:A.room.id});
  for(const pc of A.pcs.values()){try{pc.close()}catch(e){}}
  A.pcs.clear();A.remoteStreams.clear();
  if(A.screenStream)A.screenStream.getTracks().forEach(t=>t.stop());
  if(A.localStream)A.localStream.getTracks().forEach(t=>t.stop());
  if(!silent){loadRooms();render()}
 }

 // ---- Material Sharing Modal Inside Active Study Room ----
 function openShareMaterialModal(){
  const A=RM.active;if(!A)return;
  const decks=(S.decks||[]).filter(d=>d.cards&&d.cards.length);
  const papers=S.saved||[];
  const list=h("div",{style:"display:grid;gap:8px;max-height:55vh;overflow:auto"});

  if(decks.length){
   list.append(h("div",{class:"lbl"},rTr("حزم البطاقات الدراسية","Flashcard Decks","Paquets de cartes")));
   decks.forEach(dk=>{
    list.append(h("button",{class:"btn",style:"justify-content:space-between;width:100%",type:"button",onclick:()=>{
     const item={kind:"deck",title:dk.title,emoji:dk.emoji||"📘",index:0,revealed:false,cards:dk.cards.slice(0,40)};
     A.shared=item;
     Net.send({type:"study:sync",roomId:A.room.id,item});
     m.remove();paintSharedStage();
     toast(rTr("تمت مشاركة الحزمة في الغرفة ✓","Deck shared to room ✓","Paquet partagé ✓"));
    }},h("span",{dir:"auto"},(dk.emoji||"📘")+" "+dk.title),h("span",{class:"meta"},dk.cards.length+" "+t("cards"))));
   });
  }
  if(papers.length){
   list.append(h("div",{class:"lbl"},rTr("الأوراق والمصادر المحفوظة","Saved Research Papers","Articles enregistrés")));
   papers.slice(0,12).forEach(p=>{
    list.append(h("button",{class:"btn",style:"justify-content:space-between;width:100%",type:"button",onclick:()=>{
     const item={kind:"paper",title:p.title,authors:p.authors||[],year:p.year,journal:p.journal||"",doi:p.doi||"",url:p.url||"",abs:(p.abs||"").slice(0,1200),citation:formatCite(p,S.citeStyle)};
     A.shared=item;
     Net.send({type:"study:sync",roomId:A.room.id,item});
     m.remove();paintSharedStage();
     toast(rTr("تمت مشاركة الورقة البحثية ✓","Research paper shared ✓","Article partagé ✓"));
    }},h("span",{dir:"auto",style:"overflow:hidden;text-overflow:ellipsis;white-space:nowrap"},p.title),h("span",{class:"meta"},p.year||"")));
   });
  }
  if(!decks.length&&!papers.length){
   list.append(h("div",{class:"meta"},rTr("لا توجد حزم أو أوراق محفوظة بعد. يمكنك أيضًا مشاركة شاشتك لمراجعة أي ملف PDF أو ورقة بحثية.","No saved decks or papers yet. You can also share your screen to review any PDF or paper.","Aucun paquet ou article enregistré.")));
  }
  const m=modal(
   h("h3",{},ic("cards")," ",rTr("مشاركة مادة علمية في الغرفة","Share Study Material in Room","Partager du contenu")),
   list,
   h("div",{class:"acts"},h("button",{class:"btn",type:"button",onclick:()=>m.remove()},t("close")))
  );
 }

 // ---- Paint Sub-regions of Active Room without tearing down <video> elements ----
 function paintVideoGrid(){
  const grid=document.getElementById("rm-vgrid");
  const A=RM.active;if(!grid||!A)return;
  const myId=Net.ensurePeerId(),me=Net.myIdentity();
  const tiles=[];

  const mkTile=(id,name,stream,media,isMe)=>{
   const hasVideo=stream&&stream.getVideoTracks().some(t=>t.enabled!==false&&t.readyState==="live");
   const box=h("div",{class:"rm-tile"+(media.screen?" screening":"")+(isMe?" me":"")});
   if(stream){
    const vidEl=h("video",{autoplay:"",playsinline:""});
    vidEl.muted=!!isMe;
    vidEl.srcObject=stream;
    box.append(vidEl);
   }
   if(!hasVideo){
    box.append(h("div",{class:"rm-avatar"},h("span",{},isMe?me.avatar:(media.avatar||"🎓")),h("b",{dir:"auto"},name)));
   }
   box.append(h("div",{class:"rm-tile-bar"},
    h("span",{dir:"auto"},name+(isMe?" ("+rTr("أنت","You","Vous")+")":"")),
    h("span",{class:"rm-tile-flags"},
     media.screen?ic("monitor",{s:14}):null,
     ic(media.mic?"mic":"mic-off",{s:14}),
     ic(media.cam?"camera":"camera-off",{s:14})
    )
   ));
   return box;
  };

  tiles.push(mkTile(myId,me.name,A.screenStream||A.localStream,{mic:A.mic,cam:A.cam,screen:A.screen,avatar:me.avatar},true));
  (A.participants||[]).filter(p=>p.peerId!==myId).forEach(p=>{
   tiles.push(mkTile(p.peerId,p.name||p.handle,A.remoteStreams.get(p.peerId)||null,p,false));
  });
  grid.replaceChildren(...tiles);
 }

 function paintRoomControls(){
  const bar=document.getElementById("rm-controls");
  const A=RM.active;if(!bar||!A)return;
  bar.replaceChildren(
   h("button",{class:"rm-cbtn"+(A.mic?"":" off"),type:"button",onclick:toggleRoomMic,title:rTr("الميكروفون","Microphone","Micro")},ic(A.mic?"mic":"mic-off"),h("span",{},A.mic?rTr("صوت","Mic","Micro"):rTr("صامت","Muted","Muet"))),
   h("button",{class:"rm-cbtn"+(A.cam?"":" off"),type:"button",onclick:toggleRoomCam,title:rTr("الكاميرا","Camera","Caméra")},ic(A.cam?"camera":"camera-off"),h("span",{},rTr("فيديو","Video","Vidéo"))),
   h("button",{class:"rm-cbtn"+(A.screen?" gold-on":""),type:"button",onclick:toggleRoomScreen,title:rTr("مشاركة الشاشة","Share Screen","Partager l'écran")},ic(A.screen?"monitor-off":"monitor"),h("span",{},A.screen?rTr("إيقاف الشاشة","Stop Share","Arrêter"):rTr("مشاركة الشاشة","Share Screen","Écran"))),
   h("button",{class:"rm-cbtn",type:"button",onclick:openShareMaterialModal,title:rTr("مشاركة بطاقات أو ورقة","Share Cards/Paper","Partager")},ic("cards"),h("span",{},rTr("بطاقات/بحث","Material","Contenu"))),
   h("button",{class:"rm-cbtn",type:"button",onclick:()=>copyRoomInvite(A.room),title:rTr("نسخ الدعوة","Copy Invite","Inviter")},ic("link"),h("span",{},rTr("دعوة","Invite","Inviter"))),
   h("button",{class:"rm-cbtn red",type:"button",onclick:()=>leaveStudyRoom(false),title:rTr("مغادرة الغرفة","Leave Room","Quitter")},ic("phone"),h("span",{},rTr("مغادرة","Leave","Quitter")))
  );
 }

 function paintSharedStage(){
  const box=document.getElementById("rm-stage");
  const A=RM.active;if(!box||!A)return;
  const item=A.shared;
  if(!item){
   box.replaceChildren(
    h("div",{class:"rm-empty-stage"},
     ic("cards",{s:34,cls:"gold"}),
     h("b",{},rTr("سبورة المذاكرة الجماعية","Collaborative Study Stage","Tableau collaboratif")),
     h("p",{class:"meta"},rTr("شارك حزمة بطاقات أو تفريغ محاضرة أو ورقة بحثية ليراجعها الجميع معًا في الوقت الفعلي.","Share a flashcard deck, lecture transcript, or research paper to study together in real time.","Partagez un paquet, une transcription ou un article.")),
     h("button",{class:"btn fill",type:"button",onclick:openShareMaterialModal},ic("plus"),rTr("اختر مادة للمشاركة","Pick Study Material","Choisir un contenu"))
    )
   );
   return;
  }

  if(item.kind==="deck"&&Array.isArray(item.cards)&&item.cards.length){
   const idx=Math.max(0,Math.min(item.cards.length-1,item.index|0));
   const card=item.cards[idx];
   const syncDeck=(nextIdx,nextRev)=>{
    const next=Object.assign({},item,{index:nextIdx,revealed:nextRev});
    A.shared=next;
    Net.send({type:"study:sync",roomId:A.room.id,item:next});
    paintSharedStage();
   };
   box.replaceChildren(
    h("div",{class:"rm-stage-card"},
     h("div",{class:"rm-stage-head"},
      h("b",{dir:"auto"},(item.emoji||"📘")+" "+item.title),
      h("span",{class:"meta"},(idx+1)+" / "+item.cards.length)
     ),
     h("div",{class:"rm-flash-q",dir:"auto"},String(card.q||"").replace("_____","＿＿＿")),
     item.revealed?h("div",{class:"rm-flash-a",dir:"auto"},card.a):null,
     card.src&&card.src.t?h("div",{class:"meta",dir:"auto"},"📖 "+card.src.t+(card.src.d?" · DOI: "+card.src.d:"")):null,
     h("div",{class:"btns"},
      h("button",{class:"btn",type:"button",disabled:idx<=0,onclick:()=>syncDeck(idx-1,false)},rTr("السابق","Prev","Préc.")),
      h("button",{class:"btn fill",type:"button",onclick:()=>syncDeck(idx,!item.revealed)},item.revealed?rTr("إخفاء الجواب","Hide Answer","Masquer"):rTr("أظهر الإجابة للجميع","Reveal for All","Révéler")),
      h("button",{class:"btn",type:"button",disabled:idx>=item.cards.length-1,onclick:()=>syncDeck(idx+1,false)},rTr("التالي","Next","Suiv.")),
      h("button",{class:"btn",type:"button",onclick:()=>{
       const created=newDeck(item.title,item.cards.map(c=>Object.assign({},c,{id:uid(),sr:undefined})),{emoji:item.emoji||"📘"});
       toast(rTr("أُضيفت الحزمة إلى حزمي ✓","Saved deck to My Decks ✓","Paquet enregistré ✓"));
      }},ic("download"),rTr("حفظ لحزمي","Save Deck","Enregistrer"))
     )
    )
   );
   return;
  }

  if(item.kind==="transcript"){
   const segs=Array.isArray(item.segments)?item.segments:[];
   const pts=Array.isArray(item.summaryPoints)?item.summaryPoints:[];
   box.replaceChildren(
    h("div",{class:"rm-stage-card"},
     h("div",{class:"rm-stage-head"},
      h("b",{dir:"auto"},"🎙️ "+(item.title||rTr("تفريغ محاضرة","Lecture Transcript","Transcription"))),
      item.confidence!=null?h("span",{class:"badge g"},item.confidence+"% "+rTr("موثوقية","Confidence","Confiance")):null
     ),
     pts.length?h("ul",{class:"rm-tr-pts",dir:"auto"},pts.slice(0,5).map(pt=>h("li",{},pt))):null,
     segs.length?h("div",{class:"rm-tr-segs"},segs.slice(0,15).map(sg=>h("p",{dir:"auto"},
      sg.t!=null?h("span",{class:"lec-t"},pad(Math.floor(sg.t/60))+":"+pad(Math.floor(sg.t%60))):null," ",sg.text
     ))):h("div",{class:"pbody",dir:"auto"},item.text||""),
     Array.isArray(item.cards)&&item.cards.length?h("div",{class:"btns"},
      h("button",{class:"btn fill",type:"button",onclick:()=>{
       newDeck(item.title||"Lecture",item.cards.map(c=>({id:uid(),t:"q",q:c.q,a:c.a,src:{t:item.title,own:1}})),{emoji:"🎙️"});
       toast(rTr("تم حفظ بطاقات المحاضرة ✓","Lecture cards saved ✓","Cartes enregistrées ✓"));
      }},ic("cards"),rTr("حفظ البطاقات ("+item.cards.length+")","Save Cards ("+item.cards.length+")","Enregistrer"))
     ):null
    )
   );
   return;
  }

  // Research paper
  box.replaceChildren(
   h("div",{class:"rm-stage-card"},
    h("div",{class:"rm-stage-head"},
     h("b",{dir:"auto"},"📄 "+(item.title||"")),
     item.year?h("span",{class:"meta"},String(item.year)):null
    ),
    item.authors&&item.authors.length?h("div",{class:"meta",dir:"auto"},item.authors.slice(0,5).join(", ")):null,
    item.citation?h("div",{class:"cite",dir:"auto"},item.citation):null,
    item.abs?h("div",{class:"pbody",dir:"auto",style:"margin-top:8px"},item.abs):null,
    item.doi||item.url?h("div",{class:"btns"},
     h("a",{class:"btn",href:item.doi?"https://doi.org/"+encodeURI(item.doi):item.url,target:"_blank",rel:"noopener noreferrer"},ic("link"),rTr("تحقّق من المصدر","Verify Source","Vérifier"))
    ):null
   )
  );
 }

 function paintRoomChat(){
  const log=document.getElementById("rm-chatlog");
  const A=RM.active;if(!log||!A)return;
  const myId=Net.ensurePeerId();
  if(!(A.messages||[]).length){
   log.replaceChildren(h("div",{class:"meta",style:"text-align:center;padding:18px"},rTr("ابدأ النقاش الأكاديمي مع المشاركين في الغرفة…","Start the scholarly discussion with participants…","Commencez la discussion…")));
   return;
  }
  log.replaceChildren(...A.messages.map(m=>{
   const me=m.peerId===myId;
   return h("div",{class:"rm-msg"+(me?" me":"")},
    h("div",{class:"rm-msg-h"},h("b",{dir:"auto"},m.name||m.handle),h("small",{},new Date(m.createdAt).toLocaleTimeString(S.lang,{hour:"2-digit",minute:"2-digit"}))),
    h("div",{class:"rm-msg-b",dir:"auto"},m.text)
   );
  }));
  log.scrollTop=log.scrollHeight;
 }

 function renderActiveRoomUI(){
  if(S.tab==="rooms"&&RM.active)render();
 }

 function renderActiveRoom(v){
  const A=RM.active,room=A.room;
  const header=h("div",{class:"rm-top"},
   h("div",{class:"rm-top-info"},
    h("div",{class:"rm-live-dot"},h("i",{}),rTr("جلسة مباشرة","LIVE STUDY ROOM","EN DIRECT")," · ",h("span",{dir:"ltr"},room.code)),
    h("h2",{dir:"auto"},room.title),
    h("div",{class:"rm-top-meta"},Net.discLabel(room.field)," · ",String((A.participants||[]).length||1)," ",rTr("مشارك","participants","participants"))
   ),
   h("button",{class:"btn",style:"color:#fff;border-color:rgba(255,255,255,.4)",type:"button",onclick:()=>leaveStudyRoom(false)},rTr("اللوبي","Lobby","Lobby"))
  );

  const vgrid=h("div",{class:"rm-vgrid",id:"rm-vgrid"});
  const controls=h("div",{class:"rm-controls",id:"rm-controls"});

  const stage=h("div",{class:"rm-stage",id:"rm-stage"});
  const chatLog=h("div",{class:"rm-chatlog",id:"rm-chatlog"});
  const chatInp=h("input",{class:"cin",placeholder:rTr("اكتب رسالة أو اقتباسًا في الغرفة…","Message or share a citation…","Écrire un message…"),maxlength:"1500",enterkeyhint:"send"});
  const sendChat=()=>{
   const txt=chatInp.value.trim();if(!txt)return;
   chatInp.value="";
   Net.send({type:"chat:send",roomId:room.id,id:uid(),text:txt});
  };
  chatInp.onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)sendChat()};
  const chatWrap=h("div",{class:"rm-chatwrap"},
   chatLog,
   h("div",{class:"ccomp"},chatInp,h("button",{class:"sendb",type:"button","aria-label":rTr("إرسال","Send","Envoyer"),onclick:sendChat},ic("send")))
  );

  const subTabs=h("div",{class:"tabs rm-subtabs"},
   h("button",{class:A.subTab==="stage"?"on":"",type:"button",onclick:()=>{A.subTab="stage";render()}},ic("cards")," ",rTr("المادة المشتركة","Shared Board","Tableau")),
   h("button",{class:A.subTab==="chat"?"on":"",type:"button",onclick:()=>{A.subTab="chat";render()}},ic("message")," ",rTr("الدردشة الفورية","Room Chat","Discussion")+(A.messages.length?" ("+A.messages.length+")":""))
  );

  const side=h("div",{class:"rm-side"},
   subTabs,
   h("div",{class:"rm-pane"+(A.subTab==="stage"?" show":"")},stage),
   h("div",{class:"rm-pane"+(A.subTab==="chat"?" show":"")},chatWrap)
  );

  const layout=h("div",{class:"rm-workspace"},
   h("div",{class:"rm-main"},vgrid,controls),
   side
  );

  v.append(header,layout);
  paintVideoGrid();
  paintRoomControls();
  paintSharedStage();
  paintRoomChat();
 }

 // ---- Lobby View ----
 function renderRooms(v){
  if(RM.active)return renderActiveRoom(v);
  if(!RM.rooms.length&&!RM.loading)loadRooms();

  const codeInp=h("input",{class:"in",dir:"ltr",placeholder:rTr("أدخل رمز الغرفة (مثال: ABC-123)","Enter room code (e.g. ABC-123)","Code de salle"),onkeydown:e=>{if(e.key==="Enter"&&codeInp.value.trim())joinStudyRoom(codeInp.value.trim())}});

  v.append(h("div",{class:"hero"},
   h("div",{class:"eyebrow"},ic("video")," ",rTr("مؤتمرات وغرف دراسة سكايب الأكاديمية","ACADEMIC VIDEO & STUDY ROOMS","SALLES D'ÉTUDE VIDÉO")),
   h("h1",{},rTr("غرف الدراسة والمناقشة المباشرة","Live Study Rooms & Video Consultations","Salles d'étude et appels vidéo")),
   h("p",{},rTr("تواصل بالفيديو والصوت ومشاركة الشاشة لمراجعة البطاقات، تفريغ المحاضرات، والأبحاث العلمية مع زملائك حول العالم.","Host or join WebRTC video study sessions with screen sharing, synced flashcard review, and instant room chat.","Sessions vidéo collaboratives avec partage d'écran, fiches synchronisées et discussion en direct.")),
   h("div",{class:"btns"},
    h("button",{class:"pri",style:"width:auto;margin-top:0;padding:10px 18px",type:"button",onclick:()=>openRoomCreator({scheduled:false})},ic("video"),rTr("بدء غرفة دراسة فورية","Launch Study Room","Lancer une salle")),
    h("button",{class:"btn",style:"color:#fff;border-color:rgba(255,255,255,.55)",type:"button",onclick:()=>openRoomCreator({scheduled:true})},ic("calendar-plus"),rTr("جدولة جلسة","Schedule Session","Planifier"))
   )
  ));

  v.append(h("div",{class:"card"},
   h("div",{class:"lbl",style:"margin-top:0"},rTr("انضم عبر رمز الغرفة أو الرابط","Join by Room Code","Rejoindre par code")),
   h("div",{style:"display:flex;gap:8px;align-items:center"},
    codeInp,
    h("button",{class:"btn fill",type:"button",onclick:()=>{if(codeInp.value.trim())joinStudyRoom(codeInp.value.trim())}},rTr("انضمام","Join","Rejoindre"))
   )
  ));

  // Discipline filter chips
  v.append(h("div",{class:"tscroll"},Net.DISCIPLINES.map(d=>
   h("button",{class:"tchip"+(RM.filterField===d.id?" on":""),type:"button",onclick:()=>{RM.filterField=d.id;loadRooms();render()}},d[S.lang]||d.en)
  )));

  v.append(h("div",{class:"seg",role:"tablist"},
   [["all",rTr("الكل","All","Tout")],["live",rTr("مباشرة الآن","Live Now","En direct")],["scheduled",rTr("مجدولة","Scheduled","Planifiées")]].map(([k,lab])=>
    h("button",{class:RM.filterMode===k?"on":"",type:"button",onclick:()=>{RM.filterMode=k;render()}},lab)
   )
  ));

  const myId=Net.ensurePeerId();
  let list=RM.rooms.slice();
  if(RM.filterMode==="live")list=list.filter(r=>(r.activeParticipants&&r.activeParticipants.length>0)||!r.scheduledAt);
  if(RM.filterMode==="scheduled")list=list.filter(r=>Boolean(r.scheduledAt));

  v.append(h("div",{class:"sec"},h("span",{},rTr("الغرف المتاحة","Available Study Rooms","Salles disponibles")),h("button",{class:"btn",type:"button",onclick:loadRooms},rTr("تحديث","Refresh","Actualiser"))));

  if(RM.loading&&!list.length){
   v.append(h("div",{class:"msg"},"⏳"));
   return;
  }
  if(!list.length){
   v.append(h("div",{class:"card cempty"},
    ic("video",{s:34}),
    h("b",{},rTr("لا توجد غرف دراسة في هذا التخصص بعد","No study rooms in this field yet","Aucune salle dans cette discipline")),
    h("div",{class:"meta"},rTr("أنشئ أول غرفة فورية أو مجدولة وشارك رمزها مع زملائك.","Create the first live or scheduled study room and invite peers.","Créez la première salle d'étude.")),
    h("button",{class:"pri",type:"button",onclick:()=>openRoomCreator({field:RM.filterField})},ic("plus"),rTr("إنشاء غرفة دراسة","Create Study Room","Créer une salle"))
   ));
   return;
  }

  list.forEach(room=>{
   const activeCnt=(room.activeParticipants&&room.activeParticipants.length)||0;
   const isHost=room.hostId===myId;
   const when=room.scheduledAt?new Date(room.scheduledAt).toLocaleString(S.lang,{dateStyle:"medium",timeStyle:"short"}):rTr("فورية الآن","Instant Session","En cours");
   v.append(h("article",{class:"card room-card"},
    h("div",{class:"room-card-head"},
     h("div",{class:"room-badges"},
      activeCnt>0?h("span",{class:"room-live-badge"},h("i",{}),activeCnt+" "+rTr("متصل الآن","active","en ligne")):null,
      h("span",{class:"kchip"},Net.discLabel(room.field)),
      room.visibility==="private"?h("span",{class:"badge n"},ic("lock",{s:12}),rTr("خاصة","Private","Privée")):null
     ),
     h("span",{class:"meta",dir:"ltr"},room.code)
    ),
    h("h3",{dir:"auto"},room.title),
    room.description?h("div",{class:"pbody",dir:"auto"},room.description):null,
    h("div",{class:"meta"},
     rTr("المضيف: ","Host: "),room.hostName," · ",when," · ",String(room.durationMin||60)," ",rTr("د","min","min"),
     room.linkedItem?(" · "+rTr("مادة مرفقة: ","Attached: ")+(room.linkedItem.title||"")):""
    ),
    h("div",{class:"btns"},
     h("button",{class:"btn fill",type:"button",onclick:()=>joinStudyRoom(room.id)},ic("video"),rTr("دخول الغرفة","Join Video Room","Rejoindre")),
     h("button",{class:"btn",type:"button",onclick:()=>copyRoomInvite(room)},ic("link"),rTr("نسخ الدعوة","Copy Invite","Inviter")),
     room.scheduledAt?h("button",{class:"btn",type:"button",onclick:()=>downloadRoomIcs(room)},ic("calendar"),rTr("للتقويم","Calendar (.ics)","Calendrier")):null,
     isHost?h("button",{class:"btn danger",type:"button",onclick:async()=>{if(!confirm(rTr("إغلاق الغرفة للجميع؟","Close this room?","Fermer la salle ?")))return;await Net.apiDel("/api/rooms/"+encodeURIComponent(room.id)+"?peerId="+encodeURIComponent(myId));loadRooms()}},ic("trash")):null
    )
   ));
  });
 }

 VIEWS.rooms=renderRooms;
 buildTabs();
})();
