// send-summary.js — Netlify Function that emails the workbook record summary via Resend.
// SETUP (one time):
//   1. Sign up at resend.com and verify the domain shondamartin.com (Resend → Domains).
//   2. In Netlify: Site settings → Environment variables → add RESEND_API_KEY with your Resend API key.
//   3. Deploy this file at netlify/functions/send-summary.js in the same site as the workbook.
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.RESEND_API_KEY;
  if (!key) return new Response('RESEND_API_KEY not configured', { status: 500 });
  let data;
  try { data = await req.json(); } catch (e) { return new Response('Bad request', { status: 400 }); }
  const { to, subject, body } = data || {};
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to) || !body || String(body).length > 20000) {
    return new Response('Bad request', { status: 400 });
  }
  const preview = 'Here is your latest summary of workbook entries, disputes, and responses.';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html =
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + esc(preview) + '</div>' +
    '<pre style="font-family:Georgia,\'Times New Roman\',serif;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#14111A;margin:0;">' + esc(body) + '</pre>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Shonda Martin | DIY Credit Hub <diy@shondamartin.com>',
      reply_to: 'diy@shondamartin.com',
      to: [to],
      subject: subject || 'Your DIY Credit Hub Record Summary',
      text: body,
      html
    })
  });
  if (!res.ok) return new Response('Email send failed', { status: 502 });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
