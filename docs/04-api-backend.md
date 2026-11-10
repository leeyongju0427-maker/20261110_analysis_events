# 04. Node.js 백엔드 및 API 구현 지침

## 1. 백엔드 역할

백엔드는 브라우저와 외부 서비스(OpenAI, Supabase) 사이의 안전한 중계 역할을 한다.

- 요청 데이터 검증
- OpenAI API 호출
- AI 응답 형식 검증 및 정규화
- Supabase에 최소 통계 메타데이터 저장
- 브라우저에 정해진 JSON 형식으로 응답

Vercel Serverless Function으로 `api/analyze.js`를 구현한다.

## 2. API 명세

### `POST /api/analyze`

요청 헤더:
`Content-Type: application/json`

요청 본문:

```json
{
  "text": "오늘은 정말 즐거운 하루였어."
}
```

성공 응답(HTTP 200):

```json
{
  "ok": true,
  "result": {
    "sentiment": "positive",
    "sentimentLabel": "긍정",
    "confidence": 91,
    "reason": "즐거움과 만족을 나타내는 표현이 문장의 중심입니다."
  }
}
```

실패 응답 예시:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "분석할 문장을 입력해 주세요."
  }
}
```

## 3. HTTP 상태 코드와 오류 코드

| HTTP | 코드 | 의미 | 사용자 안내 |
|---|---|---|---|
| 400 | `INVALID_INPUT` | 빈 값/문자열 아님 | 문장을 입력해 주세요. |
| 413 | `TEXT_TOO_LONG` | 1,000자 초과 | 1,000자 이하로 입력해 주세요. |
| 405 | `METHOD_NOT_ALLOWED` | POST 이외 요청 | 올바른 방식으로 요청해 주세요. |
| 429 | `RATE_LIMITED` | 과도한 요청 또는 공급자 한도 | 잠시 후 다시 시도해 주세요. |
| 502 | `AI_RESPONSE_INVALID` | AI 결과 검증 실패 | 결과를 처리하지 못했습니다. 다시 시도해 주세요. |
| 503 | `AI_UNAVAILABLE` | OpenAI 일시 장애 | 잠시 후 다시 시도해 주세요. |
| 500 | `SERVER_ERROR` | 설정 누락/서버 오류 | 일시적인 오류입니다. 잠시 후 다시 시도해 주세요. |

실제 공급자 오류 메시지, API 키, 내부 스택 트레이스를 브라우저에 노출하지 않는다.

## 4. 서버 처리 순서

1. HTTP 메서드가 POST인지 확인한다.
2. 요청 본문이 JSON인지 확인한다.
3. `text`가 문자열인지 확인한다.
4. 앞뒤 공백을 제거한다.
5. 공백 제거 후 1자 이상인지 확인한다.
6. 글자 수가 1,000자 이하인지 확인한다.
7. 서버 환경 변수 `OPENAI_API_KEY`와 `OPENAI_MODEL`을 확인한다.
8. OpenAI 공식 SDK를 통해 구조화된 JSON 출력을 요청한다.
9. 응답의 필수 필드, 허용된 감성 값, 신뢰도 범위, 이유 길이를 검증한다.
10. 결과를 정규화한다.
11. Supabase 통계 기록을 시도한다. 기록 실패는 분석 성공을 실패로 바꾸지 않는다.
12. 표준 성공 JSON을 반환한다.

## 5. 서버 검증 규칙

- `sentiment`: `positive`, `negative`, `neutral`만 허용.
- `confidence`: 정수 0~100만 허용.
- `reason`: 비어 있지 않은 문자열, 최대 500자.
- `sentimentLabel`: 서버에서 감성 코드에 따라 생성한다. AI가 준 라벨을 그대로 신뢰하지 않는다.
- AI가 잘못된 JSON을 반환하거나 필드가 빠지면 `AI_RESPONSE_INVALID`로 처리한다.
- 모델이 반환한 이유 문장에 HTML이 포함되어도 브라우저는 `textContent`로 출력한다.

## 6. OpenAI 호출

- OpenAI API 키는 서버 환경 변수에서만 읽는다.
- 현재 SDK의 Responses API 사용법을 확인해 구현한다.
- 구형 Chat Completions 예제의 `messages` 파라미터를 Responses API 요청에 그대로 사용하지 않는다. Responses API에서는 해당 입력이 `input` 구조를 사용한다.
- 구조화된 출력(JSON Schema 또는 SDK가 지원하는 동등 기능)을 사용해 응답 형식을 제한한다.
- 모델명은 `OPENAI_MODEL` 환경 변수에서 읽는다.
- 모델이 제공하지 않는 파라미터를 추측해서 넣지 않는다.
- API 타임아웃과 예외 처리를 구현한다.

## 7. 오류 처리 및 로그

- 클라이언트 응답에는 안전한 오류 코드와 짧은 메시지만 포함한다.
- 서버 로그에는 오류 종류와 요청 식별 정보 등 최소한의 운영 정보만 남긴다.
- 입력 원문, OpenAI 키, Supabase 키, 전체 AI 응답을 로그에 남기지 않는다.
- 원문을 포함한 디버깅 로그를 임시로 추가했다면 배포 전에 제거한다.

## 8. 완료 기준

- POST 요청만 허용한다.
- 입력값 검증이 서버에서 수행된다.
- OpenAI 응답이 검증된 경우에만 성공을 반환한다.
- 모든 실패 응답은 일관된 JSON 형식을 가진다.
- API 키가 브라우저 소스/네트워크 응답에 노출되지 않는다.
- Supabase 기록 장애가 분석 결과 전달을 막지 않는다.
