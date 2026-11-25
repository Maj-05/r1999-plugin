import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'resources', 'data');
const AFFLATUS_CN = { Beast: '兽', Star: '星', Mineral: '岩', Plant: '木', Intellect: '灵', Spirit: '智' };
function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null } }
function rarityName(r) { const m = {6:'六星',5:'五星',4:'四星',3:'三星',2:'二星'}; return m[r] || ('R' + r) }
const arcanists = readJSON(path.join(DATA, 'arcanists.json')) || [];
const characters = arcanists.map(a => ({
  id: a.Id, name: a.Name, rarity: a.Rarity, rarityName: rarityName(a.Rarity),
  afflatus: a.Afflatus, afflatusName: AFFLATUS_CN[a.Afflatus] || a.Afflatus,
  released: !!a.IsReleased,
  insight: (a.Insight || []).length, resonance: (a.Resonance || []).length
}));
characters.sort((a,b)=>b.rarity-a.rarity || a.id-b.id);
const psychubes = (readJSON(path.join(DATA, 'psychubes.json')) || []).map(p => ({
  id: p.Id, name: p.Name, rarity: p.Rarity, rarityName: rarityName(p.Rarity),
  tag: p.Tag, impression: p.Impression || ''
})).sort((a,b)=>b.rarity-a.rarity || a.id-b.id);
const items = (readJSON(path.join(DATA, 'items.json')) || []);
const itemsOut = (Array.isArray(items) ? items : []).map(i => ({
  id: i.Id, name: i.Name, rarity: i.Rarity ?? null, rarityName: i.Rarity != null ? rarityName(i.Rarity) : ''
}));
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'characters.json'), JSON.stringify(characters));
fs.writeFileSync(path.join(OUT, 'psychubes.json'), JSON.stringify(psychubes));
fs.writeFileSync(path.join(OUT, 'items.json'), JSON.stringify(itemsOut));
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ builtAt: new Date().toISOString(), sourceVersion: 'kornblume-raw' }));
console.log('build done: characters=' + characters.length + ' psychubes=' + psychubes.length + ' items=' + itemsOut.length);
