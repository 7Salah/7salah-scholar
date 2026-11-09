// الاكتشاف: بحث عن باحثين ومنشورات، واقتراحات المتابعة. يُحمَّل بعد admin.js.
const sq=s=>(s||"").replace(/[,()%*\\"]/g," ").trim().slice(0,50);
function searchBar(){const inp=h("input",{class:"cin",type:"search",placeholder:"ابحث عن باحث (اسم أو ID) أو تخصص أو منشور",value:SC.q||"",enterkeyhint:"search",
 onkeydown:e=>{if(e.key==="Enter"){const q=sq(inp.value);if(q.length<2)return toast("اكتب حرفين على الأقل");SC.q=q;SC.view="search";render()}}});
 return h("div",{style:"padding:0 16px"},inp)}
function userRow(p,fw){const sub=[p.field,p.university].filter(Boolean).join(" · ");
 const row=h("div",{class:"card phd"},h("div",{style:"display:flex;gap:10px;align-items:center;flex:1;min-width:0",onclick:()=>openProf(p.id)},av(p,42),
  h("div",{},h("b",{dir:"auto"},(p.name||p.username)+(p.verified?" ✅":"")),h("div",{class:"meta",dir:"auto"},"@"+p.username+(sub?" · "+sub:"")))));
 if(fw&&SC.user)row.append(h("button",{class:"btn",onclick:async e=>{e.stopPropagation();const r=await SC.sb.from("follows").insert({follower:SC.user.id,followee:p.id});if(r.error)return toast(r.error.message);row.remove()}},"＋ متابعة"));return row}
async function sugBox(v){const box=h("div",{});v.append(box);const r=await SC.sb.rpc("suggested_users"),l=((r.data)||[]).filter(p=>!SC.blocked.has(p.id)).slice(0,4);if(r.error||!l.length)return;
 box.append(h("div",{class:"meta",style:"padding:8px 16px 0;font-weight:700"},"✨ باحثون قد تهتم بمتابعتهم"),...l.map(p=>userRow(p,true)))}
async function searchView(v){const q=SC.q;v.append(searchBar());const pb=h("div",{}),xb=h("div",{}),T=x=>h("div",{class:"meta",style:"padding:8px 16px 0;font-weight:700"},x);
 v.append(T("👤 باحثون"),pb,T("📄 منشورات"),xb);
 const w="*"+q+"*",pr=await SC.sb.from("profiles").select("*").or("username.ilike."+w+",name.ilike."+w+",field.ilike."+w+",university.ilike."+w+(/^\d{6,12}$/.test(q)?",researcher_uid.eq."+q:"")).limit(20),rows=(pr.data||[]).filter(p=>!SC.blocked.has(p.id));
 if(rows.length)rows.forEach(p=>pb.append(userRow(p)));else pb.append(h("div",{class:"meta",style:"padding:6px 16px"},"لا نتائج"));
 loadPosts(xb,{q})}

// ===== الخلاصة المخصّصة «✨ لك» =====
// تُحسب في المتصفح من آخر 80 منشورًا (بلا تغيير في قاعدة البيانات). عوامل الترتيب:
// من تتابعه، تطابق التخصص، التفاعل، حداثة المنشور، وأسئلة لم تُجَب بعد. مع تنويع كي لا يطغى كاتب واحد.
function rankForYou(rows,fol,field){
 const me=SC.user&&SC.user.id,now=Date.now(),mine=normT(field||""),toks=mine.split(" ").filter(w=>w.length>2);
 const sc=rows.map(p=>{
  const n=x=>(p[x]&&p[x][0]&&p[x][0].count)||0,hrs=Math.max(0,(now-new Date(p.created_at).getTime())/36e5);
  let s=40*Math.exp(-hrs/36)+Math.min(30,n("likes")*3+n("comments")*5),why="";
  if(fol.has(p.user_id)){s+=40;why="👤 من تتابعه"}
  const tx=normT((p.topic||"")+" "+(p.title||""));
  if(mine&&p.topic&&normT(p.topic)===mine){s+=30;if(!why)why="🏷 تخصصك: "+p.topic}
  else if(toks.length){const k=toks.filter(w=>tx.includes(w)).length;if(k){s+=Math.min(20,k*10);if(!why&&p.topic)why="🏷 قريب من تخصصك"}}
  if(p.kind==="question"&&n("comments")===0){s+=8;if(!why)why="❓ سؤال ينتظر إجابة"}
  if(p.user_id===me)s-=15;
  p._why=why;return{p,s}}).sort((a,b)=>b.s-a.s);
 const out=[],cnt={};
 while(sc.length&&out.length<60){let bi=0,bv=-1e9;for(let i=0;i<Math.min(sc.length,25);i++){const v=sc[i].s-12*(cnt[sc[i].p.user_id]||0);if(v>bv){bv=v;bi=i}}
  const x=sc.splice(bi,1)[0];cnt[x.p.user_id]=(cnt[x.p.user_id]||0)+1;out.push(x.p)}
 return out}
async function loadForYou(box){
 const u=SC.user,field=SC.me&&SC.me.field;
 const hint=h("div",{class:"meta",style:"padding:0 16px 8px"},"✨ مرتّبة لك بحسب من تتابعهم وتخصصك.",
  field?null:h("button",{class:"btn",style:"margin-inline-start:6px",onclick:()=>SC.me&&editModal(SC.me)},"حدّد تخصصك لخلاصة أدق"));
 box.append(hint);
 const fl=await SC.sb.from("follows").select("followee").eq("follower",u.id),fol=new Set((fl.data||[]).map(x=>x.followee));
 const body=h("div",{});box.append(body);
 await loadPosts(body,{limit:80,rank:rows=>rankForYou(rows,fol,field)})}

// ===== 🔥 حزم رائجة: الأكثر إضافةً خلال 30 يومًا =====
async function loadTopDecks(box){
 const since=new Date(Date.now()-30*864e5).toISOString();
 const r=await SC.sb.from("deck_adds").select("post_id").gte("created_at",since).limit(2000);
 if(r.error){box.append(h("div",{class:"card"},"لتفعيل الحزم الرائجة شغّل v19o-deck-adds.sql في Supabase"));return}
 const cnt={};(r.data||[]).forEach(x=>{cnt[x.post_id]=(cnt[x.post_id]||0)+1});
 const ids=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).slice(0,20);
 if(!ids.length){box.append(h("div",{class:"meta",style:"padding:0 16px 8px"},"لا حزم رائجة بعد. هذه أحدث الحزم المشاركة، وكل حزمة يضيفها الآخرون ترتفع هنا."));return loadPosts(box,{kind:"deck"})}
 return loadPosts(box,{kind:"deck",ids,rank:rows=>rows.sort((x,y)=>(cnt[y.id]||0)-(cnt[x.id]||0)).map(p=>{p._why="🔥 أُضيفت "+(cnt[p.id]||0)+" مرة هذا الشهر";return p})})}
