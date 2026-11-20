import { assertLocalHost, activeAccount, db } from '../../../../lib/chatgpt-plan';
import { identity, failure, ApiError } from '../../../../lib/server';

export async function GET(request:Request) {
  try { assertLocalHost(request); const account=await activeAccount(); return Response.json({connected:!!account,email:account?.email||null,name:account?.name||null}); }
  catch(error) { return failure(error); }
}

export async function DELETE(request:Request) {
  try {
    assertLocalHost(request); await identity(request); const account=await activeAccount();
    if(!account)return Response.json({connected:false});
    let response:Response;
    try {
      const config=await fetch('https://auth.openai.com/.well-known/openid-configuration');
      if(!config.ok)throw new Error('OpenID configuration unavailable');
      const metadata:any=await config.json();if(typeof metadata.revocation_endpoint!=='string')throw new Error('Revocation endpoint unavailable');
      response=await fetch(metadata.revocation_endpoint,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:account.refresh_token,token_type_hint:'refresh_token',client_id:account.client_id}),signal:AbortSignal.timeout(20000)});
    } catch { throw new ApiError('Could not confirm disconnection with OpenAI. Your local connection remains saved; retry when online.',503); }
    if(!response.ok)throw new ApiError('OpenAI could not confirm disconnection. Your local connection remains saved.',503);
    await db().prepare('DELETE FROM chatgpt_accounts').run();
    return Response.json({connected:false});
  } catch(error) { return failure(error); }
}
