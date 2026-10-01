# Factor Escape

Juego de factorización para 1 a 5 equipos. 

Todas las partidas tienen cinco ejercicios por caso, 25 en total, tanto con un
solo equipo como con varios. Cada caso tiene un banco de nueve ejercicios:
cinco se seleccionan al azar y cuatro quedan como alternativas.

## Ejecutar

Usa Node.js 24 o superior y pnpm. Instala con `pnpm install`, inicia con
`pnpm dev` y abre http://localhost:3000. Los scripts usan Webpack para evitar
el error de creación de procesos de Turbopack observado en Windows.

## Recorrido

1. Factor común: coeficientes → potencias → tres términos y dos variables.
2. Factor común por agrupación: factores simples → coeficientes → factor negativo.
3. Trinomio cuadrado perfecto: suma → resta → coeficientes y dos variables.
4. Diferencia de cuadrados: raíces simples → coeficientes → potencias mayores.
5. Trinomio x² + bx + c: pareja positiva → pareja negativa → signos opuestos.

Cada nivel tiene cinco ejercicios. La respuesta se construye colocando números,
variables, signos, paréntesis y potencias en sus casillas. El turno cambia al terminar
o cambiar un ejercicio. Al acertar aparece una animación con el marcador actualizado.
Una respuesta correcta al primer intento vale 3 puntos;
al segundo, 1 punto; al tercero, 0 puntos. Cambiar de ejercicio descuenta 1 punto.
Con un solo equipo, cambiar sustituye el ejercicio actual por una alternativa sin
avanzar el contador ni repetir ejercicios ya terminados. Con varios equipos,
cambiar mantiene el comportamiento de saltar el ejercicio y pasar el turno.
El orden de los ejercicios y de las piezas cambia en cada partida. Los ejercicios
de cada nivel tienen una complejidad equivalente. El banco incluye diez piezas
distractoras que no forman parte de la respuesta correcta.
Los ejercicios emplean únicamente las variables `x` y `y`. Factor común usa tres
términos para mantener un reto similar al de los trinomios y la agrupación.
Las piezas pueden colocarse con clic o escribiendo números, `x`, `y`, signos y
paréntesis. Las flechas cambian de casilla y Backspace elimina una pieza. Las
potencias se seleccionan desde el banco visual. Los coeficientes de dos cifras
escritos consecutivamente se combinan en una sola pieza.

## Verificar

- `pnpm test`: valida los 45 ejercicios y los cambios por alternativas.
- `pnpm typecheck`: comprobación de TypeScript.
- `pnpm build`: compilación de producción con comprobación de tipos habilitada.

El contenido está en `data/exercises.ts` y el recorrido del juego en `app/page.tsx`.
