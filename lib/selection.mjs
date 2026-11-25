// 多结果分页 / 序号选择的临时状态存储（按 sessionId 隔离）
const pending = new Map() // key: userId|sessionId -> { list, page, pageSize, header }
const TTL = 5 * 60 * 1000

export function rememberSelect(userId, sessionId, list, pageSize = 5, header = '') {
  const key = userId + '|' + sessionId
  pending.set(key, { list, page: 0, pageSize, header, time: Date.now() })
  return key
}
export function peekSelect(userId, sessionId) {
  const key = userId + '|' + sessionId
  const p = pending.get(key)
  if (p && Date.now() - p.time < TTL) return p
  pending.delete(key)
  return null
}
export function updatePage(userId, sessionId, delta) {
  const p = peekSelect(userId, sessionId)
  if (!p) return null
  const maxPage = Math.max(0, Math.ceil(p.list.length / p.pageSize) - 1)
  p.page = Math.min(maxPage, Math.max(0, p.page + delta))
  p.time = Date.now()
  return p
}
export function clearSelect(userId, sessionId) {
  pending.delete(userId + '|' + sessionId)
}
// 定时清理过期项
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of pending) if (now - v.time > TTL) pending.delete(k)
}, TTL)