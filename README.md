# Factor Escape

Juego multijugador de factorización en tiempo real, inspirado en la dinámica de
Kahoot. Una persona crea una sala y comparte un código de seis caracteres; los
demás participantes escriben el código y su nombre para entrar.

Cada partida tiene diez ejercicios, organizados en cinco módulos de dos ejercicios
cada uno. El primer ejercicio avanza automáticamente cuando todos terminan; al
completar el segundo, el administrador decide cuándo abrir el siguiente módulo. Las salas
admiten hasta 20 participantes. Quien crea la sala entra como administrador: no
resuelve ejercicios ni participa en el puntaje, ve el progreso de los equipos y
decide cuándo avanzar. El marcador se actualiza para todos en tiempo real.

## Ejecutar

Usa Node.js 24 o superior y pnpm. Instala con `pnpm install`, inicia con
`pnpm dev` y abre http://localhost:3000. Sin `REDIS_URL`, el servidor de desarrollo
guarda las salas temporalmente en memoria. En Vercel, Redis es obligatorio para
compartir salas entre distintas instancias.

## Publicar en Internet

1. En el Marketplace del proyecto de Vercel, agrega la integración Upstash Redis.
2. Comprueba que la integración haya creado la variable `REDIS_URL`.
3. En `Settings → Functions`, activa Fluid Compute.
4. Vuelve a desplegar el proyecto.

Vercel sirve la conexión WebSocket desde `/api/ws`. Redis mantiene las salas
sincronizadas aunque los jugadores lleguen a distintas instancias. Cada sala
caduca automáticamente cuatro horas después de su última actividad.

## Recorrido

1. Factor común: coeficientes → potencias → tres términos y dos variables.
2. Factor común por agrupación: factores simples → coeficientes → factor negativo.
3. Trinomio cuadrado perfecto: suma → resta → coeficientes y dos variables.
4. Diferencia de cuadrados: raíces simples → coeficientes → potencias mayores.
5. Trinomio x² + bx + c: pareja positiva → pareja negativa → signos opuestos.

La respuesta se construye colocando números,
variables, signos, paréntesis y potencias en sus casillas. El turno cambia al terminar
un ejercicio. Al acertar, el marcador se actualiza para todos los participantes.
En cada ejercicio, el primer equipo que responde correctamente obtiene 20 puntos,
el segundo 19, el tercero 18 y así sucesivamente. A ese valor se le resta un punto
si acierta en el segundo intento y dos si acierta en el tercero. Un equipo que
agota sus intentos sin resolverlo obtiene 0 puntos.
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
