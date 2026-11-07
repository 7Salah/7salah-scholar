// الشروط والخصوصية، حذف الحساب، ولوحة الإدارة. يُحمَّل بعد chat.js.
function legalModal(){const P=(t0,...a)=>[h("h3",{},t0),...a.map(x=>h("div",{dir:"auto",class:"meta",style:"line-height:1.9"},"• "+x))];
 const m=modal(...P("📜 شروط الاستخدام",
  "المنصة للتبادل الأكاديمي: بحوث وتجارب ومناقشات. أنت مسؤول عما تنشره.",
  "يُمنع: التحرّش والإساءة، ونسب أبحاث أو نصوص لغير أصحابها، والإعلانات المزعجة، والمحتوى غير القانوني أو الخطير، وانتحال الشخصية.",
  "ملفك ومنشوراتك وتعليقاتك عامة. الرسائل خاصة بأطرافها لكنها غير مشفّرة طرفًا لطرف.",
  "للإدارة حذف أي محتوى مخالف وإغلاق الحساب دون إنذار عند التكرار أو الخطورة.",
  "يجب ألا يقل عمرك عن 16 سنة.",
  "المحتوى يعبّر عن أصحابه، وليس نصيحة طبية أو قانونية أو مهنية. الخدمة تُقدَّم كما هي دون ضمان."),
  ...P("🔒 سياسة الخصوصية",
  "نحفظ: بريدك، واسمك واسم المستخدم، وصورتك ونبذتك، ومنشوراتك وتعليقاتك وإعجاباتك ومتابعاتك، ورسائلك وملفاتك، وبلاغاتك.",
  "نستخدمها لتشغيل الخدمة فقط. لا نبيعها ولا نعرض إعلانات.",
  "الجهات المشغّلة: Supabase (قاعدة البيانات والمصادقة والتخزين)، وNetlify (الاستضافة)، وjsDelivr وcdnjs (مكتبات)، وOpenAlex وويكيبيديا (البحث)، ويوتيوب عند تشغيل فيديو مضمّن، وMyMemory عند ضغط زر الترجمة (يُرسَل إليها النص المراد ترجمته فقط).",
  "المكالمات مباشرة بين الطرفين (WebRTC) ولا تُسجَّل، لكن قد تكشف عنوان الإنترنت (IP) لكل طرف للآخر، وتُستخدم خوادم STUN عامة لإتمام الاتصال.",
  "الرسائل والمنشورات المُبلَّغ عنها يطّلع عليها المشرفون للمراجعة.",
  "حقوقك: تعديل بياناتك، أو حذف حسابك نهائيًا من «تعديل ملفي» ويُحذف معه محتواك. قد تبقى نسخ احتياطية أو ملفات مرفوعة مدة قصيرة حتى تنظيفها.",
  "للتواصل: "+((window.APP&&APP.contact)||"—")),
  h("div",{class:"acts"},h("button",{class:"btn",onclick:()=>m.remove()},t("cancel"))))}
async function deleteAccount(){if(!confirm("سيُحذف حسابك وكل منشوراتك ورسائلك نهائيًا ولا يمكن التراجع. متابعة؟"))return;
 const u=SC.me&&SC.me.username;if(prompt("للتأكيد اكتب اسم المستخدم: "+u)!==u)return toast("لم يتطابق الاسم، أُلغي الحذف");
 const r=await SC.sb.rpc("delete_my_account");if(r.error)return toast(r.error.message);
 document.querySelectorAll(".modal").forEach(x=>x.remove());await SC.sb.auth.signOut();SC.view="feed";toast("تم حذف حسابك")}
async function adminAcademicResources(box){
 const panel=h("section",{class:"card",style:"margin-bottom:14px"},h("h3",{},"📚 مراجعة المحتوى الجامعي"),h("div",{class:"meta"},"الملفات المرسلة من الطلاب وتحتاج إلى اعتماد."));box.append(panel);
 const list=h("div",{});panel.append(list);
 const r=await SC.sb.rpc("admin_academic_resources");
 if(r.error){list.append(h("div",{class:"meta"},"⚠ "+r.error.message+" — تأكد من تطبيق migration الخاص بالمكتبة المشتركة."));return}
 if(!r.data||!r.data.length){list.append(h("div",{class:"meta"},"لا توجد ملفات بانتظار المراجعة."));return}
 r.data.forEach(x=>{const card=h("div",{class:"card",style:"margin:10px 0"},h("b",{dir:"auto"},x.title),h("div",{class:"meta",dir:"auto"},[x.university,x.faculty,x.department,x.level,x.semester,x.course,x.content_type].filter(Boolean).join(" · ")||"دون تصنيف"),x.description?h("p",{dir:"auto"},x.description):null,h("div",{class:"meta"},(x.file_name||"PDF")+" · "+new Date(x.created_at).toLocaleString("ar")));
  const actions=h("div",{class:"btns"});
  const review=async(status)=>{const note=status==="rejected"?(prompt("سبب الرفض (اختياري):")||""):"";const z=await SC.sb.rpc("review_academic_resource",{resource_id:x.id,decision:status,review_note:note});if(z.error)return toast(z.error.message);toast(status==="approved"?"تم اعتماد الملف ✓":"تم رفض الملف");adminView(v)};
  actions.append(h("button",{class:"btn fill",onclick:()=>review("approved")},"اعتماد ونشر"),h("button",{class:"btn danger",onclick:()=>review("rejected")},"رفض"));
  const open=h("button",{class:"btn",onclick:async()=>{const z=await SC.sb.storage.from("academic-library").createSignedUrl(x.file_path,300);if(z.error)return toast(z.error.message);window.open(z.data.signedUrl,"_blank","noopener")}},"معاينة PDF");actions.append(open);card.append(actions);list.append(card)
 })
}
async function adminView(v){const box=h("div",{});v.append(h("div",{class:"card"},h("h3",{},"🛡 البلاغات المفتوحة")),box);
 adminAcademicResources(box);
 const r=await SC.sb.rpc("admin_reports");if(r.error)return box.append(h("div",{class:"card"},"⚠ "+r.error.message));
 const act=async(a,id)=>{const x=await SC.sb.rpc("admin_act",{act:a,tid:id});if(x.error)return toast(x.error.message);toast("✅ تم");render()};
 if(!r.data.length)box.append(h("div",{class:"meta",style:"text-align:center;padding:20px"},"لا بلاغات 🎉"));
 r.data.forEach(b=>box.append(h("div",{class:"card"},
  h("div",{class:"meta"},new Date(b.rcreated).toLocaleString(S.lang)+" · السبب: "+(b.rreason||"-")+" · المُبلِّغ: @"+(b.reporter||"?")),
  h("div",{dir:"auto"},"المُبلَّغ عنه: @"+(b.tname||"؟")),b.ptitle?h("div",{dir:"auto",class:"meta"},"📄 "+b.ptitle):null,b.mbody?h("div",{dir:"auto",class:"meta"},"💬 "+b.mbody):null,
  h("div",{class:"btns"},
   b.pid?h("button",{class:"btn",onclick:()=>confirm("حذف المنشور؟")&&act("delete_post",b.pid)},"حذف المنشور"):null,
   b.mid?h("button",{class:"btn",onclick:()=>confirm("حذف الرسالة؟")&&act("delete_message",b.mid)},"حذف الرسالة"):null,
   b.tuser?h("button",{class:"btn",onclick:()=>openProf(b.tuser)},"عرض الصفحة"):null,
   b.tuser?h("button",{class:"btn danger",onclick:()=>confirm("حذف الحساب نهائيًا مع كل محتواه؟")&&act("remove_user",b.tuser)},"حذف الحساب"):null,
   h("button",{class:"btn",onclick:()=>act("resolve",b.rid)},"تم الحل ✓")))))}
