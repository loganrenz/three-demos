import { describe, expect, it } from 'vitest'
import { validateWord } from './lexistack-dictionary'
import { LETTER_SCORES, isAdjacentPosition, scoreWord } from './lexistack-logic'

describe('lexistack logic helpers', () => {
  it('detects adjacency including diagonals', () => {
    expect(isAdjacentPosition({ row: 1, col: 1 }, { row: 2, col: 2 })).toBe(true)
    expect(isAdjacentPosition({ row: 1, col: 1 }, { row: 1, col: 3 })).toBe(false)
    expect(isAdjacentPosition({ row: 2, col: 4 }, { row: 2, col: 4 })).toBe(false)
  })

  it('uses scrabble-like letter scores', () => {
    expect(LETTER_SCORES.A).toBe(1)
    expect(LETTER_SCORES.Q).toBe(10)
  })

  it('applies length bonus and combo multiplier when scoring words', () => {
    const letters = ['B', 'E', 'E']
    const expected = Math.round((LETTER_SCORES.B + LETTER_SCORES.E * 2) * 1.3 * 1.5)
    expect(scoreWord(letters, 1.5)).toBe(expected)
  })

  it('supports lowercase letters when scoring', () => {
    expect(scoreWord(['a', 'p', 'e'], 1)).toBe(Math.round((1 + 3 + 1) * 1.3))
  })

  it('confirms dictionary lookups are case-insensitive', async () => {
    const valid = await validateWord('apple')
    const invalid = await validateWord('NotAWord')
    expect(valid.valid).toBe(true)
    expect(invalid.valid).toBe(false)
  })
})
