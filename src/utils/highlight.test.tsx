import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  getWordInflections,
  findPhraseMatches,
  highlightMultiPhrases,
} from './highlight'

describe('highlight utility with verb tenses and inflections', () => {
  it('generates correct inflected forms for verbs', () => {
    const showForms = getWordInflections('show')
    expect(showForms).toContain('show')
    expect(showForms).toContain('shows')
    expect(showForms).toContain('showed')
    expect(showForms).toContain('showing')

    // Stemming test: starts with progressive form
    const showingForms = getWordInflections('showing')
    expect(showingForms).toContain('show')
    expect(showingForms).toContain('shows')
    expect(showingForms).toContain('showed')
    expect(showingForms).toContain('showing')

    const tuckForms = getWordInflections('tuck')
    expect(tuckForms).toContain('tucked')
    expect(tuckForms).toContain('tucking')
  })

  it('matches progressive tense (-ing) for phrasal verbs like "show off"', () => {
    const text = 'He is always showing off his expensive watch.'
    const matches = findPhraseMatches(text, 'show off', true)
    expect(matches).toHaveLength(1)
    expect(matches[0].isPrimary).toBe(true)
    expect(text.substring(matches[0].start, matches[0].end)).toBe('showing off')
  })

  it('matches past tense (-ed) for "show off"', () => {
    const text = 'Yesterday she showed off her new painting.'
    const matches = findPhraseMatches(text, 'show off', true)
    expect(matches).toHaveLength(1)
    expect(text.substring(matches[0].start, matches[0].end)).toBe('showed off')
  })

  it('matches 3rd person singular present (-s) for "show off"', () => {
    const text = 'He shows off at every opportunity.'
    const matches = findPhraseMatches(text, 'show off', true)
    expect(matches).toHaveLength(1)
    expect(text.substring(matches[0].start, matches[0].end)).toBe('shows off')
  })

  it('matches separable pronoun phrasal verbs like "showing it off"', () => {
    const text = 'She was proud of the medal, showing it off to everyone.'
    const matches = findPhraseMatches(text, 'show off', true)
    expect(matches).toHaveLength(2)
    expect(text.substring(matches[0].start, matches[0].end)).toBe('showing')
    expect(text.substring(matches[1].start, matches[1].end)).toBe('off')
  })

  it('renders primary phrase with yellow highlight and co-registered phrase with sky blue highlight', () => {
    const text = 'He was showing off his car behind the venue.'
    render(
      <div data-testid="container">
        {highlightMultiPhrases(text, 'show off', ['behind'])}
      </div>
    )

    const container = screen.getByTestId('container')
    const primaryMark = container.querySelector('mark.bg-\\[\\#fef08a\\]')
    expect(primaryMark).not.toBeNull()
    expect(primaryMark?.textContent).toBe('showing off')

    const secondaryMark = container.querySelector('mark.bg-\\[\\#bae6fd\\]')
    expect(secondaryMark).not.toBeNull()
    expect(secondaryMark?.textContent).toBe('behind')
  })

  it('matches "showing off" in user screenshot sentence', () => {
    const text = 'He’s just showing off because that girl he likes is here.'
    const matches = findPhraseMatches(text, 'show off', true)
    expect(matches).toHaveLength(1)
    expect(text.substring(matches[0].start, matches[0].end)).toBe('showing off')
  })

  it('matches "Breathed N into ~" format and highlights breathed and into separately', () => {
    const text = 'The new manager breathed new life into the company.'
    const matches = findPhraseMatches(text, 'Breathed N into ~', true)

    expect(matches).toHaveLength(2)
    // First part: "breathed"
    expect(text.substring(matches[0].start, matches[0].end)).toBe('breathed')
    expect(matches[0].isPrimary).toBe(true)

    // Second part: "into"
    expect(text.substring(matches[1].start, matches[1].end)).toBe('into')
    expect(matches[1].isPrimary).toBe(true)
  })

  it('renders "breathed" and "into" with color in highlightMultiPhrases while leaving "new life" unhighlighted', () => {
    const text = 'The new manager breathed new life into the company.'
    render(
      <div data-testid="breathe-container">
        {highlightMultiPhrases(text, 'Breathed N into ~')}
      </div>
    )

    const container = screen.getByTestId('breathe-container')
    const marks = container.querySelectorAll('mark.bg-\\[\\#fef08a\\]')
    expect(marks).toHaveLength(2)
    expect(marks[0].textContent).toBe('breathed')
    expect(marks[1].textContent).toBe('into')

    // Make sure the text in between is still rendered
    expect(container.textContent).toBe('The new manager breathed new life into the company.')
  })

  it('handles variations: "breathe ~ into" and "breathe into" with intervening object', () => {
    const text = 'Fresh leadership breathes energy into the team.'
    const matchesTilde = findPhraseMatches(text, 'breathe ~ into', true)
    expect(matchesTilde).toHaveLength(2)
    expect(text.substring(matchesTilde[0].start, matchesTilde[0].end)).toBe('breathes')
    expect(text.substring(matchesTilde[1].start, matchesTilde[1].end)).toBe('into')

    const matchesBare = findPhraseMatches(text, 'breathe into', true)
    expect(matchesBare).toHaveLength(2)
    expect(text.substring(matchesBare[0].start, matchesBare[0].end)).toBe('breathes')
    expect(text.substring(matchesBare[1].start, matchesBare[1].end)).toBe('into')
  })
})
