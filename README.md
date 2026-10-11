# Sentence Note (Sentence Vault)

영어 예문 속 핵심 표현과 다중 색인(Multi-Index)을 체계적으로 수집하고, 망각 곡선에 맞춘 **Anki 방식의 간격 반복(SRS)**으로 복습할 수 있는 모던 영어 학습 웹 애플리케이션입니다.

## ✨ 주요 기능

1. **다중 색인 관리 (Multi-Index Sentence Vault)**
   - 한 문장 안에 포함된 여러 핵심 표현(구동사, 숙어, 주요 단어)을 동시에 색인 등록 및 관리
   - 동사 변형(시제, 분리형 구동사 `breathed N into ~` 등) 자동 감지 및 스마트 하이라이트

2. **2-Tier 그룹형 라이브러리 (Sentence Library)**
   - 알파벳 챕터(A~Z)와 유니크 색인 카드 단위의 2단계 계층형 뷰
   - 빠른 스크롤 점프 북마크 레일 및 플로팅 인덱스 버블
   - 문장별 개별 수정, 삭제, 즐겨찾기 관리

3. **Anki 스타일의 간격 반복 복습 (Review & Practice)**
   - SM-2 간격 반복(Spaced Repetition System) 알고리즘 적용
   - 4단계 복습 평가: **Again** (< 10m, 세션 내 재출제), **Hard**, **Good**, **Easy**
   - Anki 3색 덱 카운터 (New, Learn, Due) 및 키보드 단축키 지원 (`Space`, `1~4`)
   - 타겟 표현 블라인드 마스킹, 사전 뜻, 한국어 번역, 메모 및 원어민 TTS 발음 듣기

4. **데이터 백업 및 복원**
   - 전체 문장 및 색인 데이터 JSON Export / Import 지원
   - 브라우저 로컬스토리지 자동 동기화

## 🛠 기술 스택

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Testing & Quality**: Vitest, React Testing Library, Oxlint

## 🚀 시작하기

```bash
# 패키지 설치
npm install

# 로컬 개발 서버 실행
npm run dev

# 테스트 실행
npm test

# 린트 및 빌드
npm run lint
npm run build
```
