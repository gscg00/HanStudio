import*as example from'./config.example.js';
let local={};
try{local=await import('./config.local.js');}catch{}
export const PUBLIC_CONFIG=Object.freeze({
  SUPABASE_URL:String(local.SUPABASE_URL||example.SUPABASE_URL||'').trim(),
  SUPABASE_PUBLISHABLE_KEY:String(local.SUPABASE_PUBLISHABLE_KEY||example.SUPABASE_PUBLISHABLE_KEY||'').trim(),
  ADMIN_EMAILS:Object.freeze((local.ADMIN_EMAILS||example.ADMIN_EMAILS||[]).map(email=>String(email).trim().toLowerCase()).filter(Boolean)),
});
export const isSupabaseConfigured=()=>/^https:\/\/.+\.supabase\.co$/i.test(PUBLIC_CONFIG.SUPABASE_URL)&&PUBLIC_CONFIG.SUPABASE_PUBLISHABLE_KEY.length>20;
