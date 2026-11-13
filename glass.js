/* 7Salah Scholar — التحكم في الشفافية (بدون مكتبات). احفظه كـ glass.js وأضف له وسم script بمصدر glass.js
   واجهة الاستخدام (كلها اختيارية، ضعها في أي شاشة إعدادات):
   <input type="range" min="0" max="100" data-glass="t">   الشفافية
   <input type="range" min="0" max="30"  data-glass="b">   قوة الضبابية
   <input type="checkbox" data-glass="lite">               وضع التوفير
   <button data-glass-preset="glass|balanced|solid">  <button data-glass-reset>
   <span data-glass-out="t"></span> <span data-glass-out="b"></span>
   ومن الكود: Glass.set({t:40,b:10,lite:false}) / Glass.get() / Glass.reset() */
(function(){
  var K="glass-v1",D={t:65,b:14},
      P={glass:{t:null,b:null,lite:false},balanced:{t:30,b:8,lite:false},solid:{t:0,b:0,lite:true}},
      r=document.documentElement,s={t:null,b:null,lite:false};
  try{var j=JSON.parse(localStorage.getItem(K));
    if(j&&typeof j==="object")s={t:j.t==null?null:+j.t,b:j.b==null?null:+j.b,lite:!!j.lite}}catch(e){}
  function val(k){return s[k]==null?D[k]:s[k]}
  function apply(){
    if(s.t==null)r.style.removeProperty("--g-a");else r.style.setProperty("--g-a",(1-s.t/100*.65).toFixed(2));
    if(s.b==null)r.style.removeProperty("--g-px");else r.style.setProperty("--g-px",String(s.b));
    if(document.body)document.body.classList.toggle("lite",s.lite);
    document.querySelectorAll("[data-glass]").forEach(function(el){
      var k=el.dataset.glass;if(k==="lite")el.checked=s.lite;else el.value=val(k)});
    document.querySelectorAll("[data-glass-out]").forEach(function(el){
      var k=el.dataset.glassOut;el.textContent=k==="t"?val(k)+"%":val(k)});
    document.querySelectorAll("[data-glass-preset]").forEach(function(el){
      var p=P[el.dataset.glassPreset];
      el.classList.toggle("on",p.lite===s.lite&&(p.t==null?s.t==null:p.t===s.t)&&(p.b==null?s.b==null:p.b===s.b))});
  }
  function save(){try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}}
  function set(p){for(var k in p)if(k in s)s[k]=p[k];save();apply()}
  document.addEventListener("input",function(e){
    var el=e.target,k=el.dataset&&el.dataset.glass;if(!k)return;
    var o={};if(k==="lite")o.lite=el.checked;else o[k]=+el.value;set(o)});
  document.addEventListener("click",function(e){
    var el=e.target.closest&&e.target.closest("[data-glass-preset],[data-glass-reset]");if(!el)return;
    set(el.hasAttribute("data-glass-reset")?P.glass:P[el.dataset.glassPreset])});
  window.Glass={set:set,get:function(){return{t:val("t"),b:val("b"),lite:s.lite}},reset:function(){set(P.glass)}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply);else apply();
})();
