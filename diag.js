// فحص نقطة الاتصال: يتحقق من Supabase (الرابط/المفتاح) ثم من وجود الدوال والجداول التي يحتاجها التطبيق.
// الفحوص بلا أي أثر جانبي: الدوال تُستدعى بقيم غير صالحة عمدًا فيرفضها الخادم قبل أي كتابة.
(function(){
 const FN=[["request_level",{lvl:"__probe",note:null,verify:false},"v19b-levels-files.sql"],
  ["leaderboard",{grp:"__probe"},"v19-trust.sql"],
  ["create_study_group",{ttl:"",subj:null,lvl:null,univ:null,pub:true},"v19c-groups-mentors.sql"],
  ["report_acts",{acts:[]},"v19-trust.sql"]];
 const TB=[["level_requests","v19-trust.sql"],["post_decks","v19n-decks.sql"],["deck_adds","v19o-deck-adds.sql"],["stories","v19p-stories.sql"]];
 const missing=e=>e&&(e.code==="PGRST202"||e.code==="PGRST205"||e.code==="42883"||e.code==="42P01"||/schema cache|Could not find/i.test(e.message||""));
 let cache=null;
 window.connDiag=async function(force){
  if(cache&&!force)return cache;
  const out={ok:true,net:true,problems:[],files:[]};
  try{
   const r=await fetch(SUPA.url+"/rest/v1/profiles?select=id&limit=1",{headers:{apikey:SUPA.key,Authorization:"Bearer "+SUPA.key}});
   if(r.status===401||r.status===403){out.ok=false;out.problems.push("المفتاح مرفوض من Supabase ("+r.status+"): تحقق من anon/publishable key في config.js");}
   else if(r.status===404){const j=await r.json().catch(()=>({}));if(missing(j)){out.ok=false;out.problems.push("جدول profiles غير موجود: شغّل schema.sql أولًا");out.files.push("schema.sql")}else{out.ok=false;out.problems.push("الرابط لا يشير إلى مشروع Supabase صحيح (404)")}}
  }catch(e){out.ok=false;out.net=false;out.problems.push("لا اتصال بـ "+SUPA.url+" — تحقق من الإنترنت أو من صحة Project URL أو أن المشروع غير موقوف (Paused)");}
  if(!out.net||!SC.sb){cache=out;return out}
  for(const [fn,args,file] of FN){try{const r=await SC.sb.rpc(fn,args);if(missing(r.error)){out.ok=false;out.problems.push("الدالة "+fn+" غير موجودة");if(!out.files.includes(file))out.files.push(file)}}catch(e){}}
  for(const [t,file] of TB){try{const r=await SC.sb.from(t).select("*",{head:true,count:"exact"}).limit(1);if(missing(r.error)){out.ok=false;out.problems.push("الجدول "+t+" غير موجود");if(!out.files.includes(file))out.files.push(file)}}catch(e){}}
  cache=out;return out};
 window.connBanner=function(v){
  connDiag().then(d=>{if(d.ok||!v.isConnected)return;
   const c=h("div",{class:"card",style:"border:2px solid #d9534f"},h("h3",{},"⚠ إعداد قاعدة البيانات ناقص"),
    h("ul",{class:"meta",style:"margin:6px 0"},d.problems.map(p=>h("li",{},p))),
    d.files.length?h("div",{class:"meta"},"الحل: شغّل في Supabase → SQL Editor الملف "+(d.files.indexOf("schema.sql")<0?"00-repair-connection.sql":"schema.sql")+" ثم الملفات التالية إن ظهرت: "+d.files.join("، ")+"."):null,
    h("button",{class:"btn",onclick:()=>{cache=null;SC.view="feed";render()}},"↻ أعد الفحص"));
   v.prepend(c)}).catch(()=>{})};
})();
