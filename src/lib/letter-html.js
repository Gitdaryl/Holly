// Renders a stationery letter (the text markup in src/data/stationery.js) to
// email-safe HTML and to plain text. ONE renderer: the desk preview, the
// print window and the email all call this, so what Holly sees is what goes.
//
// Email constraints (not style choices): tables, inline styles, no webfonts,
// 600px. The print window wraps the same HTML in @page rules.
// Older-reader rules: 17px body, 1.6 line height, true dark ink, no grey text
// below 14px, headings in a serif, every list spaced.
//
// Michigan broker rule (MCL 339.2512e): the brokerage name must be at least
// as prominent as Holly's. The letterhead band carries Foundation Realty in
// the same size as her name, and the signature block pairs her signature
// with a Foundation Realty panel of equal height.

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const C = { ink: '#1c2b29', pink: '#e64774', berry: '#ad3557', teal: '#237168', deep: '#1a554e', cream: '#fdf7f5', blush: '#fbeae6', line: '#eeddd8', muted: '#4a5654' };

export const stripEmDashes = (s) => String(s == null ? '' : s).replace(/\s*—\s*/g, ', ').replace(/–/g, '-');
const esc = (s) => stripEmDashes(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" style="color:${C.teal};font-weight:700;word-break:break-all;">${u}</a>`);
const nl = (s) => linkify(s).replace(/\n/g, '<br>');

// Markup -> blocks. See the header of stationery.js for the four rules.
export function parse(text) {
  const blocks = [];
  for (const para of String(text || '').replace(/\r/g, '').split(/\n{2,}/)) {
    const ls = para.split('\n').filter((l) => l.trim() !== '');
    if (!ls.length) continue;
    let i = 0;
    while (i < ls.length) {
      const l = ls[i];
      if (/^#\s+/.test(l)) { blocks.push({ h: l.replace(/^#\s+/, '') }); i++; continue; }
      if (/^>\s?/.test(l)) { const box = []; while (i < ls.length && /^>\s?/.test(ls[i])) box.push(ls[i].replace(/^>\s?/, '')), i++; blocks.push({ box: box.join('\n') }); continue; }
      if (/^-\s+/.test(l)) { const items = []; while (i < ls.length && /^-\s+/.test(ls[i])) items.push(ls[i].replace(/^-\s+/, '')), i++; blocks.push({ list: items }); continue; }
      if (/\s::\s/.test(l)) { const rows = []; while (i < ls.length && /\s::\s/.test(ls[i])) { const [k, ...v] = ls[i].split(/\s::\s/); rows.push([k.trim(), v.join(' :: ').trim()]); i++; } blocks.push({ kv: rows }); continue; }
      const p = []; while (i < ls.length && !/^(#\s|>\s?|-\s|.*\s::\s)/.test(ls[i])) p.push(ls[i]), i++;
      if (p.length) blocks.push({ p: p.join('\n') });
    }
  }
  return blocks;
}

function blockHTML(b) {
  if (b.h) return `<h2 style="font:700 20px/1.3 ${SERIF};color:${C.ink};margin:26px 0 8px;">${esc(b.h)}</h2>`;
  if (b.box) return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;"><tr><td style="background:#fff5f8;border-left:4px solid ${C.pink};padding:14px 16px;font:400 17px/1.6 ${SANS};color:${C.ink};">${nl(b.box)}</td></tr></table>`;
  if (b.list) return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 14px;">${b.list.map((it) => `<tr><td valign="top" style="padding:4px 10px 4px 0;font:700 17px/1.6 ${SANS};color:${C.pink};">&bull;</td><td style="padding:4px 0;font:400 17px/1.6 ${SANS};color:${C.ink};">${nl(it)}</td></tr>`).join('')}</table>`;
  if (b.kv) return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 16px;border-top:1px solid ${C.line};">${b.kv.map(([k, v]) => `<tr><td valign="top" width="38%" style="padding:9px 12px 9px 0;border-bottom:1px solid ${C.line};font:700 15px/1.5 ${SANS};color:${C.muted};">${esc(k)}</td><td valign="top" style="padding:9px 0;border-bottom:1px solid ${C.line};font:400 17px/1.5 ${SANS};color:${C.ink};">${nl(v)}</td></tr>`).join('')}</table>`;
  return `<p style="font:400 17px/1.6 ${SANS};color:${C.ink};margin:0 0 14px;">${nl(b.p)}</p>`;
}

function blockText(b) {
  if (b.h) return `\n${b.h.toUpperCase()}\n`;
  if (b.box) return `* ${b.box.replace(/\n/g, '\n  ')}`;
  if (b.list) return b.list.map((it) => `  - ${it}`).join('\n');
  if (b.kv) return b.kv.map(([k, v]) => `${k}: ${v}`).join('\n');
  return b.p;
}

// { subject, text, dateStr, siteUrl, terms: [[term, meaning]], phone, brokerage: {name, address}, firstName }
export function renderLetter({ subject, text, dateStr, siteUrl, terms = [], phone, prettyPhone, brokerage, awards = '' }) {
  const blocks = parse(text);
  const body = blocks.map(blockHTML).join('');
  const glossary = terms.length ? `
<tr><td style="padding:8px 36px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};border:1px solid ${C.line};border-radius:10px;"><tr><td style="padding:16px 18px;">
<div style="font:700 12px/1 ${SANS};letter-spacing:.12em;text-transform:uppercase;color:${C.berry};margin-bottom:10px;">Words in this letter</div>
${terms.map(([t, m]) => `<p style="font:400 15px/1.55 ${SANS};color:${C.ink};margin:0 0 8px;"><strong>${esc(t)}.</strong> ${esc(m)}</p>`).join('')}
</td></tr></table></td></tr>` : '';
  const addr = brokerage ? `${brokerage.address.street}, ${brokerage.address.city}, ${brokerage.address.region} ${brokerage.address.postal}` : '';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject || 'A letter from Holly Griewahn')}</title></head>
<body style="margin:0;padding:0;background:${C.cream};color:${C.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" class="sheet" style="max-width:640px;width:100%;background:#ffffff;border:1px solid ${C.line};border-radius:14px;overflow:hidden;">

<tr><td style="background:${C.deep};padding:26px 36px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td valign="middle"><div style="font:400 26px/1.15 ${SERIF};color:#ffffff;">Holly Griewahn</div><div style="font:700 12px/1.4 ${SANS};letter-spacing:.1em;text-transform:uppercase;color:#f5b5c7;margin-top:5px;">REALTOR&reg; &middot; Irish Hills lakes</div></td>
    <td valign="middle" align="right"><div style="font:400 26px/1.15 ${SERIF};color:#ffffff;">${esc(brokerage?.name || 'Foundation Realty')}</div><div style="font:400 13px/1.4 ${SANS};color:#cfe3df;margin-top:5px;">${esc(prettyPhone || '')}</div></td>
  </tr></table>
</td></tr>

<tr><td style="padding:30px 36px 6px;">
  <div style="font:400 15px/1.5 ${SANS};color:${C.muted};margin-bottom:18px;">${esc(dateStr || '')}</div>
  ${subject ? `<h1 style="font:700 24px/1.25 ${SERIF};color:${C.ink};margin:0 0 20px;">${esc(subject)}</h1>` : ''}
  ${body}
</td></tr>

<tr><td style="padding:6px 36px 10px;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td valign="middle" style="padding-right:18px;"><img src="${siteUrl}/images/signature.webp" alt="Holly Griewahn" width="220" height="58" style="display:block;width:220px;height:auto;"></td>
    <td valign="middle"><table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${C.line};border-radius:8px;"><tr><td style="height:58px;padding:0 12px;" valign="middle"><img src="${siteUrl}/images/foundation-logo.png" alt="${esc(brokerage?.name || 'Foundation Realty')}" width="120" height="52" style="display:block;height:52px;width:auto;"></td></tr></table></td>
  </tr></table>
  <div style="font:400 15px/1.6 ${SANS};color:${C.muted};margin-top:12px;">Holly Griewahn, REALTOR&reg;${awards ? ` &middot; ${esc(awards)}` : ''}<br>Call or text <a href="tel:${esc(phone || '')}" style="color:${C.teal};font-weight:700;text-decoration:none;">${esc(prettyPhone || '')}</a></div>
</td></tr>

${glossary}

<tr><td style="background:#fbf0ed;border-top:1px solid ${C.line};padding:18px 36px;font:400 14px/1.7 ${SANS};color:${C.muted};">
  <div style="font-weight:700;color:${C.ink};">Holly Griewahn is a REALTOR&reg; with ${esc(brokerage?.name || 'Foundation Realty')}</div>
  <div>${esc(addr)}${prettyPhone ? ` &middot; ${esc(prettyPhone)}` : ''}</div>
</td></tr>

</table></td></tr></table>
</body></html>`;
}

export function renderText({ subject, text, dateStr, terms = [], prettyPhone, brokerage }) {
  const blocks = parse(text);
  const addr = brokerage ? `${brokerage.address.street}, ${brokerage.address.city}, ${brokerage.address.region} ${brokerage.address.postal}` : '';
  return stripEmDashes([
    `Holly Griewahn, REALTOR® · ${brokerage?.name || 'Foundation Realty'}`,
    dateStr || '',
    '',
    subject ? `${subject}\n` : '',
    blocks.map(blockText).join('\n\n'),
    '',
    `Holly Griewahn, REALTOR®`,
    `Call or text ${prettyPhone || ''}`,
    terms.length ? `\nWords in this letter\n${terms.map(([t, m]) => `${t}: ${m}`).join('\n')}` : '',
    '',
    `Holly Griewahn is a REALTOR® with ${brokerage?.name || 'Foundation Realty'}, ${addr}`,
  ].filter((l) => l !== null).join('\n')).replace(/\n{3,}/g, '\n\n');
}

// Wraps the email HTML for a print window: Letter paper, no cream margin.
export function printWrap(html) {
  return html.replace('</head>', `<style>
@media print { @page { size: letter; margin: 0.55in; } body { background: #fff !important; } .no-print { display: none !important; } .sheet { border: none !important; border-radius: 0 !important; } }
@media screen { .no-print { position: sticky; top: 0; z-index: 9; background: #1a554e; color: #fff; font: 600 15px/1.4 -apple-system, Helvetica, Arial, sans-serif; padding: 12px 16px; display: flex; gap: 12px; align-items: center; justify-content: center; } .no-print button { font: inherit; font-weight: 700; background: #e64774; color: #fff; border: 0; border-radius: 8px; padding: 10px 18px; cursor: pointer; } }
</style></head>`).replace('<body', '<body').replace(/<body([^>]*)>/, `<body$1><div class="no-print">Print it, or choose "Save as PDF" in the print window to attach it to an email. <button onclick="window.print()">Print / Save as PDF</button></div>`);
}
