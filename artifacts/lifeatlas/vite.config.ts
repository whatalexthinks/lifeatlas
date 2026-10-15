import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import { marketingPages } from './src/data/marketing-pages';


/** Mirrors next.config.ts headers() for dev/preview: security headers + noindex on private routes. */
const PRIVATE_ROUTE = /^\/(contribute|gift|future|view|app|demo|checkout|proof)(\/|$)/;
function lifeatlasHeaders(): Plugin {
  const base = (process.env.BASE_PATH ?? '/').replace(/\/$/, '');
  const middleware = (req: { url?: string; headers: Record<string, string | string[] | undefined> }, res: { setHeader(k: string, v: string): void; end(body: string): void }, next: () => void) => {
    let p = (req.url ?? '/').split('?')[0];
    if (base && p.startsWith(base)) p = p.slice(base.length) || '/';
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');
    if (PRIVATE_ROUTE.test(p)) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    if (p === '/sitemap.xml' || p === '/robots.txt') {
      const header = (name: string) => String(req.headers[name] ?? '').split(',')[0].trim();
      const origin = process.env.VITE_SITE_URL || `${header('x-forwarded-proto') || 'http'}://${header('x-forwarded-host') || header('host')}`;
      const root = new URL(base || '/', origin).href.replace(/\/$/, '');
      if (p === '/robots.txt') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(`User-agent: *\nAllow: /\n${['/app', '/view', '/contribute', '/gift/', '/future', '/checkout', '/demo', '/proof', '/r/'].map(p => `Disallow: ${base}${p}`).join('\n')}\nSitemap: ${root}/sitemap.xml\n`);
      } else {
        const dedicated = ['how-it-works', 'couples', 'families', 'personal', 'legacy', 'gifts', 'physical-capsules', 'pricing', 'examples', 'faq', 'about', 'support', 'contact', 'privacy', 'terms'];
        const quiet = new Set(['privacy', 'terms', 'data-retention', 'accessibility', 'contact', 'support']);
        const xml = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', ...new Set([...dedicated, ...Object.keys(marketingPages)])].map(slug => `<url><loc>${xml(`${root}/${slug}`)}</loc><changefreq>monthly</changefreq><priority>${slug ? quiet.has(slug) ? '0.3' : '0.7' : '1'}</priority></url>`).join('')}</urlset>`);
      }
      return;
    }
    if (p.startsWith('/plates/')) {
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    next();
  };
  return {
    name: 'lifeatlas-headers',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    lifeatlasHeaders(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
