import test from 'node:test'
import assert from 'node:assert/strict'
import { query } from '../lib/query.mjs'

test('exact ID, Chinese name and multiword English name resolve to the same skills', () => {
  const card = query('角色10001').text
  assert.equal(card, query('角色 槲寄生').text)
  assert.equal(card, query('arcanist druvis iii').text)
  assert.match(card, /3阶 单体攻击/)
  assert.match(card, /至终的仪式/)
})

test('psychube amplification and material sources come from the offline snapshot', () => {
  assert.match(query('心相 Yearning Desire').text, /增幅 5 .*16%/)
  assert.match(query('物品 Rhine Gold').text, /来源 .*Craft in the Wilderness/)
})

test('combined filters and explicit pages', () => {
  const page = query('角色 六星 木')
  assert.ok(page.state.ids.length > 1)
  assert.match(page.text, /六星 · 木/)
  assert.match(query('角色 六星 第2页').text, /\n8\..*\n/s)
  assert.match(query('角色 露西').text, /智/)
})

test('Yunzai selection uses displayed numbers and isolates group sessions', async () => {
  globalThis.plugin = class {}
  const { R1999Query } = await import('../apps/query.js')
  const bot = new R1999Query()
  bot.e = { msg: '#r1999角色六星', user_id: 1, group_id: 2 }
  bot.reply = s => s
  await bot.lookup()
  bot.e.msg = '#下一页'
  const page = await bot.navigate()
  const id = page.match(/8\..*ID (\d+)/)[1]
  bot.e.msg = '8'
  assert.equal(await bot.navigate(), query('角色 ' + id).text)
  bot.e.group_id = 3
  assert.equal(await bot.navigate(), false)
})
