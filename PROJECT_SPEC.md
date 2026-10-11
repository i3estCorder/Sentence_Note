# Sentence Note — 종합 개발 명세 및 아키텍처 가이드 (PROJECT SPEC)

> **버전**: v1.0.0  
> **최종 수정일**: 2026-10-11  
> **저장소**: [github.com/i3estCorder/Sentence_Note](https://github.com/i3estCorder/Sentence_Note)  
> **목적**: 본 문서는 `Sentence Note`의 전체 시스템 아키텍처, 데이터 모델, 핵심 비즈니스 로직(Anki SRS, 스마트 하이라이트 등), UI/UX 디자인 시스템 및 추후 확장 개발을 위한 레퍼런스 문서입니다.

---

## 1. 프로젝트 개요 (Overview)

**Sentence Note**는 영어 예문 속 핵심 표현과 다중 색인(Multi-Index)을 체계적으로 수집하고, 에빙하우스 망각 곡선에 맞춘 **Anki 방식의 간격 반복(SRS - Spaced Repetition System)**으로 복습할 수 있는 모던 영어 학습 웹 애플리케이션입니다.

### 핵심 가치 및 문제 해결
- **단어 단독 암기의 한계 극복**: 단어/숙어를 맥락(Context Sentence) 속에서 학습합니다.
- **다중 색인(Multi-Index) 지원**: 한 문장 안에 존재하는 여러 개의 주요 표현(구동사, 숙어, 주요 어휘)을 문장 하나에 동시에 연결하여 중복 입력 없이 관리합니다.
- **동사 시제 및 분리형 구동사 자동 감지**: 원형뿐만 아니라 과거형(`breathed`), 진행형(`showing off`), 분리형(`breathed [new life] into`)을 지능적으로 감지하여 하이라이트합니다.
- **실전 Anki 알고리즘 통합**: 단순 슬라이드쇼가 아닌, 실제 Anki의 SM-2 알고리즘과 큐(Queue) 관리, 단축키 및 덱 카운터를 지원합니다.

---

## 2. 기술 스택 및 환경 (Tech Stack)

| 계층 | 기술 | 버전 / 상세 |
| :--- | :--- | :--- |
| **Language** | TypeScript | v5.9 (Strict Type-checking) |
| **Framework** | React | v19.2 (Functional Components & Hooks) |
| **Build Tool** | Vite | v8.3 (Fast HMR & ESM Client Bundling) |
| **Styling** | Tailwind CSS | v4.2 (Utility-First, Custom Design Tokens) |
| **Icons** | Lucide React | v1.16 |
| **Testing** | Vitest, Testing Library | v5.0 (Unit & Integration Tests) |
| **Linting** | Oxlint | Fast Rust-based Linter (0 warnings, 0 errors) |
| **Storage** | Web LocalStorage API | 무서버 영속성 (`sentence_vault_v1`, `sentence_vault_anki_stats_v1`) |

---

## 3. 데이터 구조 및 타입 정의 (Data Models)

### 3.1 코어 인터페이스 (`src/types/index.ts`)

```typescript
// 1. 색인(인덱스) 표현 단위
export interface IndexPhrase {
  id: string              // 고유 식별자 (예: idx-17286421-a3f8)
  phrase: string          // 등록된 원형/키워드 표현 (예: "breathe into", "tucked away")
  meaning?: string        // 인덱스 표현의 한국어 뜻 (예: ~에 생기를 불어넣다)
}

// 2. 문장 데이터 단위
export interface SentenceData {
  id: string              // 고유 식별자 (예: sentence-1)
  text: string            // 영어 원문 예문
  translation?: string    // 한국어 해석
  notes?: string          // 추가 학습 정보, 문법 팁, 어원 등 (최대 1,000자)
  indexes: IndexPhrase[]  // 해당 문장에 연결된 1개 이상의 색인 목록
  isFavorite?: boolean    // 즐겨찾기 여부
}

// 3. 네비게이션 탭 ID
export type NavItemId = 'library' | 'review' | 'favorites' | 'edit-index'
```

### 3.2 Anki SRS 통계 데이터 인터페이스 (`src/components/ReviewView.tsx`)

```typescript
export type AnkiRating = 'again' | 'hard' | 'good' | 'easy'
export type CardState = 'new' | 'learning' | 'review'

export interface AnkiCardStats {
  id: string              // 카드 식별자 (`${sentenceId}_${indexId}`)
  reps: number            // 연속 정답 횟수 (기본: 0)
  interval: number        // 복습 간격(일 단위, 0은 당일 학습)
  easeFactor: number      // 난이도 계수 (기본: 2.5, 최소: 1.3)
  dueDate: string         // 다음 복습 예정일 (YYYY-MM-DD)
  state: CardState        // 'new' | 'learning' | 'review'
  lapses: number          // Again으로 실패한 총 횟수
  lastReviewed?: string   // 마지막 복습 일자
}
```

### 3.3 로컬 저장소 키 (LocalStorage Keys)
- `sentence_vault_v1`: 전체 문장 목록 (`SentenceData[]`)
- `sentence_vault_anki_stats_v1`: 각 카드별 Anki SRS 통계 맵 (`Record<string, AnkiCardStats>`)

---

## 4. 핵심 기능 명세 (Implemented Features)

### 4.1 다중 색인 관리 및 스마트 하이라이트 (`src/utils/highlight.tsx`)
- **불규칙 및 규칙 동사 변형 처리**:
  - `show` → `showing`, `showed`, `shown`, `shows`
  - `breathe` → `breathed`, `breathing`, `breathes`
  - `stumble` → `stumbled`, `stumbling` 등 50여 개 이상의 주요 영어 불규칙/규칙 동사 어형 사전 내장 (`src/utils/dictionary.ts`).
- **분리형 구동사 하이라이트**:
  - 예: 색인이 `breathe into`일 때, 문장의 `breathed new life into` 패턴에서 `breathed`와 `into`를 정확히 찾아내어 중간 목적어와 분리 하이라이트.
- **다중 색인 동시 색상 구분**:
  - 현재 선택/대상 색인: 형광 노랑 틴트 (`bg-[#fef08a] ring-1 ring-amber-300`)
  - 동일 문장 내 타 색인: 부드러운 스카이 블루 틴트 (`bg-[#bae6fd] text-[#0369a1]`)

### 4.2 2-Tier 계층형 라이브러리 (`src/components/LibraryView.tsx`)
- **Tier 1 (알파벳 챕터)**: 인덱스의 첫 글자(A, B, C...) 기준 챕터 분리.
- **Tier 2 (유니크 인덱스 카드)**: 동일한 색인 표현이 여러 문장에 쓰인 경우, 1개의 카드 안에 문장들을 그룹화(Grouping).
- **고속 점프 북마크 레일**: 화면 우측에 형광 북마크 인덱스 레일 고정 배치 → 클릭 시 해당 알파벳 섹션으로 부드러운 스크롤 이동.
- **플로팅 패스트 스크롤 버블**: Google Photos 스타일로 스크롤 중 현재 알파벳 및 단어 위치를 화면 우상단에 띄움.
- **정렬 옵션**: `Index (A → Z)`, `Index (Z → A)`, `Original` 정렬 지원.
- **사이드바 및 타이틀 카운트**: 실시간 전체 문장 수 표기 뱃지 제공.

### 4.3 Anki 간격 반복 복습 시스템 (`src/components/ReviewView.tsx`)
- **SM-2 알고리즘 구현**:
  - **Again**: `reps = 0`, `interval = 0`, `state = 'learning'`, `easeFactor -= 0.2`  
    👉 **핵심 로직**: 카드가 현재 세션 큐의 맨 뒤에 다시 삽입되어, 오늘 세션이 끝나기 전까지 반복 출제.
  - **Hard**: `reps += 1`, `interval = interval * 1.2`, `easeFactor -= 0.15`
  - **Good**: `reps += 1`, `interval = reps == 1 ? 1d : reps == 2 ? 3d : interval * easeFactor`
  - **Easy**: `reps += 1`, `interval = reps == 1 ? 4d : interval * easeFactor * 1.3`, `easeFactor += 0.15`
- **인터벌 미리보기**: 버튼 상단에 `< 10m`, `1d`, `3d`, `4d` 등 다음 복습 예정 간격이 실시간 계산되어 표기.
- **3색 덱 카운터**: 🔵 **New** (신규), 🔴 **Learn** (재학습 큐), 🟢 **Review** (오늘 복습).
- **키보드 단축키**:
  - `Space` / `Enter`: 정답 확인 (Reveal answer)
  - `1`: Again, `2`: Hard, `3`/`Space`: Good, `4`: Easy
- **원어민 음성 TTS**: Web Speech API (`SpeechSynthesisUtterance`) 연동.
- **세션 완료 뷰**: 큐 소진 시 축하 트로피 화면 및 세션 통계(Again, Good 횟수) 표기, '전체 다시 복습' 지원.

### 4.4 문장 및 색인 편집/관리 모달들
- `SentenceDetailModal.tsx`: 카드 클릭 시 상단에 뜨는 종합 상세 모달 (원문, 번역, 발음 듣기, 색인 뜻, 예문 스위처, 개별 수정/삭제).
- `EditSentenceModal.tsx`: 문장 텍스트, 한국어 번역, 색인 표현(쉼표 구분), 추가 메모(최대 1,000자) 수정.
- `NewSentenceModal.tsx`: 신규 문장 추가.
- `ConfirmationModal.tsx`: 삭제 전 안전 확인 모달.
- `JSON Export / Import`: 데이터 유실 방지를 위한 완전한 백업/복원 기능.

---

## 5. UI/UX 디자인 시스템 및 토큰 (Design Tokens)

일관된 사용자 경험을 위해 전체 컴포넌트에 통일된 Tailwind CSS 토큰이 적용되어 있습니다.

### 5.1 색상 체계 (Color Palette)
- **Primary Green (포레스트 딥그린)**: `#133d2e` (기본), `#0c2b20` (호버), `#081e16` (액티브)
- **Backgrounds (따뜻한 크림/웜화이트)**: `#f7f6f1` (전체 배경), `#faf9f5` (문장 박스), `#ffffff` (카드 배경)
- **Borders & Dividers**: `#ece7dc`, `#dedad0`, `#f2ede4`
- **Text Hierarchy**: `#12382c` (헤드라인), `#143d30` (영문 본문 세리프), `#5f756c` (보조 캡션)

### 5.2 버튼 디자인 표준 (Button Sizing)

| 버튼 유형 | 크기 사양 | Tailwind 클래스셋 |
| :--- | :--- | :--- |
| **Primary Regular** (신규 생성, 저장) | `h-9.5 (38px)` / `px-4` | `h-9.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#133d2e] hover:bg-[#0c2b20] active:scale-[0.98] text-white shadow-xs` |
| **Compact Action** (Edit index, 카드 푸터) | `h-8.5 (34px)` / `px-3.5` | `h-8.5 px-3.5 rounded-xl text-xs font-semibold bg-[#133d2e] hover:bg-[#0c2b20] active:scale-[0.98] text-white shadow-2xs` |
| **Secondary Regular** (Export/Import, 취소) | `h-9.5 (38px)` / `px-3.5~4`| `h-9.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-[#f6f4ee] border border-[#dedad0] text-[#12382c]` |
| **Compact Secondary** (문장 수정, 닫기) | `h-8.5 (34px)` / `px-3.5` | `h-8.5 px-3.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#f4efe5] border border-[#c4cfc9] text-[#12382c]` |
| **Ghost Icon Button** (즐겨찾기, 삭제 등) | `w-8 h-8 (32px)` 정사각 | `w-8 h-8 rounded-xl flex items-center justify-center text-[#8c9e96] hover:text-[#12382c] hover:bg-[#f6f4ee]` |

### 5.3 카드 컴포넌트 표준
- 모서리: `rounded-2xl`
- 테두리: `border border-[#ece7dc] hover:border-[#133d2e]/30`
- 그림자 & 인터랙션: `shadow-[0_2px_10px_-2px_rgba(20,50,40,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(20,50,40,0.08)] hover:-translate-y-0.5 transition-all duration-200`
- 내부 문장 박스: `p-3 sm:p-3.5 rounded-xl bg-[#faf9f5] border border-[#eeebe3]`

---

## 6. 디렉터리 및 파일 구조 (Project Architecture)

```
Sentences/
├── public/                     # 정적 에셋 (favicon, SVG 아이콘 등)
├── src/
│   ├── assets/                 # 이미지 리소스
│   ├── components/             # React UI 컴포넌트
│   │   ├── AddIndexModal.tsx       # 문장에 인덱스 추가 모달
│   │   ├── ConfirmationModal.tsx   # 공통 작업 삭제/확인 모달
│   │   ├── EditSentenceModal.tsx   # 문장별 내용, 번역, 메모 수정 모달
│   │   ├── FavoritesView.tsx       # 즐겨찾기(Favorites) 인덱스 카드 뷰
│   │   ├── Header.tsx              # 메인 편집 뷰 헤더
│   │   ├── IndexEditForm.tsx       # 색인 등록/수정/단어 추천 폼
│   │   ├── LibraryView.tsx         # 2-Tier 계층형 인덱스 라이브러리 뷰
│   │   ├── NewSentenceModal.tsx    # 신규 문장 추가 모달
│   │   ├── ReviewView.tsx          # Anki SRS 기반 간격 반복 복습 뷰
│   │   ├── SentenceDetailModal.tsx # 문장 및 인덱스 상세 팝업 모달
│   │   ├── SentenceDisplay.tsx     # 메인 화면 인터랙티브 문장 하이라이터
│   │   ├── SentenceIndexList.tsx   # 메인 우측 현재 문장 인덱스 칩 목록
│   │   ├── Sidebar.tsx             # 좌측 네비게이션 및 브랜드 바
│   │   └── Toast.tsx               # 피드백 토스트 알림 컴포넌트
│   ├── data/
│   │   └── mockData.ts             # 초기 영어 예문 및 인덱스 데이터
│   ├── test/
│   │   └── setup.ts                # Vitest 환경 셋업 (@testing-library/jest-dom)
│   ├── types/
│   │   └── index.ts                # 전역 타입 정의 (SentenceData, IndexPhrase 등)
│   ├── utils/
│   │   ├── dictionary.ts           # 동사 시제/불규칙 어형 사전 맵
│   │   ├── highlight.tsx           # 정규식 기반 구동사/변형 하이라이트 유틸
│   │   └── highlight.test.tsx      # 하이라이트 알고리즘 단위 테스트 (10개)
│   ├── App.tsx                     # 전역 상태 관리 및 네비게이션 라우팅
│   ├── App.test.tsx                # 통합 기능 및 컴포넌트 테스트 (17개)
│   ├── index.css                   # Tailwind v4 스타일시트
│   └── main.tsx                    # React 진입점
├── PROJECT_SPEC.md             # 본 개발 명세 문서
├── README.md                   # 프로젝트 리드미
├── package.json                # 의존성 및 스크립트
├── tsconfig.json               # TypeScript 설정
└── vite.config.ts              # Vite 설정
```

---

## 7. 검증 및 품질 현황 (Testing & QA)

현재 모든 코드는 다음 검증 파이프라인을 100% 통과하고 있습니다.

1. **정적 분석 (Linter)**:
   - `npm run lint` (`oxlint`) 실행 시: **0 errors, 0 warnings**
2. **타입 안정성 & 빌드**:
   - `npm run build` (`tsc -b && vite build`) 성공.
3. **단위 및 통합 테스트 (Vitest)**:
   - `npm test -- --run` 실행 시: **27 / 27 테스트 통과 (100% Pass)**
     - `src/utils/highlight.test.tsx` (10 tests): 대소문자, 시제 변형, 분리형 구동사 하이라이트 검증.
     - `src/App.test.tsx` (17 tests): 네비게이션, 모달 열기/닫기, Anki 복습 평가, 인덱스 추가/삭제, 브랜드명 일치 검증.

---

## 8. 추후 확장 개발 로드맵 (Future Roadmap)

추후 기능을 추가할 개발자를 위한 권장 확장 포인트입니다:

1. **Anki 통계 대시보드 (Heatmap & Stats Chart)**:
   - 일자별 복습 횟수(Github 스타일 잔디 히트맵), 기억 유지율(Retention Rate) 차트 추가.
2. **다크 모드 (Dark Mode)**:
   - Tailwind `dark:` 변형을 활용한 밤 시간대 눈 편한 저조도 테마 지원.
3. **클라우드 실시간 동기화**:
   - 현재 LocalStorage 기반 데이터를 Supabase 또는 Firebase Firestore와 연동하여 모바일-PC 기기 간 실시간 동기화.
4. **AI 문장 번역 및 작문 추천 (LLM API 연동)**:
   - 신규 문장 입력 시 한국어 번역 자동 생성 및 등록된 인덱스를 활용한 AI 예문 생성 기능.
5. **오디오 발음 커스터마이징**:
   - Web Speech API 외에 고품질 오픈소스 신경망 TTS (예: ElevenLabs, WebTTS 등) 옵션 제공.
