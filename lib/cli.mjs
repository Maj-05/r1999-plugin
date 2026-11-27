import { query } from './query.mjs'
let input = ''
process.stdin.setEncoding('utf8')
for await (const chunk of process.stdin) input += chunk
console.log(JSON.stringify(query(JSON.parse(input).command)))
