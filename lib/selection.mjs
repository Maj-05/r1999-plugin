const pending = new Map()
const ttl = 300000

export function rememberSelect(uid, sid, state) {
  pending.set(JSON.stringify([uid, sid]), { ...state, expires: Date.now() + ttl })
}
export function clearSelect(uid, sid) {
  pending.delete(JSON.stringify([uid, sid]))
}
export function peekSelect(uid, sid) {
  const state = pending.get(JSON.stringify([uid, sid]))
  if (state?.expires > Date.now()) return state
  clearSelect(uid, sid)
  return null
}
setInterval(() => {
  for (const [key, state] of pending) if (state.expires <= Date.now()) pending.delete(key)
}, ttl).unref()
