const clean = (value: string) => value.replaceAll(' ', '').replaceAll('-', '−')

function canonical(value: string) {
  const normalized = clean(value)
  const factors = normalized.match(/\([^()]+\)(?:[²³⁴⁵⁶])?/g) ?? []
  if (factors.length < 2 || !normalized.endsWith(factors.join(''))) return normalized
  const prefix = normalized.slice(0, normalized.length - factors.join('').length)
  return `${prefix}${[...factors].sort().join('')}`
}

export function equivalentFactorization(candidate: string, expected: string) {
  return canonical(candidate) === canonical(expected)
}
