/**
 * Serve the Vite production build from the API process (same origin as /api).
 * Spec §12 allows Express static or a reverse proxy; we keep raw node:http and
 * serve files ourselves so the API contract stays unchanged.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
export const DEFAULT_STATIC_DIR = join(PROJECT_ROOT, 'dist')

const MIME_BY_EXT: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

function envFlagTrue(raw: string | undefined): boolean {
  if (raw === undefined) return false
  const v = raw.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

function envFlagFalse(raw: string | undefined): boolean {
  if (raw === undefined) return false
  const v = raw.trim().toLowerCase()
  return v === '0' || v === 'false' || v === 'no' || v === 'off'
}

/**
 * Resolve the static root, or null to disable serving.
 * Default: on in production (dist/), off otherwise. Override with SERVE_STATIC / STATIC_DIR.
 */
export function resolveStaticDir(
  env: NodeJS.ProcessEnv = process.env,
  override?: string | null,
): string | null {
  if (override === null) return null
  if (typeof override === 'string') {
    const trimmed = override.trim()
    return trimmed ? resolve(trimmed) : null
  }

  if (envFlagFalse(env.SERVE_STATIC)) return null

  const fromEnv = env.STATIC_DIR?.trim()
  if (fromEnv) return resolve(fromEnv)

  const enabled =
    envFlagTrue(env.SERVE_STATIC) ||
    (env.NODE_ENV ?? '').trim().toLowerCase() === 'production'
  if (!enabled) return null

  return DEFAULT_STATIC_DIR
}

function safeJoin(root: string, urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split('?')[0] ?? '/')
  const relative = decoded.replace(/^\/+/, '')
  const candidate = resolve(root, relative)
  const rootWithSep = root.endsWith(sep) ? root : root + sep
  if (candidate !== root && !candidate.startsWith(rootWithSep)) {
    return null
  }
  // Reject weird normalized paths that escape via ".." after resolve (already covered)
  // and refuse to treat the root itself as a file when asking for empty path — caller uses index.
  if (normalize(candidate) !== candidate && !candidate.startsWith(root)) {
    return null
  }
  return candidate
}

function contentTypeFor(filePath: string): string {
  return MIME_BY_EXT[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

function sendFile(
  res: ServerResponse,
  filePath: string,
  method: string,
  status = 200,
): void {
  const stat = statSync(filePath)
  if (!stat.isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }
  const headers: Record<string, string | number> = {
    'Content-Type': contentTypeFor(filePath),
    'Content-Length': stat.size,
  }
  res.writeHead(status, headers)
  if (method === 'HEAD') {
    res.end()
    return
  }
  createReadStream(filePath).pipe(res)
}

/**
 * Try to serve a static file or SPA index.html.
 * Returns true if the response was handled (including 404 for missing assets).
 */
export function tryServeStatic(
  req: IncomingMessage,
  res: ServerResponse,
  staticDir: string,
  pathname: string,
): boolean {
  const method = req.method ?? 'GET'
  if (method !== 'GET' && method !== 'HEAD') return false

  if (!existsSync(staticDir)) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(
      `Static directory not found: ${staticDir}. Run npm run build, or set SERVE_STATIC=0.`,
    )
    return true
  }

  const indexPath = join(staticDir, 'index.html')
  const wantsIndex = pathname === '/' || pathname === ''

  if (wantsIndex) {
    if (!existsSync(indexPath)) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Built frontend missing (dist/index.html). Run npm run build.')
      return true
    }
    sendFile(res, indexPath, method)
    return true
  }

  const filePath = safeJoin(staticDir, pathname)
  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Invalid path')
    return true
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    sendFile(res, filePath, method)
    return true
  }

  // SPA fallback: client routes without a file extension → index.html
  const hasExtension = extname(pathname) !== ''
  if (!hasExtension && existsSync(indexPath)) {
    sendFile(res, indexPath, method)
    return true
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Not found')
  return true
}
