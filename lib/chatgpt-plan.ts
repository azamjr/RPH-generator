import { env } from 'cloudflare:workers';
import { ApiError } from './server';

const ISSUER = 'https://auth.openai.com';
const TOKEN_ENDPOINT = `${ISSUER}/api/accounts/oauth/token`;
const RESOURCE = 'https://api.openai.com/v1';
const PLAN_SCOPE = 'chatgpt.tokens.use.direct';
const CALLBACK_PATH = '/api/chatgpt/callback';
type Account = {subject:string;client_id:string;email:string;name:string;id_token:string;access_token:string;refresh_token:string;expires_at:number;scopes:string;active:number};

export function assertLocalHost(request:Request) {
  const url = new URL(request.url);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') {
    throw new ApiError('ChatGPT plan access works here only when you run your own local copy at http://127.0.0.1. Hosted deployments are not enabled for this open-source flow.', 403);
  }
  return url;
}

export function randomToken(bytes=32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return base64url(data);
}
function base64url(data:Uint8Array) {
  let binary=''; for (const byte of data) binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export async function sha256(value:string) { return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))); }
export function db() { if(!env.DB) throw new ApiError('Local database is not ready. Apply the included SQL migrations first.',503); return env.DB; }
export function callbackUri(url:URL) { return `http://127.0.0.1:${url.port||'80'}${CALLBACK_PATH}`; }

export async function verifyIdToken(token:string, clientId:string, nonce:string) {
  const parts=token.split('.'); if(parts.length!==3) throw new ApiError('ChatGPT sign-in returned an invalid ID token.',401);
  let header:any,payload:any;
  try { header=JSON.parse(atob(parts[0].replace(/-/g,'+').replace(/_/g,'/'))); payload=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { throw new ApiError('ChatGPT sign-in returned an invalid ID token.',401); }
  if(header.alg!=='RS256'||typeof header.kid!=='string') throw new ApiError('ChatGPT sign-in used an unsupported token signature.',401);
  const discovery=await fetch(`${ISSUER}/.well-known/openid-configuration`);
  if(!discovery.ok) throw new ApiError('Could not validate ChatGPT sign-in. Try again.',503);
  const metadata:any=await discovery.json();
  if(metadata.issuer!==ISSUER||typeof metadata.jwks_uri!=='string') throw new ApiError('ChatGPT identity configuration could not be validated.',503);
  const keyResponse=await fetch(metadata.jwks_uri); if(!keyResponse.ok) throw new ApiError('Could not validate ChatGPT sign-in. Try again.',503);
  const keys:any=await keyResponse.json(); const jwk=keys.keys?.find((key:any)=>key.kid===header.kid&&key.kty==='RSA');
  if(!jwk) throw new ApiError('ChatGPT sign-in key could not be found.',401);
  const publicKey=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',publicKey,Uint8Array.from(atob(parts[2].replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)),new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  const now=Math.floor(Date.now()/1000); const audiences=Array.isArray(payload.aud)?payload.aud:[payload.aud];
  if(!valid||payload.iss!==ISSUER||!audiences.includes(clientId)||!payload.sub||typeof payload.exp!=='number'||payload.exp<=now||payload.nonce!==nonce) throw new ApiError('Could not verify the ChatGPT account. Please restart sign-in.',401);
  return payload as {sub:string;email?:string;name?:string};
}

async function tokenRequest(body:Record<string,string>) {
  let response:Response;
  try { response=await fetch(TOKEN_ENDPOINT,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body),signal:AbortSignal.timeout(20000)}); }
  catch { throw new ApiError('Could not reach ChatGPT sign-in. Your saved connection was not changed.',503); }
  const payload:any=await response.json().catch(()=>({}));
  if(!response.ok) throw new ApiError('ChatGPT sign-in could not complete. Start a fresh sign-in and try again.',401);
  return payload;
}

export async function exchangeCode(code:string,clientId:string,verifier:string,redirectUri:string) {
  return tokenRequest({grant_type:'authorization_code',client_id:clientId,code,code_verifier:verifier,redirect_uri:redirectUri,resource:RESOURCE});
}

export async function activeAccount():Promise<Account|null> {
  return db().prepare('SELECT * FROM chatgpt_accounts WHERE active=1 LIMIT 1').first<Account>();
}
export async function validAccessToken(account:Account) {
  if(account.expires_at>Date.now()+120000) return account.access_token;
  const token=await tokenRequest({grant_type:'refresh_token',client_id:account.client_id,refresh_token:account.refresh_token,resource:RESOURCE});
  const scopes=String(token.scope||account.scopes).split(/\s+/).filter(Boolean);
  if(!scopes.includes(PLAN_SCOPE)||!token.access_token||!token.refresh_token) throw new ApiError('ChatGPT plan permission needs to be renewed. Disconnect and connect your account again.',401);
  await db().prepare('UPDATE chatgpt_accounts SET access_token=?,refresh_token=?,expires_at=?,scopes=?,updated_at=? WHERE subject=? AND client_id=?').bind(token.access_token,token.refresh_token,Date.now()+Number(token.expires_in||3600)*1000,scopes.join(' '),new Date().toISOString(),account.subject,account.client_id).run();
  return token.access_token as string;
}

export async function requestChatGPT(prompt:string) {
  const account=await activeAccount();
  if(!account) throw new ApiError('Connect your own ChatGPT account in Preferences before generating with AI.',401);
  const scopes=account.scopes.split(/\s+/);
  if(!scopes.includes(PLAN_SCOPE)||!scopes.includes('resource.invoke')) throw new ApiError('This ChatGPT connection has not granted plan usage. Reconnect and approve the requested permissions.',401);
  const token=await validAccessToken(account);
  let modelResponse:Response;
  try { modelResponse=await fetch(`${RESOURCE}/models`,{headers:{authorization:`Bearer ${token}`},signal:AbortSignal.timeout(20000)}); }
  catch { throw new ApiError('Could not reach the ChatGPT model list. Your current work is unchanged.',503); }
  if(!modelResponse.ok) throw new ApiError('ChatGPT could not provide the available model list. Reconnect your account and try again.',modelResponse.status===429?429:503);
  const catalog:any=await modelResponse.json();
  const model=catalog.models?.find((item:any)=>item.visibility==='list'&&typeof item.slug==='string')?.slug;
  if(!model) throw new ApiError('No models are currently available to this ChatGPT account.',503);
  let response:Response;
  try { response=await fetch(`${RESOURCE}/responses`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({model,input:[{role:'user',content:prompt}],text:{format:{type:'json_object'}},store:false,stream:true,max_output_tokens:12000}),signal:AbortSignal.timeout(90000)}); }
  catch { throw new ApiError('The ChatGPT request timed out or could not connect. Your current work is unchanged.',503); }
  if(response.status===429) throw new ApiError('ChatGPT reported a usage limit for this account. Check ChatGPT Settings → Usage, then retry when available.',429);
  if(!response.ok||!response.body) throw new ApiError('ChatGPT could not generate this plan. No other provider was used.',503);
  const reader=response.body.getReader(); const decoder=new TextDecoder(); let buffer=''; let output=''; let completed=false; let streamError:string|undefined;
  try { for(;;){ const {value,done}=await reader.read(); if(done)break; buffer+=decoder.decode(value,{stream:true}); const lines=buffer.split('\n'); buffer=lines.pop()||''; for(const line of lines){ if(!line.startsWith('data:'))continue; const raw=line.slice(5).trim(); if(raw==='[DONE]')continue; let event:any;try{event=JSON.parse(raw)}catch{continue;} if(event.type==='response.output_text.delta')output+=event.delta||''; if(event.type==='response.failed')streamError=event.response?.error?.message||event.response?.error?.code||'generation failed'; if(event.type==='response.completed')completed=true; } } }
  finally { reader.releaseLock(); }
  if(streamError) throw new ApiError(streamError.includes('subscription_sharing_usage')?'ChatGPT plan usage is unavailable or has reached its limit. Review your plan usage settings and try again.':'ChatGPT could not complete this plan. Your editor remains available.',429);
  if(!completed) throw new ApiError('The ChatGPT response ended before completion. Your existing work is unchanged; please retry.',502);
  return output;
}
