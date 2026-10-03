# Factor Escape

Juego multijugador de factorización en tiempo real, inspirado en la dinámica de
Kahoot. Una persona crea una sala y comparte un código de seis caracteres; los
demás participantes escriben el código y su nombre para entrar.

Cada partida tiene cinco rondas, una por cada caso de factorización. Las salas
admiten hasta 20 participantes, el anfitrión controla el inicio y el avance, y
el marcador se actualiza para todos en tiempo real.

## Ejecutar

Usa Node.js 24 o superior y pnpm. Instala con `pnpm install`, inicia con
`pnpm dev` y abre http://localhost:3000. Para jugar desde otros dispositivos de
la misma red, abre la dirección IP local de la computadora seguida de `:3000`.
Las salas se guardan en memoria y se eliminan al reiniciar el servidor.

## Recorrido

1. Factor común: coeficientes → potencias → tres términos y dos variables.
2. Factor común por agrupación: factores simples → coeficientes → factor negativo.
3. Trinomio cuadrado perfecto: suma → resta → coeficientes y dos variables.
4. Diferencia de cuadrados: raíces simples → coeficientes → potencias mayores.
5. Trinomio x² + bx + c: pareja positiva → pareja negativa → signos opuestos.

La respuesta se construye colocando números,
variables, signos, paréntesis y potencias en sus casillas. El turno cambia al terminar
un ejercicio. Al acertar, el marcador se actualiza para todos los participantes.
Una respuesta correcta al primer intento vale 3 puntos;
al segundo, 1 punto; al tercero, 0 puntos.
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
