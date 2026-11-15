// 7Salah Scholar — Google Maps Platform Study Spaces Explorer & Gemini Maps Grounding
(function(){
 "use strict";

 const mTr=(a,e,f)=>S.lang==="ar"?a:S.lang==="fr"?(f||e):e;
 const ATTRIBUTION_ID="gmp_mcp_codeassist_v1_aistudio";
 const QUOTA_DOCS_URL="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors";

 // ---- Case A Tier-1 Quota Defense (Registered immediately at module root) ----
 const QUOTA_RX=/OverQuotaMapError|QuotaExceededError|OVER_QUERY_LIMIT|RESOURCE_EXHAUSTED/i;
 let quotaNotified=false;
 function triggerQuotaExceeded(source){
  try{
   window.dispatchEvent(new CustomEvent("gmp-quota-exceeded",{detail:{source:source||"maps"}}));
  }catch(e){}
 }

 const prevGmAuth=window.gm_authFailure;
 window.gm_authFailure=function(){
  triggerQuotaExceeded("gm_authFailure");
  if(typeof prevGmAuth==="function"){
   try{prevGmAuth.apply(this,arguments)}catch(e){}
  }
 };

 if(typeof console!=="undefined"&&typeof console.error==="function"){
  const origConsoleError=console.error;
  console.error=function(){
   try{
    const joined=Array.prototype.slice.call(arguments).map(x=>String(x&&x.message?x.message:x)).join(" ");
    if(QUOTA_RX.test(joined))triggerQuotaExceeded("console.error");
   }catch(e){}
   return origConsoleError.apply(console,arguments);
  };
 }

 function checkQuotaResponse(status,payloadOrMessage){
  if(Number(status)===429){
   triggerQuotaExceeded("http_429");
   return true;
  }
  const msg=typeof payloadOrMessage==="string"
   ?payloadOrMessage
   :JSON.stringify(payloadOrMessage||{});
  if(QUOTA_RX.test(msg)){
   triggerQuotaExceeded("api_error");
   return true;
  }
  return false;
 }

 function showQuotaBanner(){
  if(quotaNotified||document.getElementById("gmp-quota-banner"))return;
  quotaNotified=true;
  const bar=h("div",{id:"gmp-quota-banner",class:"gmp-quota-banner",role:"alert"},
   h("div",{class:"gmp-quota-inner"},
    ic("alert",{s:18}),
    h("span",{class:"gmp-quota-tx"},
     mTr(
      "تم تجاوز حصة مفتاح العرض التجريبي لخرائط Google مؤقتًا. يمكنك الاستمرار عبر البحث الذكي أو ربط مشروعك.",
      "Google Maps demo quota temporarily reached. You can continue using Gemini Maps Grounding or configure your own project.",
      "Quota Google Maps temporairement atteint."
     ),
     " ",
     h("a",{href:QUOTA_DOCS_URL,target:"_blank",rel:"noopener noreferrer"},mTr("مراجعة تفاصيل الحصة","Quota & billing details","Détails du quota"))
    ),
    h("button",{type:"button",class:"gmp-quota-close","aria-label":t("close"),onclick:()=>bar.remove()},ic("x",{s:15}))
   )
  );
  const app=document.querySelector(".app")||document.body;
  app.prepend(bar);
 }
 window.addEventListener("gmp-quota-exceeded",showQuotaBanner);

 // ---- Dynamic Library Import Bootstrap ----
 let cfgPromise=null;
 let mapsBootstrapPromise=null;

 async function getMapsConfig(){
  if(!cfgPromise){
   cfgPromise=fetch("/api/maps/config")
    .then(r=>r.json())
    .catch(()=>({configured:false,apiKey:"",attributionId:ATTRIBUTION_ID}));
  }
  return cfgPromise;
 }

 function injectDynamicMapsBootstrap(apiKey,lang){
  if(window.google&&window.google.maps&&typeof window.google.maps.importLibrary==="function"){
   return Promise.resolve(true);
  }
  if(mapsBootstrapPromise)return mapsBootstrapPromise;
  mapsBootstrapPromise=new Promise((resolve,reject)=>{
   try{
    (g=>{
     var b=window,c="google",l="importLibrary",q="__ib__",m=document,h_,a,k,p="The Google Maps JavaScript API";
     b=b[c]||(b[c]={});
     var d=b.maps||(b.maps={}),r=new Set(),e=new URLSearchParams(),u=()=>h_||(h_=new Promise(async(f,n)=>{
      a=m.createElement("script");
      e.set("libraries",[...r]+"");
      for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);
      e.set("callback",c+".maps."+q);
      a.src=`https://maps.${c}apis.com/maps/api/js?`+e;
      d[q]=f;
      a.onerror=()=>n(new Error(p+" could not load."));
      a.nonce=m.querySelector("script[nonce]")?.nonce||"";
      m.head.append(a);
     }));
     d[l]?resolve(true):d[l]=(f,...n)=>{r.add(f);return u().then(()=>d[l](f,...n));};
    })({
     key:apiKey,
     v:"weekly",
     language:lang==="ar"?"ar":lang==="fr"?"fr":"en"
    });
    resolve(true);
   }catch(err){
    reject(err);
   }
  });
  return mapsBootstrapPromise;
 }

 async function loadMapsLibraries(){
  const cfg=await getMapsConfig();
  if(!cfg||!cfg.configured||!cfg.apiKey){
   return {available:false,reason:"missing_key",attributionId:ATTRIBUTION_ID};
  }
  try{
   await injectDynamicMapsBootstrap(cfg.apiKey,S.lang);
   const [mapsLib,markerLib,placesLib,coreLib]=await Promise.all([
    google.maps.importLibrary("maps"),
    google.maps.importLibrary("marker"),
    google.maps.importLibrary("places"),
    google.maps.importLibrary("core")
   ]);
   return {
    available:true,
    attributionId:cfg.attributionId||ATTRIBUTION_ID,
    mapsLib,
    markerLib,
    placesLib,
    coreLib
   };
  }catch(err){
   checkQuotaResponse(err&&err.status,err&&err.message?err.message:err);
   return {available:false,reason:"load_error",error:err&&err.message?err.message:"Maps load error",attributionId:ATTRIBUTION_ID};
  }
 }

 async function queryGeminiMapsGrounding(query,coords){
  const body={
   query,
   lang:S.lang||"ar"
  };
  if(coords&&Number.isFinite(coords.lat)&&Number.isFinite(coords.lng)){
   body.lat=coords.lat;
   body.lng=coords.lng;
  }
  const res=await fetch("/api/ai/maps-grounding",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify(body)
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok){
   checkQuotaResponse(res.status,data);
   throw new Error(data.error||mTr("تعذر البحث عبر خرائط Gemini.","Maps grounding request failed.","Échec de la recherche Maps."));
  }
  return data;
 }

 function getBrowserCoords(){
  return new Promise(resolve=>{
   if(!navigator.geolocation)return resolve(null);
   navigator.geolocation.getCurrentPosition(
    pos=>resolve({lat:pos.coords.latitude,lng:pos.coords.longitude}),
    ()=>resolve(null),
    {enableHighAccuracy:false,timeout:6000,maximumAge:120000}
   );
  });
 }

 // ---- Interactive Study Spaces Map Modal ----
 function openStudyMapModal(opts){
  opts=opts||{};
  const onPickVenue=typeof opts.onPickVenue==="function"?opts.onPickVenue:null;
  const state={
   query:opts.initialQuery||mTr("مكتبة جامعية للدراسة","university library study space","bibliothèque universitaire"),
   coords:opts.coords||null,
   map:null,
   libs:null,
   markers:[],
   infoWindow:null,
   places:[],
   groundingAnswer:"",
   loading:false,
   selectedPlace:null
  };

  const mapBox=h("div",{class:"gmp-map-canvas",id:"gmp-study-map"});
  const statusLine=h("div",{class:"meta gmp-status-line"});
  const resultsEl=h("div",{class:"gmp-results-list"});
  const groundingEl=h("div",{class:"gmp-grounding-box"});

  const qInp=h("input",{
   class:"in",
   value:state.query,
   placeholder:mTr("ابحث عن مكتبة جامعية، مقهى هادئ، أو مركز أبحاث…","Search university libraries, study cafes, research centers…","Rechercher une bibliothèque…"),
   onkeydown:e=>{if(e.key==="Enter"){e.preventDefault();runTextSearch()}}
  });

  function clearMarkers(){
   state.markers.forEach(mk=>{try{mk.map=null}catch(e){}});
   state.markers=[];
  }

  function renderPlaceCards(items){
   if(!items.length){
    resultsEl.replaceChildren(h("div",{class:"meta",style:"padding:8px 2px"},mTr("أدخل اسم جامعة أو مدينة للعثور على أماكن الدراسة.","Enter a city or university to discover study venues.","Entrez une ville ou université.")));
    return;
   }
   resultsEl.replaceChildren(...items.map((p,idx)=>{
    const isSel=state.selectedPlace&&state.selectedPlace.name===p.name&&state.selectedPlace.address===p.address;
    return h("div",{class:"card gmp-place-card"+(isSel?" active":"")},
     h("div",{class:"gmp-place-head"},
      h("span",{class:"gmp-place-idx"},String(idx+1)),
      h("b",{dir:"auto"},p.name),
      p.rating?h("span",{class:"badge g"},"★ "+Number(p.rating).toFixed(1)):null
     ),
     p.address?h("div",{class:"meta",dir:"auto"},p.address):null,
     Array.isArray(p.reviewSnippets)&&p.reviewSnippets.length
      ?h("div",{class:"gmp-snippets"},p.reviewSnippets.map(rs=>
        h("div",{class:"gmp-snippet",dir:"auto"},"“",rs.text,"”")
      ))
      :null,
     h("div",{class:"btns"},
      p.location&&state.map?h("button",{type:"button",class:"btn",onclick:()=>{
       state.map.panTo(p.location);
       state.map.setZoom(15);
       state.selectedPlace=p;
       renderPlaceCards(items);
      }},ic("pin",{s:14}),mTr("عرض على الخريطة","Focus Map","Centrer")):null,
      p.uri?h("a",{class:"btn",href:p.uri,target:"_blank",rel:"noopener noreferrer"},ic("map",{s:14}),mTr("فتح في خرائط Google","Open in Google Maps","Google Maps")):null,
      onPickVenue?h("button",{type:"button",class:"btn fill",onclick:()=>{
       onPickVenue({
        name:p.name,
        address:p.address||"",
        uri:p.uri||"",
        placeId:p.placeId||"",
        lat:p.location?p.location.lat:undefined,
        lng:p.location?p.location.lng:undefined
       });
       m.remove();
       toast(mTr("تم ربط مكان الدراسة بالغرفة ✓","Study venue attached ✓","Lieu associé ✓"));
      }},ic("check",{s:14}),mTr("اختيار كمقر للغرفة","Use for Room","Choisir")):null
     )
    );
   }));
  }

  async function initMapIfReady(){
   statusLine.textContent=mTr("جارٍ تهيئة خريطة أماكن الدراسة…","Initializing Study Spaces Map…","Initialisation de la carte…");
   const libs=await loadMapsLibraries();
   state.libs=libs;
   if(!libs.available){
    mapBox.replaceChildren(
     h("div",{class:"gmp-map-fallback"},
      ic("map",{s:32,cls:"gold"}),
      h("b",{},mTr("وضع البحث الموثّق عبر Gemini Maps Grounding","Gemini Maps Grounding Mode","Mode Gemini Maps Grounding")),
      h("div",{class:"meta"},mTr("خرائط JavaScript التفاعلية تتطلب تفعيل مفتاح Google Maps على الخادم؛ يمكنك استخدام البحث الذكي الموثّق أدناه لعرض الأماكن وروابطها الرسمية على خرائط Google.","Interactive map canvas loads when GOOGLE_MAPS_API_KEY is available on the server; Gemini Maps Grounding search works right below with verified Google Maps links.","La carte interactive requiert GOOGLE_MAPS_API_KEY; la recherche vérifiée ci-dessous reste disponible."))
     )
    );
    statusLine.textContent=mTr("جاهز للبحث الذكي عن أماكن الدراسة","Ready for Gemini Maps Grounding search","Prêt pour la recherche");
    return;
   }
   try{
    const {Map,InfoWindow}=libs.mapsLib;
    const center=state.coords||{lat:24.7136,lng:46.6753};
    mapBox.replaceChildren();
    state.map=new Map(mapBox,{
     center,
     zoom:12,
     renderingType:"VECTOR",
     mapId:"DEMO_MAP_ID",
     internalUsageAttributionIds:[libs.attributionId||ATTRIBUTION_ID]
    });
    state.infoWindow=new InfoWindow();
    statusLine.textContent=mTr("الخريطة التفاعلية جاهزة ✓","Interactive map ready ✓","Carte prête ✓");
    await runTextSearch();
   }catch(err){
    checkQuotaResponse(err&&err.status,err&&err.message?err.message:err);
    statusLine.textContent=mTr("تعذر تحميل لوحة الخريطة التفاعلية.","Could not render map canvas.","Erreur de carte.");
   }
  }

  async function runTextSearch(){
   const q=qInp.value.trim();
   if(!q)return toast(mTr("أدخل عبارة بحث أولًا.","Enter a search query first.","Entrez une recherche."));
   state.query=q;
   if(!state.libs||!state.libs.available){
    return runAiMapsSearch();
   }
   statusLine.textContent=mTr("جارٍ البحث عن أماكن الدراسة…","Searching Google Places…","Recherche en cours…");
   try{
    const {Place}=state.libs.placesLib;
    const {AdvancedMarkerElement,PinElement}=state.libs.markerLib;
    const {LatLngBounds}=state.libs.coreLib;

    const req={
     textQuery:q,
     fields:["id","displayName","formattedAddress","location","rating","googleMapsURI"],
     maxResultCount:8,
     language:S.lang==="ar"?"ar":S.lang==="fr"?"fr":"en",
     internalUsageAttributionIds:[state.libs.attributionId||ATTRIBUTION_ID]
    };
    if(state.coords){
     req.locationBias=state.coords;
    }else if(state.map&&state.map.getCenter()){
     const c=state.map.getCenter();
     req.locationBias={lat:c.lat(),lng:c.lng()};
    }

    const res=await Place.searchByText(req);
    const list=Array.isArray(res&&res.places)?res.places:[];
    clearMarkers();
    if(!list.length){
     statusLine.textContent=mTr("لم يتم العثور على نتائج مطابقة — جرّب البحث الذكي (Gemini Maps).","No exact Places match — try Gemini Maps search.","Aucun résultat — essayez Gemini Maps.");
     state.places=[];
     renderPlaceCards([]);
     return;
    }

    const bounds=new LatLngBounds();
    const mapped=[];
    list.forEach((pl,i)=>{
     const loc=pl.location?{lat:typeof pl.location.lat==="function"?pl.location.lat():pl.location.lat,lng:typeof pl.location.lng==="function"?pl.location.lng():pl.location.lng}:null;
     const item={
      placeId:pl.id||"",
      name:pl.displayName||mTr("مكان دراسة","Study Place","Lieu d'étude"),
      address:pl.formattedAddress||"",
      rating:pl.rating||null,
      uri:pl.googleMapsURI||"",
      location:loc
     };
     mapped.push(item);

     if(loc&&state.map){
      bounds.extend(loc);
      const pin=new PinElement({
       background:"#001449",
       borderColor:"#FACC15",
       glyphColor:"#FACC15"
      });
      const marker=new AdvancedMarkerElement({
       map:state.map,
       position:loc,
       title:item.name,
       gmpClickable:true,
       content:pin
      });
      marker.addEventListener("gmp-click",()=>{
       state.selectedPlace=item;
       if(state.infoWindow){
        const contentNode=h("div",{style:"padding:4px 2px;max-width:220px;color:#142b4d"},
         h("b",{dir:"auto"},item.name),
         item.address?h("div",{style:"font-size:12px;margin-top:3px;color:#475569",dir:"auto"},item.address):null
        );
        state.infoWindow.setContent(contentNode);
        state.infoWindow.open({anchor:marker,map:state.map});
       }
       renderPlaceCards(state.places);
      });
      state.markers.push(marker);
      if(i===0)state.selectedPlace=item;
     }
    });

    if(state.map&&!bounds.isEmpty()){
     state.map.fitBounds(bounds);
    }
    state.places=mapped;
    statusLine.textContent=mTr("تم العثور على "+mapped.length+" مكان دراسة ✓","Found "+mapped.length+" study places ✓",mapped.length+" lieux trouvés ✓");
    renderPlaceCards(mapped);
   }catch(err){
    checkQuotaResponse(err&&err.status,err&&err.message?err.message:err);
    statusLine.textContent=mTr("تعذر البحث عبر Places — جارٍ التحويل لبحث Gemini Maps…","Places lookup fallback to Gemini Maps…","Bascule vers Gemini Maps…");
    await runAiMapsSearch();
   }
  }

  async function runAiMapsSearch(){
   const q=qInp.value.trim();
   if(!q)return;
   state.query=q;
   groundingEl.replaceChildren(h("div",{class:"meta",style:"padding:8px"},mTr("جارٍ استرجاع توصيات خرائط Google عبر Gemini…","Querying Google Maps grounding via Gemini…","Recherche Gemini Maps…")));
   try{
    const data=await queryGeminiMapsGrounding(q,state.coords);
    const items=(data.places||[]).map(p=>({
     placeId:p.placeId||"",
     name:p.title||"Google Maps Place",
     address:p.address||"",
     rating:p.rating||null,
     location:Number.isFinite(p.lat)&&Number.isFinite(p.lng)?{lat:p.lat,lng:p.lng}:null,
     uri:p.uri||"",
     reviewSnippets:p.reviewSnippets||[]
    }));
    if(data.answer){
     groundingEl.replaceChildren(
      h("div",{class:"card gmp-ai-note"},
       h("div",{class:"gmp-ai-head"},ic("sparkles",{s:15}),h("b",{},mTr("ترشيحات المساعد المدعومة بخرائط Google","Gemini · Google Maps Grounding","Recommandations Google Maps"))),
       h("div",{class:"pbody",dir:"auto",style:"white-space:pre-wrap"},data.answer)
      )
     );
    }else{
     groundingEl.replaceChildren();
    }
    if(items.length){
     state.places=items;
     renderPlaceCards(items);
    }
    statusLine.textContent=mTr("نتائج موثّقة من خرائط Google ✓","Grounded in Google Maps ✓","Ancré dans Google Maps ✓");
   }catch(err){
    groundingEl.replaceChildren(h("div",{class:"ai-verif-line warn"},ic("alert",{s:15}),h("span",{},err.message)));
   }
  }

  const geoBtn=h("button",{type:"button",class:"btn",onclick:async()=>{
   statusLine.textContent=mTr("جارٍ تحديد موقعك بإذنك…","Requesting location…","Localisation…");
   const c=await getBrowserCoords();
   if(!c){
    statusLine.textContent=mTr("لم يتم منح إذن الموقع أو تعذر تحديده.","Location unavailable or denied.","Position indisponible.");
    return;
   }
   state.coords=c;
   if(state.map){state.map.setCenter(c);state.map.setZoom(14)}
   await runTextSearch();
  }},ic("pin",{s:15}),mTr("بالقرب مني","Near Me","Autour de moi"));

  const m=modal(
   h("h3",{},ic("map")," ",mTr("خريطة أماكن الدراسة والمكتبات","Study Spaces & Campus Map","Carte des lieux d'étude")),
   h("div",{class:"gmp-search-row"},
    qInp,
    h("button",{type:"button",class:"btn fill",onclick:runTextSearch},ic("search",{s:15}),mTr("بحث","Search","Chercher")),
    geoBtn
   ),
   h("div",{class:"gmp-action-sub"},
    h("button",{type:"button",class:"btn",onclick:runAiMapsSearch},ic("sparkles",{s:15}),mTr("بحث ذكي بالخرائط (Gemini Grounding)","Smart Maps Search (Gemini)","Recherche Gemini Maps")),
    statusLine
   ),
   mapBox,
   groundingEl,
   resultsEl,
   h("div",{class:"acts"},h("button",{type:"button",class:"btn",onclick:()=>m.remove()},t("close")))
  );

  initMapIfReady();
  return m;
 }

 window.StudyMaps={
  openStudyMapModal,
  queryGeminiMapsGrounding,
  getMapsConfig,
  checkQuotaResponse,
  getBrowserCoords
 };
})();
