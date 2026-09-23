#!/usr/bin/env python3
"""One-shot remap of the old navy/magenta template palette onto Holly's brand
board (Desktop/for sale sign.svg): raspberry, berry, blush, lake teal.
Dark surfaces become deep teal; navy used as text becomes a teal-tinted ink.
Idempotent: running it twice changes nothing."""
import re, sys, pathlib

# Navy family that only ever shows up as a dark surface -> teal family.
DARK = {
  '#1a2332': '#1a554e', '#2c3e50': '#237168', '#2c4a6e': '#237168', '#1a3a4a': '#174a44',
  '#1a3a52': '#1d5f57', '#0f2940': '#123f3a', '#24405c': '#1f655c', '#3d5a73': '#2d7c72',
  '#0f1923': '#0e2d29',
}
GLOBAL = {
  # navy outside a background is text, strokes, borders
  '#1a2332': '#1c2b29',
  # pink
  '#e84393': '#e64774', '#c0166d': '#ad3557', '#f6a5c9': '#f5b5c7', '#f093fb': '#f5b5c7',
  # slate greys -> neutrals leaning teal
  '#6b7a8d': '#66706e', '#94a3b8': '#98a3a1', '#64748b': '#66706e', '#4a5568': '#4a5654',
  '#475569': '#4a5654', '#cbd5e0': '#d5dcda', '#2d3748': '#26312f',
  # cream grounds + hairlines -> blush
  '#e8e4df': '#eeddd8', '#f0eee9': '#f6e9e5', '#faf9f7': '#fdf7f5', '#f8f7f5': '#fcf5f3',
  '#f0ece8': '#f4e6e2', '#f7f3f0': '#fbf0ed', '#f5f2ec': '#fbefeb',
  # stock "good"/"active" greens -> teal
  '#22c55e': '#237168', '#059669': '#237168', '#047857': '#1a554e',
  # stray blue chip
  '#f0f9ff': '#eef5f4',
}
GLOBAL.update({k: v for k, v in DARK.items() if k != '#1a2332'})
RGBA = {
  '232,67,147': '230,71,116', '26,35,50': '26,85,78', '15,25,35': '10,38,35', '15,41,64': '10,38,35',
  '10,16,24': '8,28,26', '250,249,247': '253,247,245', '34,197,94': '35,113,104', '16,185,129': '35,113,104',
}
FONTS = [
  (re.compile(r"https://fonts\.googleapis\.com/css2\?family=Playfair\+Display[^'\"`)\s]*"),
   'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..800;1,8..60,400..600&family=Inter:wght@300..700&display=swap'),
  (re.compile(r"'Playfair Display',\s*(Georgia,\s*)?serif"), "'Source Serif 4', Georgia, serif"),
  (re.compile(r"\"Playfair Display\",\s*(Georgia,\s*)?serif"), "\"Source Serif 4\", Georgia, serif"),
  (re.compile(r"'Playfair Display'"), "'Source Serif 4'"),
  (re.compile(r"'DM Sans'"), "'Inter'"),
  (re.compile(r"\"DM Sans\""), "\"Inter\""),
]
BG = re.compile(r"""(background(?:Color|-color|-image)?\s*:\s*)('[^']*'|"[^"]*"|`[^`]*`|[^;'"`}\n]*)""")

def dark(m):
  v = m.group(2)
  for k, r in DARK.items(): v = re.sub(re.escape(k), r, v, flags=re.I)
  return m.group(1) + v

def remap(s):
  s = BG.sub(dark, s)
  for k, r in GLOBAL.items(): s = re.sub(re.escape(k) + r'(?![0-9a-fA-F])', r, s, flags=re.I)
  for k, r in RGBA.items(): s = re.sub(r'rgba?\(\s*' + r'\s*,\s*'.join(k.split(',')), 'rgba(' + r, s)
  for p, r in FONTS: s = p.sub(r, s)
  return s

changed = 0
for f in sys.argv[1:]:
  p = pathlib.Path(f); old = p.read_text(); new = remap(old)
  if new != old: p.write_text(new); changed += 1; print('remapped', f)
print(changed, 'files')
