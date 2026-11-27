import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const PLUGIN_ROOT = path.resolve(__dirname, '..')
export const rulePrefix = '[#\/](?:1999|r1999)?\\s*';
export const DATA_DIR = path.join(PLUGIN_ROOT, 'resources', 'data')
export function readData(name) {
  try {
    const p = path.join(DATA_DIR, name.endsWith('.json') ? name : name + '.json')
    if (!fs.existsSync(p)) return null
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) { logger?.error('[r1999] readData ' + name + ' 失败: ' + e.message) }
  return null
}
export const AFFLATUS = { Beast: '兽', Star: '星', Mineral: '岩', Plant: '木', Intellect: '灵', Spirit: '智' }
export const RARITY = { 6: { name: '六星', color: '#e8b93c' }, 5: { name: '五星', color: '#c88ae0' }, 4: { name: '四星', color: '#6aa8e8' }, 3: { name: '三星', color: '#7ec27e' }, 2: { name: '二星', color: '#a8a8a8' } }
export function rarityName(r) { return (RARITY[r] && RARITY[r].name) || ('R' + r) }
export function rarityColor(r) { return (RARITY[r] && RARITY[r].color) || '#a8a8a8' }
/** 简单模糊评分：精确>前缀>包含>逐字命中 */
export function fuzzyScore(q, s) {
  const str = String(s || '')
  if (!str) return 0
  if (str === q) return 100
  if (str.startsWith(q)) return 80
  if (str.includes(q)) return 60
  let c = 0
  for (const ch of q) if (str.includes(ch)) c++
  return c >= 2 ? 30 + c : 0
}
