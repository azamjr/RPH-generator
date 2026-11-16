// The application trusts identity headers only behind the Sites authentication gateway.
import app from './index.js';

const personalWorkspace = 'https://rph-generator-azam.leafy-wren-7212.chatgpt.site';

export default {
  fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === '/signin-with-chatgpt' || pathname === '/signout-with-chatgpt') {
      return Response.redirect(personalWorkspace + pathname + '?return_to=%2F', 302);
    }

    const headers = new Headers(request.headers);
    for (const name of [...headers.keys()]) {
      if (name.startsWith('oai-')) headers.delete(name);
    }
    return app.fetch(new Request(request, { headers }), env, ctx);
  }
};
