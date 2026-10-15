// Hangi bildirimlerin zamanı geldi? (Türkiye saati, UTC+3)
const TZ = 3 * 3600e3, WINDOW = 6 * 3600e3;
const pad = n => String(n).padStart(2, '0');
const dim = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();          // m: 1-12
const at = (y, m, d, h, mi = 0) => Date.UTC(y, m - 1, d, h, mi) - TZ;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };

export function buildEvents(data, now) {
  const ev = [];
  const days = [0, 1].map(k => { const t = new Date(now + TZ - k * 864e5); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; });
  const s = data.start && parse(data.start), me = data.meet && parse(data.meet);
  for (const D of days) {
    const when = at(D.y, D.m, D.d, 9);
    if (s) {
      const months = (D.y - s.y) * 12 + (D.m - s.m);
      if (months >= 1 && D.d === Math.min(s.d, dim(D.y, D.m))) {
        if (months % 12 === 0) ev.push({ key: `y-s-${D.y}`, when, title: '🖤 Yıl dönümümüz kutlu olsun!', body: `Bugün ${months / 12}. yıl dönümümüz. İyi ki varsın 🖤` });
        else ev.push({ key: `m-${D.y}-${D.m}`, when, title: '🖤 Ay dönümümüz kutlu olsun!', body: `Bugün ${months}. ay dönümümüz.` });
      }
    }
    if (me && D.y - me.y >= 1 && D.m === me.m && D.d === me.d)
      ev.push({ key: `y-m-${D.y}`, when, title: '✨ Tanışma yıl dönümü', body: `Tanışmamızın ${D.y - me.y}. yıl dönümü.` });
  }
  for (const p of data.plans || []) {
    if (p.done) continue;
    const t = Date.parse(p.date); if (isNaN(t)) continue;
    ev.push({ key: `p-${p.id}-t`, when: t, title: '🎉 Plan zamanı!', body: p.t });
    const l = new Date(t + TZ), morning = at(l.getUTCFullYear(), l.getUTCMonth() + 1, l.getUTCDate(), 9);
    if (morning < t - 30 * 60e3)
      ev.push({ key: `p-${p.id}-d`, when: morning, title: '📅 Bugün planımız var', body: `${p.t} — saat ${pad(l.getUTCHours())}:${pad(l.getUTCMinutes())}` });
  }
  return ev.filter(e => e.when <= now && now - e.when <= WINDOW);
}
