import type { IncomingHttpHeaders } from "node:http";
import type { RequestHandler } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const CLERK_FRONTEND_API = "https://frontend-api.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";

export function getClerkProxyHost(req: { headers: IncomingHttpHeaders }): string | undefined {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return raw?.split(",")[0]?.trim() || req.headers.host?.trim() || undefined;
}

export function clerkProxyMiddleware(): RequestHandler {
  if (process.env.NODE_ENV !== "production" || !process.env.CLERK_SECRET_KEY) {
    return (_req, _res, next) => next();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  return createProxyMiddleware({
    target: CLERK_FRONTEND_API,
    changeOrigin: true,
    selfHandleResponse: true,
    pathRewrite: (path) => path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq, req) => {
        const protocol = req.headers["x-forwarded-proto"] || "https";
        const host = getClerkProxyHost(req) || "";
        proxyReq.setHeader("Clerk-Proxy-Url", `${protocol}://${host}${CLERK_PROXY_PATH}`);
        proxyReq.setHeader("Clerk-Secret-Key", secretKey);

        const forwardedFor = req.headers["x-forwarded-for"];
        const clientIp =
          (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(",")[0]?.trim() ||
          req.socket.remoteAddress ||
          "";
        if (clientIp) proxyReq.setHeader("X-Forwarded-For", clientIp);
      },
      proxyRes: (proxyRes, req, res) => {
        const chunks: Buffer[] = [];
        proxyRes.on("data", (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
        proxyRes.on("error", () => res.destroy());
        proxyRes.on("end", () => {
          const status = proxyRes.statusCode ?? 502;
          const headers = { ...proxyRes.headers };
          delete headers["transfer-encoding"];
          delete headers.connection;
          delete headers["keep-alive"];

          const bodyless =
            req.method === "HEAD" ||
            status < 200 ||
            status === 204 ||
            status === 304;
          const body = bodyless ? Buffer.alloc(0) : Buffer.concat(chunks);
          if (status < 200 || status === 204) delete headers["content-length"];
          else headers["content-length"] = String(body.length);
          res.writeHead(status, headers);
          res.end(body);
        });
      },
    },
  });
}
