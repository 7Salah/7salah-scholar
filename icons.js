// نظام الأيقونات الموحّد (v19q): SVG inline بأسلوب Lucide — شبكة 24، حدّ 1.75، أطراف مستديرة، لون currentColor.
// يُحمَّل قبل app.js. الاستعمال: ic("send") ← عنصر SVG؛ icp("home") ← محتوى المسارات كنص (للتبويبات).
// كما يحوّل h() تلقائيًا الرموز التعبيرية الوظيفية داخل نصوص الواجهة إلى أيقونات (انظر iconize في الأسفل).
(function(){
const P={
 search:"<circle cx='11' cy='11' r='7'/><path d='m20 20-3.5-3.5'/>",
 home:"<path d='M3 10.5 12 3l9 7.5'/><path d='M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9'/>",
 users:"<circle cx='9' cy='8' r='3.5'/><path d='M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5'/><path d='M16 4.6a3.5 3.5 0 0 1 0 6.8'/><path d='M18 14.8c2 .6 3.5 2.3 3.5 5.2'/>",
 user:"<circle cx='12' cy='8' r='4'/><path d='M4 21c0-4 3.6-6 8-6s8 2 8 6'/>",
 message:"<path d='M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20.5l1.5-5A8.5 8.5 0 1 1 21 11.5z'/>",
 send:"<path d='m22 2-7 20-4-9-9-4z'/><path d='M22 2 11 13'/>",
 paperclip:"<path d='m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5l8.6-8.6A4 4 0 1 1 18 8.8l-8.6 8.6a2 2 0 0 1-2.8-2.8l8.5-8.5'/>",
 phone:"<path d='M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z'/>",
 video:"<path d='m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11'/><rect x='2' y='6' width='14' height='12' rx='2'/>",
 ban:"<circle cx='12' cy='12' r='10'/><path d='m4.9 4.9 14.2 14.2'/>",
 flag:"<path d='M4 22V4'/><path d='M4 4h13l-2 4 2 4H4'/>",
 trash:"<path d='M3 6h18'/><path d='M8 6V4h8v2'/><path d='m19 6-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6'/><path d='M10 11v6M14 11v6'/>",
 pencil:"<path d='M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z'/><path d='m15 5 4 4'/>",
 plus:"<path d='M12 5v14M5 12h14'/>",
 check:"<path d='M20 6 9 17l-5-5'/>",
 checks:"<path d='M18 6 7 17l-5-5'/><path d='m22 10-7.5 7.5L13 16'/>",
 x:"<path d='M18 6 6 18M6 6l12 12'/>",
 "chevron-left":"<path d='m15 18-6-6 6-6'/>",
 "chevron-right":"<path d='m9 18 6-6-6-6'/>",
 "arrow-left":"<path d='M19 12H5M12 19l-7-7 7-7'/>",
 "arrow-right":"<path d='M5 12h14M12 5l7 7-7 7'/>",
 bell:"<path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'/><path d='M10.3 21a1.9 1.9 0 0 0 3.4 0'/>",
 globe:"<circle cx='12' cy='12' r='10'/><path d='M2 12h20'/><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/>",
 shield:"<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/>",
 "shield-check":"<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><path d='m9 12 2 2 4-4'/>",
 trophy:"<path d='M6 9H4.5a2.5 2.5 0 0 1 0-5H6'/><path d='M18 9h1.5a2.5 2.5 0 0 0 0-5H18'/><path d='M4 22h16'/><path d='M10 14.7V17c0 .6-.5 1-1.2 1.2C7.8 18.7 7 20.2 7 22'/><path d='M14 14.7V17c0 .6.5 1 1.2 1.2 1 .5 1.8 2 1.8 3.8'/><path d='M18 2H6v7a6 6 0 0 0 12 0z'/>",
 book:"<path d='M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z'/><path d='M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z'/>",
 layers:"<path d='m12 2 10 5-10 5L2 7z'/><path d='m2 17 10 5 10-5'/><path d='m2 12 10 5 10-5'/>",
 cards:"<rect x='3' y='8' width='13' height='13' rx='2'/><path d='M8 8V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3'/>",
 zap:"<path d='M13 2 4 14h7l-1 8 9-12h-7z'/>",
 flame:"<path d='M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z'/>",
 star:"<path d='m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z'/>",
 heart:"<path d='M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z'/>",
 link:"<path d='M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7'/><path d='M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7'/>",
 clock:"<circle cx='12' cy='12' r='10'/><path d='M12 6v6l4 2'/>",
 hourglass:"<path d='M6 2h12M6 22h12'/><path d='M7 2c0 5 3 7 5 10-2 3-5 5-5 10M17 2c0 5-3 7-5 10 2 3 5 5 5 10'/>",
 image:"<rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-5-5L5 21'/>",
 map:"<path d='M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z'/><path d='M9 4v14M15 6v14'/>",
 "file-text":"<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><path d='M14 2v6h6M8 13h8M8 17h8M8 9h2'/>",
 flask:"<path d='M9 2h6M10 2v6L4.5 18.5A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.8-3L14 8V2'/><path d='M7.5 15h9'/>",
 cap:"<path d='m22 10-10-5-10 5 10 5z'/><path d='M6 12v5c3 2 9 2 12 0v-5'/><path d='M22 10v6'/>",
 help:"<circle cx='12' cy='12' r='10'/><path d='M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3'/><path d='M12 17h.01'/>",
 sparkles:"<path d='m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z'/><path d='M19 3v4M21 5h-4M5 17v4M7 19H3'/>",
 logout:"<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/><path d='m16 17 5-5-5-5M21 12H9'/>",
 login:"<path d='M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4'/><path d='m10 17 5-5-5-5M15 12H3'/>",
 more:"<circle cx='12' cy='5' r='1.2'/><circle cx='12' cy='12' r='1.2'/><circle cx='12' cy='19' r='1.2'/>",
 mic:"<rect x='9' y='2' width='6' height='12' rx='3'/><path d='M5 11a7 7 0 0 0 14 0M12 18v4'/>",
 "mic-off":"<rect x='9' y='2' width='6' height='12' rx='3'/><path d='M5 11a7 7 0 0 0 14 0M12 18v4'/><path d='m3 3 18 18'/>",
 camera:"<path d='M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4z'/><circle cx='12' cy='13' r='3.5'/>",
 "camera-off":"<path d='M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4z'/><circle cx='12' cy='13' r='3.5'/><path d='m3 3 18 18'/>",
 bookmark:"<path d='M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z'/>",
 target:"<circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='6'/><circle cx='12' cy='12' r='2'/>",
 bulb:"<path d='M9 18h6M10 21.5h4'/><path d='M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3h6c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2z'/>",
 alert:"<path d='M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z'/><path d='M12 9v4M12 17h.01'/>",
 "check-circle":"<circle cx='12' cy='12' r='10'/><path d='m8 12 3 3 5-6'/>",
 "x-circle":"<circle cx='12' cy='12' r='10'/><path d='m15 9-6 6M9 9l6 6'/>",
 lock:"<rect x='4' y='11' width='16' height='10' rx='2'/><path d='M8 11V7a4 4 0 0 1 8 0v4'/>",
 download:"<path d='M12 3v12m-5-5 5 5 5-5'/><path d='M4 21h16'/>",
 inbox:"<path d='M22 12h-6l-2 3h-4l-2-3H2'/><path d='M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z'/>",
 play:"<path d='M7 4v16l13-8z'/>",
 eye:"<path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z'/><circle cx='12' cy='12' r='3'/>",
 "eye-off":"<path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z'/><circle cx='12' cy='12' r='3'/><path d='m3 3 18 18'/>",
 compass:"<circle cx='12' cy='12' r='10'/><path d='m16 8-2 6-6 2 2-6z'/>",
 dice:"<rect x='3' y='3' width='18' height='18' rx='3'/><circle cx='8.5' cy='8.5' r='.9'/><circle cx='15.5' cy='8.5' r='.9'/><circle cx='12' cy='12' r='.9'/><circle cx='8.5' cy='15.5' r='.9'/><circle cx='15.5' cy='15.5' r='.9'/>",
 award:"<circle cx='12' cy='8' r='6'/><path d='M15.5 13 17 22l-5-3-5 3 1.5-9'/>",
 tag:"<path d='M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z'/><circle cx='7.5' cy='7.5' r='1'/>",
 clipboard:"<rect x='8' y='2' width='8' height='4' rx='1'/><path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/>",
 pin:"<path d='M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z'/><circle cx='12' cy='10' r='3'/>",
 calendar:"<rect x='3' y='4' width='18' height='18' rx='2'/><path d='M16 2v4M8 2v4M3 10h18'/>",
 settings:"<circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'/>",
 share:"<circle cx='18' cy='5' r='3'/><circle cx='6' cy='12' r='3'/><circle cx='18' cy='19' r='3'/><path d='m8.6 13.5 6.8 4M15.4 6.5l-6.8 4'/>",
 "message-plus":"<path d='M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20.5l1.5-5A8.5 8.5 0 1 1 21 11.5z'/><path d='M12 8.5v6M9 11.5h6'/>",
 "user-plus":"<circle cx='9' cy='8' r='4'/><path d='M2 21c0-3.8 3.1-6 7-6s7 2.2 7 6'/><path d='M19 8v6M16 11h6'/>",
 smile:"<circle cx='12' cy='12' r='10'/><path d='M8 14s1.5 2 4 2 4-2 4-2'/><path d='M9 9h.01M15 9h.01'/>",
 crown:"<path d='m2 8 4.5 4L12 4l5.5 8L22 8l-2 12H4z'/>",
 reply:"<path d='m9 17-5-5 5-5'/><path d='M20 18v-2a4 4 0 0 0-4-4H4'/>",
 repeat:"<path d='m17 2 4 4-4 4'/><path d='M3 11v-1a4 4 0 0 1 4-4h14'/><path d='m7 22-4-4 4-4'/><path d='M21 13v1a4 4 0 0 1-4 4H3'/>",
 quote:"<path d='M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z'/><path d='M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z'/>",
 thread:"<path d='M6 3v12'/><circle cx='6' cy='18' r='3'/><circle cx='18' cy='6' r='3'/><path d='M18 9a9 9 0 0 1-9 9'/>",
 "corner-down-right":"<path d='m15 10 5 5-5 5'/><path d='M4 4v7a4 4 0 0 0 4 4h12'/>",
 "at-sign":"<circle cx='12' cy='12' r='4'/><path d='M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8'/>",
 "chevron-down":"<path d='m6 9 6 6 6-6'/>",
 "chevron-up":"<path d='m18 15-6-6-6 6'/>"
};
const A={},ALIAS={"arrow-start":"arrow-left"};
const NS="http://www.w3.org/2000/svg";
// ic(name,{s:حجم px، w:سماكة، cls:صنف إضافي، fill:true، label:وصف للقارئ الشاشي})
function ic(n,o){o=o||{};const d=P[n]||P[ALIAS[n]]||P.help,s=document.createElementNS(NS,"svg");
 s.setAttribute("viewBox","0 0 24 24");s.setAttribute("class","ic ic-"+n+(o.cls?" "+o.cls:"")+(o.fill?" fill":""));
 if(o.s){s.style.width=s.style.height=o.s+"px";s.style.fontSize="0"}
 if(o.w)s.style.strokeWidth=o.w;
 if(o.label){s.setAttribute("role","img");s.setAttribute("aria-label",o.label)}else s.setAttribute("aria-hidden","true");
 s.setAttribute("focusable","false");s.innerHTML=d;return s}
const icp=n=>P[n]||P.help;
// خريطة الرموز التعبيرية الوظيفية ← أيقونة. ما ليس فيها (حيوانات الصور الرمزية، وجوه المزاج، أيقونات الحزم) يبقى كما هو لأنه محتوى لا واجهة.
const M={"🔎":"search","🔍":"search","🏠":"home","👥":"users","🤝":"users","👤":"user","💬":"message","📞":"phone","🎥":"video","🎬":"video","🚫":"ban","🚩":"flag","⚑":"flag","🗑":"trash",
 "✏":"pencil","✍":"pencil","📝":"pencil","＋":"plus","✓":"check","✔":"check","✕":"x","✖":"x","❌":"x","🔔":"bell","🌐":"globe","🛡":"shield","🏆":"trophy","📚":"book","📘":"book","📖":"book",
 "🃏":"cards","⚡":"zap","🆚":"zap","💪":"zap","⚔":"zap","🔥":"flame","⭐":"star","🌟":"star","❤":"heart","🤍":"heart","🔗":"link","📎":"paperclip","⏰":"clock","⏳":"hourglass","🖼":"image","🗺":"map","📄":"file-text","📜":"file-text",
 "🧪":"flask","🔬":"flask","🎓":"cap","❓":"help","✨":"sparkles","🎉":"sparkles","👏":"sparkles","🚀":"sparkles","🚪":"logout","🎤":"mic","🔇":"mic-off","📷":"camera","🔖":"bookmark","🎯":"target","💡":"bulb","🧠":"bulb",
 "⚠":"alert","✅":"check-circle","🔒":"lock","📥":"inbox","▶":"play","👁":"eye","🙈":"eye-off","🧭":"compass","🎲":"dice","🏅":"award","💯":"award","🏷":"tag","📋":"clipboard","📍":"pin","📅":"calendar"};
const RE=new RegExp("("+Object.keys(M).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")[\\uFE0E\\uFE0F]?","g");
const strip=s=>String(s).replace(RE,"").replace(/^\s+/,"");
// ie(emoji): أيقونة إن كان الرمز واجهة، وإلا الرمز نفسه (لشارات الإنجازات ونحوها)
const ie=e=>{const k=String(e||"").replace(/[\uFE0E\uFE0F]/g,"");return M[k]?ic(M[k]):e};
// iconize: يستعمله h() لتحويل نص إلى عقدة نصية، أو إلى أجزاء (نص + أيقونات) إن احتوى رمزًا وظيفيًا
function iconize(str,tag,at){str=String(str);RE.lastIndex=0;if(!RE.test(str))return document.createTextNode(str);
 at=at||{};
 if(tag==="option"||tag==="textarea"||tag==="title")return document.createTextNode(strip(str));
 if(at.dir==="auto")return document.createTextNode(str);                     // محتوى كتبه المستخدمون يبقى كما كُتب
 const cl=String(at.class||""),sty=String(at.style||"");
 if(/(^|\s)(em|eo|avi|avb|cav)(\s|$)/.test(cl)||/font-size:\s*(2[89]|[3-9]\d)px/.test(sty))return document.createTextNode(str);
 const f=document.createDocumentFragment();let last=0,m;RE.lastIndex=0;
 while((m=RE.exec(str))){if(m.index>last)f.append(document.createTextNode(str.slice(last,m.index)));
  const k=m[1];if(k==="✓"||k==="✔"){/* علامة التوثيق/النجاح */}f.append(ic(M[k]));last=m.index+m[0].length;
  // نتخطى المسافة التي تلي الأيقونة (الهامش يتولاه CSS)
  if(str[last]===" ")last++}
 if(last<str.length)f.append(document.createTextNode(str.slice(last)));return f}
const setT=(el,str)=>{el.replaceChildren(iconize(str,el.tagName.toLowerCase(),{class:el.className&&el.className.baseVal===undefined?el.className:"",style:el.getAttribute("style")||""}));return el};
window.setT=setT;window.ic=ic;window.icp=icp;window.ie=ie;window.iconize=iconize;window.ICON_NAMES=Object.keys(P);
})();
