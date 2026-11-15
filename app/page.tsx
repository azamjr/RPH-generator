import Workspace from './workspace';
import { getChatGPTUser } from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Home(){const user=await getChatGPTUser();return <Workspace user={user?{name:user.fullName||user.email.split('@')[0],email:user.email}:null}/>;}
