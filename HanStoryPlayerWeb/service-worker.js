const SHELL='hanstory-shell-v70';
const GUIDED_COURSE_LANGUAGES=['English','Korean','Russian','Italian','French','German','Chinese','Portuguese','Arabic'];
const GUIDED_COURSE_UNITS=['reading','survival','essentials','questions','time','vocabulary','reading-bridge','story-bridge'];
const GUIDED_COURSE_ASSETS=GUIDED_COURSE_LANGUAGES.flatMap(language=>[
  `./library/courses/${language}/course.json`,
  `./library/courses/${language}/audio_manifest.json`,
  ...GUIDED_COURSE_UNITS.map(unit=>`./library/courses/${language}/units/${unit}.json`)
]);
// La ruta histórica /library/courses/Japanese/audio/ también queda cubierta por guidedCourseAudio.
const ASSETS=[
  './','./index.html','./assets/styles.css','./assets/teaching.css','./assets/navigation.css',
  './assets/japanese_course.css','./assets/japanese_lesson.css','./assets/icon-192.svg','./assets/icon-512.svg',
  './src/app.js','./src/storage.js','./src/branding.js','./src/config.example.js','./src/config.local.js','./src/public_config.js',
  './src/auth_service.js','./src/local_progress_store.js','./src/cloud_progress_store.js',
  './src/progress_merge.js','./src/sync_service.js','./src/account_ui.js','./src/xp_service.js','./src/friends_service.js',
  './src/beginner_courses.js','./src/data/zero_courses.js','./src/japanese_course_app.js',
  './src/japanese_course_logic.js','./src/guided_course_config.js','./src/guided_course_logic.js',
  './manifest.webmanifest','./library/library.json',
  './library/courses/Japanese/course.json','./library/courses/Japanese/units/hiragana-01.json',
  './library/courses/Japanese/units/katakana.json','./library/courses/Japanese/units/rhythm.json',
  './library/courses/Japanese/units/first-words.json','./library/courses/Japanese/units/first-sentences.json',
  './library/courses/Japanese/units/basic-verbs.json','./library/courses/Japanese/units/adjectives.json',
  './library/courses/Japanese/units/functional-a1.json','./library/courses/Japanese/units/starter-kanji.json',
  './library/courses/Japanese/units/story-bridge.json',
  './library/courses/Japanese/audio_manifest.json',
  ...GUIDED_COURSE_ASSETS
];
self.addEventListener('install',event=>event.waitUntil(
  caches.open(SHELL).then(cache=>cache.addAll(ASSETS.map(path=>new Request(path,{cache:'reload'})))).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hanstory-shell-')&&key!==SHELL).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  const requestUrl=new URL(event.request.url);
  if(requestUrl.origin!==self.location.origin){event.respondWith(fetch(event.request));return;}
  if(['code','token','access_token','refresh_token','error'].some(key=>requestUrl.searchParams.has(key))||requestUrl.searchParams.has('auth')){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}
  const guidedCourseAudio=/\/library\/courses\/[^/]+\/audio\//.test(requestUrl.pathname);
  const fresh=requestUrl.pathname.endsWith('/library/library.json')||['document','script','style'].includes(event.request.destination)||requestUrl.pathname.endsWith('/manifest.webmanifest');
  if(fresh||guidedCourseAudio){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      const copy=response.clone();
      caches.open(SHELL).then(cache=>cache.put(event.request,copy));
      return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING'){self.skipWaiting();return;}
  if(event.data?.type==='CHECK_UPDATES')fetch(new URL('./library/library.json',self.registration.scope),{cache:'no-store'}).then(response=>caches.open(SHELL).then(cache=>cache.put('./library/library.json',response)));
});
