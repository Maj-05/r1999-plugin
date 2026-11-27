import { rulePrefix } from '../lib/constants.mjs'
import { query, detail, pageResult } from '../lib/query.mjs'
import { rememberSelect, peekSelect, clearSelect } from '../lib/selection.mjs'

export class R1999Query extends plugin {
  constructor() {
    super({ name: '[r1999]图鉴', dsc: '重返未来1999图鉴查询', event: 'message', priority: 500, rule: [
      { reg: '^' + rulePrefix + '(?:(?:角色|人物|arcanist|心相|psychube|物品|item).*|(?:图鉴状态|状态)\\s*)$', fnc: 'lookup' },
      { reg: '^[#/](?:r?1999)\\s*(?:帮助)?$', fnc: 'lookup' },
      { reg: '^' + rulePrefix + '(下一页|上一页|[1-9]\\d*)\\s*$|^[1-9]\\d*$', fnc: 'navigate' }
    ] })
  }
  keys() {
    const e = this.e
    return [String(e.user_id), JSON.stringify([e.self_id, e.group_id, e.guild_id, e.channel_id, e.session_id])]
  }
  command() {
    return String(this.e.msg).replace(/^[#/](?:r?1999)?\s*/i, '').trim()
  }
  async lookup() {
    const result = query(this.command())
    clearSelect(...this.keys())
    return this.send(result)
  }
  async send(result) {
    if (result.state) {
      rememberSelect(...this.keys(), result.state)
      return this.reply(result.text + '\n回复显示的序号看详情，或发送 #下一页 / #上一页。')
    }
    return this.reply(result.text)
  }
  async navigate() {
    const state = peekSelect(...this.keys())
    if (!state) return false
    const cmd = this.command()
    if (/^\d+$/.test(cmd)) {
      const id = state.ids[Number(cmd) - 1]
      return this.reply(id == null ? '序号超出范围' : detail(state.kind, id))
    }
    return this.send(pageResult(state, state.page + (cmd === '下一页' ? 1 : -1)))
  }
}
