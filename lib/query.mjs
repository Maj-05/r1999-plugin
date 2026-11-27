import db from './db.mjs'

const kinds = { 角色: 'character', 人物: 'character', arcanist: 'character', 心相: 'psychube', psychube: 'psychube', 物品: 'item', item: 'item' }
const sources = {
  character: { label: '角色', get: id => db.getCharacter(id), find: q => db.searchCharacter(q) },
  psychube: { label: '心相', get: id => db.getPsychube(id), find: q => db.searchPsychube(q) },
  item: { label: '物品', get: id => db.getItem(id), find: q => db.searchItem(q) }
}
const digits = '一二三四五六'
const help = '【重返未来：1999 图鉴】\n角色 槲寄生 · 角色 Druvis III\n角色 六星 木 · 角色 六星 第2页\n心相 Gluttony · 物品 87 · 图鉴状态\n按显示的 ID 查询详情。'
const size = 7

function title(row) {
  return row.nameZh && row.nameZh !== row.name ? row.nameZh + '（' + row.name + '）' : row.name
}

export function detail(kind, id) {
  const row = sources[kind].get(id)
  const lines = ['【' + title(row) + '】', ['ID ' + id, row.rarityName, row.afflatusName, row.dmgTypeName].filter(Boolean).join(' ｜ ')]
  if (kind === 'character') {
    if (!row.released) lines.push('快照标记：未实装')
    if (row.tags?.length) lines.push(row.tags.join(' / '))
    const groups = new Map()
    for (const skill of row.skills || []) {
      if (!groups.has(skill.name)) groups.set(skill.name, [])
      groups.get(skill.name).push(skill)
    }
    for (const [name, skills] of groups) {
      lines.push('『' + name + '』')
      if (skills[0].desc) lines.push(skills[0].desc)
      for (const skill of skills) {
        if (skill.effect) lines.push((skill.tier ? skill.tier + '阶 ' : '') + skill.effect)
      }
    }
    if (row.ritual) lines.push('【至终的仪式】' + row.ritual.name, row.ritual.desc, row.ritual.effect)
  }
  if (row.tag && row.tag !== 'None') lines.push(row.tag)
  for (const level of row.amplification || []) {
    if (level.Effect) lines.push('增幅 ' + level.Id + ' ｜ ' + level.Effect)
  }
  if (row.category) lines.push('类别 ｜ ' + row.category)
  if (row.description) lines.push(row.description)
  if (row.source) lines.push('来源 ｜ ' + row.source)
  if (row.usage) lines.push('用途 ｜ ' + row.usage)
  if (row.impression) lines.push('【印象】', row.impression)
  return lines.filter(Boolean).join('\n')
}

export function pageResult(state, requested) {
  const { kind, ids } = state
  const pages = Math.ceil(ids.length / size)
  const page = Math.min(pages, Math.max(1, requested))
  const start = (page - 1) * size
  const lines = ids.slice(start, start + size).map((id, i) => {
    const row = sources[kind].get(id)
    return (start + i + 1) + '. ' + title(row) + ' ｜ ' + [row.rarityName, row.afflatusName, 'ID ' + id].filter(Boolean).join(' · ')
  })
  return { text: ['【' + sources[kind].label + '】共 ' + ids.length + ' 条', ...lines, '第 ' + page + '/' + pages + ' 页'].join('\n'), state: { kind, ids, page } }
}

export function query(command) {
  const raw = command.trim()
  if (!db.load()) return { text: '图鉴数据不完整，请重新安装完整插件包。' }
  if (/^(图鉴状态|状态)$/.test(raw)) {
    const s = db.stats()
    return { text: '【1999 图鉴】角色 ' + s.characters + ' · 心相 ' + s.psychubes + ' · 物品 ' + s.items + '\n快照构建于 ' + s.builtAt }
  }
  const match = raw.match(/^(角色|人物|arcanist|心相|psychube|物品|item)\s*(.*)$/i)
  if (!match) return { text: help }
  const kind = kinds[match[1].toLowerCase()]
  const tail = match[2].match(/^(.*?)(?:\s+第\s*(\d+)\s*页)?$/)
  const q = tail[1].trim()
  if (!q && kind === 'character') {
    db.load()
    const counts = obj => Object.entries(obj).map(([key, n]) => key + ' ' + n).join(' · ')
    return { text: '【角色分布】\n' + counts(db.rarityCounts()) + '\n' + counts(db.afflatusCounts()) + '\n' + help }
  }
  if (!q) return { text: help }
  const filters = q.split(/\s+/)
  const criteria = []
  for (const token of filters) {
    const rarity = token.match(/^([一二三四五六1-6])星?$/)
    if (rarity) criteria.push(row => row.rarity === (Number(rarity[1]) || digits.indexOf(rarity[1]) + 1))
    else if (kind === 'character' && /^[兽星岩木灵智]$/.test(token)) criteria.push(row => row.afflatusName === token)
    else break
  }
  const filtered = criteria.length === filters.length
  db.load()
  const rows = { character: db.characters, psychube: db.psychubes, item: db.items }[kind]
  // Bare numeric IDs have priority; use “六星” or “6星” for filters.
  const exactId = /^\d+$/.test(q) && sources[kind].get(q)
  if (exactId) return { text: detail(kind, exactId.id) }
  const ids = filtered ? rows.filter(row => criteria.every(test => test(row))).map(row => row.id) : sources[kind].find(q)
  if (!ids.length) return { text: '未找到' + sources[kind].label + '「' + q + '」' }
  if (ids.length === 1) return { text: detail(kind, ids[0]) }
  return pageResult({ kind, ids }, Number(tail[2]) || 1)
}
