import { assertLocalHost, db, exchangeCode, verifyIdToken } from '../../../../lib/chatgpt-plan';
import { ApiError } from '../../../../lib/server';

function page(message:string,success:boolean) {
  const safe=message.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>RPH Studio · ChatGPT</title><body style="font:16px system-ui;max-width:560px;margin:12vh auto;padding:24px;color:#17202a"><h1>${success?'ChatGPT connected':'ChatGPT sign-in incomplete'}</h1><p>${safe}</p><p>You can close this tab and return to RPH Studio.</p><a href="/">Return to RPH Studio</a></body></html>`,{status:success?200:400,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer'}});
}

export async function GET(request:Request) {
  try {
    const url=assertLocalHost(request); const state=url.searchParams.get('state')||'';
    if(!state)throw new ApiError('This sign-in link is missing its security state. Start sign-in again.',400);
    const store=db(); const flow=await store.prepare('SELECT state,nonce,verifier,redirect_uri FROM chatgpt_oauth_state WHERE state=?').bind(state).first<{state:string;nonce:string;verifier:string;redirect_uri:string}>();
    if(!flow)throw new ApiError('This sign-in request expired or was already used. Start sign-in again.',400);
    await store.prepare('DELETE FROM chatgpt_oauth_state WHERE state=?').bind(state).run();
    const error=url.searchParams.get('error');
    if(error) return page(error==='access_denied'?'You declined ChatGPT plan access. No account was connected.':'ChatGPT did not complete authorization. Start again when you are ready.',false);
    const code=url.searchParams.get('code')||'';const clientId=url.searchParams.get('client_id')||'';
    if(!code||!clientId||clientId==='dynamic_agent_client')throw new ApiError('ChatGPT did not return a registered client. Start sign-in again.',400);
    const tokens:any=await exchangeCode(code,clientId,flow.verifier,flow.redirect_uri);
    if(typeof tokens.id_token!=='string'||typeof tokens.access_token!=='string'||typeof tokens.refresh_token!=='string')throw new ApiError('ChatGPT did not return a complete sign-in. Start again.',401);
    const scopes=String(tokens.scope||url.searchParams.get('scope')||'').split(/\s+/).filter(Boolean);
    if(!scopes.includes('chatgpt.tokens.use.direct')||!scopes.includes('resource.invoke'))throw new ApiError('The account did not approve ChatGPT plan usage. No AI request was sent.',403);
    const identity=await verifyIdToken(tokens.id_token,clientId,flow.nonce);
    await store.prepare('DELETE FROM chatgpt_accounts').run();
    await store.prepare('INSERT OR REPLACE INTO chatgpt_accounts (subject,client_id,email,name,id_token,access_token,refresh_token,expires_at,scopes,active,updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,?)').bind(identity.sub,clientId,identity.email||'ChatGPT account',identity.name||identity.email||'ChatGPT account',tokens.id_token,tokens.access_token,tokens.refresh_token,Date.now()+Number(tokens.expires_in||3600)*1000,scopes.join(' '),new Date().toISOString()).run();
    return page('Your account is connected on this computer. RPH Studio will send each lesson prompt to OpenAI Responses API using your approved ChatGPT plan. The app does not receive your ChatGPT password.',true);
  } catch(error) {
    const message=error instanceof ApiError?error.message:'ChatGPT sign-in could not be validated. Your existing connection was left unchanged.';
    return page(message,false);
  }
}
