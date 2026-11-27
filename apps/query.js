import db from '../lib/db.mjs'
import { rulePrefix, rarityName } from '../lib/constants.mjs'
import { rememberSelect, peekSelect, updatePage } from '../lib/selection.mjs'

const RARITY_KEYS = { '六星':6, '六':6, '6星':6, '五星':5, '五':5, '5星':5, '四星':4, '四':4, '4星':4, '三星':3, '三':3, '3星':3, '二星':2, '二':2, '2星':2 }
const AFFLATUS_KEYS = { '木': 'Plant', '星': 'Star', '岩': 'Mineral', '兽': 'Beast', '灵': 'Intellect', '智': 'Spirit' }

export class R1999Query extends plugin {
  constructor() {
    super({
      name: '[r1999]图鉴',
      dsc: '重返未来1999图鉴查询',
      event: 'message',
      priority: 500,
      rule: [
        { reg: `^${rulePrefix}(角色|人物|arcanist)\\s*(.*)$`, fnc: 'queryCharacter' },
        { reg: `^${rulePrefix}(心相|psychube)\\s*(.*)$`, fnc: 'queryPsychube' },
        { reg: `^${rulePrefix}(物品|item)\\s*(.*)$`, fnc: 'queryItem' },
        { reg: `^${rulePrefix}(图鉴状态|状态)\\s*$`, fnc: 'status' },
        { reg: `^${rulePrefix}(下一页|上一页)\\s*$`, fnc: 'turnPage' },
        { reg: `^${rulePrefix}[1-9]\\s*$`, fnc: 'pick' }
      ]
    })
  }
  _uid() { return String(this.e?.user_id || '0') }
  _sid() { return String(this.e?.session_id || '') }
  async queryCharacter() {
    const q = this._kw().trim()
    if (!q) {
      const rc = db.rarityCounts(); const ac = db.afflatusCounts()
      const rl = Object.entries(rc).map(([k,v])=>k+' '+v).join(' / ')
      const al = Object.entries(ac).map(([k,v])=>k+' '+v).join(' / ')
      return await this.reply('【1999 角色】\n稀有度: '+rl+'\n属性: '+al+'\n\n用法：#角色 <名/稀有度/属性>，如 #角色 六星 / 木 / 槲寄生')
    }
    if (RARITY_KEYS[q]) {
      const list = db.charactersByRarity(RARITY_KEYS[q])
      return this._paginate(list.map(c=>c.id), '【'+q+'角色】', id=>this._charLine(id))
    }
    if (AFFLATUS_KEYS[q]) {
      const list = db.charactersByAfflatus(AFFLATUS_KEYS[q])
      return this._paginate(list.map(c=>c.id), '【'+q+'属性角色】', id=>this._charLine(id))
    }
    const ids = db.searchCharacter(q)
    if (!ids.length) return await this.reply('未找到「'+q+'」，试试 #角色 六星 / 木')
    if (ids.length === 1) return await this.reply(this._charDetail(ids[0]))
    return this._paginate(ids, '【1999 角色】', id=>this._charDetail(id))
  }
  async queryPsychube() {
    const q = this._kw().trim()
    if (!q) return await this.reply('用法：#心相 <名称/稀有度>，如 #心相 六星 / Gluttony')
    if (RARITY_KEYS[q]) {
      const list = db.psychubesByRarity(RARITY_KEYS[q])
      return this._paginate(list.map(p=>p.id), '【'+q+'心相】', id=>{ const p=db.getPsychube(id); return p.name+'（'+rarityName(p.rarity)+'）' })
    }
    const ids = db.searchPsychube(q)
    if (!ids.length) return await this.reply('未找到心相「'+q+'」')
    return this._paginate(ids, '【1999 心相】', id=>{ const p=db.getPsychube(id); return p.name+'（'+rarityName(p.rarity)+'）'+(p.impression?'\n　'+p.impression:'') })
  }
  async queryItem() {
    const q = this._kw().trim()
    if (!q) return await this.reply('用法：#物品 <名称>')
    const ids = db.searchItem(q)
    if (!ids.length) return await this.reply('未找到物品「'+q+'」')
    return this._paginate(ids, '【1999 物品】', id=>{ const i=db.getItem(id); return i ? (i.name+'（'+(i.rarityName||'')+'）') : ('#'+id) })
  }
  async status() {
    db.load(); const s = db.stats()
    return await this.reply('【1999图鉴数据】\n角色: '+s.characters+'\n心相: '+s.psychubes+'\n物品: '+s.items+'\n构建: '+s.builtAt)
  }
  // 存 id 列表 + 渲染函数，使分页始终可用且选中显示详情
  _paginate(ids, header, renderFn) {
    if (!ids.length) return this.reply(header+' 无结果')
    const uid=this._uid(), sid=this._sid()
    rememberSelect(uid, sid, { ids, renderFn, header }, 7)
    return this._renderPage(uid, sid, 0)
  }
  _renderPage(uid, sid, page) {
    const p = peekSelect(uid, sid)
    if (!p) return this.reply('分页已过期，请重新查询')
    const start = page * p.pageSize
    const slice = p.ids.slice(start, start + p.pageSize)
    const maxPage = Math.max(0, Math.ceil(p.ids.length / p.pageSize) - 1)
    const body = slice.map((id,i)=> (start+i+1)+'. '+p.renderFn(id)).join('\n')
    const foot = '\n\n第 '+(page+1)+'/'+(maxPage+1)+' 页（回复序号看详情，#下一页/上一页）'
    return this.reply(p.header+'\n'+body+foot)
  }
  async turnPage() {
    const p = peekSelect(this._uid(), this._sid())
    if (!p) return await this.reply('没有分页，先查询试试')
    const isNext = String(this.e?.msg||'').includes('下一页')
    const maxPage = Math.max(0, Math.ceil(p.ids.length / p.pageSize) - 1)
    const page = isNext ? Math.min(maxPage, p.page+1) : Math.max(0, p.page-1)
    updatePage(this._uid(), this._sid(), isNext ? 1 : -1)
    return this._renderPage(this._uid(), this._sid(), page)
  }
  async pick() {
    const p = peekSelect(this._uid(), this._sid())
    if (!p) return await this.reply('没有可选的搜索结果，先查询试试')
    const n = Number((this.e?.msg||'').replace(/^[#\/\s]+/,''))
    if (!n || n < 1 || n > p.ids.length) return await this.reply('序号超出范围')
    const idx = p.page * p.pageSize + n - 1
    if (idx < 0 || idx >= p.ids.length) return await this.reply('序号超出范围')
    return await this.reply(p.renderFn(p.ids[idx]))
  }
  _kw() {
    const msg = this.e?.msg || ''
    const m = msg.replace(/^[#\/\s]+/, '').match(/(?:角色|人物|arcanist|心相|psychube|物品|item)\s+(.*)$/i)
    return m ? m[1].trim() : ''
  }
  _charLine(id) {
    const c = db.getCharacter(id)
    if (!c) return '#'+id
    const nm = c.nameZh ? (c.nameZh+' ('+c.name+')') : c.name
    const skills = (c.skills||[]).filter((s,i,a)=>a.findIndex(x=>x.name===s.name)===i).map(s=>s.name).join(' / ')
    return nm+' '+c.rarityName+'｜'+c.afflatusName+'｜'+(skills||'无技能')+(c.ritual?'｜仪式:'+c.ritual.name:'')+(c.released?'':'（未实装）')
  }
  _charDetail(id) {
    const c = db.getCharacter(id)
    if (!c) return '#'+id
    const nm = c.nameZh ? (c.nameZh+' ('+c.name+')') : c.name
    const extra = [c.rarityName, c.afflatusName].filter(Boolean).concat(c.dmgTypeName?[c.dmgTypeName]:[]).concat(c.tags&&c.tags.length?['['+c.tags.join('/')+']']:[]).join('｜')
    const lines = ['【'+nm+'】'+extra+(c.released?'':'（未实装）')]
    const seen = new Set()
    for (const s of (c.skills||[])) {
      if (seen.has(s.name)) continue
      seen.add(s.name)
      const effLine = s.effect ? (s.desc && s.desc !== s.effect ? '\n　'+s.desc : '')+'\n　'+s.effect : (s.desc ? '\n　'+s.desc : '')
      lines.push('『'+s.name+'』'+effLine)
    }
    if (c.ritual) lines.push('【至终的仪式】'+c.ritual.name+(c.ritual.desc ? '\n　'+c.ritual.desc : ''))
    return lines.join('\n')
  }
}