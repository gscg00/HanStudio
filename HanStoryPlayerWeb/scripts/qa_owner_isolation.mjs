import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'});
try{
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 // A same-origin document without the application avoids starting its auth service.
 await page.goto('http://127.0.0.1:8080/manifest.webmanifest');
 const result=await page.evaluate(async()=>{
   const {SyncService}=await import('/src/sync_service.js');
   const {put}=await import('/src/storage.js');
   const {readSnapshot,ownerSnapshot}=await import('/src/local_progress_store.js');
   const auth=new EventTarget();auth.session={user:{id:'qa-user-a'}};
   const service=new SyncService(auth);service.emit=()=>{};service.flush=async()=>{};
   await put('metadata',{id:'guided:english:v1',language:'English',completedLessons:['guest-only']},{sync:false});
   service.cloud.loadAll=async()=>[{store:'metadata',id:'guided:english:v1',entityKey:'course:english',value:{id:'guided:english:v1',language:'English',completedLessons:['account-only']}}];
   await Promise.all([service.handleAuth(auth.session,'automatic-reload'),service.handleAuth(auth.session,'automatic-reload')]);
   const guest=(await ownerSnapshot('guest'))[0].value.completedLessons;
   await service.prepareSignOut();
   const restored=(await readSnapshot())[0].value.completedLessons;
   const saved=(await ownerSnapshot('user:qa-user-a'))[0].value.completedLessons;
   // A different empty account must never inherit another account's data.
   service.signingOut=false;service.activeOwner='user:qa-user-a';auth.session={user:{id:'qa-user-b'}};
   await put('metadata',{id:'guided:english:v1',language:'English',completedLessons:['account-only']},{sync:false});
   service.cloud.loadAll=async()=>[];
   await service.handleAuth(auth.session,'automatic-reload');
   return {guest,restored,saved,other:await readSnapshot()};
 });
 assert.deepEqual(result.guest,['guest-only']);assert.deepEqual(result.restored,['guest-only']);
 assert.deepEqual(result.saved,['account-only']);assert.deepEqual(result.other,[]);
 console.log('IndexedDB real: eventos duplicados, salida a invitado y cambio a cuenta vacía conservan propietarios separados.');
 await context.close();
}finally{await browser.close();}
