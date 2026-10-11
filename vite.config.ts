import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'

function serveLocalDirectory(urlPrefix: string, directory: string): Plugin {
  const root = resolve(directory)
  const mimeTypes: Record<string, string> = {
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.moc3': 'application/octet-stream',
    '.png': 'image/png',
  }

  return {
    name: `local-only:${urlPrefix}`,
    configureServer(server: ViteDevServer) {
      server.middlewares.use(urlPrefix, (request, response, next) => {
        let requestedPath: string
        try {
          requestedPath = decodeURIComponent((request.url ?? '/').split('?')[0])
        } catch {
          response.statusCode = 400
          response.end('Invalid path')
          return
        }

        const filePath = resolve(root, `.${requestedPath}`)
        if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
          response.statusCode = 403
          response.end('Forbidden')
          return
        }
        if (!existsSync(filePath) || !statSync(filePath).isFile()) {
          next()
          return
        }

        response.setHeader('Content-Type', mimeTypes[extname(filePath)] ?? 'application/octet-stream')
        createReadStream(filePath).pipe(response)
      })
    },
  }
}

function serveMygoCatalog(directory: string): Plugin {
  const root = resolve(directory)
  const assetsRoot = resolve(root, '../assets')
  return {
    name: 'local-mygo-catalog',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/mygo-model-catalog.json', (_request, response) => {
        const catalog = (existsSync(root) ? readdirSync(root, { withFileTypes: true }) : [])
          .filter((entry) => entry.isDirectory())
          .flatMap((member) => readdirSync(resolve(root, member.name), { withFileTypes: true })
            .filter((outfit) => outfit.isDirectory() && existsSync(resolve(root, member.name, outfit.name, 'index.json')))
            .map((outfit) => ({
              character: member.name,
              outfit: outfit.name,
              thumbnail: existsSync(resolve(assetsRoot, `${outfit.name}.png`)),
            })))
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(JSON.stringify(catalog))
      })
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'local-cubism2-runtime-script',
      apply: 'serve',
      transformIndexHtml(html) {
        const runtimePath = resolve('work/mygo-reference/public/live2d.min.js')
        if (!existsSync(runtimePath)) return html
        return html.replace('</head>', '    <script src="/mygo-runtime/live2d.min.js"></script>\n  </head>')
      },
    },
    serveLocalDirectory('/models/mygo', resolve('work/mygo-reference/public/model')),
    serveLocalDirectory('/mygo-assets', resolve('work/mygo-reference/public/assets')),
    serveLocalDirectory('/mygo-runtime', resolve('work/mygo-reference/public')),
    serveMygoCatalog(resolve('work/mygo-reference/public/model')),
  ],
  server: {
    host: '127.0.0.1',
  },
})
