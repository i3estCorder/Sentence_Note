import React from 'react'
import {
  Sparkles,
  BookOpen,
  RotateCw,
  Volume2,
  Layers,
  ArrowRight,
  ArrowLeft,
  Menu,
  CheckCircle2,
  Lightbulb,
  Zap,
} from 'lucide-react'

interface AboutViewProps {
  onNavigateToLibrary: () => void
  onNavigateToAdd: () => void
  onOpenMobileMenu?: () => void
}

export const AboutView: React.FC<AboutViewProps> = ({
  onNavigateToLibrary,
  onNavigateToAdd,
  onOpenMobileMenu,
}) => {
  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#eae6dc]/60 dark:border-[#23352f]">
        <button
          type="button"
          onClick={onNavigateToLibrary}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#486358] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-[#ede9df] dark:hover:bg-[#1b2b27] group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Library</span>
        </button>

        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-[#3d5249] dark:text-[#a0b5ab] hover:bg-[#eae6dc] dark:hover:bg-[#1b2b27] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12382c] via-[#1a4a3b] to-[#0e2a21] text-white p-7 sm:p-10 shadow-lg border border-[#235845]">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#dcf2e6]/20 text-[#a7f3d0] border border-[#a7f3d0]/30 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#34d399]" />
            <span>Next-Gen Context Language Vault</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            SentVault <span className="text-[#a7f3d0] font-normal text-2xl sm:text-3xl">(센트볼트)</span>
          </h1>

          <p className="text-sm sm:text-base text-[#c4ded3] leading-relaxed">
            단순히 단어만 따로 외우는 공부는 실제 대화에서 바로 입 밖으로 나오지 않습니다.
            <br className="hidden sm:inline" />
            <strong>SentVault</strong>는 <span className="text-white font-semibold">실제 문맥(Context) 속 예문</span>과
            <span className="text-white font-semibold"> N:M 색인(Multi-Index) 구조</span>, 그리고
            <span className="text-[#a7f3d0] font-semibold"> Anki식 과학적 SRS 복습 알고리즘</span>을 결합한 스마트 언어 자산 보관소입니다.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={onNavigateToLibrary}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#12382c] hover:bg-[#f6f4ee] active:scale-[0.98] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Library 둘러보기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNavigateToAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#225a47] text-[#e4ede8] hover:bg-[#2b6d56] active:scale-[0.98] font-semibold text-xs sm:text-sm border border-[#3b7c65] shadow-xs transition-all cursor-pointer"
            >
              <span>+ 새 문장 등록하기</span>
            </button>
          </div>
        </div>

        {/* Background Decorative Element */}
        <div className="absolute right-4 -bottom-10 opacity-10 pointer-events-none select-none hidden md:block">
          <BookOpen className="w-72 h-72 text-white stroke-[1]" />
        </div>
      </section>

      {/* Core Philosophies (4 Key Pillars) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#12382c] dark:text-[#e4ede8] tracking-tight">
            왜 SentVault인가요? (핵심 가치)
          </h2>
          <p className="text-xs sm:text-sm text-[#5f756c] dark:text-[#8ea49a] mt-1">
            시중의 평범한 단어장과 차별화되는 SentVault만의 핵심 메커니즘입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pillar 1 */}
          <div className="bg-white dark:bg-[#14201c] rounded-2xl p-6 border border-[#ece8df] dark:border-[#23352f] shadow-xs hover:shadow-sm transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#dcf2e6] dark:bg-[#183d2f] text-[#12382c] dark:text-[#34d399] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-[#12382c] dark:text-[#e4ede8]">
              1. N:M 멀티 인덱스 구조 (Multi-Index Linking)
            </h3>
            <p className="text-xs sm:text-sm text-[#556c61] dark:text-[#8ea49a] leading-relaxed">
              한 문장에는 여러 숙어·표현이 들어있을 수 있고, 반대로 하나의 핵심 표현은 수많은 실제 예문에서 다르게 쓰입니다. SentVault는 문장과 인덱스 단어를 자유자재로 연결하여 표현 간의 관계를 입체적으로 학습할 수 있습니다.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white dark:bg-[#14201c] rounded-2xl p-6 border border-[#ece8df] dark:border-[#23352f] shadow-xs hover:shadow-sm transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#e0e7ff] dark:bg-[#1e1b4b] text-[#3730a3] dark:text-[#a5b4fc] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-[#12382c] dark:text-[#e4ede8]">
              2. Google Photos 스타일 초고속 색인 탐색
            </h3>
            <p className="text-xs sm:text-sm text-[#556c61] dark:text-[#8ea49a] leading-relaxed">
              우측의 <strong>알파벳 북마크 책갈피 탭</strong>과 스크롤 시 나타나는 <strong>플로팅 색인 버블</strong>을 통해 수천 개의 문장 속에서도 원하는 알파벳 철자(A~Z)로 0.1초 만에 날아갈 수 있습니다.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white dark:bg-[#14201c] rounded-2xl p-6 border border-[#ece8df] dark:border-[#23352f] shadow-xs hover:shadow-sm transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#fef3c7] dark:bg-[#382d13] text-[#b45309] dark:text-[#fcd34d] flex items-center justify-center font-bold">
              <RotateCw className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-[#12382c] dark:text-[#e4ede8]">
              3. Anki식 과학적 SRS (망각 곡선 주기 복습)
            </h3>
            <p className="text-xs sm:text-sm text-[#556c61] dark:text-[#8ea49a] leading-relaxed">
              에빙하우스 망각 곡선을 바탕으로, 오늘 잊어버릴 타이밍이 된 카드만 선별해 4단계 난이도(Again, Hard, Good, Easy) 평가로 복습 주기를 자동 연장하여 단기 기억을 영구 장기 기억으로 전환합니다.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white dark:bg-[#14201c] rounded-2xl p-6 border border-[#ece8df] dark:border-[#23352f] shadow-xs hover:shadow-sm transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#fce7f3] dark:bg-[#391729] text-[#be185d] dark:text-[#f472b6] flex items-center justify-center font-bold">
              <Volume2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-[#12382c] dark:text-[#e4ede8]">
              4. 애플/삼성 네이티브 음성 & 능동 회상
            </h3>
            <p className="text-xs sm:text-sm text-[#556c61] dark:text-[#8ea49a] leading-relaxed">
              Apple Siri 및 Samsung Bixby 최적화 고품질 TTS로 원어민 억양을 바로 청취할 수 있으며, 번역은 기본적으로 숨겨져 있어 뇌가 원문의 의미를 먼저 스스로 유추하는 능동 회상(Active Recall)을 유도합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step User Guide */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#12382c] dark:text-[#e4ede8] tracking-tight">
            상세 사용 방법 (How to Use)
          </h2>
          <p className="text-xs sm:text-sm text-[#5f756c] dark:text-[#8ea49a] mt-1">
            SentVault를 200% 활용하는 5단계 가이드입니다.
          </p>
        </div>

        <div className="space-y-3">
          {/* Step 1 */}
          <div className="bg-white dark:bg-[#14201c] rounded-2xl p-5 sm:p-6 border border-[#ece8df] dark:border-[#23352f] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-lg bg-[#12382c] dark:bg-[#1d5743] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-sm sm:text-base font-bold text-[#12382c] dark:text-[#e4ede8]">
                  새 문장과 인덱스 등록하기 (New sentence)
                </h4>
                <p className="text-xs sm:text-sm text-[#556c61] dark:text-[#8ea49a] leading-relaxed">
                  우측 상단 <strong>New sentence</strong> 버튼을 클릭하고 영어 원문을 입력합니다. 
                  그 아래 <span className="font-semibold text-[#12382c] dark:text-[#a7f3d0]">인덱스 키워드</span> 칸에 문장 속 핵심 표현을 쉼표(,)로 구분해 여러 개 입력하세요. (예: <code className="px-1.5 py-0.5 rounded bg-[#f0ede6] dark:bg-[#253932] text-xs">show off, at the party</code>)
                  문장 본문에서 해당 표현이 자동으로 하이라이트됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-[#14201c] rounded-2xl p-5 sm:p-6 border border-[#ece8df] dark:border-[#23352f] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-lg bg-[#12382c] dark:bg-[#1d5743] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-sm sm:text-base font-bold text-[#12382c] dark:text-[#e4ede8]">
                  Library에서 모드 전환 (Index별 vs Sentence별)
                </h4>
                <p className="text-xs sm:text-sm text-[#556c61] dark:text-[#8ea49a] leading-relaxed">
                  Library 화면 상단의 탭 버튼으로 두 가지 뷰를 오갈 수 있습니다:
                  <br />
                  &bull; <strong>Index 뷰</strong>: 인덱스 단어(phrase) 기준으로 그룹화되어 알파벳 챕터별로 예문들을 묶어서 확인합니다.
                  <br />
                  &bull; <strong>Sentence 뷰</strong>: 내가 등록한 모든 문장을 한 줄씩 나열해 보며, 발음 듣기 및 번역 보기를 빠르게 수행합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-[#14201c] rounded-2xl p-5 sm:p-6 border border-[#ece8df] dark:border-[#23352f] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-lg bg-[#12382c] dark:bg-[#1d5743] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-sm sm:text-base font-bold text-[#12382c] dark:text-[#e4ede8]">
                  카드 클릭으로 상세 팝업 확인 (Detail Modal)
                </h4>
                <p className="text-xs sm:text-sm text-[#556c61] dark:text-[#8ea49a] leading-relaxed">
                  카드를 클릭하면 예문 선택 버튼(Example 1, Example 2...)이 제공되는 상세 모달이 열립니다. 동일한 인덱스 표현이 여러 문장에서 각각 어떻게 활용되는지 문맥별 뉘앙스를 대조해 볼 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-[#14201c] rounded-2xl p-5 sm:p-6 border border-[#ece8df] dark:border-[#23352f] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-lg bg-[#12382c] dark:bg-[#1d5743] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-sm sm:text-base font-bold text-[#12382c] dark:text-[#e4ede8]">
                  Review 탭에서 매일 복습하기 (SRS Anki Flow)
                </h4>
                <p className="text-xs sm:text-sm text-[#556c61] dark:text-[#8ea49a] leading-relaxed">
                  사이드바의 <strong>Review</strong>로 이동하면 오늘 복습해야 할 카드가 나타납니다. 문장을 읽고 머릿속으로 의미를 인출한 후 <strong>뜻 확인하기</strong>를 누르면 4개의 평가 버튼이 나타납니다. 기억 상태에 맞게 누르면 다음 복습 간격이 지능적으로 계산됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white dark:bg-[#14201c] rounded-2xl p-5 sm:p-6 border border-[#ece8df] dark:border-[#23352f] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-lg bg-[#12382c] dark:bg-[#1d5743] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                5
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-sm sm:text-base font-bold text-[#12382c] dark:text-[#e4ede8]">
                  데이터 백업 & 기기 간 이전 (Export & Import JSON)
                </h4>
                <p className="text-xs sm:text-sm text-[#556c61] dark:text-[#8ea49a] leading-relaxed">
                  모든 데이터는 브라우저의 안전한 로컬 저장소에 보관됩니다. Library 상단의 <strong>Export JSON</strong>을 누르면 백업 파일(.json)이 저장되며, 스마트폰이나 다른 컴퓨터에서 <strong>Import JSON</strong>을 눌러 언제든 온전히 복원할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pro Tips Section */}
      <section className="bg-[#faf9f5] dark:bg-[#182621] rounded-2xl p-6 sm:p-8 border border-[#dedad0] dark:border-[#283d36] space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-500" />
          <h3 className="text-base sm:text-lg font-bold text-[#12382c] dark:text-[#e4ede8]">
            SentVault 학습 꿀팁 (Pro Tips)
          </h3>
        </div>

        <ul className="space-y-3 text-xs sm:text-sm text-[#4d6359] dark:text-[#a0b5ab]">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>동사 시제 자동 인식</strong>: 인덱스에 <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#20342e] font-semibold">show off</code>를 등록해 두면, 예문 본문에 과거형인 <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#20342e] font-semibold">showed off</code>나 진행형 <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#20342e] font-semibold">showing off</code>가 쓰여도 알아서 인식하여 노란색으로 강조해 줍니다.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>동반 인덱스 다른 색상 구분</strong>: 한 문장에 둘 이상의 인덱스가 등록되어 있으면, 현재 보고 있는 주 인덱스는 <span className="bg-[#fef08a] text-[#12382c] px-1.5 py-0.5 rounded font-bold">노란색</span>, 문장에 함께 등록된 다른 부 인덱스는 <span className="bg-[#bae6fd] text-[#0369a1] px-1.5 py-0.5 rounded font-bold">하늘색</span>으로 명확히 구별되어 표현 간 시너지를 높여줍니다.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>즐겨찾기(Favorites) 모아보기</strong>: 특히 자주 잊어버리거나 스피킹에서 꼭 써먹고 싶은 문장은 별표(★)를 눌러두세요. Favorites 탭에서 즉시 복습할 수 있습니다.
            </span>
          </li>
        </ul>
      </section>

      {/* Footer Branding */}
      <footer className="pt-6 border-t border-[#eae6dc]/60 dark:border-[#23352f] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7c8d85] dark:text-[#6a8076]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#133d2e] dark:bg-[#1d5743] text-white flex items-center justify-center font-bold text-[10px]">
            SV
          </div>
          <span className="font-semibold text-[#12382c] dark:text-[#c4ded3]">SentVault</span>
          <span>&bull; Smart Index & Context Sentence Vault</span>
        </div>
        <div>
          <span>Crafted for serious language learners</span>
        </div>
      </footer>
    </div>
  )
}
