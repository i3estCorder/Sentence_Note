export interface IndexPhrase {
  id: string
  phrase: string
  meaning?: string
}

export interface SentenceData {
  id: string
  text: string
  translation?: string
  notes?: string
  indexes: IndexPhrase[]
  isFavorite?: boolean
}

export type NavItemId = 'library' | 'review' | 'favorites' | 'edit-index' | 'about'

export interface NavItem {
  id: NavItemId
  label: string
  icon: string
  href?: string
}
