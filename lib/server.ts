import { getChatGPTUser } from '../app/chatgpt-auth';
export class ApiError extends Error { status:number; constructor(message:string,status=400){super(message);this.status=status;} }
export async function identity(request?:Request){
 if(request&&request.method!=='GET'){const origin=request.headers.get('origin');const site=new URL(request.url).origin;if(origin&&origin!==site)throw new ApiError('Cross-origin request rejected.',403);if(!request.headers.get('content-type')?.startsWith('application/json'))throw new ApiError('JSON required.',415);}
 const user=await getChatGPTUser();if(!user)throw new ApiError('Sign in to save or generate lessons.',401);return user;
}
export async function readJson(request:Request){const body=await request.text();if(body.length>180000)throw new ApiError('Request too large.',413);try{return JSON.parse(body);}catch{throw new ApiError('Invalid JSON.');}}
export function failure(error:unknown){if(error instanceof ApiError)return Response.json({error:error.message},{status:error.status});if(error&&typeof error==='object'&&'issues' in error)return Response.json({error:'Please check the submitted fields.'},{status:400});console.error('RPH request failed',error instanceof Error?error.message:'Unknown error');return Response.json({error:'The service is unavailable. Your editor remains available; please retry later.'},{status:503});}
