import db from '../lib/db.mjs'
import { rulePrefix, rarityName } from '../lib/constants.mjs'
export class R1999Query extends plugin {
  constructor() {
    super({
      name: '[r1999]图鉴',
      dsc: '重返未来1999图鉴查询',
      event: 'message',
      priority: 500,
      rule: [
        { reg: `^${rulePrefix}(角色|人物|arcanist)\\s*(.+)$`, fnc: 'queryCharacter' },
        { reg: `^${rulePrefix}(心相|psychube)\\s*(.+)$`, fnc: 'queryPsychube' },
        { reg: `^${rulePrefix}(物品|item)\\s*(.+)$`, fnc: 'queryItem' },
        { reg: `^${rulePrefix}(图鉴状态|状态)\\s*$`, fnc: 'status' }
      ]
    })
  }
  async queryCharacter() {
    const q = this._kw()
    if (!q) return await this.reply('用法：#角色 <名称或ID>，如 #角色 槲寄生')
    const ids = db.searchCharacter(q)
    if (!ids.length) return await this.reply(`未找到角色「${q}」`)
    const lines = ids.map(id => this._charLine(id))
    await this.reply('【重返未来1999 角色】\n' + lines.join('\n'))
    return true
  }
  async queryPsychube() {
    const q = this._kw()
    if (!q) return await this.reply('用法：#心相 <名称>')
    const ids = db.searchPsychube(q)
    if (!ids.length) return await this.reply(`未找到心相「${q}」`)
    const lines = ids.map(id => { const p = db.getPsychube(id); return `${p.name}（${rarityName(p.rarity)}）` })
    await this.reply('【1999 心相】\n' + lines.join('\n'))
    return true
  }
  async queryItem() {
    const q = this._kw()
    if (!q) return await this.reply('用法：#物品 <名称>')
    const ids = db.searchItem(q)
    if (!ids.length) return await this.reply(`未找到物品「${q}」`)
    const lines = ids.map(id => { const i = db.getItem(id); return i ? (i.name + '（' + (i.rarityName || '') + '）') : ('#' + id) })
    await this.reply('【1999 物品】\n' + lines.join('\n'))
    return true
  }
  async status() {
    db.load()
    const s = db.stats()
    await this.reply(`【1999图鉴数据】\n角色: ${s.characters}\n心相: ${s.psychubes}\n物品: ${s.items}\n构建: ${s.builtAt}`)
    return true
  }
  _kw() {
    const msg = this.e?.msg || ''
    const m = msg.replace(/^[#\/\s]+/, '').match(/(?:角色|人物|arcanist|心相|psychube|物品|item)\s+(.+)$/i)
    return m ? m[1].trim() : ''
  }
  _charLine(id) {
    const c = db.getCharacter(id)
    if (!c) return '#' + id
    const nm = c.nameZh ? (c.nameZh + ' (' + c.name + ')') : c.name
    const skills = (c.skills || [])
      .filter((s, i, a) => a.findIndex(x => x.name === s.name) === i)
      .map(s => s.name).join(' / ')
    return nm + ' ' + c.rarityName + '｜' + c.afflatusName + '｜' + (skills || '无技能')
      + (c.ritual ? '｜仪式:' + c.ritual.name : '')
      + (c.released ? '' : '（未实装）')
  }
}