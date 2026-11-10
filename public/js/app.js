/**
 * ==============================================================================
 * 마음결 (Maeumgyeol) — 프론트엔드 메인 로직 (app.js)
 * 
 * [주요 기능]
 * 1. 실시간 글자 수 계산 및 제한 검사 (최대 1,000자)
 * 2. 폼 유효성 검사 (빈 입력, 공백 전용 입력 방지)
 * 3. 백엔드 API (/api/analyze) 비동기 호출
 * 4. textContent를 활용한 안전한 결과 렌더링 (XSS 보안 원칙 준수)
 * 5. 오류 상황별 친절한 안내 메시지 표시
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 주요 DOM 엘리먼트 가져오기
  const form = document.getElementById('sentiment-form');
  const textInput = document.getElementById('text-input');
  const charCount = document.getElementById('char-count');
  const analyzeButton = document.getElementById('analyze-button');
  const buttonText = analyzeButton.querySelector('.button-text');
  const spinner = analyzeButton.querySelector('.spinner');
  
  const statusMessage = document.getElementById('status-message');
  const resultSection = document.getElementById('result-section');
  const sentimentBadge = document.getElementById('sentiment-badge');
  const sentimentIcon = document.getElementById('sentiment-icon');
  const sentimentLabel = document.getElementById('sentiment-label');
  const confidenceValue = document.getElementById('confidence-value');
  const reasonText = document.getElementById('reason-text');

  // 서비스 안내 모달 관련 엘리먼트
  const navAboutLink = document.getElementById('nav-about-link');
  const aboutSection = document.getElementById('about-section');
  const closeAboutBtn = document.getElementById('close-about-btn');

  const MAX_LENGTH = 1000;

  // 2. 실시간 글자 수 카운팅 및 UI 반영
  textInput.addEventListener('input', () => {
    const currentLength = textInput.value.length;
    charCount.textContent = `${currentLength.toLocaleString()} / ${MAX_LENGTH.toLocaleString()}자`;

    if (currentLength > MAX_LENGTH) {
      charCount.style.color = '#D65A5A'; // 초과 시 붉은색
    } else {
      charCount.style.color = '#777E87';
    }

    // 입력 중에는 이전 에러 메시지 숨김
    if (statusMessage.style.display !== 'none') {
      hideStatusMessage();
    }
  });

  // 3. 서비스 안내 모달 열기/닫기
  if (navAboutLink && aboutSection && closeAboutBtn) {
    navAboutLink.addEventListener('click', (e) => {
      e.preventDefault();
      aboutSection.style.display = 'flex';
    });

    closeAboutBtn.addEventListener('click', () => {
      aboutSection.style.display = 'none';
    });

    aboutSection.addEventListener('click', (e) => {
      if (e.target === aboutSection) {
        aboutSection.style.display = 'none';
      }
    });
  }

  // 4. 감성 분석 폼 제출(Submit) 이벤트 처리
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // 브라우저 새로고침 방지

    const rawText = textInput.value;
    const trimmedText = rawText.trim();

    // [클라이언트 유효성 검사 1] 빈 문자열 또는 공백만 있는 경우
    if (!trimmedText) {
      showStatusMessage('분석할 문장을 입력해 주세요.');
      textInput.focus();
      return;
    }

    // [클라이언트 유효성 검사 2] 1,000자 초과 입력된 경우
    if (trimmedText.length > MAX_LENGTH) {
      showStatusMessage(`1,000자 이하로 입력해 주세요. (현재: ${trimmedText.length}자)`);
      textInput.focus();
      return;
    }

    // 로딩 상태 시작
    setLoadingState(true);
    hideStatusMessage();
    hideResultSection();

    try {
      // 5. 백엔드 Serverless Function (/api/analyze) 호출
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: trimmedText })
      });

      const data = await response.json();

      // 응답 처리
      if (response.ok && data.ok && data.result) {
        // [성공] 분석 결과 렌더링
        renderResult(data.result);
      } else {
        // [서버 반환 오류]
        const errorMessage = getFriendlyErrorMessage(data.error);
        showStatusMessage(errorMessage);
      }
    } catch (networkError) {
      // [네트워크 오류 또는 서버 접속 실패]
      showStatusMessage('네트워크 연결이 원활하지 않습니다. 서버가 실행 중인지 확인해 주세요.');
    } finally {
      // 로딩 상태 종료
      setLoadingState(false);
    }
  });

  // 6. 결과 렌더링 함수 (보안을 위해 innerHTML 대신 textContent 사용)
  function renderResult(result) {
    const { sentiment, sentimentLabel: label, confidence, reason } = result;

    // 감성 라벨 및 뱃지 스타일 초기화
    sentimentBadge.className = 'sentiment-badge';
    
    if (sentiment === 'positive') {
      sentimentBadge.classList.add('positive');
      sentimentIcon.textContent = '●';
    } else if (sentiment === 'negative') {
      sentimentBadge.classList.add('negative');
      sentimentIcon.textContent = '●';
    } else {
      sentimentBadge.classList.add('neutral');
      sentimentIcon.textContent = '●';
    }

    // 텍스트 출력
    sentimentLabel.textContent = label || (sentiment === 'positive' ? '긍정' : sentiment === 'negative' ? '부정' : '중립');
    confidenceValue.textContent = `${Math.min(100, Math.max(0, Math.round(confidence)))}%`;
    reasonText.textContent = reason;

    // 결과 섹션 표시
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // 7. 로딩 UI 상태 변경 함수
  function setLoadingState(isLoading) {
    if (isLoading) {
      analyzeButton.disabled = true;
      buttonText.textContent = '분석 중...';
      spinner.style.display = 'inline-block';
    } else {
      analyzeButton.disabled = false;
      buttonText.textContent = '감성 분석하기';
      spinner.style.display = 'none';
    }
  }

  // 8. 상태/에러 메시지 표시/숨김 함수
  function showStatusMessage(message) {
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
  }

  function hideStatusMessage() {
    statusMessage.textContent = '';
    statusMessage.style.display = 'none';
  }

  function hideResultSection() {
    resultSection.style.display = 'none';
  }

  // 9. 서버 오류 코드에 따른 친절한 안내 메시지 변환
  function getFriendlyErrorMessage(error) {
    if (!error) {
      return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    }

    switch (error.code) {
      case 'INVALID_INPUT':
        return '문장을 입력해 주세요.';
      case 'TEXT_TOO_LONG':
        return '1,000자 이하로 입력해 주세요.';
      case 'RATE_LIMITED':
        return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
      case 'AI_RESPONSE_INVALID':
        return '분석 결과를 처리하지 못했습니다. 다시 시도해 주세요.';
      case 'AI_UNAVAILABLE':
        return 'AI 서비스가 일시적으로 원활하지 않습니다. 잠시 후 다시 시도해 주세요.';
      case 'SERVER_ERROR':
        return error.message || '서버 설정 또는 일시적 오류입니다. 잠시 후 다시 시도해 주세요.';
      default:
        return error.message || '일시적인 오류입니다. 잠시 후 다시 시도해 주세요.';
    }
  }
});

