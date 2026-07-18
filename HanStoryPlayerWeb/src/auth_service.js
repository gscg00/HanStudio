import{PUBLIC_CONFIG,isSupabaseConfigured}from'./public_config.js';

const AUTH_RETURN_KEY='hanstory-auth-return-hash';
const SUPABASE_CLIENT_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
export function getAuthRedirectUrl(){const url=new URL(location.pathname,location.origin);url.searchParams.set('auth','callback');return url.href;}
function loadSupabaseClient(){if(globalThis.supabase?.createClient)return Promise.resolve();return new Promise((resolve,reject)=>{const script=document.createElement('script'),timeout=setTimeout(()=>{script.remove();reject(new Error('El servicio de cuenta tardó demasiado en responder.'));},7000);script.src=SUPABASE_CLIENT_URL;script.async=true;script.onload=()=>{clearTimeout(timeout);globalThis.supabase?.createClient?resolve():reject(new Error('El cliente de cuenta no está disponible.'));};script.onerror=()=>{clearTimeout(timeout);reject(new Error('No se pudo cargar el servicio de cuenta.'));};document.head.append(script);});}

export class AuthService extends EventTarget{
  constructor(){super();this.client=null;this.session=null;this.loading=true;this.error='';this.subscription=null;}
  get configured(){return isSupabaseConfigured();}
  async init(){if(!this.configured){this.loading=false;this.error='La cuenta online todavía no está configurada.';this.emit('ready');return null;}try{await loadSupabaseClient();}catch(error){this.loading=false;this.error=error.message;this.emit('ready');return null;}this.client=globalThis.supabase.createClient(PUBLIC_CONFIG.SUPABASE_URL,PUBLIC_CONFIG.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});const listener=this.client.auth.onAuthStateChange((event,session)=>{this.session=session;this.loading=false;this.emit(event||'session');if(event==='SIGNED_IN')this.finishCallback();});this.subscription=listener.data.subscription;try{const result=await this.client.auth.getSession();if(result.error)throw result.error;this.session=result.data.session;}catch(error){this.error=error.message||'No se pudo restaurar la sesión.';}finally{this.loading=false;this.emit('ready');this.finishCallback();}return this.session;}
  async signInWithGoogle(){if(!this.client)throw new Error('El inicio de sesión no está disponible en este momento.');sessionStorage.setItem(AUTH_RETURN_KEY,location.hash||'#/');const{error}=await this.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:getAuthRedirectUrl(),scopes:'openid email profile'}});if(error)throw error;}
  async signOut(){if(!this.client)return;const{error}=await this.client.auth.signOut();if(error)throw error;}
  finishCallback(){const url=new URL(location.href);if(!url.searchParams.has('auth'))return;url.searchParams.delete('auth');const saved=sessionStorage.getItem(AUTH_RETURN_KEY)||'#/';sessionStorage.removeItem(AUTH_RETURN_KEY);history.replaceState(null,'',url.pathname+(url.searchParams.size?`?${url.searchParams}`:'')+saved);}
  emit(reason){this.dispatchEvent(new CustomEvent('change',{detail:{reason,session:this.session,loading:this.loading,error:this.error}}));}
  destroy(){this.subscription?.unsubscribe();}
}

export const authService=new AuthService();
