/* Tiny static server for looking at preview renders in a browser.
   Serves reports/ read-only on localhost. Nothing here is deployed. */
import {createServer} from 'node:http'
import {readFileSync, existsSync, readdirSync} from 'node:fs'
import {join, extname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {dirname} from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'reports')
const TYPES = {'.html': 'text/html; charset=utf-8', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.csv': 'text/csv'}
const port = Number(process.argv[2] ?? 4321)

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])
  if (url === '/') {
    const files = readdirSync(ROOT).filter(f => /\.(html|md|json|csv)$/.test(f)).sort()
    res.writeHead(200, {'content-type': 'text/html; charset=utf-8'})
    return res.end(`<h1>reports/</h1><ul>${files.map(f => `<li><a href="/${f}">${f}</a></li>`).join('')}</ul>`)
  }
  const file = join(ROOT, url.replace(/^\//, ''))
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end('not found') }
  res.writeHead(200, {'content-type': TYPES[extname(file)] ?? 'application/octet-stream'})
  res.end(readFileSync(file))
}).listen(port, () => console.log(`serving reports/ at http://127.0.0.1:${port}/`))
