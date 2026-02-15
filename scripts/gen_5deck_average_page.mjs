import fs from 'node:fs/promises';

function esc(s){return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

function roundInt(x){
  // standard rounding, min 0
  const n = Math.round(Number(x));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function coreCards(sectionArr){
  // keep cards that appear in >=3/5 decks
  return sectionArr.filter(x => x.present >= 3);
}

function buildRows(sectionArr, tag, imgMap, hkNameMap){
  const rows = coreCards(sectionArr)
    .map(x => ({ name: x.name, qty: roundInt(x.avg), present: x.present, avg: x.avg }))
    .filter(x => x.qty > 0)
    .sort((a,b)=> b.qty - a.qty || b.present - a.present || a.name.localeCompare(b.name,'ja'));

  return rows.map(r=>{
    const m = imgMap[r.name] || null;
    const jp = m?.jpImg || '';
    const hk = hkNameMap?.[r.name]?.hkImgUrl || '';
    const hkName = hkNameMap?.[r.name]?.hkName || r.name;

    const src = hk || jp;
    const img = src
      ? `<img class="thumb deck-img" src="${esc(src)}" data-hk="${esc(hk||src)}" data-jp="${esc(jp||src)}" alt="${esc(hkName)}" loading="lazy" />`
      : `<div class="thumb ph" aria-hidden="true">—</div>`;

    return `<tr>
      <td class="name">
        ${img}
        <span class="card-name" title="JP：${esc(r.name)}｜出現：${r.present}/5｜平均：${r.avg}">${esc(hkName)}</span>
      </td>
      <td class="tag">${esc(tag)}</td>
      <td class="count">${r.qty}</td>
    </tr>`;
  }).join('\n');
}

function skeletonListBySection(sectionArr, imgMap, hkNameMap){
  return coreCards(sectionArr)
    .map(x => ({ name: x.name, qty: roundInt(x.avg), present: x.present, avg: x.avg }))
    .filter(x => x.qty > 0)
    .map(x => ({
      ...x,
      jpImg: imgMap[x.name]?.jpImg || '',
      hkImg: hkNameMap?.[x.name]?.hkImgUrl || '',
      hkName: hkNameMap?.[x.name]?.hkName || x.name,
      cardId: imgMap[x.name]?.cardId || '',
    }))
    .sort((a,b)=> b.qty - a.qty || b.present - a.present || a.name.localeCompare(b.name,'ja'));
}

function buildDeckGrid(allCards){
  return allCards.map(c=>{
    const hk = c.hkImg || '';
    const jp = c.jpImg || '';
    const src = hk || jp;
    const href = src || '#';
    const title = `${c.hkName || c.name}｜JP：${c.name}`;
    return `<a class="deckcard" href="${esc(href)}" target="_blank" rel="noreferrer" title="${esc(title)}">
      <img class="deck-img" src="${esc(src)}" data-hk="${esc(hk||src)}" data-jp="${esc(jp||src)}" alt="${esc(c.hkName || c.name)}" loading="lazy" />
      <div class="badge">${c.qty}</div>
    </a>`;
  }).join('\n');
}

async function main(){
  const inPath = process.argv[2];
  const outDir = process.argv[3];
  const titleZh = process.argv[4];
  const mapPath = process.argv[5];
  const pokecabook = process.argv[6];

  if (!inPath || !outDir || !titleZh || !mapPath) {
    console.error('Usage: node scripts/gen_5deck_average_page.mjs <summaryJson> <outDir> <titleZh> <cardImgMapJson> [pokecabookUrl]');
    process.exit(1);
  }

  const data = JSON.parse(await fs.readFile(inPath,'utf8'));
  const imgMap = JSON.parse(await fs.readFile(mapPath,'utf8'));
  const hkNameMap = JSON.parse(await fs.readFile('hk_name_map_top6.json','utf8'));
  const deckIds = data.deckIds;

  const sec = (k)=> data.summary[k] || [];

  const pokemonRows = coreCards(sec('ポケモン')).map(x=>({qty: roundInt(x.avg)})).reduce((a,b)=>a+b.qty,0);
  const goodsRows = coreCards(sec('グッズ')).map(x=>({qty: roundInt(x.avg)})).reduce((a,b)=>a+b.qty,0);
  const toolRows = coreCards(sec('ポケモンのどうぐ')).map(x=>({qty: roundInt(x.avg)})).reduce((a,b)=>a+b.qty,0);
  const supportRows = coreCards(sec('サポート')).map(x=>({qty: roundInt(x.avg)})).reduce((a,b)=>a+b.qty,0);
  const stadiumRows = coreCards(sec('スタジアム')).map(x=>({qty: roundInt(x.avg)})).reduce((a,b)=>a+b.qty,0);
  const energyRows = coreCards(sec('エネルギー')).map(x=>({qty: roundInt(x.avg)})).reduce((a,b)=>a+b.qty,0);

  const itemsTools = goodsRows + toolRows;
  const stadEnergy = stadiumRows + energyRows;
  const total = pokemonRows + itemsTools + supportRows + stadEnergy;

  const skPokemon = skeletonListBySection(sec('ポケモン'), imgMap, hkNameMap);
  const skGoods = skeletonListBySection(sec('グッズ'), imgMap, hkNameMap);
  const skTools = skeletonListBySection(sec('ポケモンのどうぐ'), imgMap, hkNameMap);
  const skSupport = skeletonListBySection(sec('サポート'), imgMap, hkNameMap);
  const skStadium = skeletonListBySection(sec('スタジアム'), imgMap, hkNameMap);
  const skEnergy = skeletonListBySection(sec('エネルギー'), imgMap, hkNameMap);
  const skAll = [...skPokemon, ...skGoods, ...skTools, ...skSupport, ...skStadium, ...skEnergy];

  const deckLinks = deckIds.map(id=>{
    const printUrl = `https://www.pokemon-card.com/deck/print.html/deckID/${id}/`;
    const confirmUrl = `https://www.pokemon-card.com/deck/confirm.html/deckID/${id}`;
    return `<li class="mono"><a href="${printUrl}" target="_blank" rel="noreferrer">${esc(id)}</a> <span class="small">(print)</span>｜<a href="${confirmUrl}" target="_blank" rel="noreferrer">confirm</a></li>`;
  }).join('\n');

  const html = `<!doctype html>
<html lang="zh-HK">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PTCG｜${esc(titleZh)}｜5副平均</title>
  <style>
:root{
  --bg:#0b1020; --card:#121a33; --muted:#a9b3d1; --text:#eef1ff;
  --accent:#8de1ff; --line:rgba(255,255,255,.12);
  --good:#86efac;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
*{box-sizing:border-box}
body{margin:0; background:linear-gradient(180deg,#070a16, var(--bg)); color:var(--text); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,"PingFang HK","Noto Sans CJK HK",sans-serif;}
a{color:var(--accent)}
.wrap{max-width:980px; margin:0 auto; padding:28px 18px 60px;}
header{display:flex; gap:14px; align-items:flex-start; justify-content:space-between; flex-wrap:wrap;}
h1{margin:0; font-size:22px; letter-spacing:.2px}
.sub{margin-top:6px; color:var(--muted); font-size:14px; line-height:1.35}
.pill{display:inline-flex; align-items:center; gap:8px; padding:8px 10px; border:1px solid var(--line); background:rgba(255,255,255,.04); border-radius:999px; color:var(--muted); font-size:13px;}
.grid{display:grid; gap:14px; grid-template-columns: repeat(12, 1fr); margin-top:18px;}
.box{grid-column: span 12; background:rgba(255,255,255,.03); border:1px solid var(--line); border-radius:14px; padding:14px;}
@media(min-width:860px){ .box.half{grid-column: span 6;} }

h2{margin:0 0 10px; font-size:16px; color:#dce3ff}
table{width:100%; border-collapse:collapse; font-size:14px;}
th,td{padding:8px 6px; border-bottom:1px solid var(--line); vertical-align:top;}
th{color:var(--muted); font-weight:600; text-align:left; font-size:12px; letter-spacing:.4px; text-transform:uppercase;}
.count{width:54px; text-align:right; font-family:var(--mono); color:#dbe4ff;}
.tag{width:120px; font-size:12px; color:var(--muted)}
.note{border-left:3px solid rgba(141,225,255,.55); padding-left:10px; margin-top:10px;}
ul{margin:10px 0 0 18px; padding:0}
li{margin:6px 0; color:var(--text)}
.small{font-size:12px; color:var(--muted)}

.totals{display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; color:var(--muted); font-size:13px;}
.ok{color:var(--good); font-family:var(--mono)}

.name{display:flex; align-items:center; gap:10px;}
.thumb{width:92px; height:128px; border-radius:8px; border:1px solid var(--line); background:rgba(255,255,255,.04); object-fit:cover; flex:0 0 auto; cursor:zoom-in;}
.thumb.ph{display:flex; align-items:center; justify-content:center; color:var(--muted); font-weight:800; font-size:12px; letter-spacing:.6px; cursor:default;}

.topnav{display:flex; gap:12px; flex-wrap:wrap; margin-top:10px; align-items:center;}
.topnav a{display:inline-block; padding:6px 10px; border:1px solid var(--line); border-radius:999px; text-decoration:none; background:rgba(255,255,255,.04); color:var(--accent); font-size:13px;}

.imgtoggle{margin-left:auto; display:flex; gap:8px; align-items:center; color:var(--muted); font-size:12px;}
.imgtoggle button{padding:6px 10px; border-radius:999px; border:1px solid var(--line); background:rgba(255,255,255,.04); color:var(--text); cursor:pointer; font-size:12px;}
.imgtoggle button.active{border-color:rgba(141,225,255,.55); color:var(--accent);}

.deckshot{margin-top:14px; padding:14px; border:1px solid var(--line); background:rgba(255,255,255,.03); border-radius:14px;}
.deckshot h2{margin:0 0 10px; font-size:16px; color:#dce3ff}
.deckgrid{display:grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap:10px;}
.deckcard{position:relative; border-radius:10px; overflow:hidden; border:1px solid var(--line); background:rgba(255,255,255,.04);}
.deckcard img{width:100%; height:auto; display:block;}
.badge{position:absolute; left:8px; bottom:8px; min-width:28px; padding:4px 8px; border-radius:999px; background:rgba(0,0,0,.65); border:1px solid rgba(255,255,255,.22); color:#fff; font-family:var(--mono); font-weight:800; font-size:14px; text-align:center;}
.deckcard:hover{border-color:rgba(141,225,255,.55);}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>${esc(titleZh)}（5副平均）</h1>
        <div class="sub">樣本來源：PokecaBook 上位 deck（抽 5 副官方 deck list）｜骨架以「出現 ≥ 3/5」+「平均數四捨五入」整合</div>
        <div class="topnav">
          <a href="../../decks/">返回牌組列表</a>
          <a href="../../">返回 PTCG 首頁</a>
          ${pokecabook ? `<a href="${esc(pokecabook)}" target="_blank" rel="noreferrer">PokecaBook 原文</a>` : ''}
          <div class="imgtoggle" aria-label="Image source toggle">
            <span>圖片：</span>
            <button type="button" class="active" data-mode="hk">繁中</button>
            <button type="button" data-mode="jp">日文</button>
          </div>
        </div>
        <div class="note small">卡名目前以日文為主；圖片已接入 deck confirm 取得嘅 cardId（避免同名錯圖）。繁中（HK）卡圖/譯名我下一步再補齊。</div>
      </div>
      <div class="pill"><span style="font-family:var(--mono)">SAMPLE</span> <span style="color:var(--good);font-family:var(--mono)">5</span></div>
    </header>

    <section class="deckshot" aria-label="Full deck list image">
      <h2>完整 Deck List 圖片（骨架視覺化）</h2>
      <div class="deckgrid">
        ${buildDeckGrid(skAll)}
      </div>
      <div class="sub" style="margin-top:8px">提示：撳卡圖會開原圖（可再放大）。</div>
    </section>

    <section class="grid" aria-label="Skeleton">
      <div class="box">
        <h2>骨架（統計整合）</h2>
        <div class="sub">骨架總卡數（合計）：<b>${total}</b>（平均四捨五入，出現&lt;3/5不納入）</div>
        <div class="totals">
          <span class="pill">寶可夢 <span class="ok">${pokemonRows}</span></span>
          <span class="pill">物品/道具 <span class="ok">${itemsTools}</span></span>
          <span class="pill">支援者 <span class="ok">${supportRows}</span></span>
          <span class="pill">競技場/能量 <span class="ok">${stadEnergy}</span></span>
          <span class="pill">合計 <span class="ok">${total}</span></span>
        </div>
        <div class="sub" style="margin-top:10px"><b>本次抽樣 deckID：</b></div>
        <ul>${deckLinks}</ul>
      </div>

      <div class="box half">
        <h2>寶可夢（${pokemonRows}）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${buildRows(sec('ポケモン'), '寶可夢', imgMap, hkNameMap) || `<tr><td colspan="3" class="small">（無）</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="box half">
        <h2>物品/道具（${itemsTools}）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${buildRows(sec('グッズ'), '物品', imgMap, hkNameMap)}
            ${buildRows(sec('ポケモンのどうぐ'), '道具', imgMap, hkNameMap)}
          </tbody>
        </table>
      </div>

      <div class="box half">
        <h2>支援者（${supportRows}）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${buildRows(sec('サポート'), '支援者', imgMap, hkNameMap) || `<tr><td colspan="3" class="small">（無）</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="box half">
        <h2>競技場/能量（${stadEnergy}）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${buildRows(sec('スタジアム'), '競技場', imgMap, hkNameMap)}
            ${buildRows(sec('エネルギー'), '能量', imgMap, hkNameMap)}
          </tbody>
        </table>
      </div>

      <div class="box">
        <h2>總結（點樣解讀呢個「5副平均骨架」）</h2>
        <ul>
          <li><b>骨架</b> = 5副入面「至少 3 副都有」嘅卡，再用平均數四捨五入，整成一份「接近主流」嘅參考 60。</li>
          <li>想搵 <b>tech 位</b>：通常就係 <b>只出現 3/5</b> 或者 <b>平均數好低（0.x～1.x）</b> 嗰啲。</li>
          <li>想做得更貼實戰：你可以用呢份骨架做底，再按你本地 meta 把 2–6 個 slot 換成針對卡。</li>
        </ul>
      </div>
    </section>

    <script>
      // click-to-open full image
      document.querySelectorAll('img.thumb').forEach(img => {
        img.addEventListener('click', () => window.open(img.src, '_blank', 'noopener'));
      });

      // toggle between HK (繁中) and JP images when both are available
      function setImgMode(mode){
        document.querySelectorAll('.imgtoggle button').forEach(b => b.classList.toggle('active', b.dataset.mode===mode));
        document.querySelectorAll('img.deck-img').forEach(img => {
          const hk = img.dataset.hk || '';
          const jp = img.dataset.jp || '';
          const next = (mode==='hk' ? (hk||jp) : (jp||hk));
          if(next) img.src = next;
        });
        // update deckcard links too
        document.querySelectorAll('a.deckcard').forEach(a => {
          const img = a.querySelector('img.deck-img');
          if(!img) return;
          a.href = img.src;
        });
      }
      document.querySelectorAll('.imgtoggle button').forEach(btn => {
        btn.addEventListener('click', () => setImgMode(btn.dataset.mode));
      });
      setImgMode('hk');
    </script>
  </div>
</body>
</html>`;

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(`${outDir}/index.html`, html, 'utf8');
  console.log('wrote ' + outDir + '/index.html');
}

await main();
