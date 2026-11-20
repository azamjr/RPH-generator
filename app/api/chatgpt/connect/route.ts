import { assertLocalHost, callbackUri, db, randomToken, sha256 } from '../../../../lib/chatgpt-plan';
import { identity, failure } from '../../../../lib/server';

export async function POST(request:Request) {
  try {
    const url=assertLocalHost(request); await identity(request);
    const store=db();
    let host=await store.prepare("SELECT value FROM chatgpt_host WHERE key='host_id'").first<{value:string}>();
    if(!host){const value=`urn:uuid:${crypto.randomUUID()}`;await store.prepare("INSERT OR IGNORE INTO chatgpt_host (key,value) VALUES ('host_id',?)").bind(value).run();host=await store.prepare("SELECT value FROM chatgpt_host WHERE key='host_id'").first<{value:string}>();}
    if(!host)throw new Error('Unable to initialize local ChatGPT host ID.');
    const state=randomToken(),nonce=randomToken(),verifier=randomToken(48),redirectUri=callbackUri(url);
    await store.prepare('DELETE FROM chatgpt_oauth_state WHERE created_at<?').bind(new Date(Date.now()-10*60_000).toISOString()).run();
    await store.prepare('INSERT INTO chatgpt_oauth_state (state,nonce,verifier,redirect_uri,created_at) VALUES (?,?,?,?,?)').bind(state,nonce,verifier,redirectUri,new Date().toISOString()).run();
    const params=new URLSearchParams({client_id:'dynamic_agent_client',agent_name_hint:'RPH Studio',ext_agent_host_id:host.value,response_type:'code',redirect_uri:redirectUri,scope:'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct',resource:'https://api.openai.com/v1',state,nonce,code_challenge_method:'S256',code_challenge:await sha256(verifier)});
    return Response.json({authorizeUrl:`https://auth.openai.com/api/accounts/authorize?${params}`});
  } catch(error) { return failure(error); }
}
