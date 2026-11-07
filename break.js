// استراحة 🙂: أسئلة ترفيهية حسب التخصص + فحص مزاج خاص + تمرين تنفّس. كل شيء على جهاز المستخدم ولا يُرسل لأي جهة.
const BRK_FIELDS=[["med","الطب والصحة",/طب|صيدل|تمريض|صح|أسنان|med|pharm|health/i],["eng","الهندسة",/هندس|eng|معمار|ميكانيك|كهرب|مدني/i],["cs","المعلوماتية",/إعلام|معلومات|حاسب|برمج|ذكاء|cs|computer|software|data/i],
 ["law","القانون",/قانون|حقوق|law|شريعة/i],["eco","الاقتصاد والتسيير",/اقتصاد|تسيير|تجار|مالي|محاسب|eco|manage|business|financ/i],["lit","اللغة والأدب",/أدب|لغ|ترجم|lit|lang|عربي|إنجليز|فرنس/i],
 ["sci","الفيزياء والرياضيات",/فيزياء|رياضي|إحصاء|phys|math|stat/i],["bio","الكيمياء والأحياء",/كيمياء|أحياء|بيولوج|chem|bio|فلاح|زراع/i],["psy","علم النفس والتربية",/نفس|تربي|تعليم|psy|educ/i],["hist","التاريخ والاجتماع",/تاريخ|اجتماع|جغراف|إعلام واتصال|hist|soc|سياس|علوم إنسان/i],["gen","عام",null]];
const BRK_Q={
med:[["كم عظمة في جسم الإنسان البالغ؟",["206","186","256","306"],0,"يولد الطفل بعدد أكبر من العظام، ثم يلتحم بعضها مع النمو."],["ما أصغر عظمة في الجسم؟",["الركاب","المطرقة","السندان","الزند"],0,"الركاب في الأذن الوسطى، وطولها بضعة ملليمترات."],["أي عضو يستهلك نحو 20% من طاقة الجسم؟",["الدماغ","الكبد","القلب","الرئتان"],0,"الدماغ نحو 2% من الوزن فقط، لكنه كبير الاستهلاك. أرِحه بالنوم!"],["أكبر عضو في جسم الإنسان؟",["الجلد","الكبد","الأمعاء","الرئة"],0,"الجلد عضو كامل وليس غلافًا فقط."]],
eng:[["من أي لغة جاءت كلمة robot؟",["التشيكية","اليونانية","اللاتينية","اليابانية"],0,"من كلمة robota التي تعني العمل الشاق، وظهرت في مسرحية تشيكية عام 1920."],["ما وحدة قياس القدرة؟",["الواط","النيوتن","الباسكال","الجول"],0,"سُمّيت تكريمًا للمهندس جيمس وات."],["ما المادة الأشهر في صناعة الشرائح الإلكترونية؟",["السيليكون","النحاس","الحديد","الألمنيوم"],0,"ومن هنا جاء اسم «وادي السيليكون»."],["ينصّ قانون مورفي الساخر على أن…",["كل ما قد يسوء سيسوء","الحل الأبسط دائمًا الأصح","الوقت يكفي دومًا","الأخطاء تُصلح نفسها"],0,"قانون ساخر يتذكره كل مهندس أمام مشروعه الأخير 😅"]],
cs:[["الرقم الثنائي 101 يساوي بالعشري…",["5","3","7","10"],0,"4 + 0 + 1 = 5."],["رمز الخطأ 404 يعني…",["الصفحة غير موجودة","الخادم متوقف","ممنوع الدخول","انتهى الوقت"],0,"أشهر رسالة تواجه كل من يتصفح الإنترنت."],["من تُعدّ أول مبرمجة في التاريخ؟",["آدا لوفلايس","غريس هوبر","مارغريت هاملتون","ليزا سو"],0,"كتبت خوارزمية للآلة التحليلية في القرن التاسع عشر."],["HTML هي لغة…",["ترميز","برمجة","قواعد بيانات","تجميع"],0,"تصف هيكل الصفحة، ولا تحوي منطقًا برمجيًا بذاتها."]],
law:[["«المتهم بريء حتى تثبت إدانته» مبدأ يسمى…",["قرينة البراءة","مبدأ الشرعية","حسن النية","عبء الإثبات"],0,"من أهم ضمانات المحاكمة العادلة."],["«لا جريمة ولا عقوبة إلا بنص» هو مبدأ…",["الشرعية","التقادم","الإباحة","الاختصاص"],0,"يحمي الأفراد من التجريم بأثر رجعي."],["مسلة حمورابي القانونية تعود إلى حضارة…",["بابل","الفراعنة","الإغريق","الرومان"],0,"من أقدم النصوص القانونية المكتوبة المعروفة."],["عبارة Habeas Corpus تعني تقريبًا…",["أحضِر الشخص","احترم العقد","أنكر التهمة","أجّل الحكم"],0,"أمر قضائي يضمن عدم احتجاز أحد دون مسوّغ قانوني."]],
eco:[["«اليد الخفية» ارتبطت باسم…",["آدم سميث","كينز","ماركس","ريكاردو"],0,"وردت في كتابه «ثروة الأمم»."],["من كتب «النظرية العامة» عام 1936؟",["جون ماينارد كينز","ميلتون فريدمان","ألفريد مارشال","فريدريك هايك"],0,"غيّر نظرة الدول إلى دور الإنفاق الحكومي."],["التضخم هو ارتفاع عام في…",["الأسعار","الأجور فقط","الصادرات","الفائدة فقط"],0,"وتتناقص معه القدرة الشرائية للنقود."],["«لا غداء مجاني» تعني أن…",["لكل خيار تكلفة فرصة بديلة","الأسعار ثابتة","المطاعم غالية","الأجور تكفي"],0,"اختيارك للمراجعة الليلة له ثمن: ساعات نومك!"]],
lit:[["من كتب «الأيام»؟",["طه حسين","نجيب محفوظ","توفيق الحكيم","العقاد"],0,"سيرة ذاتية أدبية لأحد أعلام الأدب العربي."],["راوية «ألف ليلة وليلة» هي…",["شهرزاد","زرقاء اليمامة","الخنساء","رابعة"],0,"تؤجّل مصيرها بالحكايات كل ليلة."],["كم حرفًا في الأبجدية العربية؟",["28","26","30","32"],0,"وتُعدّ الهمزة والألف حالتين في بعض الاستعمالات."],["الجناس هو تشابه لفظين مع…",["اختلاف المعنى","اتفاق المعنى","نفس الوزن فقط","نفس الحرف الأخير فقط"],0,"محسّن بديعي يمنح الكلام إيقاعًا موسيقيًا، مثل «الساعة» بمعنى الوقت و«الساعة» بمعنى القيامة."]],
sci:[["سرعة الضوء في الفراغ تقريبًا؟",["300 ألف كم/ث","30 ألف كم/ث","3 ملايين كم/ث","300 كم/ث"],0,"ضوء الشمس يصلنا بعد نحو 8 دقائق."],["العدد الأولي الزوجي الوحيد هو…",["2","4","0","6"],0,"كل الأعداد الزوجية الأخرى تقبل القسمة على 2."],["كلمة Algorithm مشتقة من اسم…",["الخوارزمي","ابن الهيثم","الكندي","البيروني"],0,"عالم رياضيات من العصر العباسي."],["مجموع زوايا المثلث في المستوي…",["180°","90°","360°","270°"],0,"وفي الهندسة الكروية يختلف الأمر!"]],
bio:[["الرمز الكيميائي للذهب؟",["Au","Ag","Go","Gd"],0,"من الكلمة اللاتينية aurum."],["عدد الكروموسومات في خلية الإنسان الجسدية؟",["46","23","44","48"],0,"23 زوجًا."],["أي عضية تُسمّى مصنع الطاقة؟",["الميتوكوندريا","النواة","الريبوسوم","جهاز غولجي"],0,"تنتج معظم ATP الخلية."],["أكثر العناصر وفرة في الكون؟",["الهيدروجين","الأكسجين","الكربون","الحديد"],0,"يشكل الجزء الأكبر من النجوم."]],
psy:[["من اشتهر بتجارب الاستجابة الشرطية على الكلاب؟",["بافلوف","فرويد","سكنر","ماسلو"],0,"ظلت الأجراس مرتبطة بالطعام في الذاكرة 😄"],["صاحب «هرم الاحتياجات»؟",["ماسلو","بياجيه","إريكسون","روجرز"],0,"في قاعدته الاحتياجات الأساسية كالنوم والغذاء."],["من وصف «منحنى النسيان»؟",["إبنغهاوس","بياجيه","فيغوتسكي","واطسون"],0,"المراجعة المتباعدة تبطئ النسيان، وهي الأساس في بطاقات تطبيقك."],["صاحب نظرية المراحل المعرفية عند الطفل؟",["بياجيه","بافلوف","بندورا","فرويد"],0,"من رواد علم نفس النمو."]],
hist:[["من كتب «المقدمة» وأسّس علم العمران؟",["ابن خلدون","ابن رشد","ابن سينا","الفارابي"],0,"يُعدّ من مؤسسي علم الاجتماع."],["أقدم جامعة ما زالت تعمل بحسب موسوعة غينيس؟",["القرويين","الأزهر","بولونيا","أكسفورد"],0,"أسّستها فاطمة الفهرية في فاس عام 859م."],["سنة استقلال الجزائر؟",["1962","1954","1958","1965"],0,"5 جويلية."],["من بنى مدينة بغداد؟",["المنصور","هارون الرشيد","المأمون","المعتصم"],0,"أُسّست عام 762م."]],
gen:[["كم ساعة نوم يحتاجها البالغ عادة؟",["7-9","3-4","5","12"],0,"النوم الجيد يثبّت ما راجعته أكثر من ليلة سهر."],["في تقنية بومودورو، بعد 25 دقيقة عمل تأخذ استراحة…",["5 دقائق","60 دقيقة","30 ثانية","3 ساعات"],0,"وبعد أربع جولات تأخذ استراحة أطول."],["ما أنفع ما تفعله قبل الامتحان بليلة؟",["النوم الجيد","السهر للفجر","إنهاء كل الكتب","تجنّب الأكل"],0,"النوم يثبّت الذاكرة ويحسّن التركيز."],["كم كوبًا من الماء يُنصح به تقريبًا يوميًا؟",["6-8","1","15","لا حاجة"],0,"الجفاف الخفيف يُنقص التركيز."]]};
const BRK_MOOD=[["😄","رائع!","استمتع بهذا الشعور، وشارك زميلًا شيئًا طيبًا اليوم."],["🙂","جيد","حافظ على نومك وراحتك القصيرة بين المراجعات."],["😐","عادي","جرّب استراحة 5 دقائق: قم وتحرك، اشرب ماء، وابتعد عن الشاشة."],["😟","متعب قليلًا","هذا شائع بين الطلبة. قسّم المهام الكبيرة، واطلب مساعدة زميل أو أستاذ، ولا تقارن نفسك بغيرك."],["😣","مرهق جدًا","ما تشعر به مفهوم وحقيقي. تحدّث اليوم مع شخص تثق به، أو مع مركز الإرشاد في جامعتك أو طبيب. وإن راودتك أفكار بإيذاء نفسك فتواصل فورًا مع أقرب شخص إليك أو خدمات الطوارئ في بلدك."]];
const brkShuf=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
function brkGuess(){const f=(SC&&SC.me&&SC.me.field)||"";const m=BRK_FIELDS.find(x=>x[2]&&x[2].test(f));return m?m[0]:"gen"}

// «نبراس»: رفيق استراحة بأسلوب أنمي خيالي — حركة SVG/CSS أصلية وخفيفة.
function mascot(mood,size){
 const i=Math.min(Math.max(mood<0?1:mood,0),4);
 const eyes=[
  '<path d="M39 70 Q48 58 57 70 M71 70 Q80 58 89 70" class="n-eye-line"/>',
  '<ellipse cx="48" cy="68" rx="8" ry="11" class="n-iris"/><ellipse cx="80" cy="68" rx="8" ry="11" class="n-iris"/><ellipse cx="48" cy="69" rx="3" ry="8" class="n-pupil"/><ellipse cx="80" cy="69" rx="3" ry="8" class="n-pupil"/><circle cx="51" cy="63" r="3.2" class="n-glint"/><circle cx="83" cy="63" r="3.2" class="n-glint"/><circle cx="45" cy="73" r="1.5" class="n-glint"/>',
  '<ellipse cx="48" cy="68" rx="8" ry="11" class="n-iris"/><ellipse cx="80" cy="68" rx="8" ry="11" class="n-iris"/><ellipse cx="48" cy="69" rx="3" ry="8" class="n-pupil"/><ellipse cx="80" cy="69" rx="3" ry="8" class="n-pupil"/><path d="M40 60 Q48 55 56 60 M72 60 Q80 55 88 60" class="n-eye-line"/>',
  '<path d="M40 70 Q48 61 56 70 M72 70 Q80 61 88 70" class="n-eye-line"/>',
  '<path d="M39 71 Q48 78 57 71 M71 71 Q80 78 89 71" class="n-eye-line"/>'
 ];
 const mouth=[
  '<path d="M56 88 Q64 101 72 88 Q64 94 56 88Z" class="n-mouth"/>',
  '<path d="M56 88 Q64 97 72 88" class="n-mouth-line"/>',
  '<path d="M58 91 Q64 87 70 91" class="n-mouth-line"/>',
  '<path d="M57 94 Q64 86 71 94" class="n-mouth-line"/>',
  '<path d="M57 94 Q64 90 71 94" class="n-mouth-line"/>'
 ];
 const svg=`<svg class="nibras-svg" viewBox="0 0 160 150" width="${size||100}" height="${Math.round((size||100)*150/160)}" role="img" aria-label="نبراس، القط الأنمي">
 <defs>
  <linearGradient id="nFur" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".48" stop-color="#cbd5e1"/><stop offset="1" stop-color="#8795a8"/></linearGradient>
  <linearGradient id="nScarf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#315b91"/><stop offset="1" stop-color="#102b50"/></linearGradient>
  <radialGradient id="nEye"><stop stop-color="#d9e8ff"/><stop offset=".52" stop-color="#648bd0"/><stop offset="1" stop-color="#263e75"/></radialGradient>
  <filter id="nGlow"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 </defs>
 <g class="n-sparkles" fill="#f3cf79"><path d="M17 34 l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/><path d="M139 24 l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/><circle cx="137" cy="112" r="2.5"/><circle cx="21" cy="112" r="2"/></g>
 <g class="n-cat">
  <path class="n-tail" d="M104 112 Q143 121 133 91 Q129 78 119 88" fill="none" stroke="#9aa8b8" stroke-width="13" stroke-linecap="round"/>
  <path d="M28 57 L22 12 Q21 5 29 11 L62 39Z" fill="url(#nFur)" stroke="#65758a" stroke-width="2"/>
  <path d="M132 57 L138 12 Q139 5 131 11 L98 39Z" fill="url(#nFur)" stroke="#65758a" stroke-width="2"/>
  <path d="M31 43 L28 22 L49 39Z M129 43 L132 22 L111 39Z" fill="#e9a0b2" opacity=".9"/>
  <path d="M28 122 Q20 139 38 142 L122 142 Q140 139 132 122 Q111 105 80 111 Q49 105 28 122Z" fill="url(#nScarf)"/>
  <path class="n-scarf-tail" d="M106 123 Q128 125 132 145 Q111 141 102 132Z" fill="#244a7b"/>
  <path d="M65 116 Q80 126 95 116" fill="none" stroke="#c9ddff" stroke-width="3" stroke-linecap="round"/>
  <circle cx="80" cy="126" r="5" fill="#f3cf79" stroke="#a96b2b" stroke-width="1.5"/>
  <ellipse cx="80" cy="74" rx="49" ry="43" fill="url(#nFur)" stroke="#65758a" stroke-width="2"/>
  <path d="M54 39 Q80 25 106 39" fill="none" stroke="#ffe0a8" stroke-width="7" stroke-linecap="round" opacity=".8"/>
  <g class="n-cap"><path d="M48 27 L80 12 L112 27 L80 41Z" fill="#18365f" stroke="#0d2342" stroke-width="2"/><path d="M61 31 L61 39 Q80 49 99 39 L99 31 L80 40Z" fill="#294f80" stroke="#0d2342" stroke-width="1.5"/><path d="M110 27 L115 44" stroke="#e7bd65" stroke-width="2.5" stroke-linecap="round"/><circle cx="115" cy="46" r="3" fill="#e7bd65"/><circle cx="80" cy="25" r="2.5" fill="#e7bd65"/></g>
  <path d="M67 36 l5 -8 5 8 5 -8 5 8" fill="none" stroke="#d97b36" stroke-width="3" stroke-linecap="round"/>
  <path d="M50 89 Q80 75 110 89 Q106 116 80 116 Q54 116 50 89Z" fill="#fff0d9"/>
  <ellipse cx="48" cy="88" rx="8" ry="5" fill="#ff8f9b" opacity=".55"/><ellipse cx="112" cy="88" rx="8" ry="5" fill="#ff8f9b" opacity=".55"/>
  <path d="M29 84 L12 79 M29 91 L10 92 M131 84 L148 79 M131 91 L150 92" stroke="#9d704e" stroke-width="2" stroke-linecap="round"/>
  ${eyes[i]}
  <path d="M74 83 Q80 77 86 83 Q80 91 74 83Z" fill="#e9788c" stroke="#9d4f56" stroke-width="1"/>
  ${mouth[i]}
  <g class="n-blush-stars" fill="#fff4cf"><path d="M36 58 l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><path d="M124 58 l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g>
  <g class="n-paw"><path d="M24 112 Q10 108 13 121 Q17 130 31 124Z" fill="#f4b66e" stroke="#65758a" stroke-width="2"/><path d="M136 112 Q150 108 147 121 Q143 130 129 124Z" fill="#f4b66e" stroke="#65758a" stroke-width="2"/></g>
 </g>
 <g class="n-orbit" fill="none" stroke="#8fe4d8" stroke-width="2"><path d="M11 70 Q0 26 48 12" stroke-dasharray="3 6"/><path d="M149 75 Q158 119 116 139" stroke-dasharray="3 6"/></g>
 </svg>`;
 const d=h("div",{class:"nibras",style:"display:flex;justify-content:center;align-items:center;overflow:visible"});
 d.innerHTML=svg;
 return d;
}
const brkBubble=t=>h("div",{style:"background:rgba(127,127,127,.15);border-radius:14px;padding:8px 12px;text-align:center;margin:6px 0",dir:"auto"},t);
function openBreak(sm){
 let key=LS.get("7s_brk",null)||brkGuess();const body=h("div",{}),m=modal(h("h3",{},"🙂 استراحة"),body,cancelB({remove:()=>m.remove()}));
 const home=()=>{const sel=h("select",{class:"cin",onchange:e=>{key=e.target.value;LS.set("7s_brk",key)}},BRK_FIELDS.map(([k,n])=>h("option",{value:k,selected:k===key?"selected":null},n)));
  body.replaceChildren(mascot(-1,96),brkBubble("أهلًا! أنا نبراس 👋 خذ استراحة قصيرة معي."),h("div",{class:"meta"},"خذ دقيقتين من الضغط. أسئلة خفيفة عن تخصصك للمتعة فقط، بلا نقاط ولا تقييم."),sel,
   h("button",{class:"pri",onclick:()=>quiz()},"🎲 ابدأ أسئلة ترفيهية"),h("button",{class:"btn",onclick:mood},"💬 كيف حالك اليوم؟"),h("button",{class:"btn",onclick:breathe},"🌬 تنفّس معي"))};
 const quiz=()=>{const qs=brkShuf(BRK_Q[key]||BRK_Q.gen).slice(0,4);let i=0,ok=0;
  const step=()=>{if(i>=qs.length){body.replaceChildren(h("h3",{},"🎉 أحسنت! "+ok+"/"+qs.length),h("div",{class:"meta"},"المهم أنك ابتسمت واستمتعت. عُد للدراسة حين تكون جاهزًا."),h("button",{class:"pri",onclick:quiz},"جولة أخرى"),h("button",{class:"btn",onclick:home},"رجوع"));return}
   const [q,o,a,f]=qs[i],opts=brkShuf(o.map((t,j)=>[t,j===a]));let done=false;
   body.replaceChildren(h("div",{class:"meta"},"سؤال "+(i+1)+" من "+qs.length),h("b",{dir:"auto"},q),
    ...opts.map(([t,c])=>{const b=h("button",{class:"btn",style:"display:block;width:100%;margin-top:6px",onclick:()=>{if(done)return;done=true;if(c)ok++;
     setT(b,(c?"✅ ":"❌ ")+t);[...body.querySelectorAll("button.btn")].forEach((x,j)=>{if(opts[j]&&opts[j][1]&&x!==b)setT(x,"✅ "+opts[j][0])});
     body.append(h("div",{class:"meta",style:"margin-top:8px"},"💡 "+f),h("button",{class:"pri",onclick:()=>{i++;step()}},i+1<qs.length?"التالي":"النتيجة"))}},t);return b}))};
  step()};
 const mood=()=>{body.replaceChildren(mascot(-1,96),brkBubble("كيف حالك اليوم؟ 😊"),h("div",{class:"emj",style:"justify-content:center;margin:12px 0"},BRK_MOOD.map(([e,n,t])=>h("button",{title:n,onclick:()=>{
   try{const l=LS.get("7s_mood",[]);l.push({d:Date.now(),v:BRK_MOOD.findIndex(x=>x[0]===e)});LS.set("7s_mood",l.slice(-60))}catch(_){}
   body.replaceChildren(mascot(Math.min(BRK_MOOD.findIndex(x=>x[0]===e),2)<0?1:(BRK_MOOD.findIndex(x=>x[0]===e)<=2?BRK_MOOD.findIndex(x=>x[0]===e):1),96),h("h3",{style:"text-align:center"},e+" "+n),h("div",{dir:"auto"},t),h("div",{class:"meta",style:"margin-top:8px"},"اختيارك محفوظ على جهازك فقط."),h("button",{class:"btn",onclick:breathe},"🌬 تنفّس معي"),h("button",{class:"btn",onclick:home},"رجوع"))}},e))),h("button",{class:"btn",onclick:home},"رجوع"))};
 const breathe=()=>{const t=h("h2",{style:"text-align:center;margin:20px 0"},"استعد…"),c=h("div",{class:"meta",style:"text-align:center"},"3 دورات: شهيق 4 ثوانٍ، احبس 4، زفير 6");let alive=true,n=0;
  body.replaceChildren(t,c,h("button",{class:"btn",onclick:()=>{alive=false;home()}},"إنهاء"));
  const ph=[["🌬 شهيق…",4],["✋ احبس…",4],["😮‍💨 زفير…",6]],run=async()=>{for(let r=0;r<3&&alive;r++)for(const [s,d] of ph){if(!alive)return;t.textContent=s;await new Promise(z=>setTimeout(z,d*1000))}
   if(alive){setT(t,"✨ أحسنت");c.textContent="أخذت دقيقة لنفسك."}};setTimeout(run,800)};
 sm?mood():home()}
{const hb=document.getElementById("help");if(hb&&hb.parentNode){const b=h("button",{class:"lang hbtn",title:"استراحة","aria-label":"استراحة",onclick:()=>openBreak()},ic("smile"));hb.parentNode.insertBefore(b,hb)}}

// سؤال لطيف مرة كل يوم (يُغلق بالضغط على ✕ ولا يتكرر في اليوم نفسه)
setTimeout(()=>{try{const day=new Date().toDateString();if(LS.get("7s_askd","")===day||document.querySelector(".nbask"))return;
 const b=h("div",{class:"nbask",style:"position:fixed;bottom:84px;inset-inline-start:12px;z-index:50;display:flex;align-items:center;gap:6px;background:#fff;color:#123;border-radius:18px;padding:6px 10px;box-shadow:0 4px 16px rgba(0,0,0,.25);max-width:260px"},
  h("div",{style:"cursor:pointer;display:flex;align-items:center;gap:6px",onclick:()=>{LS.set("7s_askd",day);b.remove();openBreak(true)}},mascot(-1,56),h("b",{style:"font-size:14px"},"كيف حالك اليوم؟")),
  h("button",{style:"border:0;background:none;font-size:16px;cursor:pointer;color:#666",title:"إغلاق",onclick:()=>{LS.set("7s_askd",day);b.remove()}},"✕"));document.body.append(b)}catch(_){}},5000);
