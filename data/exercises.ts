export type LevelType = 'common' | 'grouping' | 'perfect' | 'squares' | 'pair'

export type Exercise = {
  id: string
  type: LevelType
  expression: string
  difficulty: 'ESTÁNDAR'
  hint: string
  answer: string
  options: string[]
}

function exercise(type: LevelType, number: number, expression: string, answer: string, wrong: string[], hint: string): Exercise {
  const options = [...wrong]
  options.splice(number % 4, 0, answer)
  return { id: `${type}-${number}`, type, expression, answer, options, hint, difficulty: 'ESTÁNDAR' }
}

export const exercises: Record<LevelType, Exercise[]> = {
  common: [
    exercise('common', 1, '18x³y² − 12x²y³ + 6x²y²', '6x²y²(3x − 2y + 1)', ['6xy²(3x² − 2xy + x)', '6x²y²(3x + 2y + 1)', '3x²y²(6x − 4y + 2)'], 'El máximo factor común es 6x²y²; el último término produce 1.'),
    exercise('common', 2, '20x⁴y + 30x³y² − 10x³y', '10x³y(2x + 3y − 1)', ['10x²y(2x² + 3xy − x)', '10x³y(2x − 3y − 1)', '5x³y(4x + 6y − 2)'], 'El máximo factor común es 10x³y.'),
    exercise('common', 3, '14x³y² + 21x²y³ + 7x²y²', '7x²y²(2x + 3y + 1)', ['7xy²(2x² + 3xy + x)', '7x²y²(2x − 3y + 1)', '14x²y²(x + 3y + 1)'], 'El máximo factor común es 7x²y².'),
    exercise('common', 4, '24x⁵y² − 16x⁴y³ + 8x⁴y²', '8x⁴y²(3x − 2y + 1)', ['8x³y²(3x² − 2xy + x)', '8x⁴y²(3x + 2y + 1)', '4x⁴y²(6x − 4y + 2)'], 'El máximo factor común es 8x⁴y².'),
    exercise('common', 5, '30x⁴y³ + 45x³y⁴ − 15x³y³', '15x³y³(2x + 3y − 1)', ['15x²y³(2x² + 3xy − x)', '15x³y³(2x − 3y − 1)', '5x³y³(6x + 9y − 3)'], 'El máximo factor común es 15x³y³.'),
  ],
  grouping: [
    exercise('grouping', 1, '8x² + 12x + 6xy + 9y', '(4x + 3y)(2x + 3)', ['(4x − 3y)(2x + 3)', '(4x + 3y)(2x − 3)', '(2x + 3y)(4x + 3)'], 'Agrupa 4x(2x + 3) + 3y(2x + 3).'),
    exercise('grouping', 2, '10x² − 15x + 4xy − 6y', '(5x + 2y)(2x − 3)', ['(5x − 2y)(2x − 3)', '(5x + 2y)(2x + 3)', '(2x + 2y)(5x − 3)'], 'Agrupa 5x(2x − 3) + 2y(2x − 3).'),
    exercise('grouping', 3, '12x² + 8x − 9xy − 6y', '(4x − 3y)(3x + 2)', ['(4x + 3y)(3x + 2)', '(4x − 3y)(3x − 2)', '(3x − 3y)(4x + 2)'], 'Agrupa 4x(3x + 2) − 3y(3x + 2).'),
    exercise('grouping', 4, '6x² − 9x − 4xy + 6y', '(3x − 2y)(2x − 3)', ['(3x + 2y)(2x − 3)', '(3x − 2y)(2x + 3)', '(6x − 4y)(x − 3)'], 'Agrupa 3x(2x − 3) − 2y(2x − 3).'),
    exercise('grouping', 5, '15x² − 10x + 6xy − 4y', '(5x + 2y)(3x − 2)', ['(5x − 2y)(3x − 2)', '(5x + 2y)(3x + 2)', '(3x + 2y)(5x − 2)'], 'Agrupa 5x(3x − 2) + 2y(3x − 2).'),
  ],
  perfect: [
    exercise('perfect', 1, 'x² + 6xy + 9y²', '(x + 3y)²', ['(x − 3y)²', '(x + 9y)²', '(x − 3y)(x + 3y)'], 'Las raíces son x y 3y; su doble producto es 6xy.'),
    exercise('perfect', 2, '4x² − 12xy + 9y²', '(2x − 3y)²', ['(2x + 3y)²', '(4x − 3y)²', '(2x − 3y)(2x + 3y)'], 'Las raíces son 2x y 3y; el término central es negativo.'),
    exercise('perfect', 3, '9x² + 24xy + 16y²', '(3x + 4y)²', ['(3x − 4y)²', '(9x + 4y)²', '(3x − 4y)(3x + 4y)'], 'Las raíces son 3x y 4y; su doble producto es 24xy.'),
    exercise('perfect', 4, '16x² − 40xy + 25y²', '(4x − 5y)²', ['(4x + 5y)²', '(16x − 5y)²', '(4x − 5y)(4x + 5y)'], 'Las raíces son 4x y 5y; su doble producto es −40xy.'),
    exercise('perfect', 5, '25x² + 60xy + 36y²', '(5x + 6y)²', ['(5x − 6y)²', '(25x + 6y)²', '(5x + 6y)(5x − 6y)'], 'Las raíces son 5x y 6y; su doble producto es 60xy.'),
  ],
  squares: [
    exercise('squares', 1, '4x² − 9y²', '(2x − 3y)(2x + 3y)', ['(2x − 3y)²', '(4x − 9y)(x + y)', '(2x − 9y)(2x + 9y)'], 'Las raíces de los términos son 2x y 3y.'),
    exercise('squares', 2, '9x² − 16y²', '(3x − 4y)(3x + 4y)', ['(3x − 4y)²', '(9x − 16y)(x + y)', '(3x − 8y)(3x + 8y)'], 'Las raíces de los términos son 3x y 4y.'),
    exercise('squares', 3, '25x² − 36y²', '(5x − 6y)(5x + 6y)', ['(5x − 6y)²', '(25x − 36y)(x + y)', '(5x − 3y)(5x + 3y)'], 'Las raíces de los términos son 5x y 6y.'),
    exercise('squares', 4, '49x² − 64y²', '(7x − 8y)(7x + 8y)', ['(7x − 8y)²', '(49x − 64y)(x + y)', '(7x − 4y)(7x + 4y)'], 'Las raíces de los términos son 7x y 8y.'),
    exercise('squares', 5, '81x² − 100y²', '(9x − 10y)(9x + 10y)', ['(9x − 10y)²', '(81x − 100y)(x + y)', '(9x − 5y)(9x + 5y)'], 'Las raíces de los términos son 9x y 10y.'),
  ],
  pair: [
    exercise('pair', 1, 'x² + 5x + 6', '(x + 2)(x + 3)', ['(x − 2)(x − 3)', '(x + 1)(x + 6)', '(x − 2)(x + 3)'], 'Busca dos números que sumen 5 y multipliquen 6.'),
    exercise('pair', 2, 'x² + 7x + 12', '(x + 3)(x + 4)', ['(x − 3)(x − 4)', '(x + 2)(x + 6)', '(x + 1)(x + 12)'], 'Busca dos números que sumen 7 y multipliquen 12.'),
    exercise('pair', 3, 'x² − 9x + 20', '(x − 4)(x − 5)', ['(x + 4)(x + 5)', '(x − 2)(x − 10)', '(x + 4)(x − 5)'], 'Producto positivo y suma negativa: ambos números son negativos.'),
    exercise('pair', 4, 'x² − x − 12', '(x + 3)(x − 4)', ['(x − 3)(x + 4)', '(x − 2)(x + 6)', '(x + 3)(x + 4)'], 'Busca dos números que sumen −1 y multipliquen −12.'),
    exercise('pair', 5, 'x² + 4x − 45', '(x + 9)(x − 5)', ['(x − 9)(x + 5)', '(x + 15)(x − 3)', '(x + 9)(x + 5)'], 'Busca dos números que sumen 4 y multipliquen −45.'),
  ],
}

export const levelMeta: { type: LevelType; number: string; name: string; short: string; icon: string }[] = [
  { type: 'common', number: '01', name: 'Encuentra el factor', short: 'Factor común', icon: '⌬' },
  { type: 'grouping', number: '02', name: 'Agrupa los términos', short: 'Factor común por agrupación', icon: '▦' },
  { type: 'perfect', number: '03', name: 'Completa el cuadrado', short: 'Trinomio cuadrado perfecto', icon: '△' },
  { type: 'squares', number: '04', name: 'Rompe los cuadrados', short: 'Diferencia de cuadrados', icon: '◇' },
  { type: 'pair', number: '05', name: 'Encuentra la pareja', short: 'Trinomio x² + bx + c', icon: '⊙' },
]

export const teamColors = ['cyan', 'violet', 'amber', 'rose', 'emerald'] as const
export const teamAvatars = ['A', 'B', 'C', 'D', 'E']
