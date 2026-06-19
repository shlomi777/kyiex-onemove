# KYIEX — One Move

A single-shot, state-first routing tool. Dump the noise, pick your capacity, get back exactly one move. It is the product's promise delivered live, as a free taste that creates hunger for the full system.

This package is two pieces with zero build step:

- `index.html` — the front-end. Self-contained. No framework, no compile.
- `api/onemove.js` — a serverless function that holds your API key and talks to Anthropic. The key never reaches the browser.

---

## Deploy in five steps

### 1. Get an Anthropic API key and set a spend cap
- Create a key at https://console.anthropic.com (API Keys).
- In the console, set a **monthly spend limit** (Billing > Limits). This is the real cost backstop. Start it low, for example $20. You can raise it later. Nothing protects you from runaway cost better than this single setting.

### 2. Deploy to Vercel
- Create a free account at https://vercel.com.
- Easiest path: drag this whole folder into a new GitHub repo, then "Import Project" in Vercel. Or install the CLI (`npm i -g vercel`) and run `vercel` from inside this folder.
- Vercel auto-detects `index.html` as the page and `api/onemove.js` as the function. No config file needed.

### 3. Add your key as an environment variable
- In the Vercel project: Settings > Environment Variables.
- Add `ANTHROPIC_API_KEY` with your key as the value. Redeploy.

### 4. Point a subdomain at it
- Recommended: a subdomain like `move.kyiex.net` or `try.kyiex.net`.
- In Vercel: Settings > Domains, add `move.kyiex.net`.
- In GoDaddy DNS: add the CNAME record Vercel gives you. Keeping it on a kyiex.net subdomain serves the page and the API from the same origin, so there are no CORS headaches.

### 5. Test, then link it
- Open the live URL. Run your own real list three times, once per capacity (low / steady / sharp). Confirm the picks are sharp and the voice holds.
- Link it from your posts as the resolution to the freeze, not as a "tool."

---

## Model and cost

- Default model is **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`). Fastest and cheapest. Roughly $1.20 per 1,000 uses.
- To switch to Sonnet for more nuance, change `MODEL` at the top of `api/onemove.js` to `claude-sonnet-4-6` (about $3.60 per 1,000 uses, slightly slower).
- Latency matters more than nuance for a frozen user. Stay on Haiku unless testing proves the picks are weak.

---

## Hardening (optional, recommended before you push volume)

**The function already enforces:**
- Input length cap (1,500 characters).
- A best-effort per-IP burst limit (6 requests / 10 minutes).

**The burst limit is best-effort only.** On serverless it resets with cold starts and does not coordinate across instances. Treat it as a speed bump, not a wall. Your two real defenses are:

1. **The monthly spend cap on the key** (step 1). This is the hard ceiling on damage.
2. **Cloudflare Turnstile** for bot protection, far more effective than IP limiting against determined abuse. Add an invisible Turnstile widget to `index.html`, pass the token in the POST body, and verify it at the top of `onemove.js` before calling Anthropic.

**For strict per-IP limiting at scale,** drop in Upstash Redis (free tier):

```js
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(6, "10 m"),
});

// inside the handler, before calling Anthropic:
const { success } = await limiter.limit(ip);
if (!success) return res.status(429).json({ error: "Slow down. Try again shortly." });
```

Add `@upstash/ratelimit` and `@upstash/redis` to a `package.json`, and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as env vars.

---

## Design rules baked in (do not break these)

- **No buy button until after the result.** The tool's only job is to deliver the felt shift first, then sell. Surfacing price before relief kills the mechanism.
- **Single shot. No save, no history.** "Clear and start over" wipes everything. The friction of repeating it manually is what sells the full system. Do not add a "give me another move" button. That one change turns your sales asset into a free replacement for the product.
- **Voice rules.** KYIEX all caps, no em dashes, no exclamation points, short declarative sentences. The routing prompt enforces this. Keep it enforced if you edit the prompt.
