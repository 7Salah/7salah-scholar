// الترجمة عند الطلب: مترجم المتصفح المحلي إن وُجد، وإلا خدمتك الخاصة (APP.translateUrl)، وإلا MyMemory.
const TL={auto:"تلقائي (عكس لغة النص)",ar:"العربية",en:"English",fr:"Français",es:"Español",tr:"Türkçe",de:"Deutsch"};
const isArTxt=s=>((s.match(/[\u0600-\u06FF]/g)||[]).length>s.replace(/\s/g,"").length*.3);
const trCache=new Map();
const trTarget=s=>{const p=LS.get("7s_tl","auto");return p==="auto"?(isArTxt(s)?"en":"ar"):p};
function trChunks(text,n){const out=[];let cur="";for(const part of text.split(/(?<=[.!؟?\n])\s*/)){let p=part;while(p.length>n){if(cur){out.push(cur);cur=""}out.push(p.slice(0,n));p=p.slice(n)}
 if((cur+" "+p).length>n){if(cur)out.push(cur);cur=p}else cur+=(cur?" ":"")+p}if(cur)out.push(cur);return out}
async function translateText(text,to){text=text.slice(0,3000);const key=to+"|"+text;if(trCache.has(key))return trCache.get(key);
 let src=isArTxt(text)?"ar":null;
 if(!src&&"LanguageDetector" in self){try{const d=await LanguageDetector.create(),r=await d.detect(text);if(r[0]&&r[0].confidence>.6)src=r[0].detectedLanguage}catch(e){}}
 if(src===to)return "النص بلغة الترجمة المختارة نفسها";
 let out=null;
 if(window.APP&&APP.translateUrl){try{const r=await fetch(APP.translateUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,to})});if(r.ok)out=(await r.json()).text}catch(e){}}
 if(!out&&src&&"Translator" in self){try{if(await Translator.availability({sourceLanguage:src,targetLanguage:to})!=="unavailable"){const t=await Translator.create({sourceLanguage:src,targetLanguage:to});out=await t.translate(text)}}catch(e){}}
 if(!out){const em=(window.APP&&/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(APP.contact||""))?"&de="+encodeURIComponent(APP.contact):"",parts=[];
  for(const c of trChunks(text,400)){const r=await fetch("https://api.mymemory.translated.net/get?q="+encodeURIComponent(c)+"&langpair="+(src||"Autodetect")+"|"+to+em);
   const j=await r.json();if(!j.responseData||String(j.responseStatus)!=="200")throw new Error("tr");parts.push(j.responseData.translatedText)}out=parts.join(" ")}
 trCache.set(key,out);return out}
function trBtn(getText,out,cls){const b=h("button",{class:cls||"btn"},cls?"🌐":"🌐 ترجم");let on=false;
 b.onclick=async()=>{if(on){out.textContent="";on=false;return}const s=getText();if(!s)return;b.disabled=true;setT(out,"⏳");
  try{out.textContent=await translateText(s,trTarget(s));on=true}catch(e){setT(out,"⚠ تعذّرت الترجمة. تحقق من الإنترنت.")}b.disabled=false};return b}
function trModal(){const sel=h("select",{class:"cin"},Object.entries(TL).map(([k,n])=>h("option",Object.assign({value:k},LS.get("7s_tl","auto")===k?{selected:""}:{}),n)));
 const m=modal(h("h3",{},"🌐 لغة الترجمة"),sel,h("div",{class:"meta"},"تُرسَل النصوص التي تضغط ترجمتها فقط إلى خدمة الترجمة."),h("button",{class:"pri",onclick:()=>{LS.set("7s_tl",sel.value);m.remove()}},"حفظ"),h("div",{class:"acts"},h("button",{class:"btn",onclick:()=>m.remove()},t("cancel"))))}
