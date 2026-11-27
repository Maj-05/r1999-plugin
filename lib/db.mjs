import { readData, fuzzyScore } from './constants.mjs'
class DB {
  constructor() {
    this.ready = false
    this.characters = []
    this.psychubes = []
    this.items = []
    this.meta = {}
    this._idx = null
  }
  load() {
    if (this.ready) return true
    try {
      this.characters = readData('characters') || []
      this.psychubes = readData('psychubes') || []
      this.items = readData('items') || []
      this.meta = readData('meta') || {}
      if (![this.characters, this.psychubes, this.items].every(rows => Array.isArray(rows) && rows.length)) {
        throw new Error('缺少角色、心相或物品快照')
      }
      this._buildIndex()
      this.ready = true
      globalThis.logger?.info('[r1999] 数据载入: 角色' + this.characters.length + ' 心相' + this.psychubes.length + ' 物品' + this.items.length)
      return true
    } catch (e) { globalThis.logger?.error('[r1999] 数据载入失败: ' + e.message); return false }
  }
  _buildIndex() {
    const mk = () => ({ byName: new Map(), byId: new Map() })
    this._idx = { character: mk(), psychube: mk(), item: mk() }
    for (const c of this.characters) this._add(this._idx.character, c)
    for (const p of this.psychubes) this._add(this._idx.psychube, p)
    for (const i of this.items) this._add(this._idx.item, i)
  }
  _add(idx, obj) {
    idx.byId.set(obj.id, obj)
    for (const n of [obj.name, obj.nameZh]) {
      if (n) {
        const key = n.toLowerCase().replace(/\s+/g, '')
        if (!idx.byName.has(key)) idx.byName.set(key, [])
        if (!idx.byName.get(key).includes(obj.id)) idx.byName.get(key).push(obj.id)
      }
    }
  }
  _search(idx, q, limit = Infinity) {
    const query = String(q || '').toLowerCase().trim().replace(/\s+/g, '')
    if (!query) return []
    if (idx.byName.has(query)) return idx.byName.get(query).slice(0, limit)
    const scores = new Map()
    const push = (id, score) => scores.set(id, Math.max(scores.get(id) || 0, score))
    if (/^\d+$/.test(query)) {
      const num = Number(query)
      if (idx.byId.has(num)) push(num, 9500)
      for (const id of idx.byId.keys()) if (String(id).startsWith(query) && id !== num) push(id, 5000)
    }
    for (const [name, ids] of idx.byName) {
      const s = fuzzyScore(query, name)
      if (s > 0) for (const id of ids) push(id, s)
    }
    const out = Array.from(scores, ([id, score]) => ({ id, score }))
    out.sort((a, b) => b.score - a.score || a.id - b.id)
    return out.slice(0, limit).map(x => x.id)
  }
  searchCharacter(q, limit) { this.load(); return this._search(this._idx.character, q, limit) }
  searchPsychube(q, limit) { this.load(); return this._search(this._idx.psychube, q, limit) }
  searchItem(q, limit) { this.load(); return this._search(this._idx.item, q, limit) }
  getCharacter(id) { this.load(); return this._idx.character.byId.get(Number(id)) }
  getPsychube(id) { this.load(); return this._idx.psychube.byId.get(Number(id)) }
  getItem(id) { this.load(); return this._idx.item.byId.get(Number(id)) }
  psychubesByRarity(r) { this.load(); return this.psychubes.filter(p => p.rarity === Number(r)).sort((a,b)=>a.id-b.id) }
    charactersByRarity(r) { this.load(); return this.characters.filter(c => c.rarity === Number(r)).sort((a,b)=>a.id-b.id) }
  charactersByAfflatus(a) { this.load(); return this.characters.filter(c => c.afflatus === a).sort((a,b)=>b.rarity-a.rarity || a.id-b.id) }
  rarityCounts() { this.load(); const m = {}; for (const c of this.characters) { const k = c.rarityName || ('R'+c.rarity); m[k] = (m[k]||0)+1 } return m }
  afflatusCounts() { this.load(); const m = {}; for (const c of this.characters) { const k = c.afflatusName || c.afflatus; m[k] = (m[k]||0)+1 } return m }
  stats() {
    this.load()
    return { characters: this.characters.length, psychubes: this.psychubes.length, items: this.items.length, builtAt: this.meta.builtAt }
  }
}
export default new DB()
