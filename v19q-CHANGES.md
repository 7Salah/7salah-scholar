# v19q — المرحلة البصرية (لا تغيير في SQL/Supabase)
- icons.js (جديد): 70+ أيقونة SVG بأسلوب Lucide (حدّ 1.75، currentColor). ic()/icp()/ie()/setT(). h() يحوّل الرموز التعبيرية الوظيفية تلقائيًا؛ نصوص المستخدمين (dir=auto) وصور الحيوانات/الحزم الرمزية تبقى كما هي.
- app.js: h()، التبويبات، الرأس، شارات الإنجازات، الإعداد الأولي. social.js: شبكة التنقّل، الفلاتر، بطاقة المنشور، الملف الشخصي.
- chat.js: قائمة المحادثات والغرفة (فقاعات، فواصل أيام، علامتا القراءة، قائمة خيارات، شريط كتابة). calls.js: أزرار المكالمات. break.js/translate.js/stories.js: أيقونات.
- styles.css: طبقة v19q في النهاية. sw.js: النسخة 7s-v19q وإضافة icons.js.


## v19q.2 — مساحة عمل متجاوبة
- إضافة تخطيط مكتبي عند 900px فأكثر: تنقل جانبي ثابت، مساحة محتوى مرنة، وبطاقات أوسع؛ يبقى شريط الهاتف السفلي دون تغيير.
- توسيع مساحة العرض للأجهزة اللوحية بين 600 و899px.
- تحسين تباين الوضع الداكن لحقول البحث والإدخال والبطاقات والتنقل.
- تحديث إصدار التطبيق إلى `19q.2` وإصدار Service Worker إلى `7s-v19q-theme2`.
- تحديث ألوان manifest ووسم theme-color إلى الهوية المعتمدة.
- لا تغييرات على SQL أو الجداول أو سياسات Supabase أو مفاتيح الاتصال.

## V19q.3 — Academic dashboard overview (2026-11-07)
- Added an academic overview to the existing home screen without replacing the original study workflow.
- Added locally-derived study indicators: deck count, saved-card count, and mastered-card count.
- Added a continue-studying panel based on the most recently used deck stored on the device.
- Added a latest-community-posts panel that queries Supabase `posts` at runtime; errors and empty results are shown honestly.
- Added an unread-messages panel that uses the existing authenticated Supabase unread-count RPC when a user is signed in.
- Added responsive dashboard styles for mobile and wider screens.
- Updated the Service Worker cache version so clients can receive the new dashboard assets.
- No SQL, database schema, Supabase credentials, or RLS policies were changed.
- Live community and messaging behavior still requires a configured Supabase project and valid deployed policies; local syntax checks do not prove live service connectivity.


## V19q.4 — Academic PDF library (2026-11-07)
- Added a dedicated Library tab to the existing navigation and dashboard shortcut.
- Added PDF import (maximum 25 MB per file), local IndexedDB storage, file listing/search, native browser PDF viewing, download/open, and deletion.
- Added per-document saved page number and lecture notes. Page progress is intentionally manual because browser-native PDF viewers do not expose reliable page-change events to the app.
- Files and notes remain on the current device; they are not uploaded to Supabase and are not synced across devices.
- No SQL, database schema, Supabase credentials, or RLS policies were changed.
- Updated Service Worker cache version.

## V19q.5 — Academic library classification (2026-11-07)
- Added optional local metadata fields for university, faculty, department, level, semester, course/module, and content type (lecture, TD, summary, reference, other).
- Added search across file names and classification metadata, plus filters by content type and semester.
- Existing PDF records remain readable; older records without metadata appear as unclassified.
- Classification metadata is stored with the PDF record in IndexedDB on this device. No SQL schema, Supabase settings, or remote data were changed.
- Bumped the Service Worker cache version to refresh V19q.5 assets.
