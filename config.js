// ضع هنا بيانات مشروع Supabase (Project Settings → API). المفتاح العام anon آمن في الواجهة. لا تضع service_role هنا أبدًا.
window.SUPA={url:"https://sgacauoadufbuotreeeh.supabase.co",key:"sb_publishable_n14PQQhVGc3F4hOHZdd0Cg_arnOMWgh"};
// تنظيف تلقائي لقيم Supabase: يزيل المسافات وعلامات الاقتباس والشرطة الأخيرة و/rest/v1 ويحوّل رابط لوحة التحكم إلى رابط المشروع.
(function(){var c=function(v){return String(v||"").trim().replace(/^[\s"'`]+|[\s"'`,;]+$/g,"")};
 var u=c(SUPA.url),k=c(SUPA.key),m;
 if(u&&!/^https?:\/\//i.test(u)&&/^[a-z0-9]{15,25}\.supabase\.co/i.test(u))u="https://"+u;
 if(m=u.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i))u="https://"+m[1]+".supabase.co";
 if(m=u.match(/^(https:\/\/[a-z0-9-]+\.supabase\.(?:co|in))(?:\/.*)?$/i))u=m[1];
 SUPA.url=u;SUPA.key=k;
 SUPA.bad=(u||k)?(!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(u)?"Project URL غير صالح — الصيغة الصحيحة: https://xxxxxxxx.supabase.co (بلا / في النهاية وبلا /rest/v1)":(!/^(eyJ|sb_publishable_)/.test(k)?"مفتاح anon غير صالح — انسخ anon public (يبدأ بـ eyJ) أو publishable key":"")):"";
 if(SUPA.bad){console.warn("[SUPA] "+SUPA.bad);SUPA.url="";SUPA.key=""}
})();
window.APP={
  pilot:true, // نسخة تجريبية مركّزة: تُخفي أزرار المكالمات. اجعلها false لإظهارها.
 contact:"ضع-بريد-التواصل-هنا@example.com", // بريدك: يُرسَل مع طلبات الترجمة المجانية (MyMemory)
 // اختياري — المكالمات: بدون هذا السطر تُستخدم خوادم STUN العامة فقط، وقد لا تتصل المكالمة في بعض الشبكات.
 // لموثوقية أعلى أضف خادم TURN من مزوّد تختاره (انظر SETUP.md)، مثال:
 // ice:[{urls:"stun:stun.l.google.com:19302"},{urls:"turn:YOUR_TURN_HOST:3478",username:"USER",credential:"PASS"}],
 // اختياري — الترجمة: عنوان خدمتك الخاصة (يستقبل POST {text,to} ويعيد {text}). إن تركته فارغًا تُستخدم ترجمة المتصفح ثم MyMemory.
 // translateUrl:"https://your-domain.example/translate",
};
