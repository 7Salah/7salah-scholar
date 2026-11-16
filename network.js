// 7Salah Scholar — Global Academic Network, Directory, Connections & Real-Time WebSocket Client
(function(){
 "use strict";

 const DISCIPLINES=[
  {id:"",ar:"كل التخصصات",en:"All Fields",fr:"Toutes disciplines"},
  {id:"Sociology",ar:"علم الاجتماع",en:"Sociology",fr:"Sociologie"},
  {id:"History",ar:"التاريخ",en:"History",fr:"Histoire"},
  {id:"Philosophy",ar:"الفلسفة",en:"Philosophy",fr:"Philosophie"},
  {id:"Medicine",ar:"الطب والصحة",en:"Medicine & Health",fr:"Médecine & Santé"},
  {id:"Computer Science",ar:"الإعلام الآلي والذكاء الاصطناعي",en:"Computer Science & AI",fr:"Informatique & IA"},
  {id:"Law",ar:"القانون",en:"Law",fr:"Droit"},
  {id:"Economics",ar:"الاقتصاد والتسيير",en:"Economics & Management",fr:"Économie & Gestion"},
  {id:"Psychology",ar:"علم النفس والتربية",en:"Psychology & Education",fr:"Psychologie & Éducation"},
  {id:"Literature",ar:"الأدب واللغات",en:"Literature & Languages",fr:"Littérature & Langues"},
  {id:"Sciences",ar:"العلوم الطبيعية والرياضيات",en:"Natural Sciences & Math",fr:"Sciences & Maths"},
  {id:"Engineering",ar:"الهندسة",en:"Engineering",fr:"Ingénierie"}
 ];

 const tr3=(a,e,f)=>S.lang==="ar"?a:S.lang==="fr"?(f||e):e;

 function discLabel(id){
  if(!id)return tr3("كل التخصصات","All Fields","Toutes disciplines");
  const d=DISCIPLINES.find(x=>x.id.toLowerCase()===String(id).toLowerCase()||x.ar===id||x.en===id||x.fr===id);
  return d?(d[S.lang]||d.en):id;
 }

 function ensurePeerId(){
  if(window.SC&&SC.user&&SC.user.id)return SC.user.id;
  let id="";
  try{id=localStorage.getItem("7s_peer_id")||""}catch(e){}
  if(!id){
   id="scholar_"+(crypto.randomUUID?crypto.randomUUID().slice(0,12):Date.now().toString(36)+Math.random().toString(36).slice(2,7));
   try{localStorage.setItem("7s_peer_id",id)}catch(e){}
  }
  return id;
 }

 function myHandle(){
  if(window.SC&&SC.me&&SC.me.username)return SC.me.username;
  if(S.prof&&S.prof.handle)return S.prof.handle;
  const base=(S.prof&&S.prof.name?S.prof.name:"scholar").toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,14)||"scholar";
  const suffix=ensurePeerId().replace(/[^a-z0-9]/gi,"").slice(-4).toLowerCase();
  const handle=base+"_"+suffix;
  if(S.prof){S.prof.handle=handle;persist()}
  return handle;
 }

 function myIdentity(){
  const id=ensurePeerId();
  const me=window.SC&&SC.me;
  return{
   id,
   username:(me&&me.username)||myHandle(),
   name:(me&&me.name)||(S.prof&&S.prof.name)||tr3("باحث أكاديمي","Academic Researcher","Chercheur"),
   field:(me&&me.field)||(S.prof&&S.prof.field)||"",
   university:(me&&me.university)||(S.prof&&S.prof.university)||"",
   level:(me&&me.academic_level)||LVCODE[myCol()]||"l1",
   bio:(me&&me.bio)||(S.prof&&S.prof.bio)||"",
   avatar:(S.prof&&S.prof.av)||"🎓",
   avatarUrl:(me&&me.avatar_url)||"",
   verified:Boolean(me&&me.verified)
  };
 }

 async function apiJson(url,opts){
  opts=opts||{};
  const mergedHeaders=Object.assign({"Content-Type":"application/json","Accept":"application/json"},opts.headers||{});
  const res=await fetch(url,Object.assign({cache:"no-store",credentials:"same-origin"},opts,{headers:mergedHeaders}));
  const raw=await res.text().catch(()=>"");
  let data={};
  if(raw){try{data=JSON.parse(raw)}catch(e){data={}}}
  if(!res.ok){
   const err=new Error(data.error||(res.status>=500?tr3("خطأ في الخادم المؤقت","Server unavailable","Serveur indisponible"):res.status===404||res.status===405?tr3("الخدمة البعيدة غير متاحة حاليًا","Remote service unavailable","Service indisponible"):tr3("تعذر إتمام الطلب ("+res.status+")","Request error ("+res.status+")","Erreur ("+res.status+")")));
   err.status=res.status;
   if(data.code)err.code=data.code;
   throw err;
  }
  return data;
 }

 const listeners=new Map();
 function on(type,fn){
  if(!listeners.has(type))listeners.set(type,new Set());
  listeners.get(type).add(fn);
  return()=>listeners.get(type)&&listeners.get(type).delete(fn);
 }
 function emit(type,payload){
  const set=listeners.get(type);
  if(set)set.forEach(fn=>{try{fn(payload)}catch(e){}});
 }

 const Net={
  DISCIPLINES,
  discLabel,
  tr3,
  myIdentity,
  ensurePeerId,
  apiGet:url=>apiJson(url,{method:"GET"}),
  apiPost:(url,body)=>apiJson(url,{method:"POST",body:JSON.stringify(body||{})}),
  apiDel:url=>apiJson(url,{method:"DELETE"}),
  ws:null,
  wsConnected:false,
  wsDisabled:false,
  _wsFailures:0,
  _wsEverOpened:false,
  onlinePeers:[],
  incomingCount:0,
  _reconTimer:null,
  _reconDelay:1200,
  _queue:[],

  connect(){
   if(this.wsDisabled||typeof WebSocket==="undefined")return;
   if(this.ws&&(this.ws.readyState===WebSocket.OPEN||this.ws.readyState===WebSocket.CONNECTING))return;
   const proto=location.protocol==="https:"?"wss://":"ws://";
   let ws;
   try{ws=new WebSocket(proto+location.host+"/ws")}catch(e){this._wsFailures++;this.scheduleReconnect();return}
   this.ws=ws;
   ws.onopen=()=>{
    this.wsConnected=true;
    this._wsEverOpened=true;
    this._wsFailures=0;
    this._reconDelay=1200;
    this.sendHello();
    while(this._queue.length&&ws.readyState===WebSocket.OPEN){
     ws.send(JSON.stringify(this._queue.shift()));
    }
    emit("ws:open",{});
   };
   ws.onmessage=ev=>{
    let msg;try{msg=JSON.parse(ev.data)}catch(e){return}
    if(!msg||!msg.type)return;
    if(msg.type==="online:peers"){this.onlinePeers=msg.peers||[]}
    if(msg.type==="connection:request"){
     this.refreshConnectionCount();
     toast(tr3("طلب تواصل أكاديمي جديد من ","New connection request from ","Nouvelle demande de connexion de ")+(msg.connection&&msg.connection.fromName||""));
    }
    if(msg.type==="connection:updated"){
     this.refreshConnectionCount();
     if(msg.connection&&msg.connection.status==="accepted"){
      toast(tr3("تم قبول طلب التواصل الأكاديمي ✓","Academic connection accepted ✓","Connexion académique acceptée ✓"));
     }
    }
    emit(msg.type,msg);
   };
   ws.onclose=()=>{
    this.wsConnected=false;
    this.ws=null;
    if(!this._wsEverOpened){
     this._wsFailures++;
     if(this._wsFailures>=2){
      this.wsDisabled=true;
      this._queue.length=0;
      return;
     }
    }
    emit("ws:close",{});
    this.scheduleReconnect();
   };
   ws.onerror=()=>{};
  },

  scheduleReconnect(){
   if(this.wsDisabled||this._reconTimer)return;
   const d=this._reconDelay;
   this._reconDelay=Math.min(20000,Math.round(d*1.8));
   this._reconTimer=setTimeout(()=>{this._reconTimer=null;this.connect()},d);
  },

  send(payload){
   if(this.wsDisabled)return false;
   if(this.ws&&this.ws.readyState===WebSocket.OPEN){
    this.ws.send(JSON.stringify(payload));
    return true;
   }
   this._queue.push(payload);
   if(this._queue.length>20)this._queue.shift();
   this.connect();
   return false;
  },

  sendHello(){
   if(this.wsDisabled)return;
   const me=myIdentity();
   this.send({
    type:"hello",
    peerId:me.id,
    name:me.name,
    handle:me.username,
    field:me.field,
    university:me.university,
    level:me.level,
    avatar:me.avatar
   });
  },

  async syncDirectory(){
   const me=myIdentity();
   try{
    await this.apiPost("/api/directory/upsert",me);
   }catch(e){}
   this.sendHello();
  },

  async refreshConnectionCount(){
   try{
    const r=await this.apiGet("/api/connections?peerId="+encodeURIComponent(ensurePeerId()));
    this.incomingCount=(r.incoming||[]).length;
    if(typeof paintDot==="function")paintDot();
    emit("connections:count",this.incomingCount);
    return r;
   }catch(e){return{connections:[],incoming:[],outgoing:[],accepted:[]}}
  },

  on,
  emit,

  shareProfile(profile){
   const u=(profile&&profile.username)||myIdentity().username;
   const id=(profile&&profile.id)||myIdentity().id;
   const link=baseUrl()+"#u="+encodeURIComponent(u||id);
   const name=(profile&&profile.name)||u;
   shareLink(link,tr3("تواصل معي أكاديميًا على 7Salah Scholar: ","Connect with me on 7Salah Scholar: ","Connectez-vous avec moi sur 7Salah Scholar : ")+name);
  }
 };

 window.Net=Net;
 Net.connect();
 setTimeout(()=>{Net.syncDirectory();Net.refreshConnectionCount()},600);
})();
