import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getCurrentWeekString,
  isAllowedHostHeader,
  isAllowedOriginHeader,
  isAllowedRefererHeader,
  isForbiddenSystemPath,
  startStudioServer,
} from '../src/studio/studio-server.js';

describe('Local Loopback Security & Anti-CSRF Validation', () => {
  describe('isAllowedOriginHeader', () => {
    const port = 4310;

    it('allows omitted or empty Origin header for native AppKit and CLI callers', () => {
      expect(isAllowedOriginHeader(undefined, port)).toBe(true);
      expect(isAllowedOriginHeader('', port)).toBe(true);
    });

    it('allows valid loopback 127.0.0.1 and localhost origins matching the active port', () => {
      expect(isAllowedOriginHeader(`http://127.0.0.1:${port}`, port)).toBe(true);
      expect(isAllowedOriginHeader(`http://localhost:${port}`, port)).toBe(true);
      expect(isAllowedOriginHeader(`http://127.0.0.1:${port}/`, port)).toBe(true);
      expect(isAllowedOriginHeader(`http://localhost:${port}/`, port)).toBe(true);
    });

    it('blocks cross-site or malicious third-party origins', () => {
      expect(isAllowedOriginHeader('http://evil.com', port)).toBe(false);
      expect(isAllowedOriginHeader('https://attacker.org', port)).toBe(false);
      expect(isAllowedOriginHeader(`http://evil.com:${port}`, port)).toBe(false);
      expect(isAllowedOriginHeader(`https://localhost.attacker.com:${port}`, port)).toBe(false);
    });

    it('blocks mismatched port origins against local loopback', () => {
      expect(isAllowedOriginHeader('http://127.0.0.1:8080', port)).toBe(false);
      expect(isAllowedOriginHeader('http://localhost:3000', port)).toBe(false);
    });

    it('blocks null or malformed origin strings', () => {
      expect(isAllowedOriginHeader('null', port)).toBe(false);
      expect(isAllowedOriginHeader('javascript:void(0)', port)).toBe(false);
      expect(isAllowedOriginHeader('invalid-url-origin', port)).toBe(false);
    });
  });

  describe('isAllowedRefererHeader', () => {
    const port = 4310;

    it('allows omitted or empty Referer header', () => {
      expect(isAllowedRefererHeader(undefined, port)).toBe(true);
      expect(isAllowedRefererHeader('', port)).toBe(true);
    });

    it('allows valid loopback 127.0.0.1 and localhost referers', () => {
      expect(isAllowedRefererHeader(`http://127.0.0.1:${port}/`, port)).toBe(true);
      expect(isAllowedRefererHeader(`http://localhost:${port}/page`, port)).toBe(true);
    });

    it('rejects cross-site or mismatched port referers', () => {
      expect(isAllowedRefererHeader('http://evil.com/exploit', port)).toBe(false);
      expect(isAllowedRefererHeader(`http://127.0.0.1:${port + 1}/`, port)).toBe(false);
      expect(isAllowedRefererHeader('invalid-referer', port)).toBe(false);
    });
  });

  describe('isForbiddenSystemPath', () => {
    it('identifies filesystem root and system directories as forbidden', () => {
      expect(isForbiddenSystemPath('/')).toBe(true);
      expect(isForbiddenSystemPath('/etc')).toBe(true);
      expect(isForbiddenSystemPath('/etc/passwd')).toBe(true);
      expect(isForbiddenSystemPath('/var')).toBe(true);
      expect(isForbiddenSystemPath('/usr/local')).toBe(true);
    });

    it('allows user workspaces and safe project paths', () => {
      expect(isForbiddenSystemPath('/Users/alice/projects/deck')).toBe(false);
      expect(isForbiddenSystemPath('/home/runner/work/aimake')).toBe(false);
    });
  });

  describe('isAllowedHostHeader', () => {
    const port = 4310;

    it('allows strictly matching loopback host headers', () => {
      expect(isAllowedHostHeader(`127.0.0.1:${port}`, port)).toBe(true);
      expect(isAllowedHostHeader(`localhost:${port}`, port)).toBe(true);
      expect(isAllowedHostHeader(`LOCALHOST:${port}`, port)).toBe(true);
    });

    it('rejects external or mismatched host headers preventing DNS rebinding', () => {
      expect(isAllowedHostHeader(undefined, port)).toBe(false);
      expect(isAllowedHostHeader('evil.com', port)).toBe(false);
      expect(isAllowedHostHeader(`127.0.0.1:${port + 1}`, port)).toBe(false);
      expect(isAllowedHostHeader(`localhost:${port + 1}`, port)).toBe(false);
      expect(isAllowedHostHeader(`attacker.com:${port}`, port)).toBe(false);
    });
  });

  describe('getCurrentWeekString', () => {
    it('returns ISO week format string matching W\\d+', () => {
      const current = getCurrentWeekString();
      expect(current).toMatch(/^W\d{1,2}$/);
    });

    it('computes expected week numbers for known dates', () => {
      expect(getCurrentWeekString(new Date('2026-01-01T12:00:00Z'))).toBe('W1');
      expect(getCurrentWeekString(new Date('2026-11-24T12:00:00Z'))).toBe('W48');
    });
  });

  describe('HTTP Studio Server Anti-CSRF Interception', () => {
    it(
      'enforces Origin and Sec-Fetch-Site rules on mutating requests while leaving GET safe',
      async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-csrf-test-'));
      const deckPath = path.join(tmpDir, 'test.deck.md');
      await fs.writeFile(
        deckPath,
        `---
title: CSRF Guard Test
template: swiss-bold
aspect: "16:9"
---

# Slide 1
Security test content
`,
        'utf8'
      );

      await fs.mkdir(path.join(tmpDir, 'exports'), { recursive: true });
      const studio = await startStudioServer({
        deckPath,
        workspaceDir: tmpDir,
        exportBaseDir: path.join(tmpDir, 'exports'),
        registryPath: path.join(tmpDir, 'recent.json'),
      });

      try {
        const port = studio.port;
        const validOrigin = `http://127.0.0.1:${port}`;
        const validLocalhostOrigin = `http://localhost:${port}`;
        const invalidOrigin = 'https://malicious-website.com';

        // 1. Mutating POST without Origin (CLI/AppKit client) -> allowed (200)
        const cliPost = await fetch(`${studio.url}/api/markdown`, {
          method: 'POST',
          headers: {
            host: `127.0.0.1:${port}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ rawMarkdown: '# Updated by CLI' }),
        });
        expect(cliPost.status).toBe(200);

        // 2. Mutating POST with same-origin 127.0.0.1 Origin -> allowed (200)
        const sameOriginPost = await fetch(`${studio.url}/api/markdown`, {
          method: 'POST',
          headers: {
            host: `127.0.0.1:${port}`,
            origin: validOrigin,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ rawMarkdown: '# Updated by same-origin 127.0.0.1' }),
        });
        expect(sameOriginPost.status).toBe(200);

        // 3. Mutating POST with localhost Origin -> allowed (200)
        const localhostPost = await fetch(`${studio.url}/api/markdown`, {
          method: 'POST',
          headers: {
            host: `127.0.0.1:${port}`,
            origin: validLocalhostOrigin,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ rawMarkdown: '# Updated by localhost' }),
        });
        expect(localhostPost.status).toBe(200);

        // 4. Mutating POST with cross-site malicious Origin -> 403 Forbidden
        const evilPost = await fetch(`${studio.url}/api/markdown`, {
          method: 'POST',
          headers: {
            host: `127.0.0.1:${port}`,
            origin: invalidOrigin,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ rawMarkdown: '# Overwritten by attacker' }),
        });
        expect(evilPost.status).toBe(403);
        const evilJson = (await evilPost.json()) as { error: string };
        expect(evilJson.error).toContain('Origin forbidden');

        // 5. Mutating POST with null Origin (sandboxed iframe / data: URI) -> 403 Forbidden
        const nullOriginPost = await fetch(`${studio.url}/api/markdown`, {
          method: 'POST',
          headers: {
            host: `127.0.0.1:${port}`,
            origin: 'null',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ rawMarkdown: '# Overwritten by iframe' }),
        });
        expect(nullOriginPost.status).toBe(403);

        // 6. Mutating POST with Sec-Fetch-Site: cross-site -> 403 Forbidden
        const crossSiteSecFetch = await fetch(`${studio.url}/api/markdown`, {
          method: 'POST',
          headers: {
            host: `127.0.0.1:${port}`,
            'sec-fetch-site': 'cross-site',
            origin: validOrigin, // Even if spoofed or matching
            'content-type': 'application/json',
          },
          body: JSON.stringify({ rawMarkdown: '# Cross-site fetch attack' }),
        });
        expect(crossSiteSecFetch.status).toBe(403);
        const crossSiteJson = (await crossSiteSecFetch.json()) as { error: string };
        expect(crossSiteJson.error).toContain('Cross-site requests forbidden');

        // 7. Non-mutating GET with cross-site Origin / Sec-Fetch-Site -> allowed (200)
        const getCrossSite = await fetch(`${studio.url}/api/state`, {
          method: 'GET',
          headers: {
            host: `127.0.0.1:${port}`,
            origin: invalidOrigin,
            'sec-fetch-site': 'cross-site',
          },
        });
        expect(getCrossSite.status).toBe(200);

        // 8. Dynamic radar API returns current week and count
        const radarRes = await fetch(`${studio.url}/api/radar?limit=5`, {
          method: 'GET',
          headers: {
            host: `127.0.0.1:${port}`,
          },
        });
        expect(radarRes.status).toBe(200);
        const radarJson = (await radarRes.json()) as {
          ok: boolean;
          week?: string;
          count?: number;
          items?: unknown[];
        };
        expect(radarJson.ok).toBe(true);
        expect(radarJson.week).toMatch(/^W\d{1,2}$/);
        expect(typeof radarJson.count).toBe('number');
        expect(Array.isArray(radarJson.items)).toBe(true);

        // 9. DNS rebinding protection: invalid Host header returns 400
        const badHostStatus = await new Promise<number>((resolve, reject) => {
          const req = http.request(
            {
              hostname: '127.0.0.1',
              port,
              path: '/api/state',
              method: 'GET',
              headers: { Host: 'attacker-dns-rebind.com' },
            },
            (res) => resolve(res.statusCode ?? 0)
          );
          req.on('error', reject);
          req.end();
        });
        expect(badHostStatus).toBe(400);

        // 10. CapCut export in Studio server renders real slideImages and returns draft metadata
        const capcutRes = await fetch(`${studio.url}/api/export`, {
          method: 'POST',
          headers: {
            host: `127.0.0.1:${port}`,
            origin: validOrigin,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ format: 'capcut', installLocal: false }),
        });
        expect(capcutRes.status).toBe(200);
        const capcutJson = (await capcutRes.json()) as {
          ok: boolean;
          format: string;
          draftDir: string;
          artifacts: string[];
          appName: string;
        };
        expect(capcutJson.ok).toBe(true);
        expect(capcutJson.format).toBe('capcut');
        expect(capcutJson.draftDir).toBeDefined();
        expect(Array.isArray(capcutJson.artifacts)).toBe(true);

        const capcutSlidesDir = path.join(tmpDir, 'exports', 'capcut-slides');
        const slideFiles = await fs.readdir(capcutSlidesDir);
        expect(slideFiles.length).toBeGreaterThanOrEqual(1);
        expect(slideFiles.some((f) => f.endsWith('.png'))).toBe(true);

        // 11. Anti-CSRF: Mutating POST with cross-site Referer without Origin -> 403 Forbidden
        const evilRefererRes = await fetch(`${studio.url}/api/markdown`, {
          method: 'POST',
          headers: {
            host: `127.0.0.1:${port}`,
            referer: 'https://evil-attacker.com/csrf.html',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ rawMarkdown: '# Attacker CSRF via Referer' }),
        });
        expect(evilRefererRes.status).toBe(403);
        const evilRefererJson = (await evilRefererRes.json()) as { error: string };
        expect(evilRefererJson.error).toContain('Referer forbidden');

        // 12. Sandbox Escape Guard: /api/workspace/switch rejecting root '/' or system directories -> 403
        const switchRootRes = await fetch(`${studio.url}/api/workspace/switch`, {
          method: 'POST',
          headers: {
            host: `127.0.0.1:${port}`,
            origin: validOrigin,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ workspaceDir: '/' }),
        });
        expect(switchRootRes.status).toBe(403);
        const switchRootJson = (await switchRootRes.json()) as { error: string };
        expect(switchRootJson.error).toContain('system directories is forbidden');

        // 13. Path Traversal Guard: /api/remix rejecting escaping sourceDeckPath -> 403
        const remixEscapeRes = await fetch(`${studio.url}/api/remix`, {
          method: 'POST',
          headers: {
            host: `127.0.0.1:${port}`,
            origin: validOrigin,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ sourceDeckPath: '/etc/passwd' }),
        });
        expect(remixEscapeRes.status).toBe(403);

        // 14. SSE Stream connection and graceful client cleanup
        const sseController = new AbortController();
        const sseRes = await fetch(`${studio.url}/api/events`, {
          signal: sseController.signal,
          headers: { host: `127.0.0.1:${port}` },
        });
        expect(sseRes.status).toBe(200);
        expect(sseRes.headers.get('content-type')).toContain('text/event-stream');
        sseController.abort(); // simulate immediate client disconnect
      } finally {
        await studio.close();
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      }
    },
    30000
  );
  });
});
