export const DEFAULT_INDEX_MEANINGS: Record<string, string> = {
  'behind': '~의 뒤에, 배후에, 뒤떨어져',
  'tucked away': '(아늑하고 한적한 곳에) 꽁꽁 숨겨진, 자리 잡은',
  'rare': '보기 드문, 희귀한, 귀중한',
  'stumbled upon': '우연히 발견하다, 마주치다',
  'reached a compromise': '타협에 도달하다, 합의를 이루다',
  'breathed new life into': '~에 새로운 활기를 불어넣다',
  'innovative': '혁신적인, 획기적인',
  'silence fell over': '~에 깊은 침묵이 감돌다',
  'groundbreaking discovery': '획기적인 발견, 혁신적 발견',
  'abrupt': '갑작스러운, 돌연한',
}

export const DEFAULT_SENTENCE_TRANSLATIONS: Record<string, string> = {
  'the small café is tucked away behind the bookstore.':
    '그 작은 카페는 서점 뒤편에 아늑하게 자리 잡고 있습니다.',
  'she stumbled upon a rare antique clock in the attic.':
    '그녀는 다락방에서 보기 드문 골동품 시계를 우연히 발견했습니다.',
  'after hours of negotiation, they finally reached a compromise.':
    '수 시간의 협상 끝에 그들은 마침내 타협점에 도달했습니다.',
  'the secret garden is hidden behind the ancient brick wall.':
    '그 비밀의 정원은 오래된 벽돌 담장 뒤에 숨겨져 있습니다.',
  'it is exceedingly rare to observe this phenomenon in nature.':
    '자연에서 이러한 현상을 관찰하는 것은 대단히 드뭅니다.',
  'her innovative approach breathed new life into the aging project.':
    '그녀의 혁신적인 접근법은 노후화된 프로젝트에 새로운 활기를 불어넣었습니다.',
  'a profound silence fell over the audience when the violinist finished.':
    '바이올리니스트가 연주를 마치자 관중석에 깊은 침묵이 감돌았습니다.',
  'the research team celebrated after making a groundbreaking discovery.':
    '연구팀은 획기적인 발견을 이뤄낸 후 축하했습니다.',
  'he had a cozy study tucked away in the corner of the house.':
    '그는 집 구석에 아늑한 서재를 마련해 두었습니다.',
  'the artist felt an abrupt urge to paint the sunset.':
    '그 예술가는 일몰을 그리고 싶은 갑작스러운 충동을 느꼈습니다.',
}

export function getIndexMeaning(phrase: string, customMeaning?: string): string {
  if (customMeaning && customMeaning.trim()) return customMeaning
  const lower = phrase.toLowerCase().trim()
  return DEFAULT_INDEX_MEANINGS[lower] || '주요 학습 표현 및 색인 단어'
}

export function getSentenceTranslation(text: string, customTranslation?: string): string {
  if (customTranslation && customTranslation.trim()) return customTranslation
  const lower = text.toLowerCase().trim()
  return DEFAULT_SENTENCE_TRANSLATIONS[lower] || '자연스러운 문맥 예문 해석'
}
