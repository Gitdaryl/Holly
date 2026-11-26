// npm test: run every test/*-test.mjs in its own process with the Blob mock registered.
import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
const files = readdirSync(new URL('../test/', import.meta.url)).filter((f) => f.endsWith('-test.mjs')).sort()
let failed = 0
for (const f of files) {
  console.log(`\n# ${f}`)
  const r = spawnSync(process.execPath, ['--import', './test/register.mjs', `test/${f}`], { stdio: 'inherit' })
  if (r.status !== 0) failed++
}
console.log(`\n${files.length - failed} of ${files.length} test files passed`)
process.exit(failed ? 1 : 0)
