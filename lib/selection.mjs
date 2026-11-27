// 多结果分页 / 序号选择的临时状态存储（按 userId|sessionId 隔离）
// payload 为任意对象，含 ids(数组) + renderFn(渲染函数) + header + pageSize
const pending = new Map()
const TTL = 5 * 60 * 1000

export function rememberSelect(userId, sessionId, payload, pageSize = 5) {
  const key = userId + '|' + sessionId
  const state = Object.assign({ page: 0, pageSize, time: Date.now() }, payload)
  pending.set(key, state)
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
  const maxPage = Math.max(0, Math.ceil(p.ids.length / p.pageSize) - 1)
  p.page = Math.min(maxPage, Math.max(0, p.page + delta))
  p.time = Date.now()
  return p
}
export function clearSelect(userId, sessionId) {
  pending.delete(userId + '|' + sessionId)
}
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of pending) if (now - v.time > TTL) pending.delete(k)
}, TTL)