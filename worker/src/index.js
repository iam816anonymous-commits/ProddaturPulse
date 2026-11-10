const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const ALLOWED_INTERESTS = new Set(["Social mixers","Game nights","Fitness and running groups","Sports meetups","Student and career community","Rental homes and rooms","Local services and deals","Weekend trips and outings","Other"]);
const SESSION_SECONDS = 60 * 60 * 8;
const MAX_BODY_BYTES = 12000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN;
    if (request.method === "OPTIONS") {
      if (origin !== allowedOrigin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (!allowedOrigin || origin !== allowedOrigin) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: JSON_HEADERS });
    if (!env.DB || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ error: "Service is not configured" }, 503, origin);
    const url = new URL(request.url);
    try {
      if (request.method === "POST" && url.pathname === "/api/register") return await register(request, env, origin);
      if (request.method === "POST" && url.pathname === "/api/admin/login") return await login(request, env, origin);
      if (url.pathname.startsWith("/api/admin/")) {
        if (!await authenticate(request, env)) return json({ error: "Authentication required" }, 401, origin);
        if (request.method === "GET" && url.pathname === "/api/admin/registrations") return await listRegistrations(url, env, origin);
        if (request.method === "GET" && url.pathname === "/api/admin/export.csv") return await exportCsv(env, origin);
        if (request.method === "DELETE" && /^\/api\/admin\/registrations\/\d+$/.test(url.pathname)) {
          await env.DB.prepare("DELETE FROM registrations WHERE id = ?").bind(Number(url.pathname.split("/").pop())).run();
          return json({ ok: true }, 200, origin);
        }
      }
      return json({ error: "Not found" }, 404, origin);
    } catch (error) {
      console.error("Request failed", error);
      return json({ error: "Request could not be completed" }, 500, origin);
    }
  }
};

function corsHeaders(origin) {
  return { "access-control-allow-origin": origin, "access-control-allow-methods": "GET, POST, DELETE, OPTIONS", "access-control-allow-headers": "content-type, authorization", "vary": "Origin" };
}
function json(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...(origin ? corsHeaders(origin) : {}) } });
}
async function readJson(request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) throw new Error("Payload too large");
  return JSON.parse(raw);
}
function clean(value, max) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}
async function digest(value) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function hitLimit(env, key, limit, windowSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare("SELECT count, window_start FROM rate_limits WHERE key = ?").bind(key).first();
  if (!row || now - row.window_start >= windowSeconds) {
    await env.DB.prepare("INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start").bind(key, now).run();
    return true;
  }
  if (row.count >= limit) return false;
  await env.DB.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").bind(key).run();
  return true;
}
function clientKey(request) { return request.headers.get("CF-Connecting-IP") || "unknown"; }

async function register(request, env, origin) {
  const ipHash = await digest(clientKey(request) + env.SESSION_SECRET);
  if (!await hitLimit(env, "submit:" + ipHash, 8, 3600)) return json({ error: "Too many submissions. Try again later." }, 429, origin);
  const d = await readJson(request);
  if (d.website) return json({ ok: true }, 202, origin);
  const name = clean(d.name, 80), phone = clean(d.phone, 10);
  const interests = Array.isArray(d.interests) ? [...new Set(d.interests.filter(x => ALLOWED_INTERESTS.has(x)))].slice(0, 9) : [];
  if (!name || !/^[6-9]\d{9}$/.test(phone) || interests.length === 0 || d.consent !== true) return json({ error: "Please check the required fields and try again." }, 400, origin);
  await env.DB.prepare("INSERT INTO registrations (submitted_at, city, name, phone, age, area, interests, timeline, willingness_to_pay, suggestion, consent, marketing_updates) VALUES (?, 'Proddatur', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)")
    .bind(new Date().toISOString(), name, phone, clean(d.age,30), clean(d.area,80), JSON.stringify(interests), clean(d.timeline,40), clean(d.willingness_to_pay,40), clean(d.suggestion,500), d.marketing_updates === true ? 1 : 0).run();
  return json({ ok: true }, 201, origin);
}
async function login(request, env, origin) {
  const ipHash = await digest(clientKey(request) + env.SESSION_SECRET);
  if (!await hitLimit(env, "login:" + ipHash, 5, 900)) return json({ error: "Too many login attempts. Try again in 15 minutes." }, 429, origin);
  const d = await readJson(request);
  const supplied = await digest(String(d.password || ""));
  const expected = await digest(env.ADMIN_PASSWORD);
  if (!constantTimeEqual(supplied, expected)) return json({ error: "Incorrect password" }, 401, origin);
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({ sub: "owner", iat: now, exp: now + SESSION_SECONDS }));
  return json({ token: payload + "." + await sign(payload, env.SESSION_SECRET), expires_in: SESSION_SECONDS }, 200, origin);
}
function constantTimeEqual(a,b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i=0;i<a.length;i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
function base64url(value) { return base64urlBytes(new TextEncoder().encode(value)); }
function base64urlBytes(bytes) {
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature = await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value));
  return base64url(String.fromCharCode(...new Uint8Array(signature)));
}
async function authenticate(request, env) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  const parts = header.slice(7).split(".");
  if (parts.length !== 2) return false;
  if (!constantTimeEqual(parts[1],await sign(parts[0],env.SESSION_SECRET))) return false;
  try {
    const normalized = parts[0].replace(/-/g,"+").replace(/_/g,"/");
    const payload = JSON.parse(atob(normalized));
    return payload.sub === "owner" && payload.exp > Math.floor(Date.now()/1000);
  } catch { return false; }
}
async function listRegistrations(url,env,origin) {
  const q = clean(url.searchParams.get("q"),100), interest = clean(url.searchParams.get("interest"),80);
  const where=[], values=[];
  if(q){where.push("(name LIKE ? OR phone LIKE ? OR area LIKE ? OR suggestion LIKE ?)");const t="%"+q+"%";values.push(t,t,t,t);}
  if(interest && ALLOWED_INTERESTS.has(interest)){where.push("interests LIKE ?");values.push("%"+interest+"%");}
  const sql="SELECT id,submitted_at,city,name,phone,age,area,interests,timeline,willingness_to_pay,suggestion,marketing_updates FROM registrations"+(where.length?" WHERE "+where.join(" AND "):"")+" ORDER BY id DESC LIMIT 500";
  const result=await env.DB.prepare(sql).bind(...values).all();
  return json({registrations:(result.results||[]).map(row=>({...row,interests:safeParse(row.interests)})),count:(result.results||[]).length,limited:(result.results||[]).length===500},200,origin);
}
function safeParse(value){try{return JSON.parse(value||"[]");}catch{return [];}}
function csvCell(value){
  let text=String(value??"");
  if(/^[\s]*[=+\-@]/.test(text)) text="'"+text;
  return '"'+text.replace(/"/g,'""')+'"';
}
async function exportCsv(env,origin) {
  const result=await env.DB.prepare("SELECT id,submitted_at,city,name,phone,age,area,interests,timeline,willingness_to_pay,suggestion,consent,marketing_updates FROM registrations ORDER BY id DESC").all();
  const cols=["id","submitted_at","city","name","phone","age","area","interests","timeline","willingness_to_pay","suggestion","consent","marketing_updates"];
  const lines=[cols.join(",")];
  for(const row of result.results||[]) lines.push(cols.map(key=>csvCell(key==="interests"?safeParse(row[key]).join("; "):row[key])).join(","));
  return new Response("\uFEFF"+lines.join("\r\n"),{status:200,headers:{...corsHeaders(origin),"content-type":"text/csv; charset=utf-8","content-disposition":'attachment; filename="proddatur-pulse-registrations.csv"',"cache-control":"no-store"}});
}
