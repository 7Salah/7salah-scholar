// 7Salah Scholar — AI Academic Research Assistant & Source-Grounded Document Analyzer
(function(){
 "use strict";

 const aiTr=(a,e,f)=>S.lang==="ar"?a:S.lang==="fr"?(f||e):e;

 Object.assign(T.ar,{nAI:"المساعد الذكي"});
 Object.assign(T.en,{nAI:"AI Research"});
 Object.assign(T.fr,{nAI:"Assistant IA"});

 if(Array.isArray(TABS)&&!TABS.some(x=>x[0]==="ai")){
  const resIdx=TABS.findIndex(x=>x[0]==="res");
  TABS.splice(resIdx!==-1?resIdx+1:3,0,["ai","nAI",icp("sparkles")]);
 }

 const MODES=[
  {id:"qa",ar:"سؤال وتوضيح",en:"Research Q&A",fr:"Questions & Synthèse"},
  {id:"simplify",ar:"تبسيط نظرية",en:"Simplify Theory",fr:"Simplifier une théorie"},
  {id:"outline",ar:"خطة بحث",en:"Research Outline",fr:"Plan de recherche"},
  {id:"litreview",ar:"مراجعة أدبيات",en:"Literature Review",fr:"Revue de littérature"}
 ];

 const TASK_ROUTES=[
  {id:"general",ar:"متوازن + مراجع (Hydrogen)",en:"Balanced + Search (Hydrogen)",fr:"Équilibré (Hydrogen)"},
  {id:"fast",ar:"سريع (Flash-Lite)",en:"Fast (Flash-Lite)",fr:"Rapide (Flash-Lite)"},
  {id:"complex",ar:"تحليل STEM متقدّم",en:"Complex STEM Analysis",fr:"Analyse STEM"},
  {id:"deep",ar:"تفكير معمّق (Deep)",en:"Deep Reasoning",fr:"Raisonnement profond"}
 ];

 const PERSONAS=[
  {id:"advisor",ar:"مستشار بحثي",en:"Research Advisor",fr:"Conseiller"},
  {id:"reviewer",ar:"محكّم نقدي",en:"Peer Reviewer",fr:"Évaluateur"},
  {id:"stem",ar:"مدرّس كمّي وSTEM",en:"STEM & Quant Tutor",fr:"Tuteur STEM"},
  {id:"summarizer",ar:"مُلخّص تنفيذي",en:"Rapid Explainer",fr:"Synthèse rapide"}
 ];

 const AI={
  tab:"chat", // chat | live | analyzer | maps | history
  mode:"qa",
  taskRoute:"general",
  persona:"advisor",
  field:"",
  useWebSearch:true,
  busy:false,
  analyzing:false,
  convertingId:null,
  savingId:null,
  source:null, // { kind: "pdf"|"lecture"|"text", title, sizeLabel, pdfBase64?, text?, mime? }
  analysis:null,
  messages:[], // [{ id, role, text, mode, modelUsed, verification, citations, openCits, ts, titleHint }]
  sessions:LS.get("7s_ai_sessions",[])||[],
  activeSessionId:null,
  draft:"",
  mapsQuery:"",
  mapsCoords:null,
  mapsBusy:false,
  mapsResult:null,
  mapsError:""
 };

 function saveSessions(){
  try{
   if(!AI.messages.length)return;
   const firstUser=AI.messages.find(m=>m.role==="user");
   const title=(AI.source&&AI.source.title)||(firstUser&&firstUser.text.slice(0,70))||aiTr("جلسة بحثية","Research Session","Session de recherche");
   const entry={
    id:AI.activeSessionId||(AI.activeSessionId=uid()),
    title,
    mode:AI.mode,
    field:AI.field,
    updatedAt:Date.now(),
    sourceMeta:AI.source?{kind:AI.source.kind,title:AI.source.title,sizeLabel:AI.source.sizeLabel,text:AI.source.text?AI.source.text.slice(0,40000):""}:null,
    messages:AI.messages.slice(-24)
   };
   const idx=AI.sessions.findIndex(s=>s.id===entry.id);
   if(idx>=0)AI.sessions[idx]=entry;
   else AI.sessions.unshift(entry);
   AI.sessions=AI.sessions.slice(0,20);
   LS.set("7s_ai_sessions",AI.sessions);
  }catch(e){}
 }

 function blobToBase64(blob){
  return new Promise((resolve,reject)=>{
   const r=new FileReader();
   r.onload=()=>resolve(String(r.result||""));
   r.onerror=()=>reject(new Error("Failed to read PDF file"));
   r.readAsDataURL(blob);
  });
 }

 async function attachPdfFile(file,autoAnalyze){
  if(!file)return;
  if(file.type!=="application/pdf"&&!/\.pdf$/i.test(file.name||"")){
   return toast(aiTr("يرجى اختيار ملف PDF صالح.","Please select a valid PDF file.","Veuillez choisir un fichier PDF valide."));
  }
  if(file.size>18*1024*1024){
   return toast(aiTr("الحد الأقصى لحجم PDF للتحليل الذكي هو 18 ميغابايت.","Maximum PDF size for AI analysis is 18 MB.","Taille maximale PDF : 18 Mo."));
  }
  try{
   const b64=await blobToBase64(file);
   AI.source={
    kind:"pdf",
    title:file.name||aiTr("ورقة بحثية PDF","Research Paper PDF","Document PDF"),
    sizeLabel:typeof libraryBytes==="function"?libraryBytes(file.size):(Math.round(file.size/1024)+" KB"),
    pdfBase64:b64
   };
   AI.analysis=null;
   toast(aiTr("تم إرفاق ملف PDF كمصدر موثّق ✓","PDF attached as grounded source ✓","PDF joint comme source ✓"));
   if(autoAnalyze){AI.tab="analyzer";render();await runDocumentAnalysis();}
   else render();
  }catch(e){
   toast(aiTr("تعذر قراءة ملف PDF.","Could not read PDF file.","Impossible de lire le PDF."));
  }
 }

 async function openLibrarySourceModal(){
  if(typeof libraryGetAll!=="function"){
   return toast(aiTr("المكتبة غير متاحة حاليًا.","Library is unavailable.","Bibliothèque indisponible."));
  }
  let docs=[];
  try{docs=(await libraryGetAll()).filter(d=>d&&d.blob&&(d.type==="application/pdf"||/\.pdf$/i.test(d.name||"")));}
  catch(e){}
  const list=h("div",{class:"ai-pick-list"});
  if(!docs.length){
   list.append(h("div",{class:"meta",style:"padding:12px 0"},aiTr("لا توجد ملفات PDF محفوظة في مكتبتك بعد. أضف ملفًا من تبويب «المكتبة» أو ارفعه مباشرة هنا.","No PDF files in your Library yet. Add one in the Library tab or upload directly here.","Aucun PDF dans votre bibliothèque.")));
  }else{
   docs.forEach(d=>{
    const m=d.meta||{};
    const meta=[m.course,m.department,m.university,typeof libraryBytes==="function"?libraryBytes(d.size||0):""].filter(Boolean).join(" · ");
    list.append(h("button",{type:"button",class:"ai-pick-item",onclick:async()=>{
     box.remove();
     await attachPdfFile(new File([d.blob],d.name||"document.pdf",{type:"application/pdf"}),true);
    }},
    h("span",{class:"ai-pick-ic"},ic("file-text")),
    h("span",{class:"ai-pick-tx"},h("b",{dir:"auto"},d.name),meta?h("small",{dir:"auto"},meta):null)));
   });
  }
  const box=modal(
   h("h3",{},ic("book"),aiTr("اختر ورقة أو محاضرة من المكتبة","Choose a PDF from My Library","Choisir depuis la bibliothèque")),
   list,
   h("div",{class:"acts"},h("button",{class:"btn",type:"button",onclick:()=>box.remove()},t("close")))
  );
 }

 async function openLectureSourceModal(){
  const list=h("div",{class:"ai-pick-list"},h("div",{class:"meta",style:"padding:10px 0"},aiTr("جارٍ تحميل المحاضرات المفرّغة…","Loading transcribed lectures…","Chargement des cours…")));
  const box=modal(
   h("h3",{},ic("mic"),aiTr("اختر محاضرة مفرّغة (Lecture AI)","Select a Transcribed Lecture","Choisir un cours transcrit")),
   list,
   h("div",{class:"acts"},h("button",{class:"btn",type:"button",onclick:()=>box.remove()},t("close")))
  );
  if(!window.SUPA||!SUPA.url||!SUPA.key||typeof loadSb!=="function"){
   list.replaceChildren(h("div",{class:"meta"},aiTr("ميزة محاضرات Lecture AI السحابية تتطلب تسجيل الدخول وإعداد Supabase. يمكنك أيضًا نسخ نص أي محاضرة ولصقه عبر خيار «لصق نص».","Cloud Lecture AI requires signing in with Supabase. You can also paste any lecture transcript via “Paste Text”.","La synchronisation Lecture AI requiert une connexion.")));
   return;
  }
  try{
   await loadSb();
   if(!SC.user){
    list.replaceChildren(h("div",{class:"meta"},aiTr("سجّل الدخول لعرض محاضراتك المفرّغة.","Sign in to view your transcribed lectures.","Connectez-vous pour voir vos cours.")));
    return;
   }
   const r=await SC.sb.from("lectures").select("id,title,subject,course,lecture_date,duration_sec,status").eq("status","ready").order("created_at",{ascending:false}).limit(40);
   if(r.error)throw r.error;
   const lecs=r.data||[];
   if(!lecs.length){
    list.replaceChildren(h("div",{class:"meta"},aiTr("لا توجد محاضرات جاهزة بعد في Lecture AI.","No ready lectures found in Lecture AI yet.","Aucun cours prêt pour l'instant.")));
    return;
   }
   list.replaceChildren(...lecs.map(l=>h("button",{type:"button",class:"ai-pick-item",onclick:async()=>{
    box.remove();
    toast(aiTr("جارٍ جلب نص المحاضرة…","Fetching lecture transcript…","Récupération du cours…"));
    try{
     const sr=await SC.sb.from("lecture_segments").select("start_sec,text").eq("lecture_id",l.id).order("start_sec").limit(2500);
     if(sr.error)throw sr.error;
     const fmtTime=sec=>{const s=Math.max(0,Math.round(+sec||0)),m=Math.floor(s/60),x=s%60;return String(m).padStart(2,"0")+":"+String(x).padStart(2,"0")};
     const transcript=(sr.data||[]).map(seg=>`[${fmtTime(seg.start_sec)}] ${seg.text}`).join("\n");
     if(transcript.length<20){
      return toast(aiTr("نص المحاضرة غير متاح.","Lecture transcript is empty.","Transcription vide."));
     }
     AI.source={
      kind:"lecture",
      title:l.title,
      sizeLabel:[l.subject,l.course,l.lecture_date].filter(Boolean).join(" · ")||aiTr("محاضرة مفرّغة","Lecture Transcript","Transcription"),
      text:transcript
     };
     AI.analysis=null;
     AI.tab="analyzer";
     render();
     await runDocumentAnalysis();
    }catch(err){
     toast(aiTr("تعذر تحميل نص المحاضرة.","Failed to fetch lecture transcript.","Échec du chargement."));
    }
   }},
   h("span",{class:"ai-pick-ic"},ic("mic")),
   h("span",{class:"ai-pick-tx"},h("b",{dir:"auto"},l.title),h("small",{dir:"auto"},[l.subject,l.course,l.lecture_date].filter(Boolean).join(" · ")||aiTr("محاضرة جاهزة","Ready lecture","Prêt"))))));
  }catch(e){
   list.replaceChildren(h("div",{class:"meta"},aiTr("تعذر تحميل قائمة المحاضرات.","Could not load lectures list.","Impossible de charger les cours.")));
  }
 }

 function openPasteTextModal(){
  const ti=h("input",{class:"in",placeholder:aiTr("عنوان الورقة أو النص (اختياري)","Document / article title (optional)","Titre du document")});
  const ta=h("textarea",{class:"in",rows:"7",placeholder:aiTr("الصق نص المقال أو البحث أو المحاضرة هنا للتحليل وطرح الأسئلة الموثّقة…","Paste research article, notes, or transcript excerpt here for strict analysis and Q&A…","Collez un article ou extrait ici…")});
  const box=modal(
   h("h3",{},ic("file-text"),aiTr("إرفاق نص أو مقال للتحليل","Attach Article or Text Source","Joindre un texte")),
   ti,
   h("div",{style:"height:8px"}),
   ta,
   h("div",{class:"acts"},
    h("button",{class:"btn",type:"button",onclick:()=>box.remove()},t("cancel")),
    h("button",{class:"btn fill",type:"button",onclick:()=>{
     const raw=ta.value.trim();
     if(raw.length<30)return toast(aiTr("النص قصير جدًا (30 حرفًا على الأقل).","Text is too short (min 30 characters).","Texte trop court."));
     const title=ti.value.trim()||raw.split(/\n/)[0].slice(0,65);
     AI.source={
      kind:"text",
      title,
      sizeLabel:raw.length.toLocaleString()+" "+aiTr("حرف","chars","car."),
      text:raw
     };
     AI.analysis=null;
     box.remove();
     render();
    }},aiTr("اعتماد كمصدر","Attach Source","Joindre"))
   )
  );
 }

 // Safe DOM Markdown Renderer (no untrusted innerHTML!)
 function appendInlineFormatted(parent,line){
  const rx=/(\*\*[^*]+\*\*|`[^`]+`|\[(?:Doc[^\]]*|\d+)\])/g;
  let last=0,m;
  while((m=rx.exec(line))){
   if(m.index>last)parent.append(document.createTextNode(line.slice(last,m.index)));
   const tok=m[0];
   if(tok.startsWith("**")&&tok.endsWith("**")){
    parent.append(h("strong",{},tok.slice(2,-2)));
   }else if(tok.startsWith("`")&&tok.endsWith("`")){
    parent.append(h("code",{class:"ai-inline-code"},tok.slice(1,-1)));
   }else{
    parent.append(h("sup",{class:"ai-cit-ref"},tok));
   }
   last=m.index+tok.length;
  }
  if(last<line.length)parent.append(document.createTextNode(line.slice(last)));
 }

 function renderMarkdownDom(text){
  const frag=document.createDocumentFragment();
  const lines=String(text||"").replace(/\r/g,"").split("\n");
  let listEl=null,listTag=null;
  const flushList=()=>{if(listEl){frag.append(listEl);listEl=null;listTag=null}};
  for(const raw of lines){
   const line=raw.trim();
   if(!line){flushList();continue}
   const hm=line.match(/^(#{1,3})\s+(.+)$/);
   if(hm){
    flushList();
    const tag=hm[1].length===1?"h4":hm[1].length===2?"h5":"h6";
    const el=h(tag,{class:"ai-md-h",dir:"auto"});
    appendInlineFormatted(el,hm[2]);
    frag.append(el);
    continue;
   }
   const ulm=line.match(/^[-*•]\s+(.+)$/);
   if(ulm){
    if(listTag!=="ul"){flushList();listEl=h("ul",{class:"ai-md-list",dir:"auto"});listTag="ul"}
    const li=h("li",{});appendInlineFormatted(li,ulm[1]);listEl.append(li);
    continue;
   }
   const olm=line.match(/^\d+[.)]\s+(.+)$/);
   if(olm){
    if(listTag!=="ol"){flushList();listEl=h("ol",{class:"ai-md-list",dir:"auto"});listTag="ol"}
    const li=h("li",{});appendInlineFormatted(li,olm[1]);listEl.append(li);
    continue;
   }
   const bq=line.match(/^>\s+(.+)$/);
   if(bq){
    flushList();
    const q=h("blockquote",{class:"ai-md-quote",dir:"auto"});
    appendInlineFormatted(q,bq[1]);
    frag.append(q);
    continue;
   }
   flushList();
   const p=h("p",{class:"ai-md-p",dir:"auto"});
   appendInlineFormatted(p,line);
   frag.append(p);
  }
  flushList();
  return frag;
 }

 function verificationMeta(v){
  if(!v)return{cls:"warn",label:aiTr("تحقّق من المصادر","Verify Sources","Vérifier les sources"),score:""};
  if(v.status==="strict-document-grounded"){
   return{
    cls:"strict",
    label:aiTr("موثّق حصريًا من المصدر المرفق","Strictly Source-Grounded","Strictement ancré à la source"),
    score:(v.confidenceScore||96)+"%"
   };
  }
  if(v.status==="hybrid-grounded"){
   return{
    cls:"strict",
    label:aiTr("موثّق بالمصدر + فهارس علمية","Source + Verified Indexes","Source + Index vérifiés"),
    score:(v.confidenceScore||95)+"%"
   };
  }
  if(v.status==="web-grounded"){
   return{
    cls:"web",
    label:aiTr("موثّق بمراجع وبحث علمي","Grounded in Verified Sources","Ancré dans des sources vérifiées"),
    score:(v.confidenceScore||86)+"%"
   };
  }
  return{
   cls:"warn",
   label:aiTr("تحقّق خارجيًا (معلومات تمهيدية)","Verify Independently","Vérification requise"),
   score:(v.confidenceScore||62)+"%"
  };
 }

 function formatCitationClient(c,style){
  style=style||S.citeStyle||"apa";
  if(typeof formatCite==="function"){
   return formatCite({
    title:c.title||"",
    authors:c.authors||[],
    year:c.year||null,
    journal:c.journal||"",
    doi:c.doi||"",
    url:c.url||""
   },style);
  }
  return c.formatted||c.title||"";
 }

 function buildCitationsBlock(citations,stateObj){
  if(!citations||!citations.length)return null;
  const isOpen=Boolean(stateObj.openCits);
  const toggleBtn=h("button",{type:"button",class:"ai-cit-toggle",onclick:()=>{stateObj.openCits=!stateObj.openCits;render()}},
   ic("book",{s:15}),
   aiTr(`المراجع الموثّقة (${citations.length}) · ${S.citeStyle.toUpperCase()}`,`Verified References (${citations.length}) · ${S.citeStyle.toUpperCase()}`,`Références (${citations.length})`),
   ic(isOpen?"chevron-up":"chevron-down",{s:15})
  );
  if(!isOpen)return h("div",{class:"ai-cit-wrap"},toggleBtn);

  const copyAllBtn=h("button",{type:"button",class:"btn",onclick:async()=>{
   const text=citations.map(c=>formatCitationClient(c,S.citeStyle)).join("\n\n");
   try{await navigator.clipboard.writeText(text);if(typeof award==="function")award("cite");toast(t("copied"));}catch(e){}
  }},ic("clipboard",{s:14}),aiTr("نسخ كل المراجع","Copy All Bibliography","Tout copier"));

  const qChips=(stateObj.queries&&stateObj.queries.length)?h("div",{class:"ai-wg-queries",style:"padding:8px 12px 0"},
   h("small",{class:"meta"},aiTr("استعلامات Google Search:","Google Search Queries:","Requêtes Google Search :")),
   stateObj.queries.map(qs=>h("span",{class:"ai-wg-q",dir:"auto"},qs))
  ):null;

  return h("div",{class:"ai-cit-wrap open"},
   toggleBtn,
   h("div",{class:"ai-cit-controls"},citeSwitcher(()=>render()),copyAllBtn),
   qChips,
   h("div",{class:"ai-cit-list"},citations.map((c,idx)=>
    h("div",{class:"ai-cit-item"},
     h("div",{class:"ai-cit-head"},
      h("span",{class:"ai-cit-idx"},"["+(c.index||idx+1)+"]"),
      h("span",{class:"ai-cit-src"},c.verifiedSource||"Academic Reference"),
      c.doi?h("span",{class:"ai-cit-doi",dir:"ltr"},"DOI: "+c.doi):null
     ),
     h("div",{class:"ai-cit-text",dir:"auto"},formatCitationClient(c,S.citeStyle)),
     c.quote?h("div",{class:"ai-cit-quote",dir:"auto"},"«"+c.quote+"»"):null,
     h("div",{class:"ai-cit-links"},
      (c.url||c.doi)?h("a",{class:"ai-link-btn",href:c.doi?("https://doi.org/"+c.doi):c.url,target:"_blank",rel:"noopener noreferrer"},ic("link",{s:13}),aiTr("تحقّق من المصدر","Verify Source","Vérifier")):null,
      h("button",{type:"button",class:"ai-link-btn",onclick:async()=>{
       try{await navigator.clipboard.writeText(formatCitationClient(c,S.citeStyle));if(typeof award==="function")award("cite");toast(t("copied"))}catch(e){}
      }},ic("clipboard",{s:13}),t("copy"))
     )
    )
   ))
  );
 }

 function resolveAiEndpoint(endpoint){
  const clean=String(endpoint||"").trim();
  if(/^https?:\/\//i.test(clean))return clean;
  const normalized=clean.startsWith("/")?clean:("/"+clean.replace(/^\/+/,""));
  const metaEl=typeof document!=="undefined"?document.querySelector('meta[name="scholar-api-base"]'):null;
  const metaBase=metaEl?metaEl.getAttribute("content")||"":"";
  let storedBase="";
  try{storedBase=localStorage.getItem("7s_api_base")||""}catch(_){}
  const base=String((window.APP&&window.APP.apiBase)||metaBase||storedBase||"").trim().replace(/\/+$/,"");
  return base?(base+normalized):normalized;
 }

 function isCrossOriginUrl(url){
  try{
   if(!/^https?:\/\//i.test(url)||typeof location==="undefined")return false;
   return new URL(url,location.href).origin!==location.origin;
  }catch(_){return false}
 }

 async function getAiHeaders(){
  const headers={"Content-Type":"application/json","Accept":"application/json"};
  try{
   if(window.ScholarAuth&&typeof window.ScholarAuth.getFreshIdToken==="function"){
    const fbToken=await window.ScholarAuth.getFreshIdToken();
    if(fbToken){headers["Authorization"]="Bearer "+fbToken;return headers}
   }
   if(window.SC&&SC.sb&&SC.sb.auth){
    const sRes=await SC.sb.auth.getSession();
    const token=sRes&&sRes.data&&sRes.data.session&&sRes.data.session.access_token;
    if(token)headers["Authorization"]="Bearer "+token;
   }
  }catch(e){}
  return headers;
 }

 async function postAiJson(endpoint,payload,timeoutMs){
  const cleanEp=String(endpoint||"").trim();
  const normEp=cleanEp.startsWith("/")?cleanEp:("/"+cleanEp.replace(/^\/+/,""));
  const url=resolveAiEndpoint(normEp);
  const crossOrigin=isCrossOriginUrl(url);
  let lastErr=null;
  for(let attempt=0;attempt<2;attempt++){
   const ctrl=typeof AbortController!=="undefined"?new AbortController():null;
   const tm=ctrl?setTimeout(()=>ctrl.abort(),timeoutMs||120000):null;
   try{
    const headers=await getAiHeaders();
    const res=await fetch(url,{
     method:"POST",
     mode:"cors",
     cache:"no-store",
     credentials:crossOrigin?"omit":"same-origin",
     headers,
     body:JSON.stringify(payload||{}),
     signal:ctrl?ctrl.signal:undefined
    });
    const raw=await res.text().catch(()=>"");
    let data={};
    if(raw){try{data=JSON.parse(raw)}catch(_){data={}}}
    if(!res.ok){
     const fallbackMsg=res.status===405
      ?aiTr(
        "تعذر إتمام الطلب عبر Gemini API (رمز 405): هذا الموقع يعمل على استضافة ثابتة لا تشغّل خادم Node.js. افتح التطبيق من رابط الخادم المنشور أو اضبط window.APP.apiBase على رابط خادم فعّال.",
        "Gemini API request failed (HTTP 405): this static host does not run the Node.js server. Open the deployed server URL or set window.APP.apiBase to a live backend.",
        "Erreur Gemini API (HTTP 405) : cet hébergement statique n'exécute pas le serveur Node.js."
       )
      :aiTr("تعذر إتمام الطلب عبر Gemini API (رمز "+res.status+").","Gemini API request could not be completed (HTTP "+res.status+").","Échec de la requête Gemini ("+res.status+").");
     const err=new Error(data.error||fallbackMsg);
     err.status=res.status;
     if((res.status===502||res.status===503||res.status===504)&&attempt===0){
      lastErr=err;
      await new Promise(r=>setTimeout(r,650));
      continue;
     }
     throw err;
    }
    return data;
   }catch(err){
    if(err&&err.name==="AbortError"){
     throw new Error(aiTr("انتهت مهلة معالجة الطلب. حاول مجددًا بنص أقصر أو ملف أصغر.","Request timed out. Please retry with a shorter query or smaller file.","Délai dépassé."));
    }
    if(err&&err.name==="TypeError"){
     if(attempt===0){
      lastErr=err;
      await new Promise(r=>setTimeout(r,650));
      continue;
     }
     throw new Error(aiTr(
      "تعذر الوصول إلى خادم Gemini API (Failed to fetch). إذا كنت تفتح التطبيق من استضافة ثابتة مثل GitHub Pages، فافتح التطبيق من رابط الخادم المنشور أو انشر الخادم أولاً ثم ضع رابطه في window.APP.apiBase.",
      "Could not reach Gemini API server (Failed to fetch). If you opened a static host like GitHub Pages, open the deployed app server URL or deploy the backend and set window.APP.apiBase.",
      "Impossible de joindre le serveur Gemini API (Failed to fetch)."
     ));
    }
    throw err;
   }finally{
    if(tm)clearTimeout(tm);
   }
  }
  throw lastErr||new Error(aiTr("تعذر الاتصال بخادم Gemini API.","Could not reach Gemini API server.","Serveur Gemini API inaccessible."));
 }

 async function convertToSmartFlashcards(text,title,citations,btnKey){
  if(AI.convertingId)return;
  AI.convertingId=btnKey;
  render();
  try{
   const data=await postAiJson("/api/ai/flashcards",{answerText:text,title:title||"AI Research",lang:S.lang},90000);
   const rawCards=Array.isArray(data.cards)?data.cards:[];
   if(!rawCards.length)throw new Error(aiTr("لم يتمكن المساعد من استخراج بطاقات من هذا النص.","Could not extract flashcards from this text.","Aucune carte extraite."));

   const primarySrc=pickCardSrc(title,citations,0);
   const cards=rawCards.map(c=>{
    const cit=c.citationIndex&&citations?citations.find(x=>Number(x.index)===Number(c.citationIndex)):null;
    const src=cit?citToDeckSrc(cit):primarySrc;
    return{id:uid(),t:"q",q:c.q,a:c.a,src};
   });
   previewWithCitations(title||aiTr("بطاقات البحث الذكي","AI Research Deck","Fiches de recherche"),cards,citations);
  }catch(e){
   toast(e.message||aiTr("تعذر التحويل إلى بطاقات.","Failed to convert to flashcards.","Échec de conversion."));
  }finally{
   AI.convertingId=null;
   render();
  }
 }

 function citToDeckSrc(c){
  if(!c)return null;
  if(c.verifiedSource&&/Uploaded|Lecture/i.test(c.verifiedSource)){
   return{t:c.title||"Source",j:c.journal||"",y:c.year||null,own:1};
  }
  return{
   t:c.title||"Academic Source",
   a:Array.isArray(c.authors)?c.authors.slice(0,6):[],
   y:c.year||null,
   j:c.journal||"",
   d:c.doi||"",
   u:c.url||"",
   k:"AI-Grounded"
  };
 }

 function pickCardSrc(title,citations){
  if(Array.isArray(citations)&&citations.length){
   const withDoi=citations.find(c=>c.doi)||citations.find(c=>c.url)||citations[0];
   return citToDeckSrc(withDoi);
  }
  if(AI.source)return{t:AI.source.title,own:1};
  return{t:title||"AI Research Assistant",own:1};
 }

 function previewWithCitations(title,cards,citations){
  const paperObj=(citations&&citations[0])?{
   title:citations[0].title||title,
   authors:citations[0].authors||[],
   year:citations[0].year||null,
   journal:citations[0].journal||"",
   doi:citations[0].doi||"",
   url:citations[0].url||"",
   src:citations[0].verifiedSource||"AI-Grounded"
  }:{title:title||"AI Research",src:"notes"};
  if(typeof previewCards==="function"){
   previewCards((title||"AI Research").slice(0,60),[{p:paperObj,cards}]);
  }else{
   const dk=newDeck(title||"AI Research",cards);
   openDeck(dk.id);
  }
 }

 async function saveReportToLibrary(opts){
  if(typeof libraryPut!=="function"){
   return toast(aiTr("المكتبة غير متاحة.","Library unavailable.","Bibliothèque indisponible."));
  }
  const key=opts.id||"rep";
  AI.savingId=key;
  render();
  try{
   const title=(opts.title||aiTr("تقرير بحثي ذكي","AI Research Brief","Note de recherche")).trim().slice(0,120);
   const style=S.citeStyle||"apa";
   const citsHtml=(opts.citations||[]).map((c,i)=>{
    const formatted=formatCitationClient(c,style);
    const link=c.doi?`https://doi.org/${c.doi}`:(c.url||"");
    return `<li><strong>[${c.index||i+1}]</strong> ${escHtml(formatted)}${link?` — <a href="${escHtml(link)}" target="_blank" rel="noopener">${escHtml(link)}</a>`:""}${c.quote?`<blockquote>“${escHtml(c.quote)}”</blockquote>`:""}</li>`;
   }).join("");

   const dir=S.lang==="ar"?"rtl":"ltr";
   const html=`<!DOCTYPE html><html lang="${S.lang}" dir="${dir}"><head><meta charset="utf-8"><title>${escHtml(title)}</title>
<style>body{font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;max-width:780px;margin:28px auto;padding:0 20px;line-height:1.8;color:#142b4d;background:#f8fafd}
.hdr{background:#001449;color:#fff;padding:20px 24px;border-radius:14px;border-bottom:3px solid #d5a83e;margin-bottom:20px}
.hdr small{color:#ffcc00;font-weight:700;letter-spacing:.04em}
.hdr h1{margin:6px 0 4px;font-size:22px}
.card{background:#fff;border:1px solid #dfe5ed;border-radius:12px;padding:18px 20px;margin-bottom:16px}
.card h2{margin:0 0 10px;font-size:16px;color:#001449;border-bottom:1px solid #edf1f7;padding-bottom:6px}
blockquote{margin:6px 0 0;padding:6px 12px;background:#f3f6fc;border-radius:8px;color:#3e526b;font-size:13.5px}
pre,code{font-family:monospace;background:#eef2f8;padding:2px 5px;border-radius:4px}
ul,ol{padding-inline-start:20px}li{margin-bottom:8px}</style></head>
<body>
<div class="hdr"><small>7SALAH SCHOLAR · AI RESEARCH ARCHIVE</small><h1>${escHtml(title)}</h1><div>${escHtml(opts.subtitle||"")} · ${new Date().toLocaleDateString(S.lang)}</div></div>
<div class="card"><h2>${aiTr("المحتوى والتحليل","Research Content","Contenu de recherche")}</h2><div style="white-space:pre-wrap">${escHtml(opts.bodyText||"")}</div></div>
${citsHtml?`<div class="card"><h2>${aiTr("قائمة المراجع","Verified References","Références vérifiées")} (${style.toUpperCase()})</h2><ol>${citsHtml}</ol></div>`:""}
</body></html>`;

   const blob=new Blob([html],{type:"text/html;charset=utf-8"});
   const docId=uid();
   const now=Date.now();
   await libraryPut({
    id:docId,
    name:title+".html",
    size:blob.size,
    type:"text/html",
    created:now,
    updated:now,
    page:1,
    note:opts.note||"",
    meta:{
     course:AI.field||aiTr("بحث ذكي","AI Research","Recherche IA"),
     kind:"summary"
    },
    blob
   });
   if(typeof LIB_OPEN_ID!=="undefined")LIB_OPEN_ID=docId;
   toast(aiTr("تم حفظ التقرير والمراجع في المكتبة ✓","Saved to your Library ✓","Enregistré dans la bibliothèque ✓"));
  }catch(e){
   toast(aiTr("تعذر الحفظ في المكتبة.","Failed to save to Library.","Échec de l'enregistrement."));
  }finally{
   AI.savingId=null;
   render();
  }
 }

 function escHtml(s){
  return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 }

 async function sendResearchQuery(promptOverride){
  const q=(promptOverride!=null?promptOverride:AI.draft).trim();
  if(!q||AI.busy)return;
  if(promptOverride==null)AI.draft="";

  const userMsg={id:uid(),role:"user",text:q,mode:AI.mode,ts:Date.now()};
  AI.messages.push(userMsg);
  AI.busy=true;
  render();

  try{
   const payload={
    messages:AI.messages.slice(-12).map(m=>({role:m.role,text:m.text})),
    mode:AI.mode,
    taskRoute:AI.taskRoute||"general",
    persona:AI.persona||"advisor",
    citeStyle:S.citeStyle||"apa",
    lang:S.lang||"ar",
    field:AI.field||"",
    useWebSearch:AI.useWebSearch
   };
   if(AI.source){
    payload.documentContext={
     kind:AI.source.kind,
     title:AI.source.title,
     pdfBase64:AI.source.pdfBase64||undefined,
     text:AI.source.text||undefined
    };
   }
   const data=await postAiJson("/api/ai/research",payload,120000);

   AI.messages.push({
    id:uid(),
    role:"assistant",
    text:data.answer||"",
    mode:AI.mode,
    modelUsed:data.modelUsed||"",
    taskRoute:data.taskRoute||AI.taskRoute,
    verification:data.verification||null,
    queries:(data.verification&&Array.isArray(data.verification.queries))?data.verification.queries:[],
    citations:Array.isArray(data.citations)?data.citations:[],
    openCits:true,
    titleHint:q.slice(0,70),
    ts:Date.now()
   });
   saveSessions();
  }catch(e){
   AI.messages.push({
    id:uid(),
    role:"assistant",
    isError:true,
    text:e.message||aiTr("تعذر إتمام الطلب عبر Gemini API مؤقتًا. حاول مجددًا بعد قليل.","Could not complete Gemini API request right now. Please try again shortly.","Échec temporaire de la requête."),
    ts:Date.now()
   });
  }finally{
   AI.busy=false;
   render();
  }
 }

 async function runDocumentAnalysis(){
  if(!AI.source||AI.analyzing)return;
  AI.analyzing=true;
  AI.tab="analyzer";
  render();
  try{
   const data=await postAiJson("/api/ai/analyze",{
    title:AI.source.title,
    kind:AI.source.kind,
    text:AI.source.text||"",
    pdfBase64:AI.source.pdfBase64||"",
    citeStyle:S.citeStyle||"apa",
    lang:S.lang||"ar"
   },180000);
   AI.analysis=data.analysis||null;
   toast(aiTr("اكتمل التحليل الموثّق للمصدر ✓","Source-grounded analysis complete ✓","Analyse terminée ✓"));
  }catch(e){
   toast(e.message||aiTr("تعذر تحليل المستند.","Could not analyze document.","Échec de l'analyse."));
  }finally{
   AI.analyzing=false;
   render();
  }
 }

 function renderSourceDock(){
  const pdfInput=h("input",{
   type:"file",
   accept:"application/pdf,.pdf",
   style:"display:none",
   onchange:e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(f)attachPdfFile(f,true)}
  });

  if(AI.source){
   const kindLabel=AI.source.kind==="pdf"?"PDF":AI.source.kind==="lecture"?aiTr("محاضرة","Lecture","Cours"):aiTr("نص","Article","Texte");
   return h("div",{class:"card ai-dock active"},
    h("div",{class:"ai-dock-row"},
     h("div",{class:"ai-dock-icon"},ic(AI.source.kind==="lecture"?"mic":"file-text",{s:20})),
     h("div",{class:"ai-dock-info"},
      h("div",{class:"ai-dock-kicker"},kindLabel," · ",AI.source.sizeLabel||""),
      h("b",{dir:"auto"},AI.source.title)
     ),
     h("div",{class:"ai-dock-btns"},
      h("button",{type:"button",class:"btn fill",disabled:AI.analyzing,onclick:()=>{runDocumentAnalysis()}},
       ic("sparkles",{s:15}),
       AI.analyzing?aiTr("جارٍ التحليل…","Analyzing…","Analyse…"):aiTr("تحليل شامل للمستند","Analyze Document","Analyser")
      ),
      h("button",{type:"button",class:"btn",onclick:()=>{AI.source=null;AI.analysis=null;render()}},ic("x",{s:15}),aiTr("إزالة","Clear","Retirer"))
     )
    ),
    h("label",{class:"ai-strict-toggle"},
     h("input",{type:"checkbox",checked:!AI.useWebSearch,onchange:e=>{AI.useWebSearch=!e.target.checked;render()}}),
     h("span",{},aiTr("حصر الإجابات في هذا المصدر فقط (منع المعلومات الخارجية)","Strictly restrict answers to this attached source only (no external web)","Limiter strictement aux informations de cette source"))
    ),
    pdfInput
   );
  }

  return h("div",{class:"card ai-dock"},
   h("div",{class:"ai-dock-top"},
    h("div",{},
     h("b",{},aiTr("تأسيس الإجابة على مصادر حقيقية","Source Grounding Dock","Ancrage documentaire")),
     h("div",{class:"meta"},aiTr("ارفق ورقة PDF أو محاضرة مفرّغة أو مقالًا لتحليله وطرح أسئلة موثّقة به.","Attach a PDF paper, transcribed lecture, or article to analyze & query strictly.","Joignez un PDF, un cours ou un texte pour l'analyser."))
    )
   ),
   h("div",{class:"ai-source-grid"},
    h("button",{type:"button",class:"ai-src-btn",onclick:()=>pdfInput.click()},ic("paperclip",{s:18}),h("span",{},aiTr("رفع ورقة PDF","Upload PDF Paper","Importer PDF"))),
    h("button",{type:"button",class:"ai-src-btn",onclick:openLibrarySourceModal},ic("book",{s:18}),h("span",{},aiTr("من مكتبتي","From My Library","Ma bibliothèque"))),
    h("button",{type:"button",class:"ai-src-btn",onclick:openLectureSourceModal},ic("mic",{s:18}),h("span",{},aiTr("محاضرة مفرّغة","Lecture Transcript","Cours transcrit"))),
    h("button",{type:"button",class:"ai-src-btn",onclick:openPasteTextModal},ic("file-text",{s:18}),h("span",{},aiTr("لصق مقال / نص","Paste Article","Coller texte")))
   ),
   pdfInput
  );
 }

 function renderChatView(v){
  const starters=S.lang==="ar"?[
   {mode:"simplify",t:"بسّط لي نظرية المعرفة عند ابن خلدون وكيف قارن بين الفكر التراثي والملاحظة التجريبية"},
   {mode:"outline",t:"أعدّ خطة بحث جامعية متكاملة حول: أثر الذكاء الاصطناعي التوليدي على البحث العلمي والأمانة العلمية"},
   {mode:"litreview",t:"قدّم مراجعة أدبيات مقارنة حول فعالية التكرار المتباعد (Spaced Repetition) في التحصيل الجامعي"}
  ]:[
   {mode:"simplify",t:"Explain Bourdieu's theory of habitus and cultural capital step-by-step with an academic example"},
   {mode:"outline",t:"Generate a structured university thesis outline on AI ethics and source-grounded academic integrity"},
   {mode:"litreview",t:"Draft a comparative literature review on spaced repetition vs massed practice in medical education"}
  ];

  // Mode + Discipline + Task Routing + Persona + Cite Style Toolbar
  const discList=(window.Net&&Net.DISCIPLINES)||[];
  const discSel=h("select",{class:"in ai-disc-sel",onchange:e=>{AI.field=e.target.value}},
   discList.map(d=>h("option",{value:d.id,selected:AI.field===d.id},d[S.lang]||d.en))
  );
  const routeSel=h("select",{class:"in ai-disc-sel",title:aiTr("توجيه النموذج والتفكير","Model & Thinking Route","Routage du modèle"),onchange:e=>{AI.taskRoute=e.target.value}},
   TASK_ROUTES.map(rt=>h("option",{value:rt.id,selected:AI.taskRoute===rt.id},rt[S.lang]||rt.en))
  );
  const personaSel=h("select",{class:"in ai-disc-sel",title:aiTr("الدور الأكاديمي","Academic Persona","Rôle académique"),onchange:e=>{AI.persona=e.target.value}},
   PERSONAS.map(pr=>h("option",{value:pr.id,selected:AI.persona===pr.id},pr[S.lang]||pr.en))
  );

  v.append(h("div",{class:"ai-toolbar"},
   h("div",{class:"ai-modes",role:"tablist"},MODES.map(m=>
    h("button",{type:"button",class:"ai-mode-btn"+(AI.mode===m.id?" on":""),onclick:()=>{AI.mode=m.id;render()}},m[S.lang]||m.en)
   )),
   h("div",{class:"ai-route-row"},routeSel,personaSel),
   h("div",{class:"ai-toolbar-meta"},
    discList.length?discSel:null,
    h("button",{type:"button",class:"btn ai-live-launch",onclick:()=>{AI.tab="live";render()}},ic("headphones",{s:15}),aiTr("تحدّث صوتيًا (Live)","Live Voice Tutor","Voix en direct")),
    typeof citeSwitcher==="function"?citeSwitcher(()=>render()):null
   )
  ));

  const stream=h("div",{class:"ai-stream"});
  if(!AI.messages.length){
   stream.append(h("div",{class:"card ai-welcome"},
    h("div",{class:"ai-welcome-head"},
     ic("sparkles",{s:22,cls:"gold"}),
     h("div",{},
      h("h3",{},aiTr("ابدأ استفسارك البحثي الموثّق","Start a Source-Grounded Research Inquiry","Démarrer une recherche vérifiée")),
      h("div",{class:"meta"},aiTr("كل إجابة تتضمن مراجع قابلة للتحقق وتنسيق اقتباس رسمي وإمكانية التحويل المباشر إلى بطاقات دراسة.","Every response includes verifiable citations, APA/MLA/Chicago formatting, and 1-click flashcard conversion.","Chaque réponse inclut des références vérifiables et la conversion en fiches."))
     )
    ),
    h("div",{class:"ai-starters"},starters.map(s=>
     h("button",{type:"button",class:"ai-starter",dir:"auto",onclick:()=>{AI.mode=s.mode;sendResearchQuery(s.t)}},
      h("span",{class:"ai-starter-tag"},MODES.find(m=>m.id===s.mode)[S.lang]||""),
      h("span",{},s.t)
     )
    ))
   ));
  }else{
   AI.messages.forEach(m=>{
    if(m.role==="user"){
     stream.append(h("div",{class:"ai-msg user"},
      h("div",{class:"ai-msg-meta"},MODES.find(x=>x.id===m.mode)?.[S.lang]||"", " · ", new Date(m.ts||Date.now()).toLocaleTimeString(S.lang,{hour:"2-digit",minute:"2-digit"})),
      h("div",{class:"ai-msg-body",dir:"auto"},m.text)
     ));
     return;
    }

    if(m.isError){
     stream.append(h("div",{class:"card ai-msg err"},
      h("div",{class:"ai-verif-line warn"},ic("alert",{s:16}),h("span",{},m.text))
     ));
     return;
    }

    const vm=verificationMeta(m.verification);
    const bodyEl=h("div",{class:"ai-msg-prose"});
    bodyEl.append(renderMarkdownDom(m.text));

    const convBusy=AI.convertingId===m.id;
    const saveBusy=AI.savingId===m.id;

    stream.append(h("div",{class:"card ai-msg assistant"},
     h("div",{class:"ai-verif-line "+vm.cls},
      h("span",{class:"ai-verif-dot"}),
      ic("shield-check",{s:16}),
      h("strong",{},vm.label),
      m.modelUsed?h("span",{class:"ai-model-chip",dir:"ltr"},m.modelUsed):null,
      vm.score?h("span",{class:"ai-verif-score"},vm.score):null,
      m.verification&&m.verification.groundingChunksCount?h("span",{class:"ai-verif-sub"}," · "+m.verification.groundingChunksCount+" "+aiTr("مصدر بحث","sources","sources")):null
     ),
     bodyEl,
     buildCitationsBlock(m.citations,m),
     h("div",{class:"ai-msg-actions"},
      h("button",{type:"button",class:"btn fill",disabled:Boolean(AI.convertingId),onclick:()=>convertToSmartFlashcards(m.text,m.titleHint,m.citations,m.id)},
       ic("cards",{s:16}),
       convBusy?aiTr("جارٍ التوليد…","Converting…","Conversion…"):aiTr("تحويل إلى بطاقات ذكية","Convert to Smart Flashcards","Convertir en fiches")
      ),
      h("button",{type:"button",class:"btn",disabled:Boolean(AI.savingId),onclick:()=>saveReportToLibrary({id:m.id,title:m.titleHint||aiTr("ملخص بحثي","Research Summary","Synthèse"),subtitle:MODES.find(x=>x.id===m.mode)?.[S.lang]||"AI Research",bodyText:m.text,citations:m.citations})},
       ic("book",{s:16}),
       saveBusy?aiTr("جارٍ الحفظ…","Saving…","Enregistrement…"):aiTr("حفظ في المكتبة","Save to Library","Enregistrer")
      ),
      h("button",{type:"button",class:"btn",onclick:async()=>{
       const cits=(m.citations||[]).map(c=>formatCitationClient(c,S.citeStyle)).join("\n");
       const full=m.text+(cits?"\n\nReferences:\n"+cits:"");
       try{await navigator.clipboard.writeText(full);toast(t("copied"))}catch(e){}
      }},ic("clipboard",{s:15}),t("copy"))
     )
    ));
   });

   if(AI.busy){
    stream.append(h("div",{class:"card ai-msg assistant ai-loading"},
     h("div",{class:"lec-spin"}),
     h("div",{},h("b",{},aiTr("جارٍ البحث والتدقيق المرجعي…","Synthesizing & verifying citations…","Synthèse et vérification…")),h("div",{class:"meta"},aiTr("يتحقّق المساعد من المصادر العلمية وصياغة الاقتباسات.","Checking scholarly grounding and reference formatting.","Vérification des sources en cours.")))
    ));
   }
  }
  v.append(stream);

  // Composer Bar
  const ta=h("textarea",{
   class:"in ai-composer-in",
   rows:"2",
   placeholder:AI.source
    ?aiTr(`اسأل حول «${AI.source.title.slice(0,40)}»…`,`Ask a question grounded in “${AI.source.title.slice(0,40)}”…`,`Question sur « ${AI.source.title.slice(0,35)} »…`)
    :aiTr("اكتب سؤالك البحثي أو النظرية المطلوب تبسيطها أو موضوع خطة البحث…","Ask a complex academic question, theory to simplify, or outline topic…","Posez votre question de recherche…"),
   value:AI.draft,
   oninput:e=>{AI.draft=e.target.value},
   onkeydown:e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendResearchQuery()}}
  });

  v.append(h("div",{class:"card ai-composer"},
   ta,
   h("div",{class:"ai-composer-foot"},
    h("div",{class:"ai-composer-hints"},
     AI.messages.length?h("button",{type:"button",class:"btn",onclick:()=>{AI.messages=[];AI.activeSessionId=null;render()}},ic("plus",{s:15}),aiTr("محادثة جديدة","New Chat","Nouveau")):null
    ),
    h("button",{type:"button",class:"btn fill ai-send-btn",disabled:AI.busy,onclick:()=>sendResearchQuery()},
     ic("send",{s:16}),
     aiTr("إرسال وتحليل","Send Query","Envoyer")
    )
   )
  ));
 }

 function renderAnalyzerView(v){
  if(!AI.source){
   v.append(h("div",{class:"card ai-empty-box"},
    ic("file-text",{s:38,cls:"gold"}),
    h("h3",{},aiTr("محلّل الأوراق البحثية والمحاضرات","Document & Paper Analyzer","Analyseur de documents et cours")),
    h("p",{class:"meta"},aiTr("ارفق ورقة بحثية PDF أو اختر محاضرة مفرّغة من الأعلى لاستخراج الملخص والنتائج والمنهجية والمصطلحات وبطاقات الدراسة بدقة موثّقة.","Attach a PDF paper, Library document, or transcribed lecture above to extract strictly grounded findings, methodologies, terminology, bibliography, and smart flashcards.","Joignez un PDF, un document ou un cours pour en extraire synthèse, méthodologie et fiches."))
   ));
   return;
  }

  if(AI.analyzing){
   v.append(h("div",{class:"card ai-loading",style:"padding:24px"},
    h("div",{class:"lec-spin"}),
    h("div",{},
     h("b",{},aiTr("جارٍ التحليل المعمّق للمصدر…","Analyzing source strictly…","Analyse rigoureuse en cours…")),
     h("div",{class:"meta"},aiTr("يستخرج المحلّل النتائج الرئيسية والمنهجية والمصطلحات مع اقتباسات نصية مباشرة من المستند.","Extracting verified findings, methodology, terminology, and direct supporting quotes.","Extraction des résultats, méthodes et citations."))
    )
   ));
   return;
  }

  if(!AI.analysis){
   v.append(h("div",{class:"card ai-empty-box"},
    h("h3",{dir:"auto"},AI.source.title),
    h("p",{class:"meta"},aiTr("المصدر جاهز للتحليل الموثّق واستخراج البطاقات والمصطلحات.","Source attached and ready for strict analysis.","Source prête pour l'analyse.")),
    h("button",{type:"button",class:"btn fill",onclick:runDocumentAnalysis},ic("sparkles",{s:16}),aiTr("ابدأ التحليل الشامل الآن","Run Full Paper Analysis","Lancer l'analyse"))
   ));
   return;
  }

  const A=AI.analysis;
  const vm=verificationMeta(A.verification);
  const fullReportText=[
   A.title,
   "",
   aiTr("## الملخص التنفيذي","## Executive Summary","## Résumé"),
   A.summary,
   "",
   aiTr("## النتائج الرئيسية","## Key Findings","## Résultats clés"),
   ...(A.keyFindings||[]).map((f,i)=>`${i+1}. ${f.claim}${f.evidenceQuote?`\n   "${f.evidenceQuote}"`:""}${f.location?` (${f.location})`:""}`),
   "",
   aiTr("## المنهجية البحثية","## Methodologies","## Méthodologie"),
   ...(A.methodologies||[]).map(m=>`- ${m.name}: ${m.description}`),
   "",
   aiTr("## المصطلحات الأساسية","## Core Terminology","## Terminologie clé"),
   ...(A.terminology||[]).map(x=>`- ${x.term}: ${x.definition}`)
  ].join("\n");

  v.append(h("div",{class:"card ai-an-head"},
   h("div",{class:"ai-verif-line "+vm.cls},
    h("span",{class:"ai-verif-dot"}),
    ic("shield-check",{s:16}),
    h("strong",{},vm.label),
    h("span",{class:"ai-verif-score"},(A.verification?.confidenceScore||97)+"%")
   ),
   h("h3",{dir:"auto",style:"margin-top:8px"},A.title),
   (A.authors&&A.authors.length)||A.year?h("div",{class:"meta",dir:"auto"},[A.authors.join("، "),A.year].filter(Boolean).join(" · ")):null,
   h("div",{class:"ai-msg-actions"},
    h("button",{type:"button",class:"btn fill",disabled:!(A.flashcards&&A.flashcards.length),onclick:()=>{
     const src=pickCardSrc(A.title,A.citations);
     const cs=(A.flashcards||[]).map(f=>({id:uid(),t:"q",q:f.q,a:f.a,src}));
     previewWithCitations(A.title,cs,A.citations);
    }},ic("cards",{s:16}),aiTr(`تحويل إلى بطاقات (${(A.flashcards||[]).length})`,`Convert to Smart Flashcards (${(A.flashcards||[]).length})`,`Convertir en fiches (${(A.flashcards||[]).length})`)),
    h("button",{type:"button",class:"btn",disabled:Boolean(AI.savingId),onclick:()=>saveReportToLibrary({id:"an_"+A.title,title:aiTr("تحليل: ","Analysis: ","Analyse : ")+A.title,subtitle:aiTr("تحليل مستند موثّق","Grounded Paper Analysis","Analyse documentaire"),bodyText:fullReportText,citations:A.citations})},
     ic("book",{s:16}),aiTr("حفظ التحليل في المكتبة","Save Analysis to Library","Enregistrer")),
    h("button",{type:"button",class:"btn",onclick:()=>{AI.tab="chat";render()}},ic("message",{s:16}),aiTr("اسأل حول المستند","Ask Questions About This","Poser des questions"))
   )
  ));

  v.append(h("div",{class:"card ai-an-sec"},
   h("h4",{},ic("book",{s:16}),aiTr("الملخص العلمي الموثّق","Scholarly Summary","Résumé académique")),
   h("p",{class:"ai-an-p",dir:"auto"},A.summary)
  ));

  if(A.keyFindings&&A.keyFindings.length){
   v.append(h("div",{class:"card ai-an-sec"},
    h("h4",{},ic("check-circle",{s:16}),aiTr("النتائج الرئيسية بالأدلة النصية","Key Findings & Evidence Quotes","Résultats et preuves")),
    h("div",{class:"ai-an-list"},A.keyFindings.map((f,i)=>
     h("div",{class:"ai-an-item"},
      h("div",{class:"ai-an-claim",dir:"auto"},h("span",{class:"ai-an-num"},(i+1)+".")," ",f.claim),
      f.evidenceQuote?h("div",{class:"ai-cit-quote",dir:"auto"},"«"+f.evidenceQuote+"»"+(f.location?" · "+f.location:"")):null
     )
    ))
   ));
  }

  if(A.methodologies&&A.methodologies.length){
   v.append(h("div",{class:"card ai-an-sec"},
    h("h4",{},ic("flask",{s:16}),aiTr("المنهجية والأدوات البحثية","Research Methodology","Méthodologie")),
    h("div",{class:"ai-an-list"},A.methodologies.map(m=>
     h("div",{class:"ai-an-item"},
      h("b",{dir:"auto"},m.name),
      h("div",{class:"meta",dir:"auto",style:"font-size:13.5px;color:var(--ink)"},m.description),
      m.evidenceQuote?h("div",{class:"ai-cit-quote",dir:"auto"},"«"+m.evidenceQuote+"»"):null
     )
    ))
   ));
  }

  if(A.terminology&&A.terminology.length){
   v.append(h("div",{class:"card ai-an-sec"},
    h("h4",{},ic("tag",{s:16}),aiTr("المفاهيم والمصطلحات الأساسية","Core Terminology","Terminologie clé")),
    h("div",{class:"ai-term-grid"},A.terminology.map(x=>
     h("div",{class:"ai-term-card"},
      h("b",{dir:"auto"},x.term),
      h("p",{dir:"auto"},x.definition),
      x.contextQuote?h("small",{dir:"auto"},"«"+x.contextQuote+"»"):null
     )
    ))
   ));
  }

  if(A.limitations&&A.limitations.length){
   v.append(h("div",{class:"card ai-an-sec"},
    h("h4",{},ic("alert",{s:16}),aiTr("حدود الدراسة وملاحظات النقد","Study Limitations","Limites méthodologiques")),
    h("ul",{class:"ai-md-list",dir:"auto"},A.limitations.map(l=>h("li",{},l)))
   ));
  }

  if(A.citations&&A.citations.length){
   v.append(h("div",{class:"card ai-an-sec"},
    buildCitationsBlock(A.citations,{openCits:true})
   ));
  }
 }

 function renderHistoryView(v){
  if(!AI.sessions.length){
   v.append(h("div",{class:"card ai-empty-box"},
    ic("clock",{s:34,cls:"gold"}),
    h("h3",{},aiTr("لا توجد جلسات بحثية محفوظة بعد","No Saved Research Sessions Yet","Aucune session enregistrée")),
    h("p",{class:"meta"},aiTr("كل محادثة بحثية تُحفظ تلقائيًا على جهازك للعودة إليها ومراجعة مراجعها.","Research chats are automatically saved locally so you can revisit references anytime.","Vos discussions sont sauvegardées localement."))
   ));
   return;
  }
  AI.sessions.forEach(s=>{
   v.append(h("div",{class:"card ai-hist-row"},
    h("div",{class:"ai-hist-main",onclick:()=>{
     AI.activeSessionId=s.id;
     AI.mode=s.mode||"qa";
     AI.field=s.field||"";
     AI.messages=Array.isArray(s.messages)?s.messages:[];
     if(s.sourceMeta&&s.sourceMeta.text){
      AI.source={kind:s.sourceMeta.kind,title:s.sourceMeta.title,sizeLabel:s.sourceMeta.sizeLabel,text:s.sourceMeta.text};
     }else if(!s.sourceMeta){
      AI.source=null;
     }
     AI.tab="chat";
     render();
    }},
     h("b",{dir:"auto"},s.title),
     h("div",{class:"meta"},(s.messages?.length||0)+" "+aiTr("رسالة","messages","messages")+" · "+new Date(s.updatedAt||Date.now()).toLocaleDateString(S.lang))
    ),
    h("button",{type:"button",class:"btn danger",onclick:()=>{
     AI.sessions=AI.sessions.filter(x=>x.id!==s.id);
     LS.set("7s_ai_sessions",AI.sessions);
     render();
    }},ic("trash",{s:15}))
   ));
  });
 }

 // ===================== Live Voice Tutor (Browser-Native Web Speech API) =====================
 const LIVE_VOICES=[
  {id:"auto",ar:"صوت المتصفح التلقائي",en:"Default Browser Voice",fr:"Voix par défaut"},
  {id:"calm",ar:"نبرة أكاديمية هادئة",en:"Calm Academic Tone",fr:"Ton académique posé"},
  {id:"crisp",ar:"نبرة سريعة ومباشرة",en:"Crisp & Direct",fr:"Ton direct"}
 ];

 const LIVE={
  active:false,
  status:"idle", // idle | connecting | listening | speaking
  muted:false,
  micUnavailable:false,
  voice:"auto",
  error:null,
  recognition:null,
  _restartTimer:null,
  _meterTimer:null,
  _speakingLock:false,
  _busyTurn:false,
  _sessionToken:0,
  turns:[], // [{ id, role: "user"|"assistant", text, finalized, ts }]
  draft:"",
  level:0,
  feedEl:null,
  meterEl:null,
  statusEl:null
 };

 function liveSpeechLocale(){
  return S.lang==="fr"?"fr-FR":S.lang==="en"?"en-US":"ar-DZ";
 }

 function cleanLiveSpeechText(text){
  return String(text||"")
   .replace(/```[\s\S]*?```/g," ")
   .replace(/\[(?:Doc[^\]]*|\d+)\]/g,"")
   .replace(/[*_`#>]+/g," ")
   .replace(/\s+/g," ")
   .trim();
 }

 function setLiveStatusDom(next){
  LIVE.status=next;
  if(!LIVE.statusEl)return;
  const meta=liveStatusLabel(next);
  LIVE.statusEl.className="ai-live-status "+next;
  LIVE.statusEl.replaceChildren(h("span",{class:"ai-live-dot"}),h("span",{},meta));
 }

 function finalizeLiveTurns(){
  const last=LIVE.turns[LIVE.turns.length-1];
  if(last)last.finalized=true;
 }

 function patchLiveFeedDom(){
  if(!LIVE.feedEl)return;
  const children=LIVE.turns.map(turn=>
   h("div",{class:"ai-live-turn "+turn.role},
    h("div",{class:"ai-live-turn-who"},turn.role==="user"?aiTr("أنت (صوت)","You (Voice)","Vous"):aiTr("المساعد الصوتي · Web Speech","Live Tutor · Web Speech","Tuteur Vocal")),
    h("div",{class:"ai-live-turn-tx",dir:"auto"},turn.text)
   )
  );
  if(!children.length){
   children.push(h("div",{class:"meta",style:"text-align:center;padding:18px 8px"},
    LIVE.micUnavailable
     ?aiTr("أرسل سؤالك كتابيًا بالأسفل ليقرأه المساعد صوتيًا عبر محرك المتصفح.","Type your question below to hear a spoken academic response via browser Web Speech.","Écrivez ci-dessous pour entendre la réponse vocale.")
     :aiTr("تحدّث بحرية في الميكروفون أو اكتب سؤالًا بالأسفل ليردّ عليك المساعد صوتيًا بشكل فوري.","Speak naturally into your microphone or type below to hear a real-time spoken academic answer.","Parlez dans votre micro ou écrivez ci-dessous.")
   ));
  }
  LIVE.feedEl.replaceChildren(...children);
  LIVE.feedEl.scrollTop=LIVE.feedEl.scrollHeight;
 }

 function updateMicMeter(level){
  LIVE.level=level;
  if(LIVE.meterEl){
   const pct=LIVE.muted?0:Math.min(100,Math.round(level*100));
   LIVE.meterEl.style.width=pct+"%";
  }
 }

 function stopSpeechRecognitionOnly(){
  if(LIVE._restartTimer){clearTimeout(LIVE._restartTimer);LIVE._restartTimer=null}
  if(LIVE.recognition){
   try{
    LIVE.recognition.onresult=null;
    LIVE.recognition.onerror=null;
    LIVE.recognition.onend=null;
    LIVE.recognition.stop();
   }catch(e){}
   LIVE.recognition=null;
  }
 }

 function scheduleRecognitionRestart(token){
  if(!LIVE.active||LIVE.muted||LIVE.micUnavailable||LIVE._speakingLock||token!==LIVE._sessionToken)return;
  if(LIVE._restartTimer)clearTimeout(LIVE._restartTimer);
  LIVE._restartTimer=setTimeout(()=>{
   LIVE._restartTimer=null;
   if(LIVE.active&&!LIVE.muted&&!LIVE.micUnavailable&&!LIVE._speakingLock&&token===LIVE._sessionToken){
    beginSpeechRecognition(token);
   }
  },280);
 }

 function beginSpeechRecognition(token){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
   LIVE.micUnavailable=true;
   if(LIVE.active)setLiveStatusDom("listening");
   patchLiveFeedDom();
   return false;
  }
  stopSpeechRecognitionOnly();
  try{
   const rec=new SR();
   rec.lang=liveSpeechLocale();
   rec.interimResults=true;
   rec.continuous=false;
   rec.maxAlternatives=1;
   LIVE.recognition=rec;

   rec.onresult=ev=>{
    if(!LIVE.active||token!==LIVE._sessionToken)return;
    let finalChunk="";
    let interimChunk="";
    for(let i=ev.resultIndex;i<ev.results.length;i++){
     const r=ev.results[i];
     if(r&&r[0]&&r[0].transcript){
      if(r.isFinal)finalChunk+=r[0].transcript+" ";
      else interimChunk+=r[0].transcript;
     }
    }
    if(interimChunk){
     updateMicMeter(0.65);
    }
    const cleanFinal=finalChunk.trim();
    if(cleanFinal){
     updateMicMeter(0.2);
     handleLiveUserTurn(cleanFinal,token);
    }
   };

   rec.onerror=ev=>{
    if(!LIVE.active||token!==LIVE._sessionToken)return;
    const code=ev&&ev.error;
    if(code==="not-allowed"||code==="service-not-allowed"||code==="audio-capture"){
     LIVE.micUnavailable=true;
     stopSpeechRecognitionOnly();
     setLiveStatusDom("listening");
     patchLiveFeedDom();
     render();
     return;
    }
    if(code==="no-speech"||code==="aborted"){
     scheduleRecognitionRestart(token);
     return;
    }
    scheduleRecognitionRestart(token);
   };

   rec.onend=()=>{
    LIVE.recognition=null;
    updateMicMeter(0);
    scheduleRecognitionRestart(token);
   };

   rec.start();
   LIVE.micUnavailable=false;
   return true;
  }catch(e){
   LIVE.micUnavailable=true;
   if(LIVE.active)setLiveStatusDom("listening");
   return false;
  }
 }

 function speakLiveText(text,token){
  const clean=cleanLiveSpeechText(text);
  if(!clean||typeof window.speechSynthesis==="undefined"||typeof window.SpeechSynthesisUtterance==="undefined"){
   if(LIVE.active&&token===LIVE._sessionToken){
    LIVE._speakingLock=false;
    setLiveStatusDom("listening");
    scheduleRecognitionRestart(token);
   }
   return;
  }
  try{
   LIVE._speakingLock=true;
   stopSpeechRecognitionOnly();
   window.speechSynthesis.cancel();
   const utt=new window.SpeechSynthesisUtterance(clean.slice(0,1800));
   const locale=liveSpeechLocale();
   utt.lang=locale;
   const prefix=locale.slice(0,2).toLowerCase();
   const voices=window.speechSynthesis.getVoices?window.speechSynthesis.getVoices():[];
   const matched=voices.filter(v=>v.lang&&v.lang.toLowerCase().startsWith(prefix));
   if(matched.length){
    const pickIdx=LIVE.voice==="crisp"?Math.min(1,matched.length-1):0;
    utt.voice=matched[pickIdx];
   }
   utt.rate=LIVE.voice==="crisp"?1.08:LIVE.voice==="calm"?0.95:1.0;
   setLiveStatusDom("speaking");

   const finishSpeech=()=>{
    if(token!==LIVE._sessionToken)return;
    LIVE._speakingLock=false;
    if(LIVE.active){
     setLiveStatusDom("listening");
     scheduleRecognitionRestart(token);
    }
   };
   utt.onend=finishSpeech;
   utt.onerror=finishSpeech;
   window.speechSynthesis.speak(utt);
  }catch(e){
   LIVE._speakingLock=false;
   if(LIVE.active&&token===LIVE._sessionToken){
    setLiveStatusDom("listening");
    scheduleRecognitionRestart(token);
   }
  }
 }

 async function handleLiveUserTurn(rawText,token){
  const tx=String(rawText||"").trim();
  if(!tx||LIVE._busyTurn)return;
  LIVE._busyTurn=true;
  if(typeof window.speechSynthesis!=="undefined"){
   try{window.speechSynthesis.cancel()}catch(e){}
  }
  LIVE.turns.push({id:uid(),role:"user",text:tx,finalized:true,ts:Date.now()});
  patchLiveFeedDom();

  const historyMsgs=LIVE.turns.slice(-10).map(t=>({role:t.role,text:t.text}));
  let replyText="";
  try{
   const payload={
    messages:historyMsgs,
    mode:"qa",
    taskRoute:"fast",
    persona:AI.persona||"advisor",
    citeStyle:S.citeStyle||"apa",
    lang:S.lang||"ar",
    field:AI.field||"",
    useWebSearch:AI.useWebSearch
   };
   if(AI.source){
    payload.documentContext={kind:AI.source.kind,title:AI.source.title,text:AI.source.text||undefined};
   }
   const data=await postAiJson("/api/ai/research",payload,45000);
   replyText=(data&&data.answer)||"";
  }catch(e){
   replyText=(e&&e.message)||aiTr("تعذر الاتصال بـ Gemini API حاليًا. حاول مجددًا بعد لحظات.","Could not reach Gemini API right now. Please try again shortly.","Erreur de connexion Gemini API.");
  }finally{
   LIVE._busyTurn=false;
  }

  if(!LIVE.active||token!==LIVE._sessionToken)return;
  if(replyText){
   LIVE.turns.push({id:uid(),role:"assistant",text:replyText,finalized:true,ts:Date.now()});
   patchLiveFeedDom();
   speakLiveText(replyText,token);
  }else{
   setLiveStatusDom("listening");
   scheduleRecognitionRestart(token);
  }
 }

 function stopLiveVoice(silent){
  LIVE._sessionToken++;
  LIVE.active=false;
  LIVE._speakingLock=false;
  LIVE._busyTurn=false;
  stopSpeechRecognitionOnly();
  if(LIVE._meterTimer){clearInterval(LIVE._meterTimer);LIVE._meterTimer=null}
  if(typeof window.speechSynthesis!=="undefined"){
   try{window.speechSynthesis.cancel()}catch(e){}
  }
  LIVE.level=0;
  finalizeLiveTurns();
  LIVE.status="idle";
  if(!silent)render();
 }

 function startLiveVoice(){
  if(LIVE.active||LIVE.status==="connecting"||LIVE.status==="listening"||LIVE.status==="speaking"){
   stopLiveVoice();
   return;
  }
  const token=++LIVE._sessionToken;
  LIVE.error=null;
  LIVE.active=true;
  LIVE.muted=false;
  LIVE._speakingLock=false;
  LIVE._busyTurn=false;
  LIVE.status="listening";

  const srOk=beginSpeechRecognition(token);
  if(!srOk){
   LIVE.micUnavailable=true;
  }
  if(LIVE._meterTimer)clearInterval(LIVE._meterTimer);
  LIVE._meterTimer=setInterval(()=>{
   if(!LIVE.active)return;
   if(LIVE.status==="speaking")updateMicMeter(0.35+Math.random()*0.45);
   else if(LIVE.muted||LIVE.micUnavailable)updateMicMeter(0);
   else updateMicMeter(0.08+Math.random()*0.15);
  },260);
  render();
 }

 function sendLiveTextTurn(){
  const tx=LIVE.draft.trim();
  if(!tx)return;
  if(!LIVE.active)startLiveVoice();
  LIVE.draft="";
  const inp=document.getElementById("ai-live-text-in");
  if(inp)inp.value="";
  handleLiveUserTurn(tx,LIVE._sessionToken);
 }

 function liveStatusLabel(st){
  if(st==="connecting")return aiTr("جارٍ تهيئة المحرك الصوتي…","Initializing Voice Engine…","Initialisation vocale…");
  if(st==="listening")return LIVE.micUnavailable
   ?aiTr("وضع النص + النطق الصوتي نشط","Text + Spoken Reply Active","Mode Texte + Voix actif")
   :aiTr("متصل (Web Speech) · يستمع الآن…","Active (Web Speech) · Listening…","En écoute…");
  if(st==="speaking")return aiTr("يتحدث المساعد الصوتي الآن…","Speaking response…","En train de parler…");
  return aiTr("جاهز للمحادثة الصوتية المباشرة (Web Speech)","Ready for Browser Live Voice","Prêt pour la voix en direct");
 }

 const CM={busy:false,listening:false,speak:true,draft:"",history:[],error:""};

 async function sendCompanionQuery(rawText){
  const q=String(rawText!=null?rawText:CM.draft||"").trim();
  const core=window.AcademicCoreInstance;
  if(!q||CM.busy||!core)return;
  CM.draft="";
  CM.busy=true;
  CM.error="";
  CM.history.push({id:uid(),role:"user",text:q,ts:Date.now()});
  render();
  try{
   const res=await core.askCompanion(q,{
    lang:S.lang||"ar",
    field:AI.field||(S.prof&&S.prof.field)||"",
    speakReply:CM.speak
   });
   CM.history.push({id:uid(),role:"model",text:res.reply||"",modelUsed:res.modelUsed||"",ts:Date.now()});
  }catch(e){
   CM.error=(e&&e.message)||aiTr("تعذر الاتصال بالمساعد الصوتي الشخصي.","Could not reach personal academic companion.","Erreur de l'assistant personnel.");
  }finally{
   CM.busy=false;
   render();
  }
 }

 function toggleCompanionVoice(){
  const core=window.AcademicCoreInstance;
  if(!core)return;
  if(CM.listening){
   try{core.recognition&&core.recognition.stop()}catch(e){}
   CM.listening=false;
   render();
   return;
  }
  CM.error="";
  try{
   const started=core.listenAndAsk({
    lang:S.lang||"ar",
    field:AI.field||(S.prof&&S.prof.field)||"",
    speakReply:CM.speak,
    onTranscript:tx=>{
     CM.listening=false;
     CM.busy=true;
     CM.history.push({id:uid(),role:"user",text:tx,ts:Date.now()});
     render();
    },
    onReply:res=>{
     CM.busy=false;
     CM.history.push({id:uid(),role:"model",text:res.reply||"",modelUsed:res.modelUsed||"",ts:Date.now()});
     render();
    },
    onError:err=>{
     CM.listening=false;
     CM.busy=false;
     CM.error=(err&&err.message)||aiTr("تعذر التقاط الصوت.","Voice input failed.","Erreur micro.");
     render();
    },
    onEnd:()=>{
     if(CM.listening){CM.listening=false;render()}
    }
   });
   if(started){CM.listening=true;render()}
  }catch(err){
   CM.listening=false;
   CM.error=(err&&err.message)||aiTr("المتصفح لا يدعم الإدخال الصوتي.","Speech recognition unavailable.","Reconnaissance vocale indisponible.");
   render();
  }
 }

 function renderVoiceCompanionCard(v){
  const core=window.AcademicCoreInstance;
  const user=window.ScholarAuth&&window.ScholarAuth.getUser();
  if(!core)return;
  if(!user){
   v.append(h("div",{class:"card ai-companion-card"},
    h("div",{class:"ai-live-top"},
     h("b",{},ic("cap",{s:16})," ",aiTr("المساعد الأكاديمي الشخصي (الصوت + ذاكرة المسار)","Personal Academic Companion (Voice + Track Memory)","Assistant personnel (Voix + Parcours)")),
     h("span",{class:"ai-live-model"},aiTr("ذاكرة دائمة","Track Memory","Mémoire"))
    ),
    h("p",{class:"meta",style:"margin:4px 0 8px"},aiTr("سجّل الدخول بحساب Google ليحفظ المساعد تخصصك وجامعتك وآخر موضوع بحثت فيه ويجيبك صوتيًا في أي جلسة.","Sign in with Google so your companion remembers your discipline, university, and latest research topic across sessions.","Connectez-vous avec Google pour mémoriser votre filière et votre dernier sujet.")),
    h("button",{type:"button",class:"btn fill",onclick:()=>{if(window.ScholarAuth&&window.ScholarAuth.signInWithGoogle)window.ScholarAuth.signInWithGoogle().catch(()=>{})}},ic("login",{s:15})," ",aiTr("تسجيل الدخول بحساب Google","Sign in with Google","Connexion Google"))
   ));
   return;
  }
  const mem=core.memory||{};
  const fieldTxt=mem.field||(S.prof&&S.prof.field)||"";
  const univTxt=mem.university||(S.prof&&S.prof.university)||"";
  const topicTxt=mem.lastTopic||mem.last_topic||"";
  const compIn=h("input",{
   class:"in",
   value:CM.draft,
   disabled:CM.busy,
   placeholder:aiTr("اسأل مساعدك الشخصي صوتيًا أو كتابةً…","Ask your personal companion by voice or text…","Posez votre question…"),
   oninput:e=>{CM.draft=e.target.value},
   onkeydown:e=>{if(e.key==="Enter"){e.preventDefault();sendCompanionQuery()}}
  });
  v.append(h("div",{class:"card ai-companion-card"},
   h("div",{class:"ai-live-top"},
    h("b",{},ic("cap",{s:16})," ",aiTr("المساعد الأكاديمي الشخصي (صوت + ذاكرة مسار)","Personal Academic Voice Companion","Assistant vocal personnel")),
    h("button",{type:"button",class:"btn",style:"padding:4px 10px;font-size:12px",onclick:()=>{if(typeof window.openScholarAccountModal==="function")window.openScholarAccountModal()}},ic("user",{s:14})," ",aiTr("ملفي الجامعي","Academic Profile","Profil"))
   ),
   h("div",{class:"ai-track-chips"},
    fieldTxt?h("span",{class:"ai-track-chip"},ic("book",{s:13})," ",fieldTxt):null,
    univTxt?h("span",{class:"ai-track-chip"},ic("cap",{s:13})," ",univTxt):null,
    topicTxt?h("span",{class:"ai-track-chip",dir:"auto"},ic("bookmark",{s:13})," ",aiTr("آخر موضوع: ","Last topic: ","Sujet : "),topicTxt):h("span",{class:"ai-track-chip muted"},aiTr("سيتم حفظ آخر موضوع تلقائيًا","Your research track updates automatically","Suivi automatique actif"))
   ),
   h("div",{class:"ai-live-controls"},
    h("button",{type:"button",class:"btn "+(CM.listening?"danger":"fill")+" ai-companion-mic"+(CM.listening?" listening":""),disabled:CM.busy,onclick:toggleCompanionVoice},
     ic(CM.listening?"mic-off":"mic",{s:16})," ",
     CM.listening?aiTr("جارٍ الاستماع… اضغط للإيقاف","Listening… Tap to stop","Écoute…"):aiTr("تحدّث مع المساعد","Speak Question","Parler")
    ),
    h("button",{type:"button",class:"btn"+(CM.speak?" fill":""),onclick:()=>{CM.speak=!CM.speak;if(!CM.speak)core.stopSpeaking();render()}},
     ic(CM.speak?"volume":"volume-x",{s:15})," ",CM.speak?aiTr("نطق الردود: مفعّل","Voice Reply: On","Voix : Activée"):aiTr("نطق الردود: صامت","Voice Reply: Muted","Voix : Coupée")
    ),
    CM.speak?h("button",{type:"button",class:"btn",onclick:()=>core.stopSpeaking()},aiTr("إيقاف الصوت","Stop Audio","Arrêter")):null
   ),
   CM.error?h("div",{class:"ai-verif-line warn",style:"margin-top:6px"},ic("alert",{s:15}),h("span",{},CM.error)):null,
   CM.history.length?h("div",{class:"ai-companion-feed"},CM.history.slice(-8).map(m=>
    h("div",{class:"ai-companion-msg "+m.role,dir:"auto"},
     h("strong",{},m.role==="user"?aiTr("أنت","You","Vous"):aiTr("المساعد الشخصي","Companion","Assistant")),
     h("div",{class:"ai-companion-txt"},m.text)
    )
   )):null,
   h("div",{class:"ai-live-textbar"},
    compIn,
    h("button",{type:"button",class:"btn fill",disabled:CM.busy,onclick:()=>sendCompanionQuery()},ic("send",{s:15})," ",CM.busy?aiTr("يفكر…","Thinking…","…"):aiTr("إرسال","Send","Envoyer"))
   )
  ));
 }

 function renderLiveVoiceView(v){
  renderVoiceCompanionCard(v);
  const active=LIVE.active||LIVE.status==="connecting"||LIVE.status==="listening"||LIVE.status==="speaking";
  const discList=(window.Net&&Net.DISCIPLINES)||[];
  const statusEl=h("div",{class:"ai-live-status "+LIVE.status},h("span",{class:"ai-live-dot"}),h("span",{},liveStatusLabel(LIVE.status)));
  LIVE.statusEl=statusEl;

  const meterFill=h("div",{class:"ai-live-meter-fill",style:"width:"+(LIVE.muted?0:Math.min(100,Math.round(LIVE.level*100)))+"%"});
  LIVE.meterEl=meterFill;

  const voiceSel=h("select",{class:"in ai-disc-sel",onchange:e=>{LIVE.voice=e.target.value}},
   LIVE_VOICES.map(vx=>h("option",{value:vx.id,selected:LIVE.voice===vx.id},vx[S.lang]||vx.en))
  );
  const discSel=discList.length?h("select",{class:"in ai-disc-sel",onchange:e=>{AI.field=e.target.value}},
   discList.map(d=>h("option",{value:d.id,selected:AI.field===d.id},d[S.lang]||d.en))
  ):null;

  const feed=h("div",{class:"ai-live-feed",id:"ai-live-feed"});
  LIVE.feedEl=feed;
  patchLiveFeedDom();

  const textIn=h("input",{
   id:"ai-live-text-in",
   class:"in",
   placeholder:aiTr("أرسل مداخلة نصية أو تحدّث عبر الميكروفون…","Send a text prompt or speak via microphone…","Écrivez ou parlez…"),
   value:LIVE.draft,
   oninput:e=>{LIVE.draft=e.target.value},
   onkeydown:e=>{if(e.key==="Enter"){e.preventDefault();sendLiveTextTurn()}}
  });

  v.append(h("div",{class:"card ai-live-card"},
   h("div",{class:"ai-live-top"},
    statusEl,
    h("span",{class:"ai-live-model"},"Web Speech · Voice")
   ),
   h("p",{class:"meta",style:"margin:4px 0 0"},
    aiTr("محادثة صوتية فورية تعمل مباشرة عبر محرك المتصفح (التعرف الصوتي + النطق الصوتي) دون خوادم وسيطة.","Real-time voice tutoring running directly via browser Web Speech API (SpeechRecognition + SpeechSynthesis).","Dialogue vocal instantané via l'API Web Speech du navigateur.")
   ),
   h("div",{class:"ai-live-controls"},
    h("button",{type:"button",class:"btn "+(active?"danger":"fill")+" ai-live-mainbtn",onclick:startLiveVoice},
     ic(active?"phone":"mic",{s:17}),
     active
      ?aiTr("إنهاء الجلسة الصوتية","End Voice Session","Terminer")
      :aiTr("بدء المحادثة الصوتية","Start Live Voice","Démarrer")
    ),
    active&&!LIVE.micUnavailable?h("button",{type:"button",class:"btn"+(LIVE.muted?" warn":""),onclick:()=>{
     LIVE.muted=!LIVE.muted;
     if(LIVE.muted){stopSpeechRecognitionOnly()}
     else{beginSpeechRecognition(LIVE._sessionToken)}
     render();
    }},ic(LIVE.muted?"mic-off":"mic",{s:16}),LIVE.muted?aiTr("إلغاء الكتم","Unmute","Activer micro"):aiTr("كتم الميكروفون","Mute","Muet")):null
   ),
   h("div",{class:"ai-live-opts"},
    h("div",{class:"ai-live-opt"},h("label",{class:"lbl"},aiTr("نبرة النطق","Speech Tone","Ton vocal")),voiceSel),
    discSel?h("div",{class:"ai-live-opt"},h("label",{class:"lbl"},aiTr("التخصص","Discipline","Discipline")),discSel):null
   ),
   active&&!LIVE.micUnavailable?h("div",{class:"ai-live-meter",ariaHidden:"true"},meterFill):null,
   feed,
   h("div",{class:"ai-live-textbar"},
    textIn,
    h("button",{type:"button",class:"btn fill",onclick:sendLiveTextTurn},ic("send",{s:15}),aiTr("إرسال","Send","Envoyer"))
   ),
   LIVE.turns.length?h("div",{class:"ai-msg-actions"},
    h("button",{type:"button",class:"btn fill",disabled:Boolean(AI.convertingId),onclick:()=>{
     const fullText=LIVE.turns.map(t=>(t.role==="user"?"Student: ":"Tutor: ")+t.text).join("\n");
     convertToSmartFlashcards(fullText,AI.source?.title||aiTr("جلسة صوتية بحثية","Live Voice Tutoring Session","Session vocale"),[], "live_fc");
    }},ic("cards",{s:15}),aiTr("تحويل الحوار إلى بطاقات","Convert to Flashcards","Convertir en fiches")),
    h("button",{type:"button",class:"btn",disabled:Boolean(AI.savingId),onclick:()=>{
     const fullText=LIVE.turns.map(t=>(t.role==="user"?aiTr("الطالب: ","Student: ","Étudiant : "):aiTr("المساعد: ","Tutor: ","Tuteur : "))+t.text).join("\n\n");
     saveReportToLibrary({id:"live_rep",title:aiTr("تفريغ حوار صوتي: ","Voice Session: ","Session vocale : ")+(AI.source?.title||AI.field||aiTr("بحث علمي","Academic Study","Étude")),subtitle:"Web Speech Voice Session",bodyText:fullText,citations:[]});
    }},ic("book",{s:15}),aiTr("حفظ في المكتبة","Save to Library","Enregistrer")),
    h("button",{type:"button",class:"btn",onclick:()=>{
     LIVE.turns=[];
     patchLiveFeedDom();
     render();
    }},ic("trash",{s:15}),aiTr("مسح السجل","Clear","Effacer"))
   ):null
  ));
 }

 async function runMapsGroundingQuery(customQuery){
  const q=(customQuery!=null?customQuery:AI.mapsQuery).trim();
  if(!q||AI.mapsBusy)return;
  AI.mapsQuery=q;
  AI.mapsBusy=true;
  AI.mapsError="";
  render();
  try{
   const body={query:q,lang:S.lang||"ar"};
   if(AI.mapsCoords&&Number.isFinite(AI.mapsCoords.lat)&&Number.isFinite(AI.mapsCoords.lng)){
    body.lat=AI.mapsCoords.lat;
    body.lng=AI.mapsCoords.lng;
   }
   const data=await postAiJson("/api/ai/maps-grounding",body,90000);
   AI.mapsResult=data;
  }catch(e){
   if(window.StudyMaps&&typeof window.StudyMaps.checkQuotaResponse==="function"){
    window.StudyMaps.checkQuotaResponse(0,e&&e.message?e.message:"");
   }
   AI.mapsError=(e&&e.message)||aiTr("تعذر استرجاع نتائج المواقع مؤقتًا.","Could not retrieve study spaces right now.","Échec temporaire de la recherche.");
  }finally{
   AI.mapsBusy=false;
   render();
  }
 }

 function renderMapsGroundingView(v){
  const presets=S.lang==="ar"
   ?["أقرب مكتبة جامعية هادئة للدراسة","مقهى دراسة بالإنترنت السريع وهادئ","مركز أبحاث علمية ومصادر"]
   :S.lang==="fr"
   ?["Bibliothèque universitaire calme","Café d'étude avec Wi-Fi","Centre de recherche scientifique"]
   :["Quiet university library for studying","Study friendly cafe with Wi-Fi","Academic research center"];

  const qInp=h("input",{
   class:"in",
   value:AI.mapsQuery,
   placeholder:aiTr("ابحث عن مكتبة جامعية، مقهى دراسة، أو حرم جامعي…","Search for libraries, campuses, or study cafes…","Rechercher une bibliothèque ou un campus…"),
   oninput:e=>{AI.mapsQuery=e.target.value},
   onkeydown:e=>{if(e.key==="Enter"){e.preventDefault();runMapsGroundingQuery()}}
  });

  v.append(h("div",{class:"card ai-maps-card"},
   h("div",{class:"ai-wg-head"},
    ic("map",{s:18}),
    h("b",{},aiTr("خرائط الدراسة الموثّقة (Gemini · Google Maps)","Grounded Study Spaces (Gemini · Google Maps)","Lieux d'étude (Gemini · Google Maps)")),
    h("span",{class:"ai-wg-badge"},"Google Maps Grounding")
   ),
   h("p",{class:"meta",style:"margin:0 0 10px"},aiTr("اعثر على مكتبات ومقاهي دراسة ومراكز أبحاث حقيقية بروابط وتقييمات موثّقة من خرائط Google أو افتح الخريطة التفاعلية.","Find real libraries, campuses, and quiet study spots with verified Google Maps links & reviews, or open the interactive map.","Trouvez de vraies bibliothèques et lieux d'étude via Google Maps.")),
   h("div",{class:"gmp-search-row"},
    qInp,
    h("button",{type:"button",class:"btn fill",disabled:AI.mapsBusy,onclick:()=>runMapsGroundingQuery()},ic("search",{s:15}),AI.mapsBusy?aiTr("جارٍ البحث…","Searching…","Recherche…"):aiTr("بحث","Search","Chercher")),
    h("button",{type:"button",class:"btn",onclick:async()=>{
     if(!window.StudyMaps||typeof window.StudyMaps.getBrowserCoords!=="function")return;
     toast(aiTr("جارٍ تحديد موقعك…","Getting location…","Localisation…"));
     const c=await window.StudyMaps.getBrowserCoords();
     if(!c)return toast(aiTr("تعذر الوصول للموقع الجغرافي.","Location unavailable.","Position indisponible."));
     AI.mapsCoords=c;
     toast(aiTr("تم تفعيل الإحداثيات للبحث القريب ✓","Location enabled for nearby search ✓","Localisation activée ✓"));
     render();
    }},ic("pin",{s:15}),aiTr("موقعي","Near Me","Ma position"))
   ),
   h("div",{class:"ai-maps-presets"},
    presets.map(p=>h("button",{type:"button",class:"tchip",onclick:()=>{AI.mapsQuery=p;runMapsGroundingQuery(p)}},p)),
    h("button",{type:"button",class:"btn",onclick:()=>window.StudyMaps&&window.StudyMaps.openStudyMapModal({initialQuery:AI.mapsQuery||undefined,coords:AI.mapsCoords||undefined})},ic("map",{s:15}),aiTr("فتح الخريطة التفاعلية الكاملة","Open Interactive Study Map","Ouvrir la carte interactive"))
   )
  ));

  if(AI.mapsError){
   v.append(h("div",{class:"card ai-msg err"},h("div",{class:"ai-verif-line warn"},ic("alert",{s:16}),h("span",{},AI.mapsError))));
  }

  if(AI.mapsResult){
   const R=AI.mapsResult;
   const prose=h("div",{class:"ai-msg-prose"});
   prose.append(renderMarkdownDom(R.answer||""));
   v.append(h("div",{class:"card ai-wg-card"},
    h("div",{class:"ai-wg-head"},
     ic("sparkles",{s:16}),
     h("b",{},aiTr("نتائج موثّقة من خرائط Google","Verified Google Maps Grounding","Résultats Google Maps")),
     R.modelUsed?h("span",{class:"ai-wg-badge",dir:"ltr"},R.modelUsed):null
    ),
    prose,
    Array.isArray(R.places)&&R.places.length
     ?h("div",{class:"gmp-results-list",style:"margin-top:10px"},R.places.map(pl=>
      h("div",{class:"card gmp-place-card"},
       h("div",{class:"gmp-place-head"},
        h("span",{class:"gmp-place-idx"},String(pl.index||"•")),
        h("b",{dir:"auto"},pl.title),
        pl.rating?h("span",{class:"badge g"},"★ "+Number(pl.rating).toFixed(1)):null
       ),
       pl.address?h("div",{class:"meta",dir:"auto"},pl.address):null,
       Array.isArray(pl.reviewSnippets)&&pl.reviewSnippets.length
        ?h("div",{class:"gmp-snippets"},pl.reviewSnippets.map(rs=>h("div",{class:"gmp-snippet",dir:"auto"},"“",rs.text,"”")))
        :null,
       h("div",{class:"btns"},
        pl.uri?h("a",{class:"btn fill",href:pl.uri,target:"_blank",rel:"noopener noreferrer"},ic("map",{s:14}),aiTr("فتح في خرائط Google","View on Google Maps","Google Maps")):null
       )
      )
     ))
     :null
   ));
  }
 }

 function renderAiAssistant(v){
  if(S.tab!=="ai"&&LIVE.active)stopLiveVoice(true);
  v.append(h("div",{class:"ai-hero"},
   h("div",{class:"ai-hero-badge"},ic("sparkles",{s:15}),aiTr("المساعد البحثي الذكي","AI Academic Research Assistant","Assistant de Recherche IA")),
   h("h2",{},aiTr("ابحث بدليل وحلّل الأوراق بدقة جامعية","Source-Grounded Research & Paper Analyzer","Recherche ancrée et analyse académique")),
   h("p",{},aiTr("اطرح الأسئلة العلمية، بسّط النظريات، تحدّث صوتيًا في الوقت الحقيقي، استكشف مكتبات الدراسة، أو حلّل ملفات PDF والمحاضرات بدقة موثّقة.","Ask complex questions, hold real-time voice conversations, locate study spaces, analyze PDFs/lectures, and convert outputs into cited flashcards.","Posez vos questions, discutez à voix haute, explorez les lieux d'étude, analysez PDF ou cours."))
  ));

  v.append(h("div",{class:"tabs ai-subtabs"},
   [["chat",aiTr("المحادثة البحثية","Research Chat","Discussion")],
    ["live",aiTr("محادثة صوتية (Live)","Live Voice","Voix Live")],
    ["analyzer",aiTr("محلّل المستندات","Document Analyzer","Analyseur PDF/Cours")],
    ["maps",aiTr("خرائط الدراسة","Study Maps","Cartes")],
    ["history",aiTr(`السجل (${AI.sessions.length})`,`History (${AI.sessions.length})`,`Historique (${AI.sessions.length})`)]
   ].map(([id,lab])=>h("button",{type:"button",class:AI.tab===id?"on":"",onclick:()=>{AI.tab=id;render()}},lab))
  ));

  v.append(renderSourceDock());
  if(AI.tab==="live")renderLiveVoiceView(v);
  else if(AI.tab==="analyzer")renderAnalyzerView(v);
  else if(AI.tab==="maps")renderMapsGroundingView(v);
  else if(AI.tab==="history")renderHistoryView(v);
  else renderChatView(v);
 }

 VIEWS.ai=renderAiAssistant;
 if(typeof render==="function")render();

 window.openAiWithSource=async function(src){
  if(!src)return go("ai");
  if(src.blob){
   await attachPdfFile(new File([src.blob],src.title||"document.pdf",{type:"application/pdf"}),src.autoAnalyze!==false);
   go("ai");
   return;
  }
  AI.source={
   kind:src.kind||"text",
   title:src.title||aiTr("مصدر مرفق","Attached Source","Source jointe"),
   sizeLabel:src.sizeLabel||(src.text?src.text.length.toLocaleString()+" "+aiTr("حرف","chars","car."):""),
   text:src.text||"",
   pdfBase64:src.pdfBase64||""
  };
  AI.analysis=null;
  AI.tab=src.autoAnalyze===false?"chat":"analyzer";
  go("ai");
  if(src.autoAnalyze!==false)await runDocumentAnalysis();
  else if(src.prompt)await sendResearchQuery(src.prompt);
 };

 window.postAiJson=postAiJson;
 window.callGeminiScholarAssistant=async function(userPrompt,opts){
  const prompt=String(userPrompt||"").trim();
  if(!prompt)return aiTr("يرجى إدخال سؤالك الأكاديمي أولاً.","Please enter your academic prompt first.","Veuillez saisir votre question académique.");
  const options=(opts&&typeof opts==="object")?opts:{};
  try{
   const data=await postAiJson("/api/ai/research",{
    messages:[{role:"user",text:prompt}],
    mode:options.mode||"qa",
    taskRoute:options.taskRoute||"general",
    persona:options.persona||AI.persona||"advisor",
    citeStyle:options.citeStyle||S.citeStyle||"apa",
    lang:options.lang||S.lang||"ar",
    field:options.field||AI.field||"",
    useWebSearch:options.useWebSearch!==undefined?options.useWebSearch:AI.useWebSearch
   },options.timeoutMs||120000);
   return (data&&data.answer)||aiTr("عذراً، لم يتم تلقي رد واضح من المساعد.","No clear response was received from the assistant.","Aucune réponse claire reçue.");
  }catch(err){
   console.error("AI error:",err);
   return aiTr("تعذّر الاتصال: ","Connection error: ","Erreur de connexion : ")+((err&&err.message)||String(err||""));
  }
 };
})();
