// 7salah-scholar service worker: offline app shell + notification click
const V='7s-v21-academic-quest1';
const SHELL=['./','index.html','styles.css','app.js','social.js','diag.js','chat.js','admin.js','discover.js','rank.js','formats.js','stories.js','groups.js','break.js','translate.js','calls.js','x.js','x.css','lecture.js','lecture.css','config.js','icons.js','theme.js','manifest.json','icon-192.png','icon-512.png','game/launch.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// الشبكة أولًا للملفات المحلية (لتصل التحديثات) ثم النسخة المخزّنة عند انقطاع الإنترنت. طلبات الفهارس الخارجية لا تُعترَض.
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||/\/game\/dist\//.test(u.pathname))return;
 e.respondWith(fetch(r).then(res=>{if(res&&res.status===200){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res})
  .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(l=>{for(const c of l){if('focus' in c)return c.focus()}return clients.openWindow('./')}))});
