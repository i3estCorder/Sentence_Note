import type { SentenceData } from '../types'

export const initialSentences: SentenceData[] = [
  {
    id: 'sentence-1',
    text: 'The small café is tucked away behind the bookstore.',
    translation: '그 작은 카페는 서점 뒤편에 아늑하게 자리 잡고 있습니다.',
    notes: '• tuck away: 아늑하고 눈에 잘 띄지 않는 곳에 자리잡은 장소를 묘사할 때 자주 사용되는 숙어.\n• behind + 장소명사: 물리적 위치(~뒤에) 외에도 "배후의 원인"을 나타낼 때도 활용 가능.',
    isFavorite: true,
    indexes: [
      {
        id: 'idx-1',
        phrase: 'tucked away',
        meaning: '(아늑하고 한적한 곳에) 꽁꽁 숨겨진, 자리 잡은',
      },
      {
        id: 'idx-2',
        phrase: 'behind',
        meaning: '~의 뒤에, 배후에',
      },
    ],
  },
  {
    id: 'sentence-2',
    text: 'She stumbled upon a rare antique clock in the attic.',
    translation: '그녀는 다락방에서 보기 드문 골동품 시계를 우연히 발견했습니다.',
    notes: '• stumble upon: 우연히 가치 있는 것을 발견하거나 마주치다 (유의어: come across, run into).\n• attic: 다락방.',
    isFavorite: false,
    indexes: [
      {
        id: 'idx-3',
        phrase: 'stumbled upon',
        meaning: '우연히 발견하다, 마주치다',
      },
      {
        id: 'idx-4',
        phrase: 'rare',
        meaning: '보기 드문, 희귀한, 귀중한',
      },
    ],
  },
  {
    id: 'sentence-3',
    text: 'After hours of negotiation, they finally reached a compromise.',
    translation: '수 시간의 협상 끝에 그들은 마침내 타협점에 도달했습니다.',
    isFavorite: true,
    indexes: [
      {
        id: 'idx-5',
        phrase: 'reached a compromise',
        meaning: '타협에 도달하다, 합의를 이루다',
      },
    ],
  },
]

export const initialSentenceData: SentenceData = initialSentences[0]
