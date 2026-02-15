import fs from 'node:fs/promises';

const data = JSON.parse(await fs.readFile('tmp/nidangir_5deck_summary.json','utf8'));

const arche = {
  title: '雙劍鞘（ニダンギル）｜優勝/上位 Deck（5副平均）',
  slug: 'nidangir',
  pokecabook: 'https://pokecabook.com/archives/285295',
};

function esc(s){return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

function pickCore(arr){
  // pick cards seen in >=3/5, then sort by present desc, avg desc
  return arr.filter(x=>x.present>=3).slice(0, 80);
}

function renderSection(name, arr){
  const core = pickCore(arr);
  const rows = core.map(x=>{
    const counts = x.counts.join(', ');
    return `<tr><td><b>${esc(x.name)}</b></td><td class="mono">${x.present}/5</td><td class="mono">${x.avg}</td><td class="mono">${esc(counts)}</td></tr>`;
  }).join('\n');
  return `
  <h2>${esc(name)}（出現 ≥ 3/5）</h2>
  <div class="box">
    <table>
      <thead><tr><th>卡</th><th>出現</th><th>平均</th><th>各副數量</th></tr></thead>
      <tbody>
        ${rows || '<tr><td colspan="4" class="muted">（無）</td></tr>'}
      </tbody>
    </table>
    <div class="hint">平均 = 5副總和 ÷ 5（冇出現當 0）。</div>
  </div>`;
}

const deckLinks = data.deckIds.map(id=>{
  const printUrl = `https://www.pokemon-card.com/deck/print.html/deckID/${id}/`;
  const confirmUrl = `https://www.pokemon-card.com/deck/confirm.html/deckID/${id}`;
  return `<li class="mono"><a href="${printUrl}" target="_blank" rel="noreferrer">${id}</a> <span class="muted">(print)</span>｜<a href="${confirmUrl}" target="_blank" rel="noreferrer">confirm</a></li>`;
}).join('\n');

const html = `<!doctype html>
<html lang="zh-HK">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(arche.title)}</title>
  <style>
    :root{--bg:#0b1020;--text:#eef1ff;--muted:#a9b3d1;--accent:#8de1ff;--line:rgba(255,255,255,.12);--good:#86efac;--mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;}
    *{box-sizing:border-box}
    body{margin:0;background:linear-gradient(180deg,#070a16,var(--bg));color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,"PingFang HK","Noto Sans CJK HK",sans-serif;}
    a{color:var(--accent)}
    .wrap{max-width:1080px;margin:0 auto;padding:28px 18px 70px;}
    header{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;}
    h1{margin:0;font-size:22px;letter-spacing:.2px}
    h2{margin:18px 0 10px;font-size:16px;color:#dce3ff}
    .sub{margin-top:6px;color:var(--muted);font-size:14px;line-height:1.55}
    .topnav{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}
    .topnav a{display:inline-block;padding:6px 10px;border:1px solid var(--line);border-radius:999px;text-decoration:none;background:rgba(255,255,255,.04);color:var(--accent);font-size:13px;}
    .pill{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.04);color:var(--muted);font-size:12px;}
    .ok{color:var(--good);font-family:var(--mono)}
    .mono{font-family:var(--mono)}
    .muted{color:var(--muted)}

    .box{margin-top:12px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.03);padding:14px;overflow:auto}
    table{width:100%;border-collapse:collapse;font-size:14px;}
    th,td{padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:top;}
    th{color:var(--muted);font-weight:700;text-align:left;font-size:12px;letter-spacing:.4px;text-transform:uppercase;}
    .hint{margin-top:8px;color:var(--muted);font-size:12px;line-height:1.5}
    ul{margin:8px 0 0 18px;color:var(--text);line-height:1.7}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>${esc(arche.title)}</h1>
        <div class="sub">根據 PokecaBook 文章內嘅上位 deck link，抽 5 副官方 deck list 做平均／骨架統計（出現 ≥ 3/5）。</div>
        <div class="topnav">
          <a href="../">返回 Decks</a>
          <a href="../../">返回 PTCG 首頁</a>
          <a href="${arche.pokecabook}" target="_blank" rel="noreferrer">PokecaBook 原文</a>
        </div>
      </div>
      <div class="pill"><span class="mono">SAMPLE</span> <span class="ok">5</span></div>
    </header>

    <div class="box">
      <div class="sub"><b>本次抽樣 deckID：</b></div>
      <ul>${deckLinks}</ul>
      <div class="hint">提示：同一牌型會有唔同分支（例如不同引擎/不同ACE SPEC）。平均化會「拉平」分歧，所以核心位會比你直覺更可靠；分歧位就要睇 counts 分佈。</div>
    </div>

    ${renderSection('ポケモン', data.summary['ポケモン'])}
    ${renderSection('グッズ', data.summary['グッズ'])}
    ${renderSection('ポケモンのどうぐ', data.summary['ポケモンのどうぐ'])}
    ${renderSection('サポート', data.summary['サポート'])}
    ${renderSection('スタジアム', data.summary['スタジアム'])}
    ${renderSection('エネルギー', data.summary['エネルギー'])}

    <h2>一句總結（我讀完5副後嘅感覺）</h2>
    <div class="box">
      <ul>
        <li>核心一定係：<b>ヒトツキ / ニダンギル / ギルガルド</b> 三段各 4（5/5 出現）。</li>
        <li>第二層常見係：<b>ゲノセクトex</b>（5/5 出現但數量 2–4 有分歧）。</li>
        <li>抽濾引擎有兩派：<b>ノココッチ線</b>（部分） vs <b>ソルロック/ルナトーン</b>（部分）。</li>
      </ul>
    </div>
  </div>
</body>
</html>`;

await fs.mkdir('ptcg/decks/nidangir', { recursive: true });
await fs.writeFile('ptcg/decks/nidangir/index.html', html, 'utf8');
console.log('wrote ptcg/decks/nidangir/index.html');
