// Renders the app to static HTML after `vite build`, so the page is readable
// before (or without) the JS bundle. GitHub Pages has been slow enough from
// some regions that this is the difference between a page and a blank screen.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const dist = path.resolve('dist')
const serverDir = path.join(dist, '.server')

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const { render } = await import(pathToFileURL(path.join(serverDir, 'entry-server.js')).href)

let html = template.replace('<!--app-html-->', render())
if (html === template) throw new Error('prerender: <!--app-html--> outlet not found in dist/index.html')

// Inline the stylesheet. It is small (~6 KB gzipped), and as a separate file
// it blocks rendering: when the CDN edge stalls on that one request (seen at
// 27 s from Mumbai), the page stays blank even though the HTML has arrived.
// Inlined, first paint needs nothing but the HTML document.
html = html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g, (tag, href) => {
  const css = fs.readFileSync(path.join(dist, href), 'utf8')
  return `<style>${css}</style>`
})
if (/<link rel="stylesheet"[^>]*\/assets\//.test(html)) throw new Error('prerender: stylesheet was not inlined')

fs.writeFileSync(path.join(dist, 'index.html'), html)
fs.writeFileSync(path.join(dist, '404.html'), html)
fs.writeFileSync(path.join(dist, '.nojekyll'), '')
fs.rmSync(serverDir, { recursive: true, force: true })

console.log(`prerender: wrote index.html (${(html.length / 1024).toFixed(1)} KB) and 404.html`)
