/**
 * ==============================================================================
 * 마음결 (Maeumgyeol) — 로컬 개발용 웹 서버 (server.js)
 * 
 * [설명]
 * - Vercel CLI 설치 없이도 로컬에서 바로 프론트엔드 화면과 /api/analyze API를 테스트할 수 있는
 *   Node.js 내장 http 기반 개발용 서버입니다.
 * - IPv4(127.0.0.1)와 IPv6(localhost) 모두 원활하게 접속되도록 0.0.0.0에 바인딩합니다.
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

  // 2. 정적 파일 서빙 (index.html, public/...)
  let relativeFilePath = pathname === '/' ? 'index.html' : pathname;
  if (relativeFilePath.startsWith('/')) {
    relativeFilePath = relativeFilePath.slice(1);
  }

  const filePath = path.join(__dirname, relativeFilePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found - 파일을 찾을 수 없습니다.');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Server Error');
      }
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
