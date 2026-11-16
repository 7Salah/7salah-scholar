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

 // ---- Academic Focus Timer (Pomodoro, Sound Presets & Room Sync Engine) ----
 const FT_SOUNDS=[
  {id:"chime",kind:"chime",ar:"رنين جرس ناعم",en:"Soft Chime",fr:"Carillon doux"},
  {id:"singing-bowl",kind:"chime",ar:"وعاء تأمّل رنّان",en:"Singing Bowl",fr:"Bol tibétain"},
  {id:"rain",kind:"nature",ar:"مطر هادئ (طبيعة)",en:"Gentle Rain (Nature)",fr:"Pluie douce (Nature)"},
  {id:"waves",kind:"nature",ar:"أمواج البحر (طبيعة)",en:"Ocean Waves (Nature)",fr:"Vagues de l'océan (Nature)"},
  {id:"forest",kind:"nature",ar:"نسيم الغابة والطيور (طبيعة)",en:"Forest Breeze & Birds (Nature)",fr:"Brise forestière (Nature)"},
  {id:"mute",kind:"mute",ar:"صامت (إشعار مرئي فقط)",en:"Silent (Visual Only)",fr:"Silencieux (Visuel)"}
 ];

 const _savedSound=LS.get("7s_ft_sound","chime");
 const _savedVol=Number(LS.get("7s_ft_volume",0.75));
 const _savedGoalHr=Number(LS.get("7s_ft_daily_goal_hr",2));
 const _todayInit=dkey(new Date());
 const _savedDailyLog=LS.get("7s_ft_daily_log",{});
 const _initDailySec=(_savedDailyLog&&typeof _savedDailyLog==="object"&&Number(_savedDailyLog[_todayInit])>0)?Math.floor(Number(_savedDailyLog[_todayInit])):0;
 const _savedSessions=LS.get("7s_ft_sessions",[]);
 const FT={
  durationMin:25,
  totalSec:25*60,
  remainingSec:25*60,
  running:false,
  completed:false,
  autoStartRoom:true,
  endAtMs:0,
  tickId:null,
  syncRoomId:null,
  sound:FT_SOUNDS.some(s=>s.id===_savedSound)?_savedSound:"chime",
  volume:Number.isFinite(_savedVol)?Math.min(1,Math.max(0,_savedVol)):0.75,
  dailyGoalHr:(Number.isFinite(_savedGoalHr)&&_savedGoalHr>=0.25&&_savedGoalHr<=16)?Math.round(_savedGoalHr*100)/100:2,
  dailyDate:_todayInit,
  dailySec:_initDailySec,
  lastTrackMs:0,
  sessionRunSec:0,
  sessions:Array.isArray(_savedSessions)?_savedSessions.filter(x=>x&&typeof x==="object"&&Number(x.durationSec)>0).slice(0,60):[],
  _lastPersistMs:0,
  goalNotifiedDate:String(LS.get("7s_ft_goal_notified","")||""),
  _audio:null,
  subscribers:new Set()
 };

 function prefersReducedMotion(){
  try{return Boolean(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)}catch(_){return false}
 }

 function triggerAchievementShine(el,opts){
  if(!el||!el.classList)return;
  opts=opts||{};
  el.classList.add("goal-shine-host");
  if(opts.persistGlow)el.classList.add("goal-achieved-glow");
  if(prefersReducedMotion()){
   el.classList.add("goal-shine-active");
   setTimeout(()=>{try{el.classList.remove("goal-shine-active")}catch(_){}},900);
   return;
  }
  el.classList.remove("goal-shine-active");
  void el.offsetWidth;
  el.classList.add("goal-shine-active");
  const sweep=document.createElement("div");
  sweep.className="goal-shine-sweep";
  sweep.setAttribute("aria-hidden","true");
  const layer=document.createElement("div");
  layer.className="goal-sparkle-layer";
  layer.setAttribute("aria-hidden","true");
  const count=Math.min(14,Math.max(6,Number(opts.count)||9));
  const colors=["#facc15","#22c55e","#fde047","#60a5fa"];
  for(let i=0;i<count;i++){
   const sp=document.createElement("span");
   sp.className="goal-sparkle";
   const x=(8+Math.random()*84).toFixed(1)+"%";
   const y=(14+Math.random()*72).toFixed(1)+"%";
   const delay=(i*0.045+Math.random()*0.08).toFixed(2)+"s";
   const dur=(0.65+Math.random()*0.35).toFixed(2)+"s";
   sp.style.cssText=`left:${x};top:${y};--sp-delay:${delay};--sp-dur:${dur};--sp-clr:${colors[i%colors.length]}`;
   layer.append(sp);
  }
  el.append(sweep,layer);
  setTimeout(()=>{
   try{sweep.remove();layer.remove();el.classList.remove("goal-shine-active")}catch(_){}
  },1150);
 }
 window.triggerAchievementShine=triggerAchievementShine;

 function fmtTimerSec(sec){
  const s=Math.max(0,Math.ceil(Number(sec)||0));
  const m=Math.floor(s/60);
  const r=s%60;
  return pad(m)+":"+pad(r);
 }

 function fmtStudiedTime(sec){
  const total=Math.max(0,Math.floor(Number(sec)||0));
  const hrs=Math.floor(total/3600);
  const mins=Math.floor((total%3600)/60);
  const secs=total%60;
  if(S.lang==="ar"){
   if(hrs>0)return hrs+" س "+(mins>0?mins+" د":"");
   if(mins>0)return mins+" د "+secs+" ث";
   return secs+" ث";
  }
  if(hrs>0)return hrs+"h "+(mins>0?mins+"m":"");
  if(mins>0)return mins+"m "+secs+"s";
  return secs+"s";
 }

 function getTimerExactProgress(){
  const total=Math.max(1,Number(FT.totalSec)||1);
  if(FT.completed){
   return {totalSec:total,remainingExactSec:0,elapsedExactSec:total,pct:100};
  }
  const nowMs=Date.now();
  const remExact=FT.running&&FT.endAtMs
   ?Math.min(total,Math.max(0,(FT.endAtMs-nowMs)/1000))
   :Math.min(total,Math.max(0,Number(FT.remainingSec)||0));
  const elapsedExact=Math.min(total,Math.max(0,total-remExact));
  const pct=Math.min(100,Math.max(0,(elapsedExact/total)*100));
  return {totalSec:total,remainingExactSec:remExact,elapsedExactSec:elapsedExact,pct};
 }

 function ensureTodayDailyLog(){
  const today=dkey(new Date());
  if(FT.dailyDate!==today){
   FT.dailyDate=today;
   const log=LS.get("7s_ft_daily_log",{});
   FT.dailySec=(log&&typeof log==="object"&&Number(log[today])>0)?Math.floor(Number(log[today])):0;
   FT.lastTrackMs=FT.running?Date.now():0;
  }
 }

 function saveDailyStudySec(){
  const prev=LS.get("7s_ft_daily_log",{});
  const next=(prev&&typeof prev==="object"&&!Array.isArray(prev))?Object.assign({},prev):{};
  next[FT.dailyDate]=FT.dailySec;
  const keys=Object.keys(next).sort();
  if(keys.length>14){
   keys.slice(0,keys.length-14).forEach(k=>{delete next[k]});
  }
  LS.set("7s_ft_daily_log",next);
 }

 function saveFocusSessions(){
  FT.sessions=FT.sessions.slice(0,60);
  LS.set("7s_ft_sessions",FT.sessions);
 }

 function recordFocusSession(durationSec,completed){
  const dur=Math.max(0,Math.round(Number(durationSec)||0));
  if(dur<10&&!completed)return null;
  const roomTitle=(RM.active&&RM.active.room&&RM.active.room.title)||"";
  const discipline=(RM.active&&RM.active.room&&RM.active.room.field)||"";
  const entry={
   id:"fs_"+uid(),
   ts:Date.now(),
   date:dkey(new Date()),
   durationSec:Math.max(1,dur),
   targetSec:Math.max(1,Number(FT.totalSec)||Math.round(FT.durationMin*60)),
   completed:Boolean(completed),
   roomTitle,
   discipline
  };
  FT.sessions.unshift(entry);
  saveFocusSessions();
  return entry;
 }

 function getFocusStatsSummary(){
  ensureTodayDailyLog();
  const today=FT.dailyDate;
  const log=LS.get("7s_ft_daily_log",{});
  const subSec=(FT.running&&FT.lastTrackMs)?Math.max(0,(Date.now()-FT.lastTrackMs)/1000):0;
  const todaySec=Math.max(0,FT.dailySec+subSec);
  const days=[];
  let weekSec=0;
  for(let i=6;i>=0;i--){
   const d=new Date();
   d.setDate(d.getDate()-i);
   const dk=dkey(d);
   const sec=dk===today?todaySec:Math.max(0,Number(log&&log[dk])||0);
   weekSec+=sec;
   days.push({dateKey:dk,dateObj:d,sec});
  }
  const todaySessions=FT.sessions.filter(s=>s.date===today);
  const completedAll=FT.sessions.filter(s=>s.completed);
  const completedToday=todaySessions.filter(s=>s.completed).length;
  const avgSec=FT.sessions.length
   ?Math.round(FT.sessions.reduce((sum,s)=>sum+(Number(s.durationSec)||0),0)/FT.sessions.length)
   :0;
  return{
   todaySec,
   weekSec,
   todayCount:todaySessions.length,
   completedToday,
   totalSessions:FT.sessions.length,
   totalCompleted:completedAll.length,
   avgSec,
   days,
   recent:FT.sessions.slice(0,20)
  };
 }
 window.getFocusStatsSummary=getFocusStatsSummary;

 function flushFocusTrackedTime(forceSave,nowOverride){
  ensureTodayDailyLog();
  if(!FT.running||!FT.lastTrackMs)return;
  const nowMs=nowOverride!=null?nowOverride:Date.now();
  const capMs=FT.endAtMs?Math.min(nowMs,FT.endAtMs):nowMs;
  const deltaMs=capMs-FT.lastTrackMs;
  if(deltaMs>=1000){
   const wholeSec=Math.floor(deltaMs/1000);
   FT.lastTrackMs+=wholeSec*1000;
   FT.dailySec+=wholeSec;
   FT.sessionRunSec=(FT.sessionRunSec||0)+wholeSec;
   const goalSec=Math.max(1,Math.round(FT.dailyGoalHr*3600));
   if(FT.dailySec>=goalSec&&FT.goalNotifiedDate!==FT.dailyDate){
    FT.goalNotifiedDate=FT.dailyDate;
    LS.set("7s_ft_goal_notified",FT.dailyDate);
    toast(rTr("مبارك! حقّقت هدف الدراسة اليومي ("+FT.dailyGoalHr+" س) 🎯","Daily Study Goal Reached ("+FT.dailyGoalHr+"h)! 🎯","Objectif quotidien atteint ("+FT.dailyGoalHr+" h) ! 🎯"));
   }
   if(forceSave||nowMs-FT._lastPersistMs>=4000){
    saveDailyStudySec();
    FT._lastPersistMs=nowMs;
   }
  }else if(forceSave){
   saveDailyStudySec();
   FT._lastPersistMs=nowMs;
  }
 }

 function setDailyStudyGoalHours(hours){
  const hVal=Math.round(Math.min(16,Math.max(0.25,Number(hours)||2))*100)/100;
  ensureTodayDailyLog();
  FT.dailyGoalHr=hVal;
  LS.set("7s_ft_daily_goal_hr",hVal);
  const goalSec=Math.max(1,Math.round(hVal*3600));
  if(FT.dailySec<goalSec&&FT.goalNotifiedDate===FT.dailyDate){
   FT.goalNotifiedDate="";
   LS.set("7s_ft_goal_notified","");
  }
  notifyTimerSubscribers();
  return hVal;
 }

 function stopFocusAudio(keepAmbientFlag){
  const cur=FT._audio;
  FT._audio=null;
  if(!keepAmbientFlag)FT.ambientPlaying=false;
  if(cur){
   if(cur.stopTimer)clearTimeout(cur.stopTimer);
   if(cur.loopInterval)clearInterval(cur.loopInterval);
   if(cur.nodes){
    cur.nodes.forEach(n=>{try{if(n.stop)n.stop()}catch(e){}try{if(n.disconnect)n.disconnect()}catch(e){}});
   }
   try{
    if(cur.master&&cur.ctx){
     cur.master.gain.setTargetAtTime(0.0001,cur.ctx.currentTime,0.04);
    }
   }catch(e){}
   setTimeout(()=>{try{if(cur.ctx&&cur.ctx.state!=="closed")cur.ctx.close()}catch(e){}},120);
   notifyTimerSubscribers();
  }
 }

 function createPinkNoiseBuffer(ctx,seconds){
  const len=Math.max(1,Math.floor(ctx.sampleRate*seconds));
  const buf=ctx.createBuffer(1,len,ctx.sampleRate);
  const data=buf.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for(let i=0;i<len;i++){
   const w=Math.random()*2-1;
   b0=0.99886*b0+w*0.0555179;
   b1=0.99332*b1+w*0.0750759;
   b2=0.96900*b2+w*0.1538520;
   b3=0.86650*b3+w*0.3104856;
   b4=0.55000*b4+w*0.5329522;
   b5=-0.7616*b5-w*0.0168980;
   data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.08;
   b6=w*0.115926;
  }
  return buf;
 }

 function playFocusSound(soundId,volumeOverride,opts){
  opts=opts||{};
  const sid=FT_SOUNDS.some(s=>s.id===soundId)?soundId:FT.sound;
  const vol=Math.min(1,Math.max(0,volumeOverride!=null?Number(volumeOverride):FT.volume));
  const loop=Boolean(opts.loop);
  stopFocusAudio();
  if(sid==="mute"||(vol<=0.01&&!loop))return false;

  try{
   const AC=window.AudioContext||window.webkitAudioContext;
   if(!AC)return false;
   const ctx=new AC();
   if(ctx.state==="suspended")ctx.resume().catch(()=>{});

   const master=ctx.createGain();
   master.gain.setValueAtTime(vol<=0.005?0.0001:vol,ctx.currentTime);
   master.connect(ctx.destination);

   const nodes=[];
   const preview=Boolean(opts.isPreview);
   let durationMs=preview?3800:6500;
   let loopInterval=null;

   const triggerChimeBurst=()=>{
    const notes=[523.25,659.25,783.99,1046.50];
    const base=ctx.currentTime;
    notes.forEach((freq,idx)=>{
     const osc=ctx.createOscillator();
     const gain=ctx.createGain();
     osc.type="sine";
     osc.frequency.value=freq;
     const t0=base+idx*0.15;
     gain.gain.setValueAtTime(0.0001,t0);
     gain.gain.exponentialRampToValueAtTime(0.24,t0+0.035);
     gain.gain.exponentialRampToValueAtTime(0.0001,t0+0.85);
     osc.connect(gain);
     gain.connect(master);
     osc.start(t0);
     osc.stop(t0+0.9);
     nodes.push(osc);
    });
   };

   const triggerBowlBurst=()=>{
    const totalSec=3.6;
    [[216,0.28],[432,0.14],[648,0.06]].forEach(([freq,amp])=>{
     const osc=ctx.createOscillator();
     const gain=ctx.createGain();
     osc.type="sine";
     osc.frequency.value=freq;
     const t0=ctx.currentTime;
     gain.gain.setValueAtTime(0.0001,t0);
     gain.gain.linearRampToValueAtTime(amp,t0+0.25);
     gain.gain.exponentialRampToValueAtTime(0.0001,t0+totalSec-0.1);
     osc.connect(gain);
     gain.connect(master);
     osc.start(t0);
     osc.stop(t0+totalSec);
     nodes.push(osc);
    });
   };

   const triggerBirdChirp=(off,idx)=>{
    const osc=ctx.createOscillator();
    const cg=ctx.createGain();
    const t0=ctx.currentTime+off;
    const f0=idx%2===0?1950:2250;
    osc.type="sine";
    osc.frequency.setValueAtTime(f0,t0);
    osc.frequency.exponentialRampToValueAtTime(f0*1.28,t0+0.09);
    osc.frequency.exponentialRampToValueAtTime(f0*0.92,t0+0.21);
    cg.gain.setValueAtTime(0.0001,t0);
    cg.gain.exponentialRampToValueAtTime(0.12,t0+0.04);
    cg.gain.exponentialRampToValueAtTime(0.0001,t0+0.24);
    osc.connect(cg);cg.connect(master);
    osc.start(t0);osc.stop(t0+0.26);
    nodes.push(osc);
   };

   if(sid==="chime"){
    if(loop){
     triggerChimeBurst();
     loopInterval=setInterval(()=>{if(FT._audio&&FT._audio.ctx===ctx)triggerChimeBurst()},4200);
    }else{
     const rounds=preview?1:2;
     durationMs=rounds===2?3600:1850;
     for(let r=0;r<rounds;r++){
      const base=ctx.currentTime+r*1.55;
      [523.25,659.25,783.99,1046.50].forEach((freq,idx)=>{
       const osc=ctx.createOscillator();
       const gain=ctx.createGain();
       osc.type="sine";
       osc.frequency.value=freq;
       const t0=base+idx*0.15;
       gain.gain.setValueAtTime(0.0001,t0);
       gain.gain.exponentialRampToValueAtTime(0.24,t0+0.035);
       gain.gain.exponentialRampToValueAtTime(0.0001,t0+0.85);
       osc.connect(gain);
       gain.connect(master);
       osc.start(t0);
       osc.stop(t0+0.9);
       nodes.push(osc);
      });
     }
    }
   }else if(sid==="singing-bowl"){
    if(loop){
     triggerBowlBurst();
     loopInterval=setInterval(()=>{if(FT._audio&&FT._audio.ctx===ctx)triggerBowlBurst()},4400);
    }else{
     durationMs=preview?3600:5400;
     const totalSec=durationMs/1000;
     [[216,0.28],[432,0.14],[648,0.06]].forEach(([freq,amp])=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.type="sine";
      osc.frequency.value=freq;
      const t0=ctx.currentTime;
      gain.gain.setValueAtTime(0.0001,t0);
      gain.gain.linearRampToValueAtTime(amp,t0+0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001,t0+totalSec-0.1);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0+totalSec);
      nodes.push(osc);
     });
    }
   }else if(sid==="rain"){
    const totalSec=loop?8:(durationMs/1000);
    const src=ctx.createBufferSource();
    src.buffer=createPinkNoiseBuffer(ctx,Math.ceil(totalSec)+1);
    src.loop=loop;
    const bp=ctx.createBiquadFilter();
    bp.type="bandpass";
    bp.frequency.value=950;
    bp.Q.value=0.65;
    const env=ctx.createGain();
    env.gain.setValueAtTime(0.0001,ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.55,ctx.currentTime+0.5);
    if(!loop){
     env.gain.setValueAtTime(0.55,ctx.currentTime+Math.max(0.8,totalSec-0.8));
     env.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+totalSec);
    }
    src.connect(bp);bp.connect(env);env.connect(master);
    src.start(ctx.currentTime);
    if(!loop)src.stop(ctx.currentTime+totalSec);
    nodes.push(src);
   }else if(sid==="waves"){
    const totalSec=loop?8:(durationMs/1000);
    const src=ctx.createBufferSource();
    src.buffer=createPinkNoiseBuffer(ctx,Math.ceil(totalSec)+1);
    src.loop=loop;
    const lp=ctx.createBiquadFilter();
    lp.type="lowpass";
    lp.frequency.value=480;
    const swellGain=ctx.createGain();
    swellGain.gain.value=0.35;
    const lfo=ctx.createOscillator();
    const lfoDepth=ctx.createGain();
    lfo.frequency.value=0.28;
    lfoDepth.gain.value=0.26;
    lfo.connect(lfoDepth);
    lfoDepth.connect(swellGain.gain);
    const env=ctx.createGain();
    env.gain.setValueAtTime(0.0001,ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.95,ctx.currentTime+0.6);
    if(!loop){
     env.gain.setValueAtTime(0.95,ctx.currentTime+Math.max(0.9,totalSec-0.9));
     env.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+totalSec);
    }
    src.connect(lp);lp.connect(swellGain);swellGain.connect(env);env.connect(master);
    src.start(ctx.currentTime);
    lfo.start(ctx.currentTime);
    if(!loop){
     src.stop(ctx.currentTime+totalSec);
     lfo.stop(ctx.currentTime+totalSec);
    }
    nodes.push(src,lfo);
   }else if(sid==="forest"){
    const totalSec=loop?8:(durationMs/1000);
    const src=ctx.createBufferSource();
    src.buffer=createPinkNoiseBuffer(ctx,Math.ceil(totalSec)+1);
    src.loop=loop;
    const bp=ctx.createBiquadFilter();
    bp.type="bandpass";
    bp.frequency.value=620;
    bp.Q.value=0.9;
    const windEnv=ctx.createGain();
    windEnv.gain.setValueAtTime(0.0001,ctx.currentTime);
    windEnv.gain.linearRampToValueAtTime(0.28,ctx.currentTime+0.5);
    if(!loop){
     windEnv.gain.setValueAtTime(0.28,ctx.currentTime+Math.max(0.7,totalSec-0.7));
     windEnv.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+totalSec);
    }
    src.connect(bp);bp.connect(windEnv);windEnv.connect(master);
    src.start(ctx.currentTime);
    if(!loop)src.stop(ctx.currentTime+totalSec);
    nodes.push(src);

    if(loop){
     triggerBirdChirp(0.45,0);
     triggerBirdChirp(1.6,1);
     let chirpIdx=2;
     loopInterval=setInterval(()=>{
      if(FT._audio&&FT._audio.ctx===ctx)triggerBirdChirp(0.1,chirpIdx++);
     },2400);
    }else{
     const chirpOffsets=preview?[0.4,1.35,2.4]:[0.45,1.5,2.7,4.1,5.2];
     chirpOffsets.forEach((off,idx)=>{
      if(off+0.35<=totalSec)triggerBirdChirp(off,idx);
     });
    }
   }

   const handle={ctx,master,nodes,isPreview:preview,loop,soundId:sid,stopTimer:null,loopInterval};
   if(!loop){
    handle.stopTimer=setTimeout(()=>{
     if(FT._audio===handle)stopFocusAudio();
    },durationMs+80);
   }
   FT.ambientPlaying=loop;
   FT._audio=handle;
   notifyTimerSubscribers();
   return true;
  }catch(e){
   return false;
  }
 }

 function setFocusVolume(pctVal){
  const pct=Math.min(100,Math.max(0,Math.round(Number(pctVal)||0)));
  FT.volume=pct/100;
  if(FT.volume>0.01)FT._lastNonZeroVol=FT.volume;
  LS.set("7s_ft_volume",FT.volume);
  if(FT._audio&&FT._audio.master&&FT._audio.ctx){
   try{
    FT._audio.master.gain.setTargetAtTime(FT.volume<=0.005?0.0001:FT.volume,FT._audio.ctx.currentTime,0.03);
   }catch(_){}
  }
  notifyTimerSubscribers();
  return pct;
 }
 window.setFocusVolume=setFocusVolume;

 window.FT_SOUNDS=FT_SOUNDS;
 window.playFocusSound=playFocusSound;
 window.stopFocusAudio=stopFocusAudio;

 function requestTimerNotificationPermission(){
  try{
   if(typeof Notification!=="undefined"&&Notification.permission==="default"){
    Notification.requestPermission().catch(()=>{});
   }
  }catch(e){}
 }

 function showFocusCompleteAlert(){
  const existing=document.getElementById("ft-complete-toast");
  if(existing)existing.remove();
  const title=rTr("انتهى وقت جلسة التركيز!","Focus Timer Complete!","Minuteur de concentration terminé !");
  const body=rTr(
   "أحسنت! أتممت "+(Math.round(FT.durationMin*10)/10)+" دقيقة من الدراسة المركّزة. خذ استراحة قصيرة أو ابدأ جولة جديدة.",
   "Great work! You completed "+(Math.round(FT.durationMin*10)/10)+" min of focused study. Take a short break or start another round.",
   "Bravo ! Session de "+(Math.round(FT.durationMin*10)/10)+" min terminée."
  );

  try{
   if(typeof Notification!=="undefined"&&Notification.permission==="granted"){
    new Notification("7Salah Scholar · "+title,{body,icon:"icon-192.png",tag:"7s-focus-timer"});
   }
  }catch(e){}
  playFocusSound(FT.sound,FT.volume,{isPreview:false});
  toast(title);

  const card=h("div",{id:"ft-complete-toast",class:"ft-notify-pop",role:"alert","aria-live":"assertive"},
   h("div",{class:"ft-notify-head"},
    h("span",{class:"ft-notify-ic"},ic("bell",{s:18})),
    h("div",{class:"ft-notify-tx"},
     h("b",{},title),
     h("div",{class:"meta"},body)
    ),
    h("button",{type:"button",class:"ft-notify-x","aria-label":t("close"),onclick:()=>{stopFocusAudio();card.remove()}},ic("x",{s:15}))
   ),
   h("div",{class:"btns"},
    h("button",{type:"button",class:"btn",onclick:()=>{stopFocusAudio();card.remove();setTimerDuration(5,false);startFocusTimer(false)}},ic("hourglass",{s:14}),rTr("استراحة 5 د","5m Break","Pause 5m")),
    h("button",{type:"button",class:"btn fill",onclick:()=>{stopFocusAudio();card.remove();setTimerDuration(FT.durationMin,false);startFocusTimer(false)}},ic("play",{s:14}),rTr("جولة جديدة","Restart","Relancer"))
   )
  );
  document.body.append(card);
 }

 function notifyTimerSubscribers(){
  for(const fn of [...FT.subscribers]){
   try{fn()}catch(e){FT.subscribers.delete(fn)}
  }
  const pill=document.getElementById("rm-timer-pill");
  if(pill){
   pill.replaceChildren(ic("clock",{s:14})," ",fmtTimerSec(FT.remainingSec));
   pill.className="rm-timer-pill"+(FT.running?" running":"")+(FT.completed?" done":"");
  }
 }

 function broadcastTimerState(action){
  if(!RM.active||!RM.active.room)return;
  Net.send({
   type:"room:timer",
   roomId:RM.active.room.id,
   timer:{
    action,
    durationMin:FT.durationMin,
    totalSec:FT.totalSec,
    remainingSec:FT.remainingSec,
    running:FT.running,
    endAtMs:FT.endAtMs
   }
  });
 }

 function stopTickLoop(){
  if(FT.tickId){
   clearInterval(FT.tickId);
   FT.tickId=null;
  }
 }

 function tickFocusTimer(){
  if(!FT.running)return;
  const nowMs=Date.now();
  const remMs=FT.endAtMs-nowMs;
  if(remMs<=0){
   flushFocusTrackedTime(true,FT.endAtMs||nowMs);
   const loggedDur=Math.max(FT.sessionRunSec||0,FT.totalSec);
   recordFocusSession(loggedDur,true);
   FT.sessionRunSec=0;
   FT.remainingSec=0;
   FT.running=false;
   FT.lastTrackMs=0;
   FT.completed=true;
   stopTickLoop();
   notifyTimerSubscribers();
   showFocusCompleteAlert();
   return;
  }
  flushFocusTrackedTime(false,nowMs);
  FT.remainingSec=Math.ceil(remMs/1000);
  notifyTimerSubscribers();
 }

 function setTimerDuration(minutes,fromRemote){
  const m=Math.min(180,Math.max(0.05,Number(minutes)||25));
  if(FT.running)flushFocusTrackedTime(true);
  if(FT.sessionRunSec>=10)recordFocusSession(FT.sessionRunSec,false);
  FT.sessionRunSec=0;
  stopTickLoop();
  FT.durationMin=m;
  FT.totalSec=Math.max(3,Math.round(m*60));
  FT.remainingSec=FT.totalSec;
  FT.running=false;
  FT.completed=false;
  FT.endAtMs=0;
  FT.lastTrackMs=0;
  notifyTimerSubscribers();
  if(!fromRemote&&RM.active)broadcastTimerState("set");
 }

 function startFocusTimer(fromRemote){
  if(FT.remainingSec<=0){
   FT.remainingSec=FT.totalSec||Math.max(3,Math.round(FT.durationMin*60));
  }
  ensureTodayDailyLog();
  FT.completed=false;
  FT.running=true;
  FT.endAtMs=Date.now()+FT.remainingSec*1000;
  FT.lastTrackMs=Date.now();
  requestTimerNotificationPermission();
  stopTickLoop();
  FT.tickId=setInterval(tickFocusTimer,120);
  notifyTimerSubscribers();
  if(!fromRemote&&RM.active)broadcastTimerState("start");
 }

 function pauseFocusTimer(fromRemote){
  if(!FT.running)return;
  flushFocusTrackedTime(true);
  FT.remainingSec=Math.max(0,Math.ceil((FT.endAtMs-Date.now())/1000));
  FT.running=false;
  FT.lastTrackMs=0;
  stopTickLoop();
  notifyTimerSubscribers();
  if(!fromRemote&&RM.active)broadcastTimerState("pause");
 }

 function resetFocusTimer(fromRemote){
  if(FT.running)flushFocusTrackedTime(true);
  if(FT.sessionRunSec>=10)recordFocusSession(FT.sessionRunSec,false);
  FT.sessionRunSec=0;
  stopTickLoop();
  FT.running=false;
  FT.completed=false;
  FT.totalSec=Math.max(3,Math.round(FT.durationMin*60));
  FT.remainingSec=FT.totalSec;
  FT.endAtMs=0;
  FT.lastTrackMs=0;
  notifyTimerSubscribers();
  if(!fromRemote&&RM.active)broadcastTimerState("reset");
 }

 function openFocusStatsModal(){
  const body=h("div",{class:"ft-stats-modal"});
  const paintStats=()=>{
   const st=getFocusStatsSummary();
   const dn=(window.T0&&T0[S.lang]&&T0[S.lang].dn)||["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
   const goalSec=Math.max(1,Math.round(FT.dailyGoalHr*3600));
   const maxBarSec=Math.max(goalSec,...st.days.map(x=>x.sec),60);

   const kpis=h("div",{class:"ft-stats-kpis"},
    h("div",{class:"ft-stats-kpi"},h("b",{},fmtStudiedTime(st.todaySec).trim()),h("small",{},rTr("دراسة اليوم","Studied Today","Aujourd'hui"))),
    h("div",{class:"ft-stats-kpi"},h("b",{},String(st.completedToday)+" / "+String(st.totalCompleted)),h("small",{},rTr("جلسات مكتملة","Completed Sessions","Terminées"))),
    h("div",{class:"ft-stats-kpi"},h("b",{},fmtStudiedTime(st.avgSec).trim()),h("small",{},rTr("متوسط الجلسة","Avg. Session","Moyenne"))),
    h("div",{class:"ft-stats-kpi"},h("b",{},fmtStudiedTime(st.weekSec).trim()),h("small",{},rTr("إجمالي 7 أيام","7-Day Total","7 derniers jours")))
   );

   const chart=h("div",{class:"ft-stats-chart-card"},
    h("div",{class:"ft-stats-head"},
     h("b",{style:"font-size:13px"},rTr("تقرير وقت الدراسة خلال آخر 7 أيام","7-Day Focus Study Chart","Activité sur 7 jours")),
     h("span",{class:"meta"},rTr("الهدف اليومي: ","Daily Goal: ")+FT.dailyGoalHr+" "+rTr("س","h","h"))
    ),
    h("div",{class:"ft-stats-chart"},st.days.map(d=>{
     const pctH=d.sec>0?Math.max(6,Math.min(100,Math.round((d.sec/maxBarSec)*100))):0;
     const mins=Math.round(d.sec/60);
     const goalMet=d.sec>=goalSec;
     return h("div",{class:"ft-stats-bar-col"},
      h("span",{class:"ft-stats-bar-val"},mins>0?(mins>=60?(Math.round((d.sec/3600)*10)/10)+(S.lang==="ar"?"س":"h"):mins+(S.lang==="ar"?"د":"m")):""),
      h("div",{class:"ft-stats-bar-track"},
       h("div",{class:"ft-stats-bar-fill"+(goalMet?" goal-met":""),style:"height:"+pctH+"%"})
      ),
      h("span",{class:"ft-stats-bar-day"},dn[d.dateObj.getDay()])
     );
    }))
   );

   const logList=st.recent.length
    ?h("div",{class:"ft-stats-log"},st.recent.map(entry=>{
      const dt=new Date(entry.ts);
      const timeStr=dt.toLocaleDateString(S.lang,{month:"short",day:"numeric"})+" · "+dt.toLocaleTimeString(S.lang,{hour:"2-digit",minute:"2-digit"});
      const label=entry.roomTitle||rTr("جلسة تركيز دراسية","Focused Study Session","Session d'étude");
      return h("div",{class:"ft-stats-row"},
       h("div",{class:"ft-stats-row-main"},
        h("b",{dir:"auto"},(entry.completed?"✓ ":"· ")+label),
        h("small",{},timeStr+" · "+(entry.completed?rTr("مكتملة","Completed","Terminée"):rTr("جزئية","Partial","Partielle")))
       ),
       h("span",{class:"ft-stats-row-dur"},fmtStudiedTime(entry.durationSec).trim())
      );
     }))
    :h("div",{class:"meta",style:"text-align:center;padding:12px"},rTr("لم تُسجّل جلسات بعد. شغّل مؤقت التركيز لتبدأ الإحصائيات تلقائيًا.","No focus sessions recorded yet. Start the focus timer to build your study report.","Aucune session enregistrée."));

   body.replaceChildren(
    kpis,
    chart,
    h("div",{class:"ft-stats-head"},
     h("b",{style:"font-size:13px"},rTr("سجل جلسات التركيز الأخيرة","Recent Focus Sessions","Sessions récentes")),
     st.totalSessions?h("button",{type:"button",class:"btn ft-stats-report-btn",onclick:async()=>{
      const lines=[
       "7Salah Scholar — "+(rTr("تقرير إحصائيات التركيز","Focus Study Report","Rapport d'étude")),
       rTr("اليوم: ","Today: ")+fmtStudiedTime(st.todaySec).trim(),
       rTr("إجمالي الأسبوع: ","7-Day Total: ")+fmtStudiedTime(st.weekSec).trim(),
       rTr("جلسات مكتملة: ","Completed Sessions: ")+st.totalCompleted+" / "+st.totalSessions,
       rTr("متوسط الجلسة: ","Average Session: ")+fmtStudiedTime(st.avgSec).trim()
      ];
      try{await navigator.clipboard.writeText(lines.join("\n"));toast(rTr("تم نسخ تقرير الدراسة ✓","Study report copied ✓","Rapport copié ✓"))}catch(_){}
     }},ic("clipboard",{s:13}),rTr("نسخ التقرير","Copy Report","Copier")):null
    ),
    logList
   );
  };
  paintStats();
  const clearBtn=h("button",{type:"button",class:"btn danger",onclick:()=>{
   if(!FT.sessions.length)return;
   if(!confirm(rTr("مسح سجل جلسات التركيز؟","Clear focus session history?","Effacer l'historique ?")))return;
   FT.sessions=[];
   saveFocusSessions();
   paintStats();
   notifyTimerSubscribers();
  }},ic("trash",{s:14}),rTr("مسح السجل","Clear Log","Effacer"));

  const m=modal(
   h("h3",{},ic("award")," ",rTr("إحصائيات جلسة التركيز وتقرير الدراسة","Focus Session Statistics & Study Report","Statistiques d'étude")),
   body,
   h("div",{class:"acts"},clearBtn,h("button",{class:"btn",type:"button",onclick:()=>m.remove()},t("close")))
  );
  return m;
 }
 window.openFocusStatsModal=openFocusStatsModal;

 function buildFocusTimerWidget(opts){
  opts=opts||{};
  const showRoomToggle=Boolean(opts.showRoomToggle);
  const clockEl=h("div",{class:"ft-clock",dir:"ltr"},fmtTimerSec(FT.remainingSec));
  const statusEl=h("span",{class:"ft-status"});
  const fillEl=h("div",{class:"ft-progress-fill"});
  const timerProgressEl=h("div",{class:"ft-progress"},fillEl);
  const bannerEl=h("div",{class:"ft-complete-banner",role:"alert",style:"display:none"});

  const customInp=h("input",{
   type:"number",
   class:"in ft-custom-in",
   dir:"ltr",
   min:"0.05",
   max:"180",
   step:"any",
   value:String(FT.durationMin),
   "aria-label":rTr("مدة المؤقت بالدقائق","Focus timer duration in minutes","Durée en minutes")
  });

  const applyCustomBtn=h("button",{type:"button",class:"btn",onclick:()=>{
   const v=parseFloat(customInp.value);
   if(!Number.isFinite(v)||v<0.05||v>180){
    return toast(rTr("أدخل مدة بين 0.05 و 180 دقيقة","Enter a duration between 0.05 and 180 min","Entre 0.05 et 180 min"));
   }
   setTimerDuration(v,false);
   if(typeof opts.onDurationChange==="function")opts.onDurationChange(v);
  }},rTr("ضبط","Set","Régler"));

  const presetBtns=[15,25,45,60].map(mins=>
   h("button",{type:"button",class:"ft-preset"+(Math.abs(FT.durationMin-mins)<0.01?" on":""),onclick:()=>{
    customInp.value=String(mins);
    setTimerDuration(mins,false);
    if(typeof opts.onDurationChange==="function")opts.onDurationChange(mins);
   }},mins+" "+rTr("د","m","m"))
  );

  const toggleBtn=h("button",{type:"button",class:"btn fill ft-main-btn",onclick:()=>{
   if(FT.running)pauseFocusTimer(false);
   else startFocusTimer(false);
  }});

  const resetBtn=h("button",{type:"button",class:"btn",onclick:()=>resetFocusTimer(false)},ic("repeat",{s:14}),rTr("إعادة","Reset","Réinitialiser"));

  const autoChk=showRoomToggle?h("input",{
   type:"checkbox",
   checked:FT.autoStartRoom,
   onchange:e=>{
    FT.autoStartRoom=Boolean(e.target.checked);
    if(typeof opts.onToggleAuto==="function")opts.onToggleAuto(FT.autoStartRoom);
   }
  }):null;

  const soundSel=h("select",{
   class:"in ft-sound-sel",
   "aria-label":rTr("صوت الخلفية وتنبيه انتهاء الجلسة","Ambient & end-of-session sound","Son d'ambiance et notification"),
   onchange:e=>{
    const wasLooping=Boolean(FT._audio&&FT._audio.loop);
    FT.sound=e.target.value;
    LS.set("7s_ft_sound",FT.sound);
    if(wasLooping&&FT.sound!=="mute"){
     playFocusSound(FT.sound,FT.volume,{loop:true});
    }else if(FT._audio){
     stopFocusAudio();
    }
    notifyTimerSubscribers();
   }
  },FT_SOUNDS.map(s=>h("option",{value:s.id,selected:FT.sound===s.id?"selected":null},s[S.lang]||s.en)));

  const previewBtn=h("button",{
   type:"button",
   class:"btn ft-preview-btn",
   onclick:()=>{
    if(FT._audio&&!FT._audio.loop){
     stopFocusAudio();
     return;
    }
    if(FT.sound==="mute"||FT.volume<=0.01){
     return toast(rTr("اختر نغمة أو ارفع مستوى الصوت للمعاينة","Select a sound or raise volume to preview","Choisissez un son pour écouter"));
    }
    playFocusSound(FT.sound,FT.volume,{isPreview:true});
   }
  });

  const ambientBtn=h("button",{
   type:"button",
   class:"btn ft-ambient-btn",
   onclick:()=>{
    if(FT._audio&&FT._audio.loop){
     stopFocusAudio();
     return;
    }
    if(FT.sound==="mute"){
     return toast(rTr("اختر نغمة طبيعة أو رنين لتشغيل الخلفية","Select a nature or chime sound first","Choisissez d'abord un son"));
    }
    if(FT.volume<=0.01)setFocusVolume(Math.round((FT._lastNonZeroVol||0.75)*100));
    playFocusSound(FT.sound,FT.volume,{loop:true});
   }
  });

  const volPct=h("span",{class:"meta ft-vol-pct",dir:"ltr"},Math.round(FT.volume*100)+"%");
  const volMuteBtn=h("button",{
   type:"button",
   class:"ft-vol-mute",
   "aria-label":rTr("كتم أو استعادة الصوت","Toggle mute","Couper / rétablir le son"),
   onclick:()=>{
    if(FT.volume>0.01){
     setFocusVolume(0);
    }else{
     setFocusVolume(Math.round((FT._lastNonZeroVol||0.75)*100));
    }
   }
  },ic(FT.volume<=0.01?"volume-x":"volume",{s:15}));

  const volSlider=h("input",{
   type:"range",
   class:"ft-vol-slider",
   min:"0",
   max:"100",
   step:"1",
   value:String(Math.round(FT.volume*100)),
   style:"--vol-pct:"+Math.round(FT.volume*100)+"%",
   "aria-label":rTr("شدة صوت الطبيعة والرنين","Ambient nature and chime volume","Intensité du son"),
   oninput:e=>{
    setFocusVolume(e.target.value);
   }
  });

  const goalStatEl=h("span",{class:"ft-goal-stat"});
  const goalFillEl=h("div",{class:"ft-goal-fill"});
  const goalProgressEl=h("div",{class:"ft-goal-progress"},goalFillEl);
  const goalParticleLayer=h("div",{class:"ft-goal-particles","aria-hidden":"true"});
  const goalProgressWrap=h("div",{class:"ft-goal-progress-wrap"},goalProgressEl,goalParticleLayer);
  const goalSubEl=h("div",{class:"meta ft-goal-sub"});
  const _initGoalSec=Math.max(1,Math.round(FT.dailyGoalHr*3600));
  let prevGoalReached=FT.dailySec>=_initGoalSec;
  let prevTimerCompleted=FT.completed;
  let celebrateTimer=null;

  function spawnGoalParticles(){
   if(prefersReducedMotion()){
    goalProgressWrap.classList.add("celebrating");
    if(celebrateTimer)clearTimeout(celebrateTimer);
    celebrateTimer=setTimeout(()=>goalProgressWrap.classList.remove("celebrating"),600);
    return;
   }
   const palette=["#facc15","#22c55e","#3b82f6","#f59e0b","#fde047","#34d399"];
   const burst=h("div",{class:"ft-particle-burst"});
   for(let i=0;i<22;i++){
    const leftPct=6+(i/21)*88;
    const tx=((Math.random()-0.5)*76).toFixed(1)+"px";
    const ty=(-22-Math.random()*54).toFixed(1)+"px";
    const rot=Math.round((Math.random()-0.5)*520)+"deg";
    const delay=(Math.random()*0.18).toFixed(2)+"s";
    const dur=(0.75+Math.random()*0.45).toFixed(2)+"s";
    const sc=(0.75+Math.random()*0.7).toFixed(2);
    const clr=palette[i%palette.length];
    const shape=i%3===0?" round":(i%3===1?" star":"");
    burst.append(h("span",{
     class:"ft-particle"+shape,
     style:`left:${leftPct.toFixed(1)}%;--tx:${tx};--ty:${ty};--rot:${rot};--delay:${delay};--dur:${dur};--sc:${sc};--clr:${clr}`
    }));
   }
   goalParticleLayer.append(burst);
   goalProgressWrap.classList.add("celebrating");
   if(celebrateTimer)clearTimeout(celebrateTimer);
   celebrateTimer=setTimeout(()=>{
    goalProgressWrap.classList.remove("celebrating");
   },1100);
   setTimeout(()=>{
    try{burst.remove()}catch(_){}
   },1450);
  }
  const goalInp=h("input",{
   type:"number",
   class:"in ft-goal-in",
   dir:"ltr",
   min:"0.25",
   max:"16",
   step:"0.25",
   value:String(FT.dailyGoalHr),
   "aria-label":rTr("الهدف اليومي للدراسة بالساعات","Daily study goal in hours","Objectif quotidien en heures")
  });
  const applyGoal=()=>{
   const v=parseFloat(goalInp.value);
   if(!Number.isFinite(v)||v<0.25||v>16){
    return toast(rTr("أدخل هدفًا بين 0.25 و 16 ساعة","Enter a daily goal between 0.25 and 16 hours","Entre 0.25 et 16 heures"));
   }
   const saved=setDailyStudyGoalHours(v);
   goalInp.value=String(saved);
   toast(rTr("تم ضبط الهدف اليومي: "+saved+" ساعة ✓","Daily study goal set: "+saved+"h ✓","Objectif réglé : "+saved+" h ✓"));
  };
  goalInp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();applyGoal()}});
  const applyGoalBtn=h("button",{type:"button",class:"btn",onclick:applyGoal},rTr("حفظ","Set","Régler"));
  const goalPresetBtns=[1,2,3,4].map(hrs=>
   h("button",{type:"button",class:"ft-goal-chip"+(Math.abs(FT.dailyGoalHr-hrs)<0.01?" on":""),onclick:()=>{
    goalInp.value=String(hrs);
    setDailyStudyGoalHours(hrs);
   }},hrs+" "+rTr("س","h","h"))
  );

  const statTodayEl=h("b",{},"0");
  const statSessionsEl=h("b",{},"0");
  const statWeekEl=h("b",{},"0");
  const statsReportBtn=h("button",{type:"button",class:"btn ft-stats-report-btn",onclick:()=>openFocusStatsModal()},ic("award",{s:13}),rTr("التقرير المفصّل","Full Report","Rapport"));

  const goalBoxEl=h("div",{class:"ft-goal-box"},
   h("div",{class:"ft-goal-head"},
    h("span",{class:"ft-goal-lbl"},ic("target",{s:14}),rTr("الهدف اليومي للدراسة (ساعات):","Daily Study Goal (Hours):","Objectif quotidien (h) :")),
    goalStatEl
   ),
   goalProgressWrap,
   h("div",{class:"ft-goal-row"},
    h("div",{class:"ft-goal-presets"},goalPresetBtns),
    goalInp,
    applyGoalBtn
   ),
   goalSubEl
  );

  let card=null;

  function paintWidget(){
   ensureTodayDailyLog();
   const prog=getTimerExactProgress();
   clockEl.textContent=fmtTimerSec(FT.running?Math.ceil(prog.remainingExactSec):FT.remainingSec);
   fillEl.style.width=prog.pct.toFixed(3)+"%";
   fillEl.className="ft-progress-fill"+(FT.completed||prog.pct>=100?" done":"");
   timerProgressEl.className="ft-progress"+(FT.completed||prog.pct>=100?" done":"");

   const goalSec=Math.max(1,Math.round(FT.dailyGoalHr*3600));
   const subSec=(FT.running&&FT.lastTrackMs)?Math.max(0,(Date.now()-FT.lastTrackMs)/1000):0;
   const liveGoalSec=FT.dailySec+subSec;
   const goalPctRaw=Math.min(100,Math.max(0,(liveGoalSec/goalSec)*100));
   const goalPctLabel=Math.min(100,Math.round(goalPctRaw));
   const goalReached=liveGoalSec>=goalSec;
   goalStatEl.textContent=fmtStudiedTime(liveGoalSec).trim()+" / "+FT.dailyGoalHr+" "+rTr("س","h","h")+" ("+(goalReached?"100":goalPctRaw<10&&goalPctRaw>0?goalPctRaw.toFixed(1):goalPctLabel)+"%)";
   goalStatEl.className="ft-goal-stat"+(goalReached?" done":"");
   goalFillEl.style.width=goalPctRaw.toFixed(3)+"%";
   goalFillEl.className="ft-goal-fill"+(FT.running&&!goalReached?" active":"")+(goalReached?" done":"");
   goalProgressEl.className="ft-goal-progress"+(goalReached?" done":"");
   goalBoxEl.className="ft-goal-box goal-shine-host"+(goalReached?" goal-complete":"");
   if(!prevGoalReached&&goalReached){
    spawnGoalParticles();
    triggerAchievementShine(goalBoxEl,{persistGlow:true,count:10});
   }
   prevGoalReached=goalReached;

   if(!prevTimerCompleted&&FT.completed&&card){
    triggerAchievementShine(card,{count:9});
   }
   prevTimerCompleted=FT.completed;

   goalSubEl.textContent=goalReached
    ?rTr("تم تحقيق هدف الدراسة اليومي! أحسنت 👏","Daily study goal reached! Great job 👏","Objectif quotidien atteint ! Bravo 👏")
    :rTr("يُحتسب التقدّم بسلاسة بالثواني المنقضية أثناء عمل المؤقت","Progress updates smoothly second-by-second while the timer runs","Progression continue suivie seconde par seconde");
   goalPresetBtns.forEach((b,idx)=>{
    const hrs=[1,2,3,4][idx];
    b.className="ft-goal-chip"+(Math.abs(FT.dailyGoalHr-hrs)<0.01?" on":"");
   });

   const stats=getFocusStatsSummary();
   statTodayEl.textContent=fmtStudiedTime(stats.todaySec).trim();
   statSessionsEl.textContent=String(stats.completedToday)+(stats.totalSessions?" / "+stats.totalSessions:"");
   statWeekEl.textContent=fmtStudiedTime(stats.weekSec).trim();

   presetBtns.forEach((b,idx)=>{
    const mins=[15,25,45,60][idx];
    b.className="ft-preset"+(Math.abs(FT.durationMin-mins)<0.01?" on":"");
   });

   if(soundSel.value!==FT.sound)soundSel.value=FT.sound;
   const isPreviewPlaying=Boolean(FT._audio&&!FT._audio.loop);
   const isLoopPlaying=Boolean(FT._audio&&FT._audio.loop);
   const volPercent=Math.round(FT.volume*100);
   const isSoundMuted=FT.sound==="mute";
   if(String(volSlider.value)!==String(volPercent))volSlider.value=String(volPercent);
   volSlider.disabled=isSoundMuted;
   volSlider.style.setProperty("--vol-pct",volPercent+"%");
   volSlider.className="ft-vol-slider"+(isSoundMuted||volPercent===0?" muted":"");
   volPct.textContent=volPercent+"%";
   volMuteBtn.disabled=isSoundMuted;
   volMuteBtn.replaceChildren(ic(isSoundMuted||volPercent===0?"volume-x":"volume",{s:15}));

   previewBtn.disabled=isSoundMuted&&!isPreviewPlaying;
   previewBtn.replaceChildren(
    ic(isPreviewPlaying?"square":(isSoundMuted?"volume-x":"play"),{s:14}),
    isPreviewPlaying?rTr("إيقاف","Stop","Arrêter"):rTr("معاينة","Preview","Écouter")
   );

   ambientBtn.disabled=isSoundMuted&&!isLoopPlaying;
   ambientBtn.className="btn ft-ambient-btn"+(isLoopPlaying?" fill":"");
   ambientBtn.replaceChildren(
    ic(isLoopPlaying?"square":"headphones",{s:14}),
    isLoopPlaying?rTr("إيقاف الخلفية","Stop Loop","Arrêter"):rTr("خلفية مستمرة","Ambient Loop","Ambiance")
   );

   if(FT.completed){
    statusEl.className="ft-status done";
    statusEl.textContent=rTr("انتهى الوقت!","Time's Up!","Temps écoulé !");
    bannerEl.style.display="flex";
    bannerEl.replaceChildren(
     ic("bell",{s:16}),
     h("span",{},rTr("انتهت جلسة التركيز — حان وقت الراحة أو المراجعة!","Focus session ended — time for a break or recap!","Session terminée !"))
    );
   }else{
    bannerEl.style.display="none";
    statusEl.className="ft-status"+(FT.running?" running":"");
    statusEl.textContent=FT.running
     ?rTr("يعمل الآن","Running","En cours")
     :FT.remainingSec<FT.totalSec
      ?rTr("متوقف مؤقتًا","Paused","En pause")
      :rTr("جاهز للبدء","Ready","Prêt");
   }

   toggleBtn.replaceChildren(
    ic(FT.running?"hourglass":"play",{s:15}),
    FT.running?rTr("إيقاف مؤقت","Pause","Pause"):(FT.remainingSec<FT.totalSec&&FT.remainingSec>0?rTr("استئناف","Resume","Reprendre"):rTr("بدء المؤقت","Start Timer","Démarrer"))
   );
  }

  const statsBoxEl=h("div",{class:"ft-stats-box"},
   h("div",{class:"ft-stats-head"},
    h("span",{class:"ft-stats-title"},ic("award",{s:14}),rTr("إحصائيات جلسة التركيز","Focus Session Statistics","Statistiques d'étude")),
    statsReportBtn
   ),
   h("div",{class:"ft-stats-strip"},
    h("div",{class:"ft-stat-cell"},statTodayEl,h("small",{},rTr("دراسة اليوم","Today","Aujourd'hui"))),
    h("div",{class:"ft-stat-cell"},statSessionsEl,h("small",{},rTr("جلسات اليوم / الكل","Sessions","Sessions"))),
    h("div",{class:"ft-stat-cell"},statWeekEl,h("small",{},rTr("آخر 7 أيام","7 Days","7 jours")))
   )
  );

  card=h("div",{class:"ft-card goal-shine-host"},
   h("div",{class:"ft-head"},
    h("div",{class:"ft-title"},ic("clock",{s:16}),h("b",{},rTr("مؤقت التركيز (Pomodoro)","Study Focus Timer","Minuteur d'étude"))),
    statusEl
   ),
   clockEl,
   timerProgressEl,
   bannerEl,
   h("div",{class:"ft-presets"},presetBtns),
   h("div",{class:"ft-custom-row"},
    h("label",{class:"meta"},rTr("مدة مخصصة (بالدقائق):","Custom (min):","Durée (min) :")),
    customInp,
    applyCustomBtn
   ),
   goalBoxEl,
   statsBoxEl,
   h("div",{class:"ft-sound-box"},
    h("label",{class:"meta ft-sound-lbl"},ic("volume",{s:14}),rTr("أصوات الطبيعة والرنين الهادئ (خلفية وتنبيه):","Ambient & Notification Sounds (Nature / Soft Chime):","Sons d'ambiance et notification :")),
    h("div",{class:"ft-sound-row"},soundSel,previewBtn,ambientBtn),
    h("div",{class:"ft-vol-row"},
     h("span",{class:"meta"},rTr("شدة الصوت:","Sound Intensity:","Intensité :")),
     volMuteBtn,
     volSlider,
     volPct
    )
   ),
   h("div",{class:"ft-actions"},toggleBtn,resetBtn),
   showRoomToggle?h("label",{class:"meta ft-auto-row"},autoChk,h("span",{},rTr("بدء المؤقت تلقائيًا عند دخول غرفة الدراسة","Auto-start focus timer when room starts","Démarrer avec la salle"))):null
  );

  FT.subscribers.add(paintWidget);
  paintWidget();

  card._cleanup=()=>FT.subscribers.delete(paintWidget);
  return card;
 }

 function openFocusTimerModal(isRoomSync){
  const widget=buildFocusTimerWidget({showRoomToggle:false});
  const m=modal(
   h("h3",{},ic("clock")," ",isRoomSync?rTr("مؤقت التركيز المشترك للغرفة","Synced Room Focus Timer","Minuteur partagé"):rTr("مؤقت التركيز للدراسة","Study Focus Timer","Minuteur d'étude")),
   widget,
   h("div",{class:"acts"},h("button",{class:"btn",type:"button",onclick:()=>{if(widget._cleanup)widget._cleanup();m.remove()}},t("close")))
  );
  return m;
 }
 window.openFocusTimerModal=openFocusTimerModal;

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

 function getLocalRooms(){return (LS.get("7s_local_rooms",[])||[]).filter(r=>r&&r.id)}
 function saveLocalRoom(room){
  const list=getLocalRooms().filter(r=>r.id!==room.id);
  list.unshift(room);
  LS.set("7s_local_rooms",list.slice(0,40));
 }
 function removeLocalRoom(id){
  LS.set("7s_local_rooms",getLocalRooms().filter(r=>r.id!==id));
 }
 function genLocalRoomCode(){
  const ch="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let a="",b="";
  for(let i=0;i<3;i++){a+=ch[Math.random()*ch.length|0];b+=ch[Math.random()*ch.length|0]}
  return a+"-"+b;
 }

 async function loadRooms(){
  RM.loading=true;
  let serverRooms=[];
  try{
   const q=new URLSearchParams();
   if(RM.filterField)q.set("field",RM.filterField);
   q.set("peerId",Net.ensurePeerId());
   const r=await Net.apiGet("/api/rooms?"+q.toString());
   serverRooms=r.rooms||[];
  }catch(e){}
  const locals=getLocalRooms().filter(r=>!RM.filterField||(r.field||"").toLowerCase().includes(RM.filterField.toLowerCase()));
  const seen=new Set(serverRooms.map(x=>x.id));
  RM.rooms=serverRooms.concat(locals.filter(x=>!seen.has(x.id)));
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

  // Study Venue (optional Google Maps Place)
  let selectedVenue=preset.venue||null;
  const venueLabel=h("div",{class:"meta"},selectedVenue?("📍 "+selectedVenue.name):rTr("افتراضي عبر الإنترنت (اختياري: اربط مكتبة أو مكان دراسة من الخريطة)","Online / Optional: pick a library or campus venue on map","En ligne / facultatif"));
  const pickVenueBtn=h("button",{type:"button",class:"btn",onclick:()=>{
   if(!window.StudyMaps)return toast(rTr("خريطة الدراسة قيد التهيئة","Maps module unavailable","Carte indisponible"));
   window.StudyMaps.openStudyMapModal({
    initialQuery:fd.value?(fd.value+" university library"):undefined,
    onPickVenue:v=>{
     selectedVenue=v;
     venueLabel.textContent="📍 "+v.name+(v.address?" · "+v.address:"");
    }
   });
  }},ic("map",{s:15}),rTr("اختيار مكان على الخريطة","Pick Venue on Map","Choisir sur la carte"));
  const venueRow=h("div",{class:"ft-venue-row"},venueLabel,pickVenueBtn);

  // Embedded Focus Timer Component inside Study Room Modal
  let focusAutoStart=FT.autoStartRoom;
  const focusWidget=buildFocusTimerWidget({
   showRoomToggle:true,
   onToggleAuto:v=>{focusAutoStart=v}
  });

  const closeCreator=()=>{
   if(focusWidget._cleanup)focusWidget._cleanup();
   m.remove();
  };

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
   const payload={
    title,
    field:fd.value,
    description:desc.value.trim(),
    hostId:me.id,
    hostName:me.name,
    hostHandle:me.username,
    visibility:vis.value,
    scheduledAt:isSched.checked&&dt.value?new Date(dt.value).toISOString():null,
    durationMin:+dur.value||60,
    focusDurationMin:FT.durationMin,
    venue:selectedVenue,
    linkedItem
   };
   let createdRoom=null;
   try{
    let tok=null;
    if(window.ScholarAuth&&typeof window.ScholarAuth.getFreshIdToken==="function"){
     tok=await window.ScholarAuth.getFreshIdToken().catch(()=>null);
    }
    if(tok){
     const rawRes=await fetch("/api/rooms",{
      method:"POST",
      cache:"no-store",
      headers:{"Content-Type":"application/json","Accept":"application/json","Authorization":"Bearer "+tok},
      body:JSON.stringify(payload)
     });
     const j=await rawRes.json().catch(()=>({}));
     if(!rawRes.ok){
      const err=new Error(j.error||"Request failed");
      err.status=rawRes.status;
      throw err;
     }
     createdRoom=j&&j.room;
    }else{
     const res=await Net.apiPost("/api/rooms",payload);
     createdRoom=res&&res.room;
    }
   }catch(e){
    if(e&&e.status===400){
     createBtn.disabled=false;
     return toast(e.message||rTr("تحقّق من بيانات الغرفة","Check room details","Vérifiez les informations"));
    }
    createdRoom=Object.assign({},payload,{
     id:"room_"+uid(),
     code:genLocalRoomCode(),
     activeParticipants:[],
     createdAt:Date.now(),
     _local:true
    });
   }
   if(createdRoom){
    saveLocalRoom(createdRoom);
    closeCreator();
    toast(rTr("تم إنشاء غرفة الدراسة ✓ (الرمز: "+createdRoom.code+")","Study room created ✓ (Code: "+createdRoom.code+")","Salle créée ✓"));
    if(isSched.checked){
     await loadRooms();
     render();
    }else{
     if(focusAutoStart&&!FT.running){
      setTimerDuration(FT.durationMin,false);
      startFocusTimer(false);
     }
     await joinStudyRoom(createdRoom.id,Object.assign({},preset,{roomObj:createdRoom}));
    }
   }else{
    createBtn.disabled=false;
    toast(rTr("تعذّر إنشاء الغرفة","Could not create room","Erreur"));
   }
  }},preset.scheduled?rTr("جدولة الغرفة","Schedule Room","Planifier"):rTr("إنشاء وبدء الجلسة","Create & Start Room","Créer et lancer"));

  const m=modal(
   h("h3",{},ic("video")," ",rTr("غرفة دراسة واستشارة مباشرة","Live Study & Consultation Room","Salle d'étude en direct")),
   h("label",{class:"lbl"},rTr("العنوان","Title","Titre")),ti,
   h("label",{class:"lbl"},rTr("التخصص العلمي","Academic Discipline","Discipline")),fd,
   h("label",{class:"lbl"},rTr("الخصوصية","Visibility","Visibilité")),vis,
   !preset.linkedItem?h("div",{},h("label",{class:"lbl"},rTr("إرفاق حزمة بطاقات للمراجعة الجماعية","Attach flashcard deck (optional)","Joindre un paquet")),deckSel):null,
   h("label",{class:"lbl"},rTr("مقر الدراسة / المكتبة (Google Maps)","Study Venue / Library (optional)","Lieu d'étude")),venueRow,
   focusWidget,
   h("label",{class:"meta",style:"display:flex;align-items:center;gap:8px;margin-top:8px;cursor:pointer"},isSched,h("span",{},rTr("جدولة لوقت لاحق (مع تصدير للتقويم)","Schedule for later (with calendar export)","Planifier pour plus tard"))),
   schedBox,
   h("label",{class:"lbl"},rTr("تفاصيل الجلسة","Agenda / Notes","Notes")),desc,
   createBtn,
   h("div",{class:"acts"},h("button",{class:"btn",type:"button",onclick:closeCreator},t("cancel")))
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

  Net.on("room:timer",msg=>{
   if(!RM.active||RM.active.room.id!==msg.roomId||!msg.timer)return;
   const tm=msg.timer;
   if(tm.action==="set"||tm.action==="reset"){
    setTimerDuration(tm.durationMin||25,true);
   }else if(tm.action==="pause"){
    if(FT.running)flushFocusTrackedTime(true);
    FT.durationMin=tm.durationMin||FT.durationMin;
    FT.totalSec=tm.totalSec||FT.totalSec;
    FT.remainingSec=Math.max(0,Number(tm.remainingSec)||0);
    FT.running=false;
    FT.lastTrackMs=0;
    stopTickLoop();
    notifyTimerSubscribers();
   }else if(tm.action==="start"){
    ensureTodayDailyLog();
    FT.durationMin=tm.durationMin||FT.durationMin;
    FT.totalSec=tm.totalSec||Math.max(3,Math.round(FT.durationMin*60));
    const rem=tm.endAtMs?Math.max(1,Math.ceil((tm.endAtMs-Date.now())/1000)):Math.max(1,Number(tm.remainingSec)||FT.totalSec);
    FT.remainingSec=rem;
    FT.completed=false;
    FT.running=true;
    FT.endAtMs=Date.now()+rem*1000;
    FT.lastTrackMs=Date.now();
    stopTickLoop();
    FT.tickId=setInterval(tickFocusTimer,120);
    notifyTimerSubscribers();
   }
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

 function resolveRoomCode(input){
  if(!input)return "";
  const clean=String(input).trim();
  if(!clean)return "";
  try{
   if(/^https?:\/\//i.test(clean)||clean.includes("#room=")||clean.includes("room=")||clean.includes("/")){
    const normalized=/^https?:\/\//i.test(clean)?clean:("https://placeholder.local/"+clean.replace(/^\/+/,""));
    const u=new URL(normalized);
    const hashM=u.hash&&u.hash.match(/[#&?](?:room|code)=([^&]+)/i);
    if(hashM&&hashM[1])return decodeURIComponent(hashM[1]).trim();
    const qRoom=u.searchParams.get("room")||u.searchParams.get("code");
    if(qRoom)return qRoom.trim();
    const segs=u.pathname.split("/").filter(Boolean);
    if(segs.length)return decodeURIComponent(segs[segs.length-1]).trim();
   }
  }catch(e){}
  const m=clean.match(/(?:^|[#&?])(?:room|code)=([^&#\s]+)/i);
  if(m&&m[1]){
   try{return decodeURIComponent(m[1]).trim()}catch(_){return m[1].trim()}
  }
  const parts=clean.split("/").filter(Boolean);
  return parts.length?parts[parts.length-1].trim():clean;
 }
 window.resolveRoomCode=resolveRoomCode;

 async function joinStudyRoom(idOrCode,opts){
  opts=opts||{};
  const resolved=resolveRoomCode(idOrCode);
  if(!resolved){
   toast(rTr("أدخل رمز الغرفة أو رابطها","Enter a room code or invite link","Entrez un code de salle"));
   return;
  }
  bindWsRoomHandlers();
  if(RM.active)leaveStudyRoom(true);
  let detail;
  try{
   detail=await Net.apiGet("/api/rooms/"+encodeURIComponent(resolved));
  }catch(e){
   try{
    if(window.AcademicCoreInstance&&typeof window.AcademicCoreInstance.joinOrVerifyRoom==="function"){
     const coreRes=await window.AcademicCoreInstance.joinOrVerifyRoom(resolved);
     const cr=coreRes&&(coreRes.room||coreRes);
     if(cr){
      detail={
       room:{
        id:cr.id?(String(cr.id).startsWith("room_")?cr.id:"room_"+cr.id):("room_"+(cr.roomCode||resolved)),
        code:cr.code||cr.roomCode||resolved.toUpperCase(),
        title:cr.title||resolved,
        field:cr.field||"General",
        description:cr.description||"",
        hostId:cr.hostId||"host",
        hostName:cr.hostName||"Scholar",
        visibility:cr.visibility||"public",
        focusDurationMin:cr.focusDurationMin||25,
        durationMin:cr.durationMin||60,
        scheduledAt:cr.scheduledAt||null,
        activeParticipants:cr.activeParticipants||[]
       },
       messages:coreRes.messages||[],
       sharedMaterial:coreRes.sharedMaterial||null
      };
     }
    }
   }catch(_){}
   if(!detail){
    const key=resolved.toUpperCase();
    const fallbackRoom=(opts&&opts.roomObj)||RM.rooms.concat(getLocalRooms()).find(r=>r&&(r.id===resolved||(r.code&&r.code.toUpperCase()===key)));
    if(fallbackRoom){
     detail={
      room:fallbackRoom,
      messages:LS.get("7s_room_msgs_"+fallbackRoom.id,[])||[],
      sharedMaterial:fallbackRoom.linkedItem||null
     };
    }else{
     toast(rTr("الغرفة غير موجودة أو أُغلقت","Study room not found or closed","Salle introuvable"));
     return;
    }
   }
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
  const canScreen=Boolean(navigator.mediaDevices&&typeof navigator.mediaDevices.getDisplayMedia==="function");
  bar.replaceChildren(
   h("button",{class:"rm-cbtn"+(A.mic?"":" off"),type:"button",onclick:toggleRoomMic,title:rTr("الميكروفون","Microphone","Micro")},ic(A.mic?"mic":"mic-off"),h("span",{},A.mic?rTr("صوت","Mic","Micro"):rTr("صامت","Muted","Muet"))),
   h("button",{class:"rm-cbtn"+(A.cam?"":" off"),type:"button",onclick:toggleRoomCam,title:rTr("الكاميرا","Camera","Caméra")},ic(A.cam?"camera":"camera-off"),h("span",{},rTr("فيديو","Video","Vidéo"))),
   canScreen?h("button",{class:"rm-cbtn"+(A.screen?" gold-on":""),type:"button",onclick:toggleRoomScreen,title:rTr("مشاركة الشاشة","Share Screen","Partager l'écran")},ic(A.screen?"monitor-off":"monitor"),h("span",{},A.screen?rTr("إيقاف الشاشة","Stop Share","Arrêter"):rTr("مشاركة الشاشة","Share Screen","Écran"))):null,
   h("button",{class:"rm-cbtn"+(FT.running?" gold-on":""),type:"button",onclick:()=>openFocusTimerModal(true),title:rTr("مؤقت التركيز","Focus Timer","Minuteur")},ic("clock"),h("span",{},rTr("مؤقت التركيز","Focus Timer","Minuteur"))),
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
  const timerPill=h("button",{
   type:"button",
   id:"rm-timer-pill",
   class:"rm-timer-pill"+(FT.running?" running":"")+(FT.completed?" done":""),
   title:rTr("فتح مؤقت التركيز","Open Focus Timer","Ouvrir minuteur"),
   onclick:()=>openFocusTimerModal(true)
  },ic("clock",{s:14})," ",fmtTimerSec(FT.remainingSec));

  const header=h("div",{class:"rm-top"},
   h("div",{class:"rm-top-info"},
    h("div",{class:"rm-live-dot"},h("i",{}),rTr("جلسة مباشرة","LIVE STUDY ROOM","EN DIRECT")," · ",h("span",{dir:"ltr"},room.code)),
    h("h2",{dir:"auto"},room.title),
    h("div",{class:"rm-top-meta"},
     Net.discLabel(room.field)," · ",String((A.participants||[]).length||1)," ",rTr("مشارك","participants","participants"),
     room.venue&&room.venue.name?(" · 📍 "+room.venue.name):""
    )
   ),
   h("div",{style:"display:flex;align-items:center;gap:8px;flex-wrap:wrap"},
    timerPill,
    h("button",{class:"btn",style:"color:#fff;border-color:rgba(255,255,255,.4)",type:"button",onclick:()=>leaveStudyRoom(false)},rTr("اللوبي","Lobby","Lobby"))
   )
  );

  const vgrid=h("div",{class:"rm-vgrid",id:"rm-vgrid"});
  const controls=h("div",{class:"rm-controls",id:"rm-controls"});

  const stage=h("div",{class:"rm-stage",id:"rm-stage"});
  const chatLog=h("div",{class:"rm-chatlog",id:"rm-chatlog"});
  const chatInp=h("input",{class:"cin",placeholder:rTr("اكتب رسالة أو اقتباسًا في الغرفة…","Message or share a citation…","Écrire un message…"),maxlength:"1500",enterkeyhint:"send"});
  const sendChat=()=>{
   const txt=chatInp.value.trim();if(!txt)return;
   chatInp.value="";
   const msgId=uid();
   const me=Net.myIdentity();
   const entry={id:msgId,roomId:room.id,peerId:me.id,name:me.name,handle:me.username,text:txt,createdAt:Date.now()};
   const sent=Net.send({type:"chat:send",roomId:room.id,id:msgId,text:txt});
   if(!sent||!Net.wsConnected){
    RM.active.messages.push(entry);
    LS.set("7s_room_msgs_"+room.id,RM.active.messages.slice(-100));
    paintRoomChat();
   }
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
   h("div",{class:"eyebrow"},ic("video")," ",rTr("مؤتمرات وغرف دراسة سكايب البحثية","ACADEMIC VIDEO & STUDY ROOMS","SALLES D'ÉTUDE VIDÉO")),
   h("h1",{},rTr("غرف الدراسة والمناقشة المباشرة","Live Study Rooms & Video Consultations","Salles d'étude et appels vidéo")),
   h("p",{},rTr("تواصل بالفيديو والصوت ومشاركة الشاشة لمراجعة البطاقات، تفريغ المحاضرات، والأبحاث العلمية مع زملائك حول العالم.","Host or join WebRTC video study sessions with screen sharing, synced flashcard review, and instant room chat.","Sessions vidéo collaboratives avec partage d'écran, fiches synchronisées et discussion en direct.")),
   h("div",{class:"btns"},
    h("button",{class:"pri",style:"width:auto;margin-top:0;padding:10px 18px",type:"button",onclick:()=>openRoomCreator({scheduled:false})},ic("video"),rTr("بدء غرفة دراسة فورية","Launch Study Room","Lancer une salle")),
    h("button",{class:"btn",style:"color:#fff;border-color:rgba(255,255,255,.55)",type:"button",onclick:()=>openRoomCreator({scheduled:true})},ic("calendar-plus"),rTr("جدولة جلسة","Schedule Session","Planifier")),
    h("button",{class:"btn",style:"color:#fff;border-color:rgba(255,255,255,.55)",type:"button",onclick:()=>openFocusTimerModal(false)},ic("clock"),rTr("مؤقت التركيز","Focus Timer","Minuteur")),
    h("button",{class:"btn",style:"color:#fff;border-color:rgba(255,255,255,.55)",type:"button",onclick:()=>openFocusStatsModal()},ic("award"),rTr("إحصائيات الدراسة","Study Stats","Statistiques")),
    h("button",{class:"btn",style:"color:#fff;border-color:rgba(255,255,255,.55)",type:"button",onclick:()=>window.StudyMaps&&window.StudyMaps.openStudyMapModal()},ic("map"),rTr("أماكن الدراسة","Study Map","Carte"))
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
     room.focusDurationMin?(" · ⏱ "+room.focusDurationMin+" "+rTr("د تركيز","m focus","m")):"",
     room.venue&&room.venue.name?(" · 📍 "+room.venue.name):"",
     room.linkedItem?(" · "+rTr("مادة مرفقة: ","Attached: ")+(room.linkedItem.title||"")):""
    ),
    h("div",{class:"btns"},
     h("button",{class:"btn fill",type:"button",onclick:()=>joinStudyRoom(room.id)},ic("video"),rTr("دخول الغرفة","Join Video Room","Rejoindre")),
     h("button",{class:"btn",type:"button",onclick:()=>copyRoomInvite(room)},ic("link"),rTr("نسخ الدعوة","Copy Invite","Inviter")),
     room.venue&&room.venue.uri?h("a",{class:"btn",href:room.venue.uri,target:"_blank",rel:"noopener noreferrer"},ic("map"),rTr("الموقع","Maps","Carte")):null,
     room.scheduledAt?h("button",{class:"btn",type:"button",onclick:()=>downloadRoomIcs(room)},ic("calendar"),rTr("للتقويم","Calendar (.ics)","Calendrier")):null,
     isHost?h("button",{class:"btn danger",type:"button",onclick:async()=>{if(!confirm(rTr("إغلاق الغرفة للجميع؟","Close this room?","Fermer la salle ?")))return;try{await Net.apiDel("/api/rooms/"+encodeURIComponent(room.id)+"?peerId="+encodeURIComponent(myId))}catch(e){}removeLocalRoom(room.id);loadRooms()}},ic("trash")):null
    )
   ));
  });
 }

 VIEWS.rooms=renderRooms;
 buildTabs();
})();
