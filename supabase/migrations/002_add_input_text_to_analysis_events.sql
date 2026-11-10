-- ==============================================================================
-- 002_add_input_text_to_analysis_events.sql
-- 마음결 (Maeumgyeol) 감성 분석 서비스 - 사용자 입력 텍스트 저장 컬럼 추가
-- 
-- [변경 목적]
-- 사용자가 입력한 분석 대상 문장을 Supabase의 analysis_events 테이블에 함께 기록하여,
-- 어떤 문장에 대해 감성 분석이 수행되었는지 대시보드에서 조회할 수 있도록 지원합니다.
-- ==============================================================================

-- 1. analysis_events 테이블에 input_text 컬럼 추가 (이미 존재하지 않는 경우에만 추가)
alter table public.analysis_events
add column if not exists input_text text;

-- 2. 컬럼 설명 주석 등록
comment on column public.analysis_events.input_text is '사용자가 감성 분석을 위해 입력한 원문 문장';

