import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appsDir = path.join(__dirname, 'apps')
const files = fs.readdirSync(appsDir).filter(f => f.endsWith('.js'))
logger.info('-------------------------')
logger.info('r1999-plugin 载入成功!')
logger.info('-------------------------')
let ret = files.map(f => import(`./apps/${f}`))
ret = await Promise.allSettled(ret)
const apps = {}
for (const i in files) {
  const name = files[i].replace('.js', '')
  if (ret[i].status !== 'fulfilled') { logger.error(`载入错误: ${name}`); logger.error(ret[i].reason); continue }
  const exps = ret[i].value
  let cls = null
  for (const k of Object.keys(exps)) {
    const v = exps[k]
    if (typeof v === 'function' && /^class\s/.test(Function.prototype.toString.call(v))) { cls = v; break }
  }
  apps[name] = cls || Object.values(exps)[0]
}
export { apps }
