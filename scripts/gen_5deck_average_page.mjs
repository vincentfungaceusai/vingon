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

function buildRows(sectionArr, tag){
  const rows = coreCards(sectionArr)
    .map(x => ({ name: x.name, qty: roundInt(x.avg), present: x.present, avg: x.avg }))
    .filter(x => x.qty > 0)
    .sort((a,b)=> b.qty - a.qty || b.present - a.present || a.name.localeCompare(b.name,'ja'));

  return rows.map(r=>{
    // no image mapping yet → placeholder block
    return `<tr>
      <td class="name">
        <div class="thumb ph" aria-hidden="true">—</div>
        <span class="card-name" title="出現：${r.present}/5｜平均：${r.avg}">${esc(r.name)}</span>
      </td>
      <td class="tag">${esc(tag)}</td>
      <td class="count">${r.qty}</td>
    </tr>`;
  }).join('\n');
}

function sumQty(rowsHtml){
  // not robust parse; caller already has computed sums
  return rowsHtml;
}

async function main(){
  const inPath = process.argv[2];
  const outDir = process.argv[3];
  const titleZh = process.argv[4];
  const pokecabook = process.argv[5];

  if (!inPath || !outDir || !titleZh) {
    console.error('Usage: node scripts/gen_5deck_average_page.mjs <summaryJson> <outDir> <titleZh> [pokecabookUrl]');
    process.exit(1);
  }

  const data = JSON.parse(await fs.readFile(inPath,'utf8'));
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
        </div>
        <div class="note small">暫時先用日文卡名（官方 deck print）；之後我可以再補：香港官方譯名 + 卡圖（同 Top6 一樣可切繁中/日文）。</div>
      </div>
      <div class="pill"><span style="font-family:var(--mono)">SAMPLE</span> <span style="color:var(--good);font-family:var(--mono)">5</span></div>
    </header>

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
            ${buildRows(sec('ポケモン'), '寶可夢') || `<tr><td colspan="3" class="small">（無）</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="box half">
        <h2>物品/道具（${itemsTools}）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${buildRows(sec('グッズ'), '物品')}
            ${buildRows(sec('ポケモンのどうぐ'), '道具')}
          </tbody>
        </table>
      </div>

      <div class="box half">
        <h2>支援者（${supportRows}）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${buildRows(sec('サポート'), '支援者') || `<tr><td colspan="3" class="small">（無）</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="box half">
        <h2>競技場/能量（${stadEnergy}）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${buildRows(sec('スタジアム'), '競技場')}
            ${buildRows(sec('エネルギー'), '能量')}
          </tbody>
        </table>
      </div>

      <div class="box">
        <h2>總結（點樣解讀呢個「5副平均骨架」）</h2>
        <ul>
          <li><b>骨架</b> = 5副入面「至少 3 副都有」嘅卡，再用平均數四捨五入做成一份「接近主流」嘅 60 概念表。</li>
          <li>想睇分歧位：請留意每張卡嘅 tooltip（出現幾多副／平均數），出現 3/5 通常就係 tech / meta slot。</li>
          <li>如果你想我再做得同 Top6 一模一樣（有卡圖、繁中/日文切換、完整 deck grid），我需要再加一步「卡名 → cardID/卡圖」對照（避免同名錯圖）。</li>
        </ul>
      </div>
    </section>
  </div>
</body>
</html>`;

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(`${outDir}/index.html`, html, 'utf8');
  console.log('wrote ' + outDir + '/index.html');
}

await main();
