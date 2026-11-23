# APOGEO — versión final con zonas ascendentes

Juego educativo de física estilo arcade espacial, listo para abrir en Visual Studio Code.


## Abrir
1. Descomprime `APOGEO_FINAL.zip`.
2. Abre esta carpeta desde Visual Studio Code.
3. Abre `index.html` con Live Server (recomendado) o directamente en un navegador.

No requiere npm ni dependencias.

## Contenido
- `index.html`, `styles.css`, `app.js`
- `assets/images/rocket.svg`, `planet.svg`, `space-background.png`
- `assets/images/planets/`: escenas vectoriales locales para órbita terrestre, Luna, Marte, Europa y Deep Space
- `assets/audio/`: efectos MP3 de inicio, respuesta correcta/incorrecta, clic y misión completada
- 30 preguntas de física, 7 por misión, 25 s por pregunta
- respuesta flexible sin tildes y tolerancia pequeña a errores tipográficos
- explicaciones y fórmulas
- puntuación, rangos, logros, récord, misiones y racha persistidos en `localStorage`

## Ascenso por zonas
La puntuación de respuestas correctas avanza la escena y la nave. El entorno cambia progresivamente:
1. Órbita terrestre
2. Luna
3. Marte
4. Europa (mundo helado)
5. Nebulosa Deep Space

La nave asciende dentro del panel, la cámara/fondo deriva y al alcanzar umbrales se cambia de planeta/escena con un efecto de llegada.

Los MP3 y las imágenes son locales; el juego no necesita conexión para esos recursos. La tipografía remota puede caer a fuentes de sistema si no hay internet.
