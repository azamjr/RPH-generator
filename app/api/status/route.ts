import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { activeAccount } from '../../../lib/chatgpt-plan';

export async function GET(request:Request){
 const user=await getChatGPTUser();let storage=0;let connected=false;const local=new URL(request.url).hostname==='127.0.0.1';
 let accountEmail:string|null=null;
 if(local&&env.DB){try{const account=await activeAccount();connected=!!account;accountEmail=account?.email||null;}catch{connected=false;}}
 if(user&&env.DB){const r=await env.DB.prepare('SELECT count(*) AS n FROM records WHERE user_id=?').bind(user.userId).first<{n:number}>();storage=r?.n||0;}
 return Response.json({aiConfigured:local&&connected,aiProvider:'ChatGPT plan',chatgptGeneration:local&&connected,googleEmailLogin:false,dailyLimit:null,used:0,recordLimit:100,storage,resetAt:null,signedIn:!!user,chatgptAccountConnected:local&&connected,chatgptAccountEmail:local?accountEmail:null,localChatGPTAvailable:local});
}
