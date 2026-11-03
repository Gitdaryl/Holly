// A full-screen title card in Holly's brand, for the open and close of a help video.
export const card = ({ kicker, title, sub }) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600..800&family=Inter:wght@400..700&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;height:100%;background:#1a554e;color:#fff;font-family:Inter,-apple-system,sans-serif}
  .w{height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 30px;box-sizing:border-box}
  .k{font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#f5b5c7;margin-bottom:14px}
  h1{font-family:'Source Serif 4',Georgia,serif;font-size:40px;line-height:1.08;margin:0 0 18px;font-weight:800}
  p{font-size:19px;line-height:1.5;color:#d8ebe7;margin:0}
  .sig{position:absolute;left:30px;bottom:44px;display:flex;align-items:center;gap:14px}
  .sig img{display:block}
  .bar{width:56px;height:5px;background:#e64774;border-radius:3px;margin-bottom:22px}
</style></head><body><div class="w">
  <div class="bar"></div>
  <div class="k">${kicker}</div>
  <h1>${title}</h1>
  <p>${sub}</p>
  <div class="sig"><span style="background:#fff;border-radius:8px;padding:6px 10px;display:inline-flex"><img src="http://localhost:4179/images/foundation-logo.png" alt="" style="height:30px"></span><img src="http://localhost:4179/images/signature-blush.webp" alt="" style="height:30px"></div>
</div></body></html>`
