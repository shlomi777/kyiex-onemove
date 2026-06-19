// KYIEX — One Move routing endpoint
// Runs as a Vercel serverless function at /api/onemove
// Your Anthropic key lives here, server-side. It never reaches the browser.

// Swap to "claude-sonnet-4-6" if testing shows the picks need more nuance.
// Haiku is faster and ~3x cheaper, which matters more than nuance for a frozen user.
const MODEL = "claude-haiku-4-5-20251001";
const MAX_LIST_CHARS = 1500;
const VALID_CAPACITY = ["low", "steady", "sharp"];

// Best-effort burst limiter. Note: on serverless this only catches naive
// hammering within a warm instance. The REAL cost backstop is the monthly
// spend cap you set on the API key in the Anthropic console. For strict
// per-IP limiting at scale, see the Upstash snippet in README.md.
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

const SYSTEM_PROMPT = `You are the routing engine inside KYIEX, a state-first execution system for overloaded solo operators.

A person who feels frozen has dumped their task list and told you their current cognitive capacity. Your only job is to choose exactly ONE thing for them to do right now, matched to the capacity they actually have, and give one short reason.

CAPACITY ROUTING:
- low: Near freeze, foggy, almost out of fuel. Pick the most STARTABLE item, not the most important one. Lowest activation energy that still creates real motion. Break the freeze and prove movement is possible. Never hand a low-capacity person the hardest task.
- steady: Pick the item with the best ratio of impact to effort. Honest forward progress that does not require peak clarity.
- sharp: Pick the highest-leverage item. The hard, important one that only gets done when the mind is genuinely clear. Do not waste a sharp state on something trivial or administrative.

If the list is vague or messy, still commit to one move. Rephrase it as a clear directive that starts with a verb.

VOICE (strict):
- Short, declarative sentences.
- No em dashes.
- No exclamation points.
- Calm and certain. Quiet authority. Not a cheerleader, not a coach. You are the one clear signal in their noise.
- Address them directly as you.
- The reason is one or two sentences. Never more.

Return ONLY valid JSON. No markdown, no backticks, no preamble:
{"move": "<the one move, starting with a verb>", "reason": "<one or two short sentences>"}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse body defensively (Vercel usually parses JSON automatically).
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Bad request" });
    }
  }
  const capacity = body?.capacity;
  const list = typeof body?.list === "string" ? body.list.trim() : "";

  // Validate.
  if (!VALID_CAPACITY.includes(capacity)) {
    return res.status(400).json({ error: "Bad request" });
  }
  if (list.length === 0 || list.length > MAX_LIST_CHARS) {
    return res.status(400).json({ error: "Bad request" });
  }

  // Rate limit.
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ error: "Slow down. Try again shortly." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 220,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `CAPACITY: ${capacity}\n\nTHEIR LIST:\n${list}`,
          },
        ],
      }),
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: "The signal dropped. Try once more." });
    }

    const data = await upstream.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (!parsed.move || !parsed.reason) {
      throw new Error("incomplete");
    }

    return res.status(200).json({
      move: String(parsed.move),
      reason: String(parsed.reason),
    });
  } catch {
    return res.status(502).json({ error: "The signal dropped. Try once more." });
  }
}
