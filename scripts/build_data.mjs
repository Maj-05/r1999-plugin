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
// ===== 合并 re1999-data 中文名 + 技能（可选；缺 character.json/skill.json 时跳过）=====
const chnFile = readJSON(path.join(DATA, 'character.json'));
const skillFile = readJSON(path.join(DATA, 'skill.json'));
const skillEffFile = readJSON(path.join(DATA, 'skill_effect.json'));
const skillEffMap = (Array.isArray(skillEffFile)) ? new Map(skillEffFile.map(e => [e.id, e])) : null;
const battleTagFile = readJSON(path.join(DATA, 'character_battle_tag.json'));
const battleTagMap = (Array.isArray(battleTagFile)) ? new Map(battleTagFile.map(t => [String(t.id), t.tagName])) : null;
if (Array.isArray(chnFile) && Array.isArray(skillFile)) {
  const skillMap = new Map(skillFile.map(s => [s.id, s]));
  const chnMap = new Map(chnFile.map(c => [c.nameEng, c]));
  let matched = 0;
  for (const c of characters) {
    const zh = chnMap.get(c.name);
    if (!zh) { continue; }
    matched++;
    c.nameZh = zh.name;
    if (zh.dmgType != null) c.dmgTypeName = (zh.dmgType === 1 ? '现实创伤' : zh.dmgType === 2 ? '精神创伤' : String(zh.dmgType));
    if (zh.battleTag && battleTagMap) {
      const tgs = String(zh.battleTag).split('#').map(t => battleTagMap.get(t)).filter(Boolean)
      if (tgs.length) c.tags = tgs
    }
    const skillIds = [];
    if (zh.skill) {
      for (const part of String(zh.skill).split('|')) {
        const seg = part.split('#');
        const slot = Number(seg[0]) || 0;
        for (let i = 1; i < seg.length; i++) {
          const id = Number(seg[i]);
          const sk = skillMap.get(id);
          if (sk) { const eff = skillEffMap ? skillEffMap.get(sk.skillEffect) : null; skillIds.push({ slot, tier: i, id, name: sk.name || ('技能' + id), desc: sk.desc_art || '', effect: eff ? eff.desc : '' }); }
        }
      }
    }
    if (zh.exSkill) {
      const sk = skillMap.get(Number(zh.exSkill));
      if (sk) c.ritual = { id: Number(zh.exSkill), name: sk.name || ('仪式' + zh.exSkill), desc: sk.desc_art || '' };
    }
    c.skills = skillIds;
  }
  console.log('合并中文名+技能: ' + matched + '/' + characters.length);
} else {
  console.log('无 character.json/skill.json，跳过中文合并');
}
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
