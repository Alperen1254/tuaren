import webpush from 'web-push';
import { buildEvents } from './events.mjs';

const { FIREBASE_PROJECT_ID: PID, COUPLE_CODE, VAPID_PUBLIC, VAPID_PRIVATE } = process.env;
const code = COUPLE_CODE.trim().toLowerCase().replace(/[\/\s]/g, '');
const url = `https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)/documents/couples/${encodeURIComponent(code)}`;

const res = await fetch(url);
if (!res.ok) { console.error('Firestore okunamadı', res.status, await res.text()); process.exit(1); }
const f = (await res.json()).fields || {};
const data = JSON.parse(f.data?.stringValue || '{}');
const subs = Object.values(JSON.parse(f.subs?.stringValue || '{}'));
const sent = JSON.parse(f.sent?.stringValue || '[]');

const due = buildEvents(data, Date.now()).filter(e => !sent.includes(e.key));
console.log(`Kayıtlı telefon: ${subs.length}, gönderilecek bildirim: ${due.length}`);
if (!due.length || !subs.length) process.exit(0);

webpush.setVapidDetails('mailto:tuaren@example.com', VAPID_PUBLIC, VAPID_PRIVATE);
for (const e of due) {
  let ok = 0;
  for (const s of subs) {
    try { await webpush.sendNotification(s, JSON.stringify({ title: e.title, body: e.body }), { urgency: 'high', TTL: 6 * 3600 }); ok++; }
    catch (err) { console.error('Gönderilemedi', err.statusCode || err.message); }
  }
  console.log(e.key, ok + '/' + subs.length);
  if (ok) sent.push(e.key);
}
const patch = await fetch(`${url}?updateMask.fieldPaths=sent`, {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields: { sent: { stringValue: JSON.stringify(sent.slice(-300)) } } })
});
if (!patch.ok) { console.error('sent yazılamadı', await patch.text()); process.exit(1); }
