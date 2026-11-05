// إشعارات Web Push 🔔 — يتطلب v19s-push.sql + دالة الحافة + APP.vapid في config.js (انظر SETUP.md).
// الاشتراك على مستوى الجهاز؛ عند تسجيل الخروج يُفصل الجهاز عن الحساب، وعند الدخول يُربط بالحساب الجديد تلقائيًا.
const pushOk=()=>!!(window.APP&&APP.vapid&&"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window);
const pushKey=s=>{const p="=".repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,"+").replace(/_/g,"/")),o=new Uint8Array(b.length);for(let i=0;i<b.length;i++)o[i]=b.charCodeAt(i);return o};
const pushSub=async()=>{try{const r=await navigator.serviceWorker.getRegistration();return r?await r.pushManager.getSubscription():null}catch(e){return null}};
const pushSave=async sub=>{const j=sub.toJSON();return SC.sb.rpc("save_push_sub",{ep:j.endpoint,k:(j.keys||{}).p256dh,a:(j.keys||{}).auth})};

async function pushEnable(){
 if(!SC.user)return authModal();
 if(!pushOk())return toast("الإشعارات الخلفية غير متاحة في هذا المتصفح أو لم تُفعَّل من الإدارة");
 if(Notification.permission==="denied")return toast("الإشعارات محجوبة لهذا الموقع. فعّلها من إعدادات المتصفح ثم أعد المحاولة");
 if(await Notification.requestPermission()!=="granted")return toast("لم تُمنح الصلاحية");
 try{const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushKey(APP.vapid)});
  const r=await pushSave(sub);if(r.error)throw r.error;toast("🔔 فُعّلت الإشعارات على هذا الجهاز")}
 catch(e){toast(/function|schema cache|does not exist/i.test((e&&e.message)||"")?"لتفعيلها شغّل v19s-push.sql في Supabase":"تعذّر التفعيل: "+((e&&e.message)||"")) }
 render()}

async function pushDisable(){const sub=await pushSub();if(sub){try{await SC.sb.rpc("remove_push_sub",{ep:sub.endpoint});await sub.unsubscribe()}catch(e){}}toast("أُوقفت إشعارات هذا الجهاز");render()}

// عند الدخول: اربط اشتراك الجهاز (إن وُجد) بالحساب الحالي. ومرة واحدة نغلّف signOut ليفصل الجهاز عن الحساب قبل إنهاء الجلسة
// (لا تصل رسائل الحساب السابق لمن يستخدم الجهاز بعده).
{const _su=setUser;setUser=async function(ss){await _su(ss);
 try{if(SC.sb&&!SC.sb.auth._7sp){SC.sb.auth._7sp=1;const so=SC.sb.auth.signOut.bind(SC.sb.auth);
   SC.sb.auth.signOut=async function(){try{const sub=await pushSub();if(sub&&SC.user)await SC.sb.rpc("remove_push_sub",{ep:sub.endpoint})}catch(e){}return so.apply(null,arguments)}}
  if(SC.user&&pushOk()&&Notification.permission==="granted"){const sub=await pushSub();if(sub)pushSave(sub)}}catch(e){}}}

// زر في قائمة الرسائل
{const _cl=chatList;chatList=async function(v){await _cl(v);if(!SC.user||!pushOk())return;
 const sub=await pushSub(),on=!!sub&&Notification.permission==="granted";
 v.prepend(h("div",{class:"btns",style:"padding:0 16px"},h("button",{class:"btn",onclick:on?pushDisable:pushEnable},on?"🔕 أوقف الإشعارات الخلفية":"🔔 إشعارات الرسائل (والتطبيق مغلق)")))}}
