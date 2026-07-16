import{authService}from'./auth_service.js';

export function normalizeFriendCode(value=''){const clean=String(value).toUpperCase().replace(/[^A-Z2-9]/g,'').replace(/[OIL01]/g,'');return clean.startsWith('HS')?`HS-${clean.slice(2,8)}`:`HS-${clean.slice(0,6)}`;}
export class FriendsService extends EventTarget{
  constructor(auth=authService){super();this.auth=auth;this.profile=null;this.friends=[];this.requests={received:[],sent:[]};this.lookup=null;this.loading=false;this.error='';this.boundAuth=()=>this.onAccountChanged();}
  async init(){this.auth.addEventListener('change',this.boundAuth);await this.onAccountChanged();return this;}
  requireOnline(){if(!this.auth.session?.user)throw new Error('Inicia sesión para usar Amigos.');if(!navigator.onLine)throw new Error('Necesitas conexión para agregar o administrar amigos.');if(!this.auth.client)throw new Error('El servicio de cuenta no está disponible.');}
  async rpc(name,args={}){this.requireOnline();const{data,error}=await this.auth.client.rpc(name,args);if(error)throw error;return data;}
  async onAccountChanged(){this.profile=null;this.friends=[];this.requests={received:[],sent:[]};this.lookup=null;this.error='';if(this.auth.session?.user&&navigator.onLine)await this.refresh();else this.emit();}
  async refresh(){this.requireOnline();this.loading=true;this.emit();try{const[profile,friends,requests]=await Promise.all([this.rpc('get_my_public_profile'),this.rpc('list_friends_with_xp'),this.rpc('list_friend_requests')]);this.profile=profile;this.friends=Array.isArray(friends)?friends:[];this.requests=requests||{received:[],sent:[]};this.error='';}catch(error){this.error=error.message||'No se pudo actualizar Amigos.';}finally{this.loading=false;this.emit();}return this;}
  async find(code){this.lookup=await this.rpc('lookup_friend_code',{p_code:normalizeFriendCode(code)});this.emit();return this.lookup;}
  async send(code){const result=await this.rpc('send_friend_request',{p_friend_code:normalizeFriendCode(code)});this.lookup=null;await this.refresh();return result;}
  async respond(requestId,action){await this.rpc('respond_friend_request',{p_request_id:requestId,p_action:action});await this.refresh();}
  async cancel(requestId){await this.rpc('cancel_friend_request',{p_request_id:requestId});await this.refresh();}
  async remove(code){await this.rpc('remove_friend',{p_friend_code:normalizeFriendCode(code)});await this.refresh();}
  emit(){this.dispatchEvent(new CustomEvent('change'));}
  destroy(){this.auth.removeEventListener('change',this.boundAuth);}
}

export const friendsService=new FriendsService();
