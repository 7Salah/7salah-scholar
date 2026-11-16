// 7salah-scholar service worker: offline app shell + notification click
const V='7s-v36-zero-error';
const SHELL=['./','index.html','styles.css','firebase-auth.js','academic-core.js','app.js','network.js','social.js','diag.js','chat.js','admin.js','discover.js','rank.js','formats.js','stories.js','groups.js','translate.js','calls.js','maps.js','rooms.js','x.js','x.css','lecture.js','lecture.css','ai.js','config.js','icons.js','theme.js','manifest.json','logo.svg','favicon-32.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'no-cache'})))).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// الشبكة أولًا للملفات المحلية (لتصل التحديثات) ثم النسخة المخزّنة عند انقطاع الإنترنت. طلبات الفهارس الخارجية و /api/ لا تُعترَض.
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||/^\/api\//.test(u.pathname)||/\/game\/dist\//.test(u.pathname))return;
 const netReq=(/\.(?:css|js|html|json|svg)$/i.test(u.pathname)||r.mode==='navigate')?new Request(r,{cache:'no-cache'}):r;
 e.respondWith(fetch(netReq).then(res=>{if(res&&res.status===200){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res})
  .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(l=>{for(const c of l){if('focus' in c)return c.focus()}return clients.openWindow('./')}))});
