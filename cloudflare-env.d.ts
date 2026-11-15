declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

declare namespace Cloudflare { interface Env { GEMINI_API_KEY?:string; GEMINI_FREE_TIER_CONFIRMED?:string; } }
