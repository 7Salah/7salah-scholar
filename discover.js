// الاكتشاف: بحث عن باحثين ومنشورات، واقتراحات المتابعة. يُحمَّل بعد admin.js.
const sq=s=>(s||"").replace(/[,()%*\\"]/g," ").trim().slice(0,50);
function searchBar(){const inp=h("input",{class:"cin",type:"search",placeholder:"🔎 ابحث عن باحث (اسم أو ID) أو تخصص أو منشور",value:SC.q||"",enterkeyhint:"search",
 onkeydown:e=>{if(e.key==="Enter"){const q=sq(inp.value);if(q.length<2)return toast("اكتب حرفين على الأقل");SC.q=q;SC.view="search";render()}}});
 return h("div",{style:"padding:0 16px"},inp)}
function userRow(p,fw){const sub=[p.field,p.university].filter(Boolean).join(" · ");
 const row=h("div",{class:"card phd"},h("div",{style:"display:flex;gap:10px;align-items:center;flex:1;min-width:0",onclick:()=>openProf(p.id)},av(p,42),
  h("div",{},h("b",{dir:"auto"},(p.name||p.username)+(p.verified?" ✅":"")),h("div",{class:"meta",dir:"auto"},"@"+p.username+(sub?" · "+sub:"")))));
 if(fw&&SC.user)row.append(h("button",{class:"btn",onclick:async e=>{e.stopPropagation();const r=await SC.sb.from("follows").insert({follower:SC.user.id,followee:p.id});if(r.error)return toast(r.error.message);row.remove()}},"＋ متابعة"));return row}
async function sugBox(v){const box=h("div",{});v.append(box);const r=await SC.sb.rpc("suggested_users"),l=((r.data)||[]).filter(p=>!SC.blocked.has(p.id)).slice(0,4);if(r.error||!l.length)return;
 box.append(h("div",{class:"meta",style:"padding:8px 16px 0;font-weight:700"},"✨ باحثون قد تهتم بمتابعتهم"),l.map(p=>userRow(p,true)))}
async function searchView(v){const q=SC.q;v.append(searchBar());const pb=h("div",{}),xb=h("div",{}),T=x=>h("div",{class:"meta",style:"padding:8px 16px 0;font-weight:700"},x);
 v.append(T("👤 باحثون"),pb,T("📄 منشورات"),xb);
 const w="*"+q+"*",pr=await SC.sb.from("profiles").select("*").or("username.ilike."+w+",name.ilike."+w+",field.ilike."+w+",university.ilike."+w+(/^\d{6,12}$/.test(q)?",researcher_uid.eq."+q:"")).limit(20),rows=(pr.data||[]).filter(p=>!SC.blocked.has(p.id));
 if(rows.length)rows.forEach(p=>pb.append(userRow(p)));else pb.append(h("div",{class:"meta",style:"padding:6px 16px"},"لا نتائج"));
 loadPosts(xb,{q})}
