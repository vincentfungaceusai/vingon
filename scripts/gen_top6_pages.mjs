import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'ptcg_winners_top6.json');
const HK_MAP_PATH = path.join(ROOT, 'hk_name_map_top6.json');
const OUT_DIR = path.join(ROOT, 'ptcg', 'recent');

const data = JSON.parse(await fs.readFile(DATA_PATH, 'utf8'));
const hkMapRaw = JSON.parse(await fs.readFile(HK_MAP_PATH, 'utf8'));

function unescapeAngle(s=''){
  return s.replaceAll('&lt;','＜').replaceAll('&gt;','＞');
}

function hkName(jpName){
  const v = hkMapRaw?.[jpName]?.hkName;
  return v ? unescapeAngle(v) : jpName;
}
function hkImg(jpName){
  return hkMapRaw?.[jpName]?.hkImgUrl ?? null;
}

// Display name overrides (HK Traditional Chinese official names)
const ARCHETYPE_DISPLAY = {
  'ドラメシヤ/ドロンチ': `${hkName('ドラパルトex')}（Top6 統計）`,
  'Nのゾロア/Nのゾロアークex': hkName('Nのゾロアークex'),
  'メガルカリオex/リオル': hkName('メガルカリオex'),
  'マシマシラ/マリィのベロバー': `${hkName('マシマシラ')}／瑪俐系`,
  'ケーシィ/ユンゲラー': `${hkName('フーディン')}系`, 
  'ロケット団のタマンチュラ/ロケット団のワナイダー': `${hkName('ロケット団のワナイダー')}（火箭隊）系`
};

const SECTION_ZH = {
  'ポケモン': '寶可夢',
  'グッズ': '物品',
  'サポート': '支援者',
  'スタジアム': '競技場',
  'ポケモンのどうぐ': '寶可夢道具',
  'エネルギー': '能量'
};

const GUIDES = {
  'ドラメシヤ/ドロンチ': {
    flow: [
      `起手優先：鋪到 2–3 隻「${hkName('ドラメシヤ')}」，配合「${hkName('なかよしポフィン')}／${hkName('ハイパーボール')}」去起動展開。`,
      `第 1 回合：先確立進化材料同資源循環位；留意「${hkName('ふしぎなアメ')}」路線，唔好太早亂丟關鍵件。`,
      `第 2 回合：用「${hkName('ふしぎなアメ')}」直上「${hkName('ドラパルトex')}」，開始向備戰分配傷害指示物，提早鎖定兩回合獎賞線。`
    ],
    matchup: [
      `先規劃「兩回合獎賞線」：點傷要以 2-2 或 3-3 節奏為目標，唔好散得太碎。`,
      `對手依賴工具/道具時，把「${hkName('ワザマシン デヴォリューション')}／${hkName('スグリ')}」（視構築）嘅出手窗口留喺對手要爆發嗰回合。`,
      `資源管理：保留「${hkName('夜のタンカ')}」做關鍵回合回收進化線/能量，避免中後期斷攻。`
    ]
  },
  'Nのゾロア/Nのゾロアークex': {
    flow: [
      `起手：至少鋪到 2 隻「${hkName('Nのゾロア')}」；有「${hkName('なかよしポフィン')}」就盡量鋪滿基本。`,
      `第 1 回合：用檢索卡把進化/能量路線準備好，並預留干擾位（例如支援者）。`,
      `第 2 回合：進化到「${hkName('Nのゾロアークex')}」開始主攻，同步用干擾（如「${hkName('ジャッジマン')}」等）打斷對手節奏。`
    ],
    matchup: [
      `呢副偏中速壓制：重點係「每回合穩定輸出 + 手牌干擾」同時做到。`,
      `留意「${hkName('Nの城')}」嘅節奏點：有時早落比你換位/續航舒服好多。`,
      `對高耐久 ex：睇下需唔需要「${hkName('グラビティーマウンテン')}」或者工具位（例如「${hkName('くさりもち')}」）去補傷害線。`
    ]
  },
  'メガルカリオex/リオル': {
    flow: [
      `起手：確保「${hkName('リオル')}」落到場；配合檢索卡快速搵到主戰。`,
      `第 1 回合：優先鋪好能量同輔助位，避免只得一條攻擊線。`,
      `第 2 回合：讓「${hkName('メガルカリオex')}」開始攻擊；道具加傷（例如「${hkName('カウンターキャッチャー')}」等視構築）要按次序用，推到關鍵擊倒線。`
    ],
    matchup: [
      `呢套成日差 10/20：道具使用順序好重要（先加傷→再換位/拉前→再抽濾）。`,
      `ACE SPEC 請留喺能改變獎賞交換嘅回合先交。`,
      `對控制：確保有足夠替換/解工具手段，唔好畀人一鎖就斷攻。`
    ]
  },
  'マシマシラ/マリィのベロバー': {
    flow: [
      `起手：至少 1 隻「${hkName('マリィのベロバー')}」，再配合第二條進化/引擎線落場。`,
      `第 1 回合：鋪基礎怪，先確保「下回合一定進化到」。`,
      `第 2 回合：完成主力進化後，用場地/支援者開始做壓制節奏，逼對手每回合都要解你板面。`
    ],
    matchup: [
      `干擾點要忍手：留喺對手要爆發嗰回合先交，收益最大。`,
      `注意自己都怕干擾：T1/T2 鋪場優先級要固定，唔好貪多線而散。`,
      `對手有工具/場地核心時，工具拆除/換場地嘅 timing 係勝負位。`
    ]
  },
  'ケーシィ/ユンゲラー': {
    flow: [
      `起手：以「${hkName('ケーシィ')}」為主，並盡快鋪到「${hkName('ノコッチ')}／${hkName('ノココッチ')}」引擎。`,
      `第 1 回合：鋪 2–3 隻「${hkName('ケーシィ')}」，確保下回合有進化/糖果路線。`,
      `第 2 回合：上「${hkName('フーディン')}」開始輸出/控制盤面；支援者要確保資源循環唔好斷。`
    ],
    matchup: [
      `呢套食進化速度：糖果/進化件要避免畀人洗走；有需要就先落關鍵件。`,
      `場地回合要用喺你最需要推線/換獎賞嗰刻，唔好亂交。`,
      `對單點高火力：用換位同回血（例如「${hkName('ミズキのケア')}」）拉長交換。`
    ]
  },
  'ロケット団のタマンチュラ/ロケット団のワナイダー': {
    flow: [
      `起手：鋪到 2 隻以上「${hkName('ロケット団のタマンチュラ')}」，準備進化「${hkName('ロケット団のワナイダー')}」。`,
      `第 1 回合：用「${hkName('ロケット団のレシーバー')}」搵支援者，把資源鏈接起嚟。`,
      `第 2 回合：完成進化後開始以火箭隊系統做節奏壓制，配合場地續航。`
    ],
    matchup: [
      `火箭隊支援者鏈接要有計劃：先展開→再干擾→最後收頭。`,
      `對依賴備戰引擎嘅對手，優先點殺/壓備戰破壞對方循環。`,
      `能量管理要克制：火箭隊能量用得太急會令中後期斷供。`
    ]
  }
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

function esc(s=''){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function cardRowsHtml(rows, cardImgById){
  return rows.map(r=>{
    const jp = (r.name||'').trim();
    const zh = hkName(jp);
    const img = hkImg(jp) || cardImgById[r.cardID] || '';
    const sec = SECTION_ZH[r.section] || r.section || '';
    return `<tr>
      <td class="name">${img?`<img class="thumb" src="${esc(img)}" alt="${esc(zh)}" loading="lazy" />`:''}<span class="card-name" title="JP：${esc(jp)}">${esc(zh)}</span></td>
      <td class="tag">${esc(sec)}</td>
      <td class="count">${r.count}</td>
    </tr>`;
  }).join('\n');
}

function sumCounts(rows){
  return (rows||[]).reduce((acc,r)=>acc + (Number(r.count)||0), 0);
}

function groupSkeleton(rows){
  const out = { pokemon: [], items: [], supporters: [], stadiumEnergy: [] };
  for(const r of (rows||[])){
    const sec = r.section;
    if (sec === 'ポケモン') out.pokemon.push(r);
    else if (sec === 'サポート') out.supporters.push(r);
    else if (sec === 'スタジアム' || sec === 'エネルギー') out.stadiumEnergy.push(r);
    else if (sec === 'グッズ' || sec === 'ポケモンのどうぐ') out.items.push(r);
    else out.items.push(r); // fallback into items
  }
  return out;
}

function deckGridHtml(rows, cardImgById){
  return rows.map(r=>{
    const jp = (r.name||'').trim();
    const zh = hkName(jp);
    const img = hkImg(jp) || cardImgById[r.cardID] || '';
    if(!img) return '';
    return `<a class="deckcard" href="${esc(img)}" target="_blank" rel="noreferrer" title="${esc(zh)}｜JP：${esc(jp)}">
      <img src="${esc(img)}" alt="${esc(zh)}" loading="lazy" />
      <div class="badge">${r.count}</div>
    </a>`;
  }).filter(Boolean).join('\n');
}

// Match the existing "Alakazam" page UI (colors, spacing, typography)
const baseCss = `
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

/* thumbnails (70% of original) */
.name{display:flex; align-items:center; gap:10px;}
.thumb{width:92px; height:128px; border-radius:8px; border:1px solid var(--line); background:rgba(255,255,255,.04); object-fit:cover; flex:0 0 auto; cursor:zoom-in;}

/* top nav */
.topnav{display:flex; gap:12px; flex-wrap:wrap; margin-top:10px;}
.topnav a{display:inline-block; padding:6px 10px; border:1px solid var(--line); border-radius:999px; text-decoration:none; background:rgba(255,255,255,.04); color:var(--accent); font-size:13px;}

/* full deck list image (visual grid) */
.deckshot{margin-top:14px; padding:14px; border:1px solid var(--line); background:rgba(255,255,255,.03); border-radius:14px;}
.deckshot h2{margin:0 0 10px; font-size:16px; color:#dce3ff}
.deckgrid{display:grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap:10px;}
.deckcard{position:relative; border-radius:10px; overflow:hidden; border:1px solid var(--line); background:rgba(255,255,255,.04);}
.deckcard img{width:100%; height:auto; display:block;}
.badge{position:absolute; left:8px; bottom:8px; min-width:28px; padding:4px 8px; border-radius:999px; background:rgba(0,0,0,.65); border:1px solid rgba(255,255,255,.22); color:#fff; font-family:var(--mono); font-weight:800; font-size:14px; text-align:center;}
.deckcard:hover{border-color:rgba(141,225,255,.55);}
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
  // representative thumbnail for the archetype list (prefer a Pokémon from skeleton)
  let thumbUrl = '';
  for (const r of (det.skeleton||[])) {
    if (r.section !== 'ポケモン') continue;
    const jp = (r.name||'').trim();
    thumbUrl = hkImg(jp) || cardImgById[r.cardID] || '';
    if (thumbUrl) break;
  }
  if (!thumbUrl) {
    for (const r of (det.skeleton||[])) {
      const jp = (r.name||'').trim();
      thumbUrl = hkImg(jp) || cardImgById[r.cardID] || '';
      if (thumbUrl) break;
    }
  }

  links.push({a, title, slug, winnerCount: det.winnerCount, thumbUrl});

  const skeleton = det.skeleton || [];
  const grouped = groupSkeleton(skeleton);

  const skeletonPokemonRows = cardRowsHtml(grouped.pokemon, cardImgById);
  const skeletonItemsRows = cardRowsHtml(grouped.items, cardImgById);
  const skeletonSupporterRows = cardRowsHtml(grouped.supporters, cardImgById);
  const skeletonStadiumEnergyRows = cardRowsHtml(grouped.stadiumEnergy, cardImgById);

  const pokemonTotal = sumCounts(grouped.pokemon);
  const itemsTotal = sumCounts(grouped.items);
  const supporterTotal = sumCounts(grouped.supporters);
  const stadiumEnergyTotal = sumCounts(grouped.stadiumEnergy);
  const skeletonTotal = pokemonTotal + itemsTotal + supporterTotal + stadiumEnergyTotal;

  const techRows = cardRowsHtml(det.commonTechs||[], cardImgById);
  const deckGrid = deckGridHtml(skeleton, cardImgById);

  const guide = GUIDES[a];
  const flowLis = (guide?.flow||[]).map(x=>`<li>${x}</li>`).join('\n');
  const matchupLis = (guide?.matchup||[]).map(x=>`<li>${x}</li>`).join('\n');

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
        <div class="topnav">
          <a href="../../">返回首頁</a>
          <a href="../">返回 Top 6 總覽</a>
          <a href="../../decks/">牌組列表</a>
        </div>
        <div class="note small">卡名已對照香港訓練家網站（繁中官方譯名）；滑鼠移到卡名會見到日文原名作對照。</div>
      </div>
      <div class="pill"><span style="font-family:var(--mono)">WINS</span> <span style="color:var(--good);font-family:var(--mono)">${det.winnerCount}</span></div>
    </header>

    <section class="deckshot" aria-label="Full deck list image">
      <h2>完整 Deck List 圖片（骨架視覺化）</h2>
      <div class="deckgrid">
        ${deckGrid || '<div class="small">（暫時冇圖片資料）</div>'}
      </div>
      <div class="sub" style="margin-top:8px">提示：撳卡圖會開原圖（可再放大）。</div>
    </section>

    <section class="grid" aria-label="Skeleton">
      <div class="box">
        <h2>骨架（統計整合）</h2>
        <div class="sub">骨架總卡數（合計）：<b>${skeletonTotal}</b></div>
        <div class="totals">
          <span class="pill">寶可夢 <span class="ok">${pokemonTotal}</span></span>
          <span class="pill">物品/道具 <span class="ok">${itemsTotal}</span></span>
          <span class="pill">支援者 <span class="ok">${supporterTotal}</span></span>
          <span class="pill">競技場/能量 <span class="ok">${stadiumEnergyTotal}</span></span>
          <span class="pill">合計 <span class="ok">${skeletonTotal}</span></span>
        </div>
      </div>

      <div class="box half">
        <h2>寶可夢（${pokemonTotal}）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${skeletonPokemonRows || '<tr><td colspan="3" class="small">（暫無資料）</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="box half">
        <h2>物品/道具（${itemsTotal}）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${skeletonItemsRows || '<tr><td colspan="3" class="small">（暫無資料）</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="box half">
        <h2>支援者（${supporterTotal}）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${skeletonSupporterRows || '<tr><td colspan="3" class="small">（暫無資料）</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="box half">
        <h2>競技場 / 能量（${stadiumEnergyTotal}）</h2>
        <table>
          <thead><tr><th>卡名</th><th class="tag">分類</th><th class="count">數量</th></tr></thead>
          <tbody>
            ${skeletonStadiumEnergyRows || '<tr><td colspan="3" class="small">（暫無資料）</td></tr>'}
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
        <h2>起手／前兩回合流程（簡化版）</h2>
        <ul>
          ${flowLis || '<li class="small">（整理中）</li>'}
        </ul>
      </div>

      <div class="box">
        <h2>對局要點（方向性）</h2>
        <ul>
          ${matchupLis || '<li class="small">（整理中）</li>'}
        </ul>
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
  const img = x.thumbUrl ? `<img class="thumb" loading="lazy" alt="${esc(x.title)}" src="${esc(x.thumbUrl)}" />` : `<div class="thumb" aria-hidden="true" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-weight:800;font-size:12px;letter-spacing:.6px;">Top6</div>`;
  return `<a class="box" href="./${x.slug}/" style="display:block;text-decoration:none">
    <div style="display:flex;gap:12px;align-items:flex-start">
      ${img}
      <div style="min-width:0">
        <h2 style="margin:0">${x.title}</h2>
        <div class="sub" style="margin-top:6px">優勝次數：<b>${x.winnerCount}</b></div>
      </div>
    </div>
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
        <div class="topnav">
          <a href="../">返回首頁</a>
          <a href="../decks/">牌組列表</a>
        </div>
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
