const SHELL='hanstory-shell-v56';
const ASSETS=[
  './','./index.html','./assets/styles.css','./assets/teaching.css','./assets/navigation.css',
  './assets/japanese_course.css','./assets/japanese_lesson.css','./src/app.js','./src/storage.js','./src/branding.js',
  './src/beginner_courses.js','./src/data/zero_courses.js','./src/japanese_course_app.js',
  './src/japanese_course_logic.js','./manifest.webmanifest','./library/library.json',
  './library/courses/japanese/course.json','./library/courses/japanese/units/hiragana-01.json',
  './library/courses/japanese/units/katakana.json','./library/courses/japanese/units/rhythm.json',
  './library/courses/japanese/units/first-words.json','./library/courses/japanese/units/first-sentences.json',
  './library/courses/japanese/units/basic-verbs.json','./library/courses/japanese/units/adjectives.json',
  './library/courses/japanese/units/functional-a1.json','./library/courses/japanese/units/starter-kanji.json',
  './library/courses/japanese/units/story-bridge.json',
  './library/courses/japanese/audio_manifest.json'
];
self.addEventListener('install',event=>event.waitUntil(
  caches.open(SHELL).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hanstory-shell-')&&key!==SHELL).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  const requestUrl=new URL(event.request.url);
  const japaneseCourseAudio=requestUrl.pathname.includes('/library/courses/japanese/audio/');
  const fresh=requestUrl.pathname.endsWith('/library/library.json')||['document','script','style'].includes(event.request.destination)||requestUrl.pathname.endsWith('/manifest.webmanifest');
  if(fresh||japaneseCourseAudio){
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(SHELL).then(cache=>cache.put(event.request,copy));
      return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});
self.addEventListener('message',event=>{
  if(event.data?.type==='CHECK_UPDATES')fetch(new URL('./library/library.json',self.registration.scope),{cache:'no-store'}).then(response=>caches.open(SHELL).then(cache=>cache.put('./library/library.json',response)));
});
