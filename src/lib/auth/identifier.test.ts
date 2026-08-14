import { looksLikeEmail, normalizeDocumentDigits, maskEmail } from './identifier'

describe('looksLikeEmail', () => {
  it('returns true for a valid email', () => {
    expect(looksLikeEmail('fazendeiro@exemplo.com')).toBe(true)
  })

  it('returns false for a CPF', () => {
    expect(looksLikeEmail('123.456.789-00')).toBe(false)
  })

  it('returns false for a CPF without punctuation', () => {
    expect(looksLikeEmail('12345678900')).toBe(false)
  })
})

describe('normalizeDocumentDigits', () => {
  it('strips punctuation from a masked CPF', () => {
    expect(normalizeDocumentDigits('123.456.789-00')).toBe('12345678900')
  })

  it('leaves an already-unmasked CPF unchanged', () => {
    expect(normalizeDocumentDigits('12345678900')).toBe('12345678900')
  })

  it('strips punctuation from a masked CNPJ', () => {
    expect(normalizeDocumentDigits('12.345.678/0001-90')).toBe('12345678000190')
  })

  it('returns an empty string when there are no digits', () => {
    expect(normalizeDocumentDigits('')).toBe('')
  })
})

describe('maskEmail', () => {
  it('masks the local part, keeping the first character and domain', () => {
    expect(maskEmail('fazendeiro@gmail.com')).toBe('f*********@gmail.com')
  })

  it('pads short local parts to at least 3 mask characters', () => {
    expect(maskEmail('ab@gmail.com')).toBe('a***@gmail.com')
  })

  it('returns the input unchanged when there is no domain', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email')
  })
})
