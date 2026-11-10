# 01. 프로젝트 생성 및 폴더 구조

## 1. 개발 환경

필수 준비물:
- Node.js LTS 버전
- Visual Studio Code 또는 Antigravity
- OpenAI API 키
- Supabase 프로젝트
- Vercel 계정
- Git 저장소(배포를 위해 권장)

Node.js 버전은 Vercel에서 지원하는 LTS 버전을 사용한다. 특정 버전을 임의로 오래 고정하지 말고 배포 시점의 Vercel 지원 버전을 확인한다.

## 2. 목표 폴더 구조

에이전트는 아래 구조를 기준으로 파일을 만든다.

```text
maeumgyeol/
├─ AGENTS.md
├─ PRD.md
├─ package.json
├─ vercel.json
├─ .gitignore
├─ .env.example
├─ index.html
├─ public/
│  ├─ css/
│  │  └─ styles.css
│  └─ js/
│     └─ app.js
├─ api/
│  └─ analyze.js
└─ docs/
   ├─ 01-project-structure.md
   ├─ 02-ui-design.md
   ├─ 03-frontend.md
   ├─ 04-api-backend.md
   ├─ 05-database-privacy.md
   └─ 06-ai-prompt-testing-deploy.md
```

## 3. 파일별 역할

| 파일 | 역할 |
|---|---|
| `index.html` | 화면의 의미 구조와 입력·결과 영역 |
| `public/css/styles.css` | 색상, 배치, 반응형 UI |
| `public/js/app.js` | 입력 검증, 버튼, API 요청, 결과 렌더링 |
| `api/analyze.js` | 서버 API, OpenAI 호출, 결과 검증, Supabase 기록 |
| `package.json` | Node.js 패키지와 실행 스크립트 |
| `vercel.json` | Vercel 배포 설정(필요한 경우에만 최소 설정) |
| `.env.example` | 환경 변수 이름과 설명만 제공하는 예시 파일 |
| `.gitignore` | `.env`, `node_modules` 등 제외 |

## 4. 패키지 원칙

- OpenAI 공식 Node SDK를 사용한다.
- Supabase 공식 JavaScript SDK를 사용한다.
- 프론트엔드는 별도 프레임워크 없이 순수 HTML/CSS/JavaScript로 구현한다.
- 불필요한 패키지는 추가하지 않는다.
- `package.json`의 실제 설치 버전과 사용 API가 일치하는지 확인한다.

## 5. 환경 변수 예시

`.env.example`에는 아래 이름과 설명만 작성한다. 실제 키를 넣지 않는다.

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

로컬에서 실제 값을 사용할 때는 `.env` 파일을 만들고 Git에 커밋하지 않는다. Vercel에서는 프로젝트 설정의 Environment Variables에 동일한 이름으로 등록한다.

## 6. 생성·실행 완료 기준

- 위 폴더 구조가 생성되어 있다.
- `npm install`이 오류 없이 완료된다.
- `npm run dev` 또는 프로젝트에 정의된 로컬 실행 명령이 동작한다.
- 정적 화면은 API 키가 없어도 열 수 있다.
- 실제 분석 요청은 서버 환경 변수가 설정된 경우에만 성공한다.
- `.env`가 Git 추적 대상에서 제외되어 있다.
