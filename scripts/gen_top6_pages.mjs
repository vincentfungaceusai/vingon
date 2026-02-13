import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'ptcg_winners_top6.json');
const OUT_DIR = path.join(ROOT, 'ptcg', 'recent');

const data = JSON.parse(await fs.readFile(DATA_PATH, 'utf8'));

// Display name overrides (JP for now; can later swap to HK official names)
const ARCHETYPE_DISPLAY = {
  'ドラメシヤ/ドロンチ': 'ドラパルトex（統計：ドラメシヤ/ドロンチ系）',
  'Nのゾロア/Nのゾロアークex': 'Nのゾロアークex',
  'メガルカリオex/リオル': 'メガルカリオex',
  'マシマシラ/マリィのベロバー': 'マシマシラ／マリィ系',
  'ケーシィ/ユンゲラー': 'フーディン（胡地）系',
  'ロケット団のタマンチュラ/ロケット団のワナイダー': 'ロケット団ワナイダー系'
};

function slugify(s){
  return s
    .replace(/\s+/g,'-')
    .replace(/[\/]/g,'-')
    .replace(/[^\w\u3040-\u30ff\u4e00-\u9fff\-]+/g,'')
    .replace(/-+/g,'-')
    .replace(/^-|-$/g,'');
}

async function fetchCardThumb(cardID){
  const url = `https://www.pokemon-card.com/deck/deckThumbsImage.php?cardID=${encodeURIComponent(cardID)}`;
  const res = await fetch(url, {headers:{'user-agent':'Mozilla/5.0'}});
  if(!res.ok) throw new Error(`fetch ${url} => ${res.status}`);
  const j = await res.json();
  if(!j || j.result !== 1 || !j.thumbsPath) throw new Error(`bad json for cardID ${cardID}`);
  return `https://www.pokemon-card.com${j.thumbsPath}`;
}

function uniq(arr){return [...new Set(arr)];}

function cardRowsHtml(rows, cardImgById){
  return rows.map(r=>{
    const img = cardImgById[r.cardID] || '';
    const safeName = (r.name||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<tr>
      <td class="name">${img?`<img class="thumb" src="${img}" alt="${safeName}" loading="lazy" />`:''}<span>${safeName}</span></td>
      <td class="tag">${(r.section||'').replace(/</g,'&lt;')}</td>
      <td class="count">${r.count}</td>
    </tr>`;
  }).join('\n');
}

const baseCss = `
:root{--bg:#0b1020;--muted:#a9b3d1;--text:#eef1ff;--accent:#8de1ff;--line:rgba(255,255,255,.12);--good:#86efac;--mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;}
*{box-sizing:border-box}
body{margin:0;background:linear-gradient(180deg,#070a16,var(--bg));color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,"PingFang HK","Noto Sans CJK HK",sans-serif;}
a{color:var(--accent)}
.wrap{max-width:1040px;margin:0 auto;padding:28px 18px 60px;}
header{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;}
h1{margin:0;font-size:22px;letter-spacing:.2px}
.sub{margin-top:6px;color:var(--muted);font-size:14px;line-height:1.35}
.pill{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--line);background:rgba(255,255,255,.04);border-radius:999px;color:var(--muted);font-size:13px;}
.grid{display:grid;gap:14px;grid-template-columns:repeat(12,1fr);margin-top:18px;}
.box{grid-column:span 12;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:14px;padding:14px;}
@media(min-width:860px){.box.half{grid-column:span 6;}}
h2{margin:0 0 10px;font-size:16px;color:#dce3ff}
table{width:100%;border-collapse:collapse;font-size:14px;}
th,td{padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top;}
th{color:var(--muted);font-weight:600;text-align:left;font-size:12px;letter-spacing:.4px;text-transform:uppercase;}
.count{width:54px;text-align:right;font-family:var(--mono);color:#dbe4ff;}
.tag{width:140px;font-size:12px;color:var(--muted)}
.name{display:flex;align-items:center;gap:10px;}
.thumb{width:132px;height:183px;border-radius:8px;border:1px solid var(--line);background:rgba(255,255,255,.04);object-fit:cover;flex:0 0 auto;cursor:zoom-in;}
.note{border-left:3px solid rgba(141,225,255,.55);padding-left:10px;margin-top:10px;}
ul{margin:10px 0 0 18px;padding:0}
li{margin:6px 0;color:var(--text)}
.small{font-size:12px;color:var(--muted)}
`;

await fs.mkdir(OUT_DIR, {recursive:true});

const top6 = data.top6Archetypes;
const archetypes = top6.map(x=>x.archetype);

// collect cardIDs needed (skeleton + techs for top6)
let neededCardIDs = [];
for(const a of archetypes){
  const det = data.top6Details[a];
  for(const r of (det.skeleton||[])) neededCardIDs.push(r.cardID);
  for(const r of (det.commonTechs||[])) neededCardIDs.push(r.cardID);
}
neededCardIDs = uniq(neededCardIDs.filter(Boolean));

// fetch thumbs
const cardImgById = {};
// simple concurrency
const CONC = 8;
let i = 0;
async function worker(){
  while(i < neededCardIDs.length){
    const idx = i++;
    const id = neededCardIDs[idx];
    try{ cardImgById[id] = await fetchCardThumb(id); }
    catch(e){ cardImgById[id] = ''; }
  }
}
await Promise.all(Array.from({length:CONC}, worker));

// write per-archetype pages
const links = [];
for(const a of archetypes){
  const det = data.top6Details[a];
  const slug = slugify(a);
  const dir = path.join(OUT_DIR, slug);
  await fs.mkdir(dir, {recursive:true});

  const title = ARCHETYPE_DISPLAY[a] || a;
  links.push({a, title, slug, winnerCount: det.winnerCount});

  const skeletonRows = cardRowsHtml(det.skeleton||[], cardImgById);
  const techRows = cardRowsHtml(det.commonTechs||[], cardImgById);

  const deckLinks = (det.deckIDs||[]).map(id=>{
    const url = `https://www.pokemon-card.com/deck/confirm.html/deckID/${id}`;
    return `<li><a href="${url}" target="_blank" rel="noreferrer">${id}</a></li>`;
  }).join('\n');

  const html = `<!doctype html>
<html lang="zh-HK">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PTCG｜近期優勝 Top6｜${title}</title>
  <style>${baseCss}</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>${title}</h1>
        <div class="sub">樣本來源：PokecaBook 4 篇彙總文章（只統計「優勝」）｜本牌型優勝次數：<b>${det.winnerCount}</b></div>
        <div class="note small">提示：而家卡名多數係日文（源自日本官網 deck list）；之後我可以再逐步對照香港官網改成港版正式卡名。</div>
      </div>
      <div class="pill"><span style="font-family:var(--mono)">WINS</span> <span style="color:var(--good);font-family:var(--mono)">${det.winnerCount}</span></div>
    </header>

    <section class="grid" aria-label="Skeleton">
      <div class="box half">
        <h2>骨架（統計整合）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${skeletonRows || '<tr><td colspan="3" class="small">（暫無資料）</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="box half">
        <h2>常見 Tech 位（>=30% 出現）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">常見數量</th></tr></thead>
          <tbody>
            ${techRows || '<tr><td colspan="3" class="small">（暫無資料）</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="box">
        <h2>本牌型優勝 deckID（來源連結）</h2>
        <ul>
          ${deckLinks}
        </ul>
      </div>
    </section>

    <footer class="small" style="margin-top:18px;color:var(--muted)">
      <div><a href="../">← 返回 Top 6 總覽</a>｜<a href="../../decks/">牌組列表</a>｜<a href="../../">PTCG 主頁</a></div>
    </footer>

    <script>
      // click-to-open full image
      document.querySelectorAll('img.thumb').forEach(img => {
        img.addEventListener('click', () => window.open(img.src, '_blank', 'noopener'));
      });
    </script>
  </div>
</body>
</html>`;

  await fs.writeFile(path.join(dir,'index.html'), html, 'utf8');
}

// write index page
const listCards = links.map(x=>{
  return `<a class="box" href="./${x.slug}/" style="display:block;text-decoration:none">
    <h2 style="margin:0">${x.title}</h2>
    <div class="sub" style="margin-top:6px">優勝次數：<b>${x.winnerCount}</b></div>
  </a>`;
}).join('\n');

const idxHtml = `<!doctype html>
<html lang="zh-HK">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PTCG｜近期優勝 Top 6 牌型</title>
  <style>${baseCss}
  .box{transition:transform .08s ease;}
  .box:hover{transform:translateY(-1px);border-color:rgba(141,225,255,.55);}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>近期優勝 Top 6 牌型（樣本：PokecaBook 4 篇）</h1>
        <div class="sub">我已經把 99 副「優勝」牌組統計成 Top 6；每頁有骨架 + 常見 tech 位 + deckID 來源連結。</div>
      </div>
      <div class="pill"><span style="font-family:var(--mono)">DECKS</span> <span style="color:var(--good);font-family:var(--mono)">${data.winnerDeckCount}</span></div>
    </header>

    <section class="grid" aria-label="Top 6">
      ${listCards}
    </section>

    <footer class="small" style="margin-top:18px;color:var(--muted)">
      <div><a href="../decks/">← 返回牌組列表</a>｜<a href="../">PTCG 主頁</a></div>
    </footer>
  </div>
</body>
</html>`;

await fs.writeFile(path.join(OUT_DIR,'index.html'), idxHtml, 'utf8');

console.log('Generated:', OUT_DIR);
