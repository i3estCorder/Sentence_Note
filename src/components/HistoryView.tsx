import React, { useState, useMemo } from 'react'
import {
  GitBranch,
  GitCommit,
  Tag,
  Copy,
  Check,
  Search,
  ExternalLink,
  ArrowLeft,
  Menu,
  Clock,
} from 'lucide-react'

interface GitCommitItem {
  hash: string
  subject: string
  date: string
  author: string
  tag?: string
  branch?: string
  type: 'feat' | 'fix' | 'style' | 'chore' | 'docs' | 'refactor' | 'init'
}

// Complete Git Commit History for SentVault
const COMMIT_HISTORY: GitCommitItem[] = [
  {
    hash: '42a4004',
    subject: 'feat: Add History page with Git Graph timeline and tag release V1.0',
    date: '2026-10-12',
    author: 'Justin',
    tag: 'V1.0',
    branch: 'main',
    type: 'feat',
  },
  {
    hash: 'bd0de12',
    subject: 'feat: Rename app brand to SentVault and add comprehensive About view with introduction and user guide',
    date: '2026-10-12',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: '885352e',
    subject: 'fix: Remove white ring outline artifact from active bookmark index tab during scroll',
    date: '2026-10-12',
    author: 'Justin',
    type: 'fix',
  },
  {
    hash: 'a0c9bc5',
    subject: 'feat: Add Index and Sentence view mode toggle buttons to LibraryView',
    date: '2026-10-12',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: 'dd15489',
    subject: 'feat: Add Index/Sentence view tabs to Favorites, and render dual colored badges for Index and Sentence next to Library',
    date: '2026-10-12',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: '520cd3f',
    subject: 'style: Render | delimiter with subtle soft gray color in FavoritesView',
    date: '2026-10-12',
    author: 'Justin',
    type: 'style',
  },
  {
    hash: '04e3e2c',
    subject: "style: Use ' | ' delimiter for multiple index phrases in FavoritesView",
    date: '2026-10-12',
    author: 'Justin',
    type: 'style',
  },
  {
    hash: 'fd6bdee',
    subject: 'feat: Deduplicate sentences in FavoritesView so each sentence shows once, with all indexes displayed in the card header',
    date: '2026-10-12',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: '8dfb962',
    subject: 'chore: Expose Vite dev server on local network (server.host: true)',
    date: '2026-10-12',
    author: 'Justin',
    type: 'chore',
  },
  {
    hash: '0a5808a',
    subject: 'feat: Add modular speechService with Apple Siri, Samsung Bixby and Google Natural priority, architected for future commercial AI engines',
    date: '2026-10-12',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: '4807929',
    subject: 'feat: Hide sentence translation section in detail modal when sentence has no translation',
    date: '2026-10-11',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: 'dc80c2f',
    subject: 'feat: Add text-to-speech listen audio button next to each sentence',
    date: '2026-10-11',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: '282a4ca',
    subject: 'fix: Resolve card execution collision by guaranteeing unique sentence IDs and specific index routing',
    date: '2026-10-11',
    author: 'Justin',
    type: 'fix',
  },
  {
    hash: '0b872bb',
    subject: 'feat: Hide sentence translations by default with show/hide toggle',
    date: '2026-10-11',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: 'a33b1d0',
    subject: 'fix: Resolve ghost sentence count mismatch and sanitize invalid/unindexed sentences',
    date: '2026-10-11',
    author: 'Justin',
    type: 'fix',
  },
  {
    hash: '6381ad3',
    subject: 'feat: End review cleanly without repeating Again cards, align Again/Learn stats, and add Again re-study button',
    date: '2026-10-11',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: '77ff559',
    subject: 'fix: Persist review SRS progress and filter due cards on re-entry',
    date: '2026-10-11',
    author: 'Justin',
    type: 'fix',
  },
  {
    hash: 'a580955',
    subject: 'feat: Set Library as the default Home screen',
    date: '2026-10-11',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: '5fe0b24',
    subject: 'feat: Add Light/Dark mode toggle button and full dark theme support',
    date: '2026-10-11',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: '83dd638',
    subject: 'docs: add comprehensive PROJECT_SPEC.md for future development reference',
    date: '2026-10-11',
    author: 'Justin',
    type: 'docs',
  },
  {
    hash: 'ab5d726',
    subject: "refactor: remove redundant 'Context sentence' label from index cards",
    date: '2026-10-11',
    author: 'Justin',
    type: 'refactor',
  },
  {
    hash: 'bed9152',
    subject: 'chore: rename brand title and logo to Sentence Note (SN)',
    date: '2026-10-11',
    author: 'Justin',
    type: 'chore',
  },
  {
    hash: 'c2c4f8c',
    subject: 'feat: Sentence Note learning app with multi-index vault and Anki SRS',
    date: '2026-10-11',
    author: 'Justin',
    type: 'feat',
  },
  {
    hash: 'c0ba5d4',
    subject: 'Initial commit',
    date: '2026-10-11',
    author: 'icarus1004',
    type: 'init',
  },
]

interface HistoryViewProps {
  onBackToMain: () => void
  onOpenMobileMenu?: () => void
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onBackToMain,
  onOpenMobileMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'feat' | 'fix' | 'style' | 'chore'>('all')
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const filteredCommits = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return COMMIT_HISTORY.filter((commit) => {
      if (selectedFilter !== 'all' && commit.type !== selectedFilter) {
        return false
      }
      if (!q) return true
      const matchesSubject = commit.subject.toLowerCase().includes(q)
      const matchesHash = commit.hash.toLowerCase().includes(q)
      const matchesTag = commit.tag?.toLowerCase().includes(q)
      const matchesAuthor = commit.author.toLowerCase().includes(q)
      return matchesSubject || matchesHash || matchesTag || matchesAuthor
    })
  }, [searchQuery, selectedFilter])

  const getTypeBadgeStyle = (type: GitCommitItem['type']) => {
    switch (type) {
      case 'feat':
        return 'bg-[#dcf2e6] text-[#12382c] dark:bg-[#183d2f] dark:text-[#a7f3d0] ring-[#bbf0d7] dark:ring-[#235845]'
      case 'fix':
        return 'bg-[#fef3c7] text-[#92400e] dark:bg-[#382d13] dark:text-[#fcd34d] ring-[#fde68a] dark:ring-[#544018]'
      case 'style':
        return 'bg-[#f3e8ff] text-[#6b21a8] dark:bg-[#31194a] dark:text-[#d8b4fe] ring-[#e9d5ff] dark:ring-[#4c2772]'
      case 'docs':
        return 'bg-[#e0e7ff] text-[#3730a3] dark:bg-[#1e1b4b] dark:text-[#a5b4fc] ring-[#c7d2fe] dark:ring-[#312e81]'
      case 'refactor':
        return 'bg-[#ecfeff] text-[#155e75] dark:bg-[#11323b] dark:text-[#67e8f9] ring-[#cffafe] dark:ring-[#164e63]'
      case 'chore':
      case 'init':
      default:
        return 'bg-[#f3f4f6] text-[#374151] dark:bg-[#202927] dark:text-[#9ca3af] ring-[#e5e7eb] dark:ring-[#374151]'
    }
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#eae6dc]/60 dark:border-[#23352f]">
        <button
          type="button"
          onClick={onBackToMain}
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

      {/* Header & Meta Summary Card */}
      <div className="bg-white dark:bg-[#14201c] rounded-3xl p-6 sm:p-8 border border-[#ece8df] dark:border-[#23352f] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#dcf2e6] dark:bg-[#183d2f] text-[#12382c] dark:text-[#34d399] ring-1 ring-[#bbf0d7] dark:ring-[#235845]">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Git Graph & Release Timeline</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12382c] dark:text-[#e4ede8] tracking-tight">
              Commit History
            </h1>

            <p className="text-xs sm:text-sm text-[#5f756c] dark:text-[#8ea49a] max-w-xl">
              SentVault 프로젝트의 전체 버전 릴리즈와 커밋 이력입니다. Git 그래프 스타일로 브랜치 및 릴리즈 태그 현황을 확인할 수 있습니다.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-[#faf9f5] dark:bg-[#1a2824] border border-[#eeebe3] dark:border-[#283d36] text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#7c8d85] dark:text-[#8ea49a] mb-0.5">
                <Tag className="w-3 h-3 text-amber-500" />
                <span>Release</span>
              </div>
              <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                V1.0
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#faf9f5] dark:bg-[#1a2824] border border-[#eeebe3] dark:border-[#283d36] text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#7c8d85] dark:text-[#8ea49a] mb-0.5">
                <GitCommit className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Commits</span>
              </div>
              <div className="text-base sm:text-lg font-black text-[#12382c] dark:text-[#a7f3d0]">
                {COMMIT_HISTORY.length}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-[#faf9f5] dark:bg-[#1a2824] border border-[#eeebe3] dark:border-[#283d36] text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#7c8d85] dark:text-[#8ea49a] mb-0.5">
                <GitBranch className="w-3 h-3 text-indigo-500" />
                <span>Branch</span>
              </div>
              <div className="text-base sm:text-lg font-black text-[#312e81] dark:text-[#a5b4fc]">
                main
              </div>
            </div>
          </div>
        </div>

        {/* Remote Link Strip */}
        <div className="mt-6 pt-5 border-t border-[#f2ede4] dark:border-[#23352f] flex flex-wrap items-center justify-between gap-3 text-xs text-[#71857c] dark:text-[#8ea49a]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#12382c] dark:text-[#e4ede8]">Repository:</span>
            <code className="px-2 py-0.5 rounded-md bg-[#ede9df] dark:bg-[#20302b] text-[11px] font-mono text-[#1a4435] dark:text-[#9fe2c7]">
              i3estCorder/Sentence_Note
            </code>
          </div>
          <a
            href="https://github.com/i3estCorder/Sentence_Note"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#133d2e] dark:text-[#34d399] hover:underline font-semibold"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8d85] dark:text-[#8ea49a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commits by message, hash, or author..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-[#14201c] border border-[#dedad0] dark:border-[#283d36] text-sm text-[#12382c] dark:text-[#e4ede8] placeholder-[#8c9e96] dark:placeholder-[#6a8076] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] transition-all"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'feat', 'fix', 'style', 'chore'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === filter
                  ? 'bg-[#12382c] text-white dark:bg-[#1d5743] shadow-xs'
                  : 'bg-white dark:bg-[#14201c] text-[#556961] dark:text-[#8ea49a] border border-[#dedad0] dark:border-[#283d36] hover:text-[#12382c] dark:hover:text-[#e4ede8]'
              }`}
            >
              {filter.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* GIT GRAPH TIMELINE */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#14201c] rounded-3xl p-6 sm:p-8 border border-[#ece8df] dark:border-[#23352f] shadow-xs">
        <div className="relative pl-6 sm:pl-8">
          {/* Continuous Git Branch Rail Line */}
          <div className="absolute left-[11px] sm:left-[15px] top-4 bottom-4 w-[3px] bg-gradient-to-b from-emerald-500 via-teal-500 to-emerald-800 dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-700 rounded-full" />

          {/* Commits List */}
          <div className="space-y-6">
            {filteredCommits.map((commit, cIdx) => {
              const isHead = cIdx === 0
              const hasTag = Boolean(commit.tag)

              return (
                <div
                  key={commit.hash + cIdx}
                  className="relative group/commit"
                >
                  {/* Git Node Circle */}
                  <div
                    className={`absolute -left-[23px] sm:-left-[27px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      hasTag
                        ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-100 dark:ring-amber-950/60 scale-110 z-10'
                        : isHead
                        ? 'bg-[#12382c] dark:bg-[#34d399] text-white dark:text-[#0b281d] shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950/50 z-10'
                        : 'bg-white dark:bg-[#14201c] border-2 border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {hasTag ? (
                      <Tag className="w-3 h-3 stroke-[2.5]" />
                    ) : (
                      <GitCommit className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </div>

                  {/* Commit Content Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#faf9f5] dark:bg-[#182622] border border-[#ece8df] dark:border-[#243730] hover:border-[#ded8ca] dark:hover:border-[#355146] transition-all">
                    {/* Top Meta Line: Badges, Tags & Commit Hash */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Release Tag Pill */}
                        {commit.tag && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-500 text-white shadow-xs">
                            <Tag className="w-3 h-3" />
                            <span>{commit.tag}</span>
                          </span>
                        )}

                        {/* Branch Head Pill */}
                        {commit.branch && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#e0e7ff] dark:bg-[#1e1b4b] text-[#3730a3] dark:text-[#a5b4fc] ring-1 ring-[#c7d2fe] dark:ring-[#312e81]">
                            <GitBranch className="w-2.5 h-2.5" />
                            <span>HEAD &bull; {commit.branch}</span>
                          </span>
                        )}

                        {/* Type Badge */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1 ${getTypeBadgeStyle(
                            commit.type
                          )}`}
                        >
                          {commit.type}
                        </span>
                      </div>

                      {/* Hash Pill & Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopyHash(commit.hash)}
                        title="Click to copy commit SHA"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-semibold bg-white dark:bg-[#14201c] border border-[#dedad0] dark:border-[#283d36] text-[#4d6359] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#ede9df] dark:hover:bg-[#20302b] transition-all cursor-pointer"
                      >
                        <span>{commit.hash}</span>
                        {copiedHash === commit.hash ? (
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-[#7c8d85]" />
                        )}
                      </button>
                    </div>

                    {/* Commit Message */}
                    <p className="text-sm sm:text-base font-semibold text-[#12382c] dark:text-[#e4ede8] leading-snug">
                      {commit.subject}
                    </p>

                    {/* Commit Author & Date Footnote */}
                    <div className="mt-2.5 pt-2 border-t border-[#eeebe3] dark:border-[#22352e] flex flex-wrap items-center justify-between gap-2 text-xs text-[#71857c] dark:text-[#8ea49a]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[#12382c] dark:text-[#c4ded3]">
                          {commit.author}
                        </span>
                        <span>authored</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-[#8c9e96]" />
                        <span>{commit.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Empty Search Result State */}
        {filteredCommits.length === 0 && (
          <div className="p-12 text-center">
            <GitCommit className="w-10 h-10 text-[#8c9e96] dark:text-[#6a8076] mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-base font-semibold text-[#12382c] dark:text-[#e4ede8]">
              No commits found
            </h3>
            <p className="text-xs text-[#7c8d85] dark:text-[#8ea49a] mt-1">
              Try adjusting your search query or filter.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
