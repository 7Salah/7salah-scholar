// 7Salah Lecture AI (v21) — من المحاضرة إلى المعرفة. يُحمَّل بعد x.js. يعمل فوق v21-lecture-ai.sql والدالة lecture-ai.
(function(){
const LT={
ar:{title:"7Salah Lecture AI",tag:"سجّل. افهم. تعلّم.",hub:"حوّل محاضراتك إلى نصوص وملخصات وأدوات مراجعة",open:"افتح مكتبة المحاضرات",lib:"مكتبة محاضراتي",newL:"محاضرة جديدة",
need:"سجّل الدخول لاستخدام Lecture AI.",login:"تسجيل الدخول",noCloud:"تحتاج هذه الميزة إلى إعداد Supabase (انظر LECTURE-AI-SETUP.md).",none:"لا محاضرات بعد. سجّل أول محاضرة أو ارفع ملفًا صوتيًا.",
fTitle:"عنوان المحاضرة",fSubject:"التخصص",fCourse:"المقياس",fLec:"لغة المحاضرة",fOut:"لغة النص الناتج",
consent:"أقرّ بأنني حصلت على الموافقات اللازمة لتسجيل هذه المحاضرة، وأنني سأحترم حقوق المحاضر والجامعة ولن أشاركها دون إذن.",consentNeed:"يجب الإقرار بالموافقة أولًا، وكتابة عنوان.",
rec:"سجّل الآن",up:"ارفع ملفًا صوتيًا",stop:"إيقاف وتفريغ",pause:"إيقاف مؤقت",resume:"متابعة",recording:"جارٍ التسجيل…",paused:"متوقف مؤقتًا",
upl:"جارٍ رفع الصوت…",trn:"جارٍ التفريغ ({a}/{b})… أبقِ الصفحة مفتوحة",ready:"جاهزة",failed:"فشلت المعالجة",resumeP:"استئناف المعالجة",proc:"قيد المعالجة",
tText:"النص",tSum:"الملخص",tTerms:"المصطلحات",tCards:"البطاقات",tQuiz:"اختبار",tMap:"خريطة",l1:"قصير",l2:"متوسط",l3:"مفصّل",
gen:"إنشاء",genHead:"اقتراح عناوين",regen:"إعادة الإنشاء",regenQ:"ستُستبدل النسخة الحالية (بما فيها تعديلاتك). المتابعة؟",working:"جارٍ الإنشاء…",
sttNote:"النص مُفرَّغ آليًا وقد يخطئ. المقاطع المسطّرة بنقاط غير واضحة أو غير مؤكدة، راجعها مع التسجيل.",aiNote:"مُنتَج بالذكاء الاصطناعي من نص المحاضرة فقط. راجعه قبل الاعتماد عليه.",
aiAdd:"إضافة تفسيرية من الذكاء الاصطناعي — ليست من كلام المحاضر",aiHead:"عناوين مقترحة آليًا",unc:"غير واضح",uncList:"مقاطع غير مؤكدة",
edit:"تعديل",save:"حفظ",saved:"تم الحفظ ✓",del:"حذف المحاضرة",delQ:"حذف المحاضرة وتسجيلاتها ونصوصها نهائيًا؟",pdf:"تصدير PDF",toDecks:"أضف إلى حزمي",added:"أُضيفت {n} بطاقة إلى حزمة جديدة ✓",
reveal:"أظهر الجواب",score:"النتيجة",tr:"صح",fa:"خطأ",back:"رجوع",search:"بحث في العناوين…",allSub:"كل التخصصات",min:"د",
eLimit:"بلغتَ الحد اليومي لمعالجة الصوت. حاول غدًا.",eBig:"الملف أكبر من 24MB. اضغطه أو قصّه إلى أجزاء.",eLong:"المحاضرة طويلة جدًا للتلخيص دفعة واحدة.",eKey:"لم تُضبط مفاتيح الخدمة في Supabase بعد.",eNoTxt:"لا يوجد نص بعد.",eMic:"تعذّر الوصول إلى الميكروفون. اسمح به من إعدادات المتصفح.",eGen:"تعذّرت العملية. حاول مرة أخرى.",eTime:"انتهت مهلة المعالجة (الملف طويل). اضغط «استئناف المعالجة» لإكمال ما تبقّى.",eStt:"تعذّر التفريغ الصوتي. اضغط «استئناف المعالجة» أو جرّب ملفًا أقصر.",eUp:"تعذّر رفع الصوت. تحقق من الاتصال وصيغة الملف (mp3 أو m4a أو wav) ثم أعد المحاولة.",lost:"لم يكتمل رفع الصوت لهذه المحاضرة ولا يوجد ملف محفوظ. احذفها وارفع الملف من جديد.",recov:"استرجاع وإكمال",
hint:"الدقة أولًا: لا اختلاق، والإضافات التفسيرية موسومة بوضوح، والتوقيت يرجعك إلى التسجيل."},
en:{title:"7Salah Lecture AI",tag:"Record. Understand. Learn.",hub:"Turn your lectures into transcripts, summaries and study tools",open:"Open lecture library",lib:"My lectures",newL:"New lecture",
need:"Sign in to use Lecture AI.",login:"Sign in",noCloud:"This feature needs Supabase set up (see LECTURE-AI-SETUP.md).",none:"No lectures yet. Record your first one or upload an audio file.",
fTitle:"Lecture title",fSubject:"Subject",fCourse:"Course",fLec:"Lecture language",fOut:"Output language",
consent:"I confirm I have the required permission to record this lecture, and I will respect the lecturer's and university's rights and not share it without permission.",consentNeed:"Confirm consent and enter a title first.",
rec:"Record now",up:"Upload audio file",stop:"Stop & transcribe",pause:"Pause",resume:"Resume",recording:"Recording…",paused:"Paused",
upl:"Uploading audio…",trn:"Transcribing ({a}/{b})… keep this page open",ready:"Ready",failed:"Processing failed",resumeP:"Resume processing",proc:"Processing",
tText:"Text",tSum:"Summary",tTerms:"Terms",tCards:"Cards",tQuiz:"Quiz",tMap:"Map",l1:"Short",l2:"Medium",l3:"Detailed",
gen:"Generate",genHead:"Suggest headings",regen:"Regenerate",regenQ:"The current version (including your edits) will be replaced. Continue?",working:"Generating…",
sttNote:"The text is machine-transcribed and may contain errors. Dotted passages are unclear or unconfirmed; check them against the recording.",aiNote:"AI-generated from the lecture text only. Review before relying on it.",
aiAdd:"AI explanatory addition — not said by the lecturer",aiHead:"Auto-suggested headings",unc:"unclear",uncList:"Unconfirmed passages",
edit:"Edit",save:"Save",saved:"Saved ✓",del:"Delete lecture",delQ:"Permanently delete this lecture, its recordings and texts?",pdf:"Export PDF",toDecks:"Add to my decks",added:"{n} cards added to a new deck ✓",
reveal:"Show answer",score:"Score",tr:"True",fa:"False",back:"Back",search:"Search titles…",allSub:"All subjects",min:"min",
eLimit:"You reached today's audio processing limit. Try tomorrow.",eBig:"File is over 24MB. Compress it or split it.",eLong:"The lecture is too long to process at once.",eKey:"Service keys are not configured in Supabase yet.",eNoTxt:"No transcript yet.",eMic:"Cannot access the microphone. Allow it in browser settings.",eGen:"The operation failed. Try again.",eTime:"Processing timed out (long file). Tap Resume to finish the rest.",eStt:"Transcription failed. Tap Resume or try a shorter file.",eUp:"Audio upload failed. Check your connection and the file format (mp3, m4a or wav), then retry.",lost:"The audio upload never finished and no file is stored. Delete this lecture and upload again.",recov:"Recover and continue",
hint:"Accuracy first: nothing invented, AI additions clearly labeled, timestamps lead you back to the recording."},
fr:{title:"7Salah Lecture AI",tag:"Enregistrer. Comprendre. Apprendre.",hub:"Transformez vos cours en textes, résumés et outils de révision",open:"Ouvrir la bibliothèque de cours",lib:"Mes cours",newL:"Nouveau cours",
need:"Connectez-vous pour utiliser Lecture AI.",login:"Connexion",noCloud:"Cette fonction nécessite la configuration de Supabase (voir LECTURE-AI-SETUP.md).",none:"Aucun cours pour l'instant. Enregistrez-en un ou importez un fichier audio.",
fTitle:"Titre du cours",fSubject:"Spécialité",fCourse:"Matière",fLec:"Langue du cours",fOut:"Langue du texte produit",
consent:"Je confirme avoir les autorisations nécessaires pour enregistrer ce cours, et je respecterai les droits de l'enseignant et de l'université sans le partager sans accord.",consentNeed:"Confirmez le consentement et saisissez un titre.",
rec:"Enregistrer",up:"Importer un fichier audio",stop:"Arrêter et transcrire",pause:"Pause",resume:"Reprendre",recording:"Enregistrement…",paused:"En pause",
upl:"Envoi de l'audio…",trn:"Transcription ({a}/{b})… gardez la page ouverte",ready:"Prêt",failed:"Échec du traitement",resumeP:"Reprendre le traitement",proc:"En cours",
tText:"Texte",tSum:"Résumé",tTerms:"Termes",tCards:"Cartes",tQuiz:"Quiz",tMap:"Carte",l1:"Court",l2:"Moyen",l3:"Détaillé",
gen:"Générer",genHead:"Suggérer des titres",regen:"Régénérer",regenQ:"La version actuelle (vos modifications comprises) sera remplacée. Continuer ?",working:"Génération…",
sttNote:"Le texte est transcrit automatiquement et peut contenir des erreurs. Les passages pointillés sont peu clairs ou non confirmés ; vérifiez-les avec l'enregistrement.",aiNote:"Généré par IA à partir du texte du cours uniquement. À vérifier avant de vous y fier.",
aiAdd:"Ajout explicatif de l'IA — non dit par l'enseignant",aiHead:"Titres suggérés automatiquement",unc:"peu clair",uncList:"Passages non confirmés",
edit:"Modifier",save:"Enregistrer",saved:"Enregistré ✓",del:"Supprimer le cours",delQ:"Supprimer définitivement ce cours, ses enregistrements et ses textes ?",pdf:"Exporter en PDF",toDecks:"Ajouter à mes paquets",added:"{n} cartes ajoutées à un nouveau paquet ✓",
reveal:"Voir la réponse",score:"Score",tr:"Vrai",fa:"Faux",back:"Retour",search:"Rechercher…",allSub:"Toutes les spécialités",min:"min",
eLimit:"Limite quotidienne de traitement audio atteinte. Réessayez demain.",eBig:"Fichier de plus de 24 Mo. Compressez-le ou découpez-le.",eLong:"Le cours est trop long pour un traitement unique.",eKey:"Les clés du service ne sont pas encore configurées dans Supabase.",eNoTxt:"Pas encore de transcription.",eMic:"Microphone inaccessible. Autorisez-le dans les paramètres du navigateur.",eGen:"L'opération a échoué. Réessayez.",eTime:"Délai dépassé (fichier long). Touchez Reprendre pour terminer.",eStt:"Échec de la transcription. Touchez Reprendre ou essayez un fichier plus court.",eUp:"Échec de l'envoi audio. Vérifiez la connexion et le format (mp3, m4a ou wav), puis réessayez.",lost:"L'envoi audio n'a jamais abouti et aucun fichier n'est stocké. Supprimez ce cours et réimportez.",recov:"Récupérer et continuer",
hint:"La précision d'abord : rien d'inventé, ajouts de l'IA signalés, horodatages pour retrouver l'enregistrement."}};
const lt=(k,o)=>{let s=(LT[S.lang]||LT.en)[k];if(s==null)s=LT.en[k];if(s==null)return k;return o?s.replace(/\{(\w+)\}/g,(m,x)=>o[x]):s};
const LN={ar:"العربية",en:"English",fr:"Français"};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtT=s=>{s=Math.max(0,Math.round(+s||0));const H=s/3600|0,M=(s%3600)/60|0,X=s%60,p=n=>String(n).padStart(2,"0");return(H?H+":":"")+p(M)+":"+p(X)};
const CH_SEC=600,MAX_UP=24*1024*1024,MAX_MP3=400*1024*1024,SPLIT_SEC=480;
const LEC={id:null,data:null,list:null,tab:"tText",lvl:2,edit:false,busy:{},recUI:null,audio:null,urls:{},q:"",sub:""};
const ok=()=>window.SUPA&&SUPA.url&&SUPA.key;
async function sb(){await loadSb();return SC.sb}
async function call(body){const c=await sb();const r=await c.functions.invoke("lecture-ai",{body});if(r.error){let code="server";try{const j=await r.error.context.json();code=j.error||code}catch(e){}throw new Error(code)}if(r.data&&r.data.error)throw new Error(r.data.error);return r.data}
const errMsg=c=>({limit:lt("eLimit"),too_big:lt("eBig"),too_long:lt("eLong"),no_key:lt("eKey"),no_text:lt("eNoTxt"),server:lt("eTime"),stt_failed:lt("eStt"),no_audio:lt("eStt"),bad_chunk:lt("eStt")})[c]||lt("eGen");

// ---------- بطاقة الدخول من الرئيسية والمكتبة ----------
function entry(){return h("div",{class:"card lec-entry",onclick:()=>{LEC.id=null;go("lec")}},h("div",{class:"lec-eic"},ic("mic")),h("div",{class:"tx"},h("h3",{},lt("title")),h("div",{class:"meta"},lt("hub")),h("div",{class:"lec-tag"},lt("tag"))))}
{const oh=VIEWS.home,ol=VIEWS.library;VIEWS.home=v=>{oh(v);v.append(entry())};VIEWS.library=v=>{ol(v);v.prepend(entry())};VIEWS.lec=renderLec;TABMAP.lec="library"}

// ---------- الشاشة الرئيسية ----------
function renderLec(v){
 const top=h("div",{class:"lec-top"},LEC.id?h("button",{class:"btn",onclick:()=>{LEC.id=null;LEC.data=null;LEC.edit=false;render()}},ic("x"),lt("back")):null,h("h2",{class:"lec-h"},lt("title")));v.append(top);
 if(!ok())return v.append(h("div",{class:"card"},lt("noCloud")));
 if(!SC.sb){v.append(h("div",{class:"card meta"},"…"));loadSb().then(()=>{if(S.tab==="lec")render()}).catch(()=>{});return}
 if(!SC.user)return v.append(h("div",{class:"card"},h("p",{},lt("need")),h("button",{class:"btn fill",onclick:()=>authModal()},lt("login"))));
 if(LEC.id)detail(v);else library(v)}

// ---------- المكتبة الشخصية ----------
async function library(v){
 const box=h("div",{});v.append(h("div",{class:"lec-bar"},h("button",{class:"btn fill",onclick:newModal},ic("plus"),lt("newL"))),h("div",{class:"note"},lt("hint")),box);
 if(LEC.recUI)box.append(recPanel());
 const c=await sb();const {data,error}=await c.from("lectures").select("id,title,subject,course,lecture_date,duration_sec,status,lecture_lang").order("created_at",{ascending:false}).limit(300);
 if(error)return box.append(h("div",{class:"card"},lt("eGen")));LEC.list=data||[];
 const subs=[...new Set(LEC.list.map(x=>x.subject).filter(Boolean))];
 const q=h("input",{class:"cin",placeholder:lt("search"),value:LEC.q,oninput:e=>{LEC.q=e.target.value;paint()}});
 const sel=h("select",{class:"cin",onchange:e=>{LEC.sub=e.target.value;paint()}},h("option",{value:""},lt("allSub")),subs.map(s=>h("option",{value:s,selected:s===LEC.sub},s)));
 const lst=h("div",{});box.append(h("div",{class:"lec-filters"},q,subs.length?sel:null),lst);
 function paint(){const f=LEC.list.filter(x=>(!LEC.sub||x.subject===LEC.sub)&&(!LEC.q||(x.title+" "+(x.course||"")).toLowerCase().includes(LEC.q.toLowerCase())));
  lst.replaceChildren(...(f.length?f.map(item):[h("div",{class:"card meta"},lt("none"))]))}
 function item(x){const st=x.status==="ready"?"g":x.status==="failed"?"n":"b";
  return h("div",{class:"card lec-item",onclick:()=>{LEC.id=x.id;LEC.data=null;LEC.tab="tText";LEC.edit=false;render()}},h("div",{class:"tx"},h("h3",{dir:"auto"},x.title),
   h("div",{class:"meta"},[x.subject,x.course,x.lecture_date,x.duration_sec?Math.max(1,Math.round(x.duration_sec/60))+" "+lt("min"):null,LN[x.lecture_lang]].filter(Boolean).join(" · "))),
   h("span",{class:"badge "+st},x.status==="ready"?lt("ready"):x.status==="failed"?lt("failed"):lt("proc")))}
 paint()}

// ---------- محاضرة جديدة ----------
function newModal(){
 const f={title:"",subject:"",course:"",ll:S.lang==="fr"?"fr":S.lang==="en"?"en":"ar",ol:S.lang,ok:false};
 const I=(k,l,ph)=>h("label",{class:"lec-f"},l,h("input",{class:"cin",value:f[k],placeholder:ph||"",maxlength:k==="title"?160:80,oninput:e=>f[k]=e.target.value}));
 const L=(k,l)=>h("label",{class:"lec-f"},l,h("select",{class:"cin",onchange:e=>f[k]=e.target.value},["ar","en","fr"].map(x=>h("option",{value:x,selected:f[k]===x},LN[x]))));
 const file=h("input",{type:"file",accept:"audio/*,.m4a,.mp3,.wav,.webm,.ogg,.aac,.flac",style:"display:none",onchange:e=>{const x=e.target.files[0];if(x)go2("file",x)}});
 const m=modal(h("h3",{},lt("newL")),I("title",lt("fTitle")),I("subject",lt("fSubject")),I("course",lt("fCourse")),L("ll",lt("fLec")),L("ol",lt("fOut")),
  h("label",{class:"lec-consent"},h("input",{type:"checkbox",onchange:e=>f.ok=e.target.checked}),h("span",{},lt("consent"))),
  h("div",{class:"acts"},h("button",{class:"btn",onclick:()=>m.remove()},t("cancel")),h("button",{class:"btn",onclick:()=>{if(!valid())return;file.click()}},ic("download"),lt("up")),h("button",{class:"btn fill",onclick:()=>go2("rec")},ic("mic"),lt("rec"))),file);
 const valid=()=>{if(!f.ok||!f.title.trim()){toast(lt("consentNeed"));return false}return true};
 async function go2(kind,x){if(!valid())return;if(kind==="file"&&x.size>(/\.mp3$/i.test(x.name)?MAX_MP3:MAX_UP)){toast(lt("eBig"));return}m.remove();
  try{const c=await sb();const r=await c.from("lectures").insert({user_id:SC.user.id,title:f.title.trim().slice(0,160),subject:f.subject.trim().slice(0,80)||null,course:f.course.trim().slice(0,80)||null,lecture_lang:f.ll,output_lang:f.ol,consent:true,status:"uploading"}).select().single();
   if(r.error)throw r.error;const lec=r.data;LEC.id=null;if(kind==="rec")startRec(lec);else uploadFile(lec,x)}catch(e){toast(lt("eGen"))}}}

// ---------- الرفع والتفريغ ----------
const extOf=(type,name)=>{const m=(name||"").match(/\.(\w{2,5})$/);if(m)return m[1].toLowerCase();return/mp4|m4a/.test(type)?"m4a":/mpeg|mp3/.test(type)?"mp3":/wav/.test(type)?"wav":/ogg/.test(type)?"ogg":"webm"};
const MIME_EXT={m4a:"audio/mp4",mp4:"audio/mp4",mp3:"audio/mpeg",mpga:"audio/mpeg",mpeg:"audio/mpeg",wav:"audio/wav",ogg:"audio/ogg",oga:"audio/ogg",aac:"audio/aac",flac:"audio/flac",webm:"audio/webm"};
const mimeOf=(type,ext)=>{if(MIME_EXT[ext])return MIME_EXT[ext];type=(type||"").split(";")[0];if(/^(audio|video)\/(webm|mp4|mpeg|mp3|wav|ogg|aac|flac)$/.test(type))return type;return"audio/webm"};
async function putChunk(lec,n,blob,name){const c=await sb(),ext=extOf(blob.type,name),path=SC.user.id+"/"+lec.id+"/c"+n+"."+ext;
 const r=await c.storage.from("lectures").upload(path,blob,{contentType:mimeOf(blob.type,ext),upsert:true});if(r.error)throw r.error;return{path,offset:0,dur:0,done:false}}
const MP3BR1=[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320],MP3BR2=[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160],MP3SR={3:[44100,48000,32000],2:[22050,24000,16000],0:[11025,12000,8000]};
function mp3Hdr(u,i){if(i+4>u.length||u[i]!==255||(u[i+1]&224)!==224)return null;const v=(u[i+1]>>3)&3,l=(u[i+1]>>1)&3,bi=u[i+2]>>4,si=(u[i+2]>>2)&3;if(v===1||l!==1||bi===0||bi===15||si===3)return null;const br=(v===3?MP3BR1:MP3BR2)[bi],sr=MP3SR[v][si];return{br,len:Math.floor((v===3?144000:72000)*br/sr)+((u[i+2]>>1)&1)}}
function mp3Sync(u,from){for(let i=from;i<u.length-4;i++){const a=mp3Hdr(u,i);if(a&&(mp3Hdr(u,i+a.len)||i+a.len>=u.length-4))return{pos:i,br:a.br}}return null}
async function splitMp3(file){const rd=async(a,b)=>new Uint8Array(await file.slice(a,Math.min(b,file.size)).arrayBuffer());
 const head=await rd(0,16);let st=0;if(head[0]===73&&head[1]===68&&head[2]===51)st=10+((head[6]&127)<<21|(head[7]&127)<<14|(head[8]&127)<<7|(head[9]&127));
 const f0=mp3Sync(await rd(st,st+65536),0);if(!f0)return[file];
 const step=Math.min(20*1024*1024,Math.max(1<<20,f0.br*125*SPLIT_SEC)),ty=file.type||"audio/mpeg",parts=[];let a=0;
 while(file.size-a>step*1.3){const f=mp3Sync(await rd(a+step,a+step+65536),0);if(!f)break;const cut=a+step+f.pos;parts.push(file.slice(a,cut,ty));a=cut}
 parts.push(file.slice(a,file.size,ty));return parts}
const splitFile=f=>/\.mp3$/i.test(f.name)&&f.size>8*1024*1024?splitMp3(f):Promise.resolve([f]);
async function uploadFile(lec,file){LEC.recUI={lec,msg:lt("upl"),file:true};render();const chs=[];
 try{const parts=await splitFile(file);for(let k=0;k<parts.length;k++){if(parts.length>1){LEC.recUI.msg=lt("upl")+" ("+(k+1)+"/"+parts.length+")";if(S.tab==="lec"&&!LEC.id)render()}chs.push(await putChunk(lec,k,parts[k],file.name))}
  const c=await sb();const saved=await c.from("lectures").update({chunks:chs}).eq("id",lec.id).select("id").single();if(saved.error)throw saved.error;lec.chunks=chs;await process(lec)}
 catch(e){console.error("[lecture-upload]",e);const c=await sb();if(chs.length){try{await c.storage.from("lectures").remove(chs.map(x=>x.path))}catch(cleanErr){console.warn("[lecture-upload-cleanup]",cleanErr)}}
  try{await c.from("lectures").delete().eq("id",lec.id)}catch(delErr){console.warn("[lecture-upload-row]",delErr)}
  toast(lt("eUp"));LEC.id=null;LEC.data=null;fin(lec,"failed")}}
async function process(lec){const c=await sb();let chunks=lec.chunks;
 try{for(let i=0;i<chunks.length;i++){if(chunks[i].done)continue;LEC.recUI={lec,msg:lt("trn",{a:i+1,b:chunks.length}),file:true};if(S.tab==="lec"&&!LEC.id)render();
   const r=await call({action:"transcribe",lecture_id:lec.id,chunk:i});if(r.status==="ready")break}
  fin(lec,"ready")}catch(e){toast(errMsg(e.message));fin(lec,"failed",e.message)}}
function fin(lec,st){LEC.recUI=null;if(S.tab==="lec"){if(st==="ready"){LEC.id=lec.id;LEC.tab="tText"}if(LEC.id===lec.id)LEC.data=null;render()}}

// ---------- التسجيل (قطع من 10 دقائق، كل قطعة تُرفع فور اكتمالها) ----------
async function startRec(lec){
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})}catch(e){toast(lt("eMic"));await(await sb()).from("lectures").delete().eq("id",lec.id);return}
 const mime=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus"].find(m=>window.MediaRecorder&&MediaRecorder.isTypeSupported(m))||"";
 const R={lec,stream,mr:null,act:0,cs:0,n:0,paused:false,ups:[],chunks:[],tick:null,wl:null};LEC.recUI=R;
 const begin=()=>{const buf=[],mr=new MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:32000}:{audioBitsPerSecond:32000}),n=R.n++;
  mr.ondataavailable=e=>{if(e.data&&e.data.size)buf.push(e.data)};
  mr.onstop=()=>{const b=new Blob(buf,{type:mr.mimeType||mime||"audio/webm"});if(b.size>2000)R.ups.push(putChunk(lec,n,b).then(ch=>{R.chunks[n]=ch}))};
  mr.start(1000);R.mr=mr;R.cs=0};
 begin();try{if(navigator.wakeLock)R.wl=await navigator.wakeLock.request("screen")}catch(e){}
 R.tick=setInterval(()=>{if(R.paused)return;R.act++;R.cs++;if(R.cs>=CH_SEC){const old=R.mr;begin();old.stop()}upd()},1000);
 function upd(){const e=document.getElementById("lec-rt");if(e)e.textContent=fmtT(R.act)}
 R.toggle=()=>{if(R.paused){R.mr.resume();R.paused=false}else{R.mr.pause();R.paused=true}render()};
 R.stop=async()=>{clearInterval(R.tick);R.msg=lt("upl");await new Promise(res=>{const o=R.mr.onstop;R.mr.onstop=()=>{o();res()};if(R.mr.state!=="inactive")R.mr.stop();else res()});stream.getTracks().forEach(t=>t.stop());try{R.wl&&R.wl.release()}catch(e){}R.stopped=true;render();
  try{await Promise.all(R.ups);const chunks=R.chunks.filter(Boolean);if(R.act<3||!chunks.length){await(await sb()).from("lectures").delete().eq("id",lec.id);LEC.recUI=null;return render()}
   const c=await sb();const saved=await c.from("lectures").update({chunks}).eq("id",lec.id).select("id").single();if(saved.error)throw saved.error;lec.chunks=chunks;await process(lec)}catch(e){console.error("[lecture-record-save]",e);const paths=R.chunks.filter(Boolean).map(x=>x.path);if(paths.length){try{await(await sb()).storage.from("lectures").remove(paths)}catch(cleanErr){console.warn("[lecture-record-cleanup]",cleanErr)}}toast(lt("eGen"));fin(lec,"failed")}};
 if(S.tab!=="lec")go("lec");else render()}
function recPanel(){const R=LEC.recUI;
 if(R.file||R.stopped)return h("div",{class:"card lec-rec"},h("div",{class:"lec-spin"}),h("b",{},R.msg||lt("proc")),h("div",{class:"meta"},R.lec.title));
 return h("div",{class:"card lec-rec on"},h("div",{class:"lec-dot"+(R.paused?" p":"")}),h("b",{},R.paused?lt("paused"):lt("recording")),h("div",{class:"lec-timer",id:"lec-rt"},fmtT(R.act)),h("div",{class:"meta"},R.lec.title),
  h("div",{class:"acts",style:"justify-content:center"},h("button",{class:"btn",onclick:R.toggle},R.paused?lt("resume"):lt("pause")),h("button",{class:"btn fill",onclick:R.stop},lt("stop"))))}
window.addEventListener("beforeunload",e=>{if(LEC.recUI&&!LEC.recUI.file&&!LEC.recUI.stopped){e.preventDefault();e.returnValue=""}});

// ---------- صفحة المحاضرة ----------
const TABS_L=["tText","tSum","tTerms","tCards","tQuiz","tMap"];
async function detail(v){
 if(!LEC.data||LEC.data.lec.id!==LEC.id){const sh=h("div",{class:"card meta"},"…");v.append(sh);try{await loadDetail()}catch(e){sh.textContent=lt("eGen");return}if(S.tab!=="lec"||!LEC.id)return;sh.remove()}
 const D=LEC.data,l=D.lec;
 if(LEC.recUI&&LEC.recUI.lec.id===l.id)v.append(recPanel());
 const title=h("h3",{dir:"auto",class:"lec-title"},l.title);
 const acts=h("div",{class:"lec-acts"},
  h("button",{class:"btn",onclick:async()=>{const n=prompt(lt("fTitle"),l.title);if(n&&n.trim()){l.title=n.trim().slice(0,160);await(await sb()).from("lectures").update({title:l.title}).eq("id",l.id);title.textContent=l.title}}},ic("pencil"),lt("edit")),
  h("button",{class:"btn",onclick:()=>exportPdf()},ic("download"),lt("pdf")),
  h("button",{class:"btn danger",onclick:()=>delLec(l)},ic("trash"),lt("del")));
 v.append(h("div",{class:"card"},title,h("div",{class:"meta"},[l.subject,l.course,l.lecture_date,Math.max(1,Math.round(l.duration_sec/60))+" "+lt("min"),LN[l.lecture_lang]+" → "+LN[l.output_lang]].filter(Boolean).join(" · ")),acts));
 if(l.status!=="ready"){const pend=(l.chunks||[]).some(c=>!c.done),act=LEC.recUI&&LEC.recUI.lec.id===l.id;v.append(h("div",{class:"card"},h("b",{},act?lt("proc"):lt("failed")),
  !act&&pend?h("div",{class:"acts"},h("button",{class:"btn fill",onclick:()=>{process(l)}},lt("resumeP"))):null,
  !act&&!pend?h("div",{},h("p",{class:"meta"},lt("lost")),h("div",{class:"acts"},h("button",{class:"btn fill",onclick:()=>recover(l)},lt("recov")))):null))}
 const ab=h("div",{class:"lec-audio"});if(!LEC.audio){LEC.audio=h("audio",{controls:"",preload:"none"})}ab.append(LEC.audio);v.append(ab);
 const tb=h("div",{class:"tabs lec-tabs"}),body=h("div",{});v.append(tb,body);
 const paintTabs=()=>tb.replaceChildren(...TABS_L.map(k=>h("button",{class:LEC.tab===k?"on":"",onclick:async()=>{await flush();LEC.edit=false;LEC.tab=k;paintTabs();paintBody()}},lt(k))));
 const paintBody=()=>{body.replaceChildren();({tText:tText,tSum:tSum,tTerms:tTerms,tCards:tCards,tQuiz:tQuiz,tMap:tMap})[LEC.tab](body,paintBody)};
 paintTabs();paintBody()}
const flush=()=>LEC.dirty&&LEC.curKind?saveOut(LEC.curKind):0;
async function loadDetail(){const c=await sb();
 const [lr,or]=await Promise.all([c.from("lectures").select("*").eq("id",LEC.id).single(),c.from("lecture_outputs").select("*").eq("lecture_id",LEC.id)]);
 if(lr.error)throw lr.error;const segs=[];
 for(let f=0;;f+=1000){const r=await c.from("lecture_segments").select("id,start_sec,end_sec,text,unclear,edited").eq("lecture_id",LEC.id).order("start_sec").range(f,f+999);if(r.error||!r.data||!r.data.length)break;segs.push(...r.data);if(r.data.length<1000)break}
 const outs={};(or.data||[]).forEach(o=>outs[o.kind]=o);LEC.data={lec:lr.data,segs,outs};LEC.dirty=false}
async function recover(l){const c=await sb(),dir=SC.user.id+"/"+l.id;const r=await c.storage.from("lectures").list(dir,{limit:200});
 const fs=(r.data||[]).filter(x=>/^c\d+\.\w+$/.test(x.name)).sort((a,b)=>parseInt(a.name.slice(1))-parseInt(b.name.slice(1)));
 if(r.error||!fs.length)return toast(lt("lost"));
 const chunks=fs.map(x=>({path:dir+"/"+x.name,offset:0,dur:0,done:false}));
 const sv=await c.from("lectures").update({chunks}).eq("id",l.id).select("id").single();if(sv.error)return toast(lt("eGen"));
 l.chunks=chunks;LEC.recUI={lec:l,msg:lt("proc"),file:true};render();await process(l)}
async function delLec(l){if(!confirm(lt("delQ")))return;const c=await sb();const ps=(l.chunks||[]).map(x=>x.path).filter(Boolean);if(ps.length)await c.storage.from("lectures").remove(ps);await c.from("lectures").delete().eq("id",l.id);LEC.id=null;LEC.data=null;render()}

// ---------- الصوت والقفز إلى التوقيت ----------
async function seek(t){const D=LEC.data,ch=D.lec.chunks||[];let i=0;ch.forEach((c,k)=>{if((+c.offset||0)<=t)i=k});const c=ch[i];if(!c)return;
 const a=LEC.audio;if(!LEC.urls[c.path]||LEC.urls[c.path].exp<Date.now()){const r=await(await sb()).storage.from("lectures").createSignedUrl(c.path,3600);if(r.error)return toast(lt("eGen"));LEC.urls[c.path]={u:r.data.signedUrl,exp:Date.now()+3e6}}
 const go=()=>{a.currentTime=Math.max(0,t-(+c.offset||0));a.play().catch(()=>{})};
 if(a.dataset.p!==c.path){a.dataset.p=c.path;a.src=LEC.urls[c.path].u;a.addEventListener("loadedmetadata",go,{once:true});a.load()}else go()}
const chip=t=>t==null||!isFinite(t)?null:h("button",{class:"lec-t",title:fmtT(t),onclick:e=>{e.stopPropagation();seek(+t)}},ic("play",{s:11}),fmtT(t));

// ---------- النص ----------
function tText(box,repaint){const D=LEC.data;
 box.append(h("div",{class:"lec-warn"},lt("sttNote")));
 if(!D.segs.length)return box.append(h("div",{class:"card meta"},lt("eNoTxt")));
 box.append(h("div",{class:"lec-bar"},h("button",{class:"btn"+(LEC.edit?" fill":""),onclick:()=>{LEC.edit=!LEC.edit;repaint()}},ic("pencil"),LEC.edit?lt("save"):lt("edit")),
  D.outs.outline?null:genBtn("outline",box,repaint,false,lt("genHead"))));
 const heads=D.outs.outline?D.outs.outline.content.items||[]:[];
 const hs=heads.filter(x=>isFinite(x.t)).sort((a,b)=>a.t-b.t);let hi=0,cur=null;const doc=h("div",{class:"card lec-doc"});
 for(const s of D.segs){
  while(hi<hs.length&&hs[hi].t<=s.start_sec+.5){doc.append(h("div",{class:"lec-hd"},h("span",{dir:"auto"},hs[hi].title),h("span",{class:"badge ai",title:lt("aiHead")},"AI")));cur=null;hi++}
  if(!cur||s.start_sec-cur.end>1.8||cur.len>650){cur={end:0,len:0,el:h("p",{class:"lec-p",dir:"auto"},chip(s.start_sec)," ")};doc.append(cur.el)}
  const sp=h("span",{class:"lec-s"+(s.unclear?" unc":""),title:s.unclear?lt("unc"):""},s.text+" ");
  if(LEC.edit){sp.contentEditable="plaintext-only";if(sp.contentEditable!=="plaintext-only")sp.contentEditable="true";sp.onblur=async()=>{const nt=sp.textContent.trim();if(!nt||nt===s.text.trim())return;const r=await(await sb()).from("lecture_segments").update({text:nt.slice(0,4000)}).eq("id",s.id);if(r.error)return toast(lt("eGen"));s.text=nt;s.unclear=false;s.edited=true;sp.classList.remove("unc")}}
  cur.el.append(sp);cur.end=s.end_sec;cur.len+=s.text.length}
 box.append(doc)}

// ---------- مولّد المخرجات ----------
function genBtn(kind,box,repaint,regen,label){return h("button",{class:"btn"+(regen?"":" fill"),disabled:!!LEC.busy[kind],onclick:async e=>{
  if(regen){const o=LEC.data.outs[kind];if(o&&o.edited&&!confirm(lt("regenQ")))return}
  LEC.busy[kind]=1;e.currentTarget.disabled=true;e.currentTarget.textContent=lt("working");
  try{const r=await call({action:"generate",lecture_id:LEC.id,kind,lang:LEC.data.lec.output_lang});LEC.data.outs[kind]={kind,lang:r.lang,content:r.content,edited:false}}catch(x){toast(errMsg(x.message))}
  delete LEC.busy[kind];if(S.tab==="lec")repaint()}},ic("sparkles"),label||(regen?lt("regen"):lt("gen")))}
function ed(o,k,tag,cls){const e=h(tag||"span",{class:(cls||"")+(LEC.edit?" lec-ed":""),dir:"auto"},o[k]==null?"":String(o[k]));
 if(LEC.edit){e.contentEditable="plaintext-only";if(e.contentEditable!=="plaintext-only")e.contentEditable="true";e.addEventListener("input",()=>{o[k]=e.textContent;LEC.dirty=true})}return e}
async function saveOut(kind){const o=LEC.data.outs[kind];const r=await(await sb()).from("lecture_outputs").update({content:o.content}).eq("lecture_id",LEC.id).eq("kind",kind);if(r.error)return toast(lt("eGen"));o.edited=true;LEC.dirty=false;toast(lt("saved"))}
function outPane(kind,box,repaint,fn,canEdit){const o=LEC.data.outs[kind];LEC.curKind=kind;
 if(!o){box.append(h("div",{class:"card"},h("p",{class:"meta"},lt("aiNote")),genBtn(kind,box,repaint)));return}
 const bar=h("div",{class:"lec-bar"},genBtn(kind,box,repaint,true));
 if(canEdit)bar.append(h("button",{class:"btn"+(LEC.edit?" fill":""),onclick:async()=>{if(LEC.edit){await saveOut(kind)}LEC.edit=!LEC.edit;repaint()}},ic("pencil"),LEC.edit?lt("save"):lt("edit")));
 box.append(h("div",{class:"lec-warn"},lt("aiNote")),bar);fn(o.content,o)}
const aiNote=n=>n?h("div",{class:"lec-ai"},h("span",{class:"badge ai"},lt("aiAdd")),h("span",{dir:"auto"},n)):null;

// ---------- الملخص ----------
function tSum(box,repaint){
 box.append(h("div",{class:"tabs"},[1,2,3].map(n=>h("button",{class:LEC.lvl===n?"on":"",onclick:async()=>{await flush();LEC.edit=false;LEC.lvl=n;repaint()}},lt("l"+n)))));
 outPane("summary"+LEC.lvl,box,repaint,c=>sumView(box,c),true)}
function sumView(box,c){(c.sections||[]).forEach(s=>box.append(h("div",{class:"card lec-sec"},h("h3",{},ed(s,"heading")),
  (s.points||[]).map(p=>h("div",{class:"lec-pt"},h("div",{},ed(p,"text"),chip(p.t)),aiNote(p.ai_note))))));
 if((c.uncertain||[]).length)box.append(h("div",{class:"card lec-sec"},h("h3",{},lt("uncList")),c.uncertain.map(u=>h("div",{class:"lec-pt unc"},h("span",{dir:"auto"},u.text),chip(u.t)))))}

// ---------- المصطلحات ----------
function tTerms(box,repaint){outPane("terms",box,repaint,c=>{(c.items||[]).forEach(x=>box.append(h("div",{class:"card lec-sec"},h("div",{class:"lec-tk"},h("b",{},ed(x,"term")),h("span",{class:"badge n"},x.kind||""),chip(x.t)),h("div",{},ed(x,"definition","div")),aiNote(x.ai_note))))},true)}

// ---------- البطاقات ----------
function tCards(box,repaint){outPane("flashcards",box,repaint,c=>{const cs=c.cards||[];
 box.append(h("div",{class:"lec-bar"},h("button",{class:"btn fill",onclick:()=>{const d=newDeck(LEC.data.lec.title,cs.filter(x=>x.q&&x.a).map(x=>({id:uid(),t:"q",q:String(x.q),a:String(x.a),src:{t:lt("title")+": "+LEC.data.lec.title,own:1}})));persist();toast(lt("added",{n:d.cards.length}))}},ic("cards"),lt("toDecks"))));
 cs.forEach(x=>{const a=h("div",{class:"lec-ans",style:"display:none"},ed(x,"a","div"));box.append(h("div",{class:"card lec-sec",onclick:e=>{if(!LEC.edit&&!e.target.closest("button"))a.style.display=a.style.display==="none"?"":"none"}},h("div",{class:"lec-tk"},h("b",{},ed(x,"q")),chip(x.t)),a));if(LEC.edit)a.style.display=""})},true)}

// ---------- الاختبار الذاتي ----------
function tQuiz(box,repaint){outPane("quiz",box,repaint,c=>{const qs=c.questions||[];let sc=0,n=0;const sb2=h("div",{class:"lec-score"},lt("score")+": 0/0");box.append(sb2);
 const upd=ok=>{n++;if(ok)sc++;sb2.textContent=lt("score")+": "+sc+"/"+n};
 qs.forEach((q,i)=>{const fb=h("div",{class:"lec-fb",style:"display:none"},h("div",{dir:"auto"},q.explain||""),chip(q.t));let done=false;
  const pick=(btn,right,val)=>{if(done)return;done=true;btn.classList.add(right?"right":"wrong");fb.style.display="";upd(right);btn.parentNode.querySelectorAll("button").forEach(b=>{if(b.dataset.ok==="1")b.classList.add("right")})};
  let opts;
  if(q.type==="short"){opts=h("div",{},h("button",{class:"btn",onclick:e=>{fb.prepend(h("div",{class:"lec-model",dir:"auto"},q.answer||""));fb.style.display="";e.currentTarget.remove()}},lt("reveal")))}
  else{const list=q.type==="tf"?[[lt("tr"),"true"],[lt("fa"),"false"]]:(q.options||[]).map(o=>[o,o]);
   opts=h("div",{class:"lec-opts"},list.map(([lab,val])=>{const nz=x=>String(x).trim().toLowerCase(),right=nz(val)===nz(q.answer),b=h("button",{class:"lec-opt",dir:"auto","data-ok":right?"1":"0",onclick:()=>pick(b,right)},lab);return b}))}
  box.append(h("div",{class:"card lec-q"},h("b",{dir:"auto"},(i+1)+". "+(q.q||"")),opts,fb))})},false)}

// ---------- الخريطة الذهنية ----------
function tMap(box,repaint){outPane("mindmap",box,repaint,c=>{
 const node=(n,d)=>{const kids=(n.children||[]);const t=h("span",{dir:"auto"},n.title||"");const row=h("span",{class:"lec-mn d"+Math.min(d,3)},t,chip(n.t));
  return kids.length?h("details",{open:d<2,class:"lec-node"},h("summary",{},row),h("div",{class:"lec-kids"},kids.map(k=>node(k,d+1)))):h("div",{class:"lec-node leaf"},row)};
 box.append(h("div",{class:"card lec-map"},h("div",{class:"lec-root",dir:"auto"},c.title||LEC.data.lec.title),(c.children||[]).map(k=>node(k,1))))},false)}

// ---------- تصدير PDF (طباعة المتصفح) ----------
function exportPdf(){const D=LEC.data,l=D.lec,O=D.outs,A=`<span class="ai">AI</span>`;let b="";
 const ts=t=>isFinite(t)&&t!=null?`<span class="t">[${fmtT(t)}]</span> `:"";
 const note=n=>n?`<div class="an"><b>${esc(lt("aiAdd"))}:</b> ${esc(n)}</div>`:"";
 b+=`<h1>${esc(l.title)}</h1><p class="m">${esc([l.subject,l.course,l.lecture_date,LN[l.lecture_lang]].filter(Boolean).join(" · "))}</p><p class="w">${esc(lt("sttNote"))} ${esc(lt("aiNote"))}</p>`;
 const heads=O.outline?(O.outline.content.items||[]).slice().sort((a,b)=>a.t-b.t):[];let hi=0,open=false,end=0,len=0;b+=`<h2>${esc(lt("tText"))}</h2>`;
 for(const s of D.segs){while(hi<heads.length&&heads[hi].t<=s.start_sec+.5){if(open)b+="</p>";open=false;b+=`<h3>${esc(heads[hi].title)} ${A}</h3>`;hi++}
  if(!open||s.start_sec-end>1.8||len>650){if(open)b+="</p>";b+=`<p dir="auto">${ts(s.start_sec)}`;open=true;len=0}
  b+=`<span class="${s.unclear?"u":""}">${esc(s.text)} </span>`;end=s.end_sec;len+=s.text.length}
 if(open)b+="</p>";
 [1,2,3].forEach(n=>{const o=O["summary"+n];if(!o)return;b+=`<h2>${esc(lt("tSum"))} — ${esc(lt("l"+n))} ${A}</h2>`;(o.content.sections||[]).forEach(s=>{b+=`<h3>${esc(s.heading)}</h3><ul>`+(s.points||[]).map(p=>`<li dir="auto">${ts(p.t)}${esc(p.text)}${note(p.ai_note)}</li>`).join("")+"</ul>"});
  if((o.content.uncertain||[]).length)b+=`<h3>${esc(lt("uncList"))}</h3><ul>`+o.content.uncertain.map(u=>`<li>${ts(u.t)}${esc(u.text)}</li>`).join("")+"</ul>"});
 if(O.terms){b+=`<h2>${esc(lt("tTerms"))} ${A}</h2><ul>`+(O.terms.content.items||[]).map(x=>`<li dir="auto">${ts(x.t)}<b>${esc(x.term)}</b>${x.definition?" — "+esc(x.definition):""}${note(x.ai_note)}</li>`).join("")+"</ul>"}
 if(O.flashcards){b+=`<h2>${esc(lt("tCards"))} ${A}</h2><ol>`+(O.flashcards.content.cards||[]).map(x=>`<li dir="auto"><b>${esc(x.q)}</b><br>${esc(x.a)}</li>`).join("")+"</ol>"}
 if(O.quiz){b+=`<h2>${esc(lt("tQuiz"))} ${A}</h2><ol>`+(O.quiz.content.questions||[]).map(q=>`<li dir="auto"><b>${esc(q.q)}</b>${(q.options||[]).length?"<ul>"+q.options.map(o=>`<li>${esc(o)}</li>`).join("")+"</ul>":""}<div class="an">✔ ${esc(q.answer)}${q.explain?" — "+esc(q.explain):""}</div></li>`).join("")+"</ol>"}
 if(O.mindmap){const nd=n=>`<li dir="auto">${esc(n.title)}${(n.children||[]).length?"<ul>"+n.children.map(nd).join("")+"</ul>":""}</li>`;b+=`<h2>${esc(lt("tMap"))} ${A}</h2><ul>${(O.mindmap.content.children||[]).map(nd).join("")}</ul>`}
 const w=window.open("","_blank");if(!w)return toast(lt("eGen"));
 w.document.write(`<!doctype html><html lang="${l.output_lang}" dir="${l.output_lang==="ar"?"rtl":"ltr"}"><head><meta charset="utf-8"><title>${esc(l.title)}</title><style>body{font:15px/1.8 system-ui,sans-serif;max-width:780px;margin:24px auto;padding:0 16px;color:#12263f}h1{color:#173D70}h2{color:#173D70;border-bottom:2px solid #c9a227;padding-bottom:3px;margin-top:28px}h3{margin:16px 0 4px}.m,.t{color:#5b6b80}.t{font-size:12px;font-family:monospace}.w{background:#fff7e0;border:1px solid #e8d48a;padding:8px 12px;border-radius:8px;font-size:13px}.u{border-bottom:1px dotted #c0392b}.ai{background:#f4d36b;color:#4a3a00;border-radius:6px;padding:0 6px;font-size:11px;font-weight:700}.an{background:#f4f6fa;border-inline-start:3px solid #c9a227;padding:3px 8px;margin:3px 0;font-size:13px}li{margin:4px 0}@media print{body{margin:0}}</style></head><body>${b}<script>onload=()=>setTimeout(()=>print(),400)<\/script></body></html>`);w.document.close()}
})();
