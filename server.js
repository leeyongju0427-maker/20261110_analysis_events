/**
 * ==============================================================================
 * 마음결 (Maeumgyeol) — 로컬 개발용 웹 서버 (server.js)
 * 
 * [설명]
 * - Vercel CLI 설치 없이도 로컬에서 바로 프론트엔드 화면과 /api/analyze API를 테스트할 수 있는 개발 서버입니다.
 * - IPv4(127.0.0.1)와 IPv6(localhost)를 모두 지원합니다.
 * - styles.css, app.js 등 정적 파일 요청 경로(/public/css/..., /css/..., /styles.css 등)를
 *   스마트하게 자동 감지하여 404 없이 서빙합니다.
 * ==============================================================================
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import handler from './api/analyze.js';

// .env 파일 로드
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// 확장자별 MIME 타입 매핑
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// 요청된 URL 경로에서 실제 파일 경로를 찾아내는 스마트 파일 탐색 함수
function resolveStaticFilePath(pathname) {
  let cleanPath = pathname === '/' ? 'index.html' : pathname;
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }

  const filename = path.basename(cleanPath);

  // 검색할 후보 경로 목록
  const candidates = [
    path.join(__dirname, cleanPath),                         // 1. 요청 경로 그대로
    path.join(__dirname, 'public', cleanPath),               // 2. public/ 아래 경로
    path.join(__dirname, 'public', 'css', filename),         // 3. public/css/ 파일명
    path.join(__dirname, 'public', 'js', filename)           // 4. public/js/ 파일명
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. API 라우트 (/api/analyze)
  if (pathname === '/api/analyze') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      try {
        req.body = bodyData ? JSON.parse(bodyData) : {};
      } catch (err) {
        req.body = {};
      }

      res.status = function(code) {
        this.statusCode = code;
        return this;
      };
      res.json = function(data) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
        this.end(JSON.stringify(data));
      };

      try {
        await handler(req, res);
      } catch (error) {
        console.error('[API 핸들러 에러]:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({
          ok: false,
          error: {
            code: 'SERVER_ERROR',
            message: '서버 내부 오류가 발생했습니다.'
          }
        }));
      }
    });
    return;
  }

  // 2. 정적 파일 서빙 (스마트 경로 매핑)
  const resolvedPath = resolveStaticFilePath(pathname);

  if (!resolvedPath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`404 Not Found - '${pathname}' 파일을 찾을 수 없습니다.`);
    return;
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(resolvedPath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Server Error');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`==================================================`);
  console.log(` 마음결(Maeumgyeol) 로컬 개발 서버가 시작되었습니다!`);
  console.log(` 브라우저에서 아래 주소 중 하나로 접속해 보세요:`);
  console.log(` 1) http://localhost:${PORT}`);
  console.log(` 2) http://127.0.0.1:${PORT}`);
  console.log(`==================================================`);
});
