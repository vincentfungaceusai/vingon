import fs from 'node:fs/promises';

const SECTION_HEADERS = new Set(['ポケモン','グッズ','ポケモンのどうぐ','サポート','スタジアム','エネルギー']);

function linesFromText(t){
  return t.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
}

function parsePrintText(text){
  const lines = linesFromText(text);
  let cur = null;
  const out = {};
  for (let i=0;i<lines.length;i++){
    const l = lines[i];
    if (SECTION_HEADERS.has(l)) { cur = l; out[cur] ||= {}; continue; }
    if (!cur) continue;
    if (l === '小計' || l === '合計') { i++; continue; }
    const name = l;
    const cntRaw = lines[i+1];
    if (!cntRaw || !/^\d+$/.test(cntRaw)) continue;
    const cnt = Number(cntRaw);
    out[cur][name] = (out[cur][name]||0) + cnt;
    i += 1;
    if (cur === 'ポケモン') {
      // skip expansion + number if present
      const exp = lines[i+1];
      const no = lines[i+2];
      if (exp && /^[A-Z0-9\-]+$/i.test(exp) && no && /\d+\/\d+/.test(no)) i += 2;
    }
  }
  return out;
}

function summarize(parsedByDeck){
  const deckIds = Object.keys(parsedByDeck);
  const n = deckIds.length;
  const sections = ['ポケモン','グッズ','ポケモンのどうぐ','サポート','スタジアム','エネルギー'];
  const summary = {};
  for (const sec of sections){
    const m = new Map();
    for (const id of deckIds){
      const obj = parsedByDeck[id][sec] || {};
      for (const [name,cnt] of Object.entries(obj)){
        if (!m.has(name)) m.set(name, []);
        m.get(name).push(cnt);
      }
    }
    const arr = [...m.entries()].map(([name,cnts])=>{
      const present = cnts.length;
      const avg = cnts.reduce((a,b)=>a+b,0)/n;
      return {
        name,
        present,
        avg: Number(avg.toFixed(2)),
        min: Math.min(...cnts),
        max: Math.max(...cnts),
        counts: cnts,
      };
    }).sort((a,b)=> (b.present-a.present) || (b.avg-a.avg) || a.name.localeCompare(b.name,'ja'));
    summary[sec] = arr;
  }
  return { n, deckIds, summary };
}

const inPath = process.argv[2];
if (!inPath) throw new Error('Usage: node scripts/parse_deck_printtexts.mjs <jsonPath>');

const raw = JSON.parse(await fs.readFile(inPath,'utf8'));
const parsedByDeck = {};
for (const [deckId, text] of Object.entries(raw)) parsedByDeck[deckId] = parsePrintText(text);
const out = summarize(parsedByDeck);
await fs.writeFile('tmp/nidangir_5deck_summary.json', JSON.stringify({parsedByDeck, ...out}, null, 2), 'utf8');
console.log('wrote tmp/nidangir_5deck_summary.json');
