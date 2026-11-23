// APOGEO — Iteración 2: banco de 30 preguntas, validación flexible y explicaciones.
// Nota: los niveles de rareza son valores de diseño provisionales, no porcentajes
// calculados a partir de respuestas reales de jugadores.

const rarityLevels = [
  { name: "ÓRBITA BAJA", points: 10 },
  { name: "ESTRATOSFERA", points: 20 },
  { name: "LÍNEA DE KÁRMÁN", points: 30 },
  { name: "ESTACIÓN ESPACIAL", points: 50 },
  { name: "SALTO LUNAR", points: 80 },
  { name: "SUPERNOVA", points: 100 }
];

// Cada variante aceptada puede tener una recompensa distinta.
// tier: 0–5, correspondiente a rarityLevels.
const questionBank = [
  { id: 1, topic: "MECÁNICA", question: "¿Cómo se llama la energía que tiene un objeto debido a su movimiento?", answers: [{ value: "energía cinética", tier: 2 }, { value: "energia cinetica", tier: 2 }, { value: "cinética", tier: 1 }, { value: "energia de movimiento", tier: 3 }], explanation: "La energía cinética es la energía asociada al movimiento de un cuerpo. Depende de su masa y de su velocidad.", formula: "Ec = ½ · m · v²" },
  { id: 2, topic: "FUERZAS", question: "¿Qué fuerza atrae los objetos hacia el centro de la Tierra?", answers: [{ value: "gravedad", tier: 2 }, { value: "fuerza gravitacional", tier: 3 }, { value: "atraccion gravitatoria", tier: 4 }, { value: "fuerza de gravedad", tier: 2 }], explanation: "La gravedad es la interacción que atrae los cuerpos con masa. Cerca de la superficie terrestre produce una aceleración aproximada de 9,8 m/s².", formula: "Fg = m · g" },
  { id: 3, topic: "MOVIMIENTO", question: "¿Qué magnitud mide el cambio de velocidad con respecto al tiempo?", answers: [{ value: "aceleración", tier: 2 }, { value: "aceleracion", tier: 2 }, { value: "tasa de cambio de velocidad", tier: 4 }], explanation: "La aceleración indica qué tan rápido cambia la velocidad de un objeto durante un intervalo de tiempo.", formula: "a = Δv / Δt" },
  { id: 4, topic: "ONDAS", question: "¿Cómo se llama el número de ciclos de una onda por segundo?", answers: [{ value: "frecuencia", tier: 2 }, { value: "frecuencia de onda", tier: 3 }, { value: "hercios", tier: 1 }, { value: "hertz", tier: 1 }], explanation: "La frecuencia indica cuántos ciclos completos ocurren cada segundo. Su unidad es el hercio (Hz).", formula: "f = 1 / T" },
  { id: 5, topic: "ELECTRICIDAD", question: "¿Qué unidad se utiliza para medir la resistencia eléctrica?", answers: [{ value: "ohmio", tier: 2 }, { value: "ohmios", tier: 2 }, { value: "ohm", tier: 1 }, { value: "omega", tier: 3 }], explanation: "La resistencia mide la oposición de un material al paso de la corriente eléctrica. Se mide en ohmios.", formula: "R = V / I" },
  { id: 6, topic: "ENERGÍA", question: "¿Cómo se llama la energía almacenada debido a la posición o configuración de un objeto?", answers: [{ value: "energía potencial", tier: 2 }, { value: "energia potencial", tier: 2 }, { value: "potencial gravitatoria", tier: 3 }, { value: "energia almacenada", tier: 1 }], explanation: "La energía potencial gravitatoria depende de la masa, la gravedad y la altura respecto a un nivel de referencia.", formula: "Ep = m · g · h" },
  { id: 7, topic: "ASTROFÍSICA", question: "¿Cómo se llama el límite alrededor de un agujero negro a partir del cual nada puede escapar?", answers: [{ value: "horizonte de sucesos", tier: 4 }, { value: "horizonte de eventos", tier: 3 }, { value: "event horizon", tier: 5 }], explanation: "El horizonte de sucesos es el límite de un agujero negro a partir del cual no es posible regresar ni enviar señales al exterior.", formula: "No existe una fórmula única necesaria para definirlo en este nivel." },
  { id: 8, topic: "CINEMÁTICA", question: "¿Qué unidad del Sistema Internacional se usa para medir la velocidad?", answers: [{ value: "metros por segundo", tier: 2 }, { value: "m/s", tier: 1 }, { value: "metro por segundo", tier: 2 }], explanation: "La velocidad relaciona el desplazamiento con el tiempo. En el Sistema Internacional se expresa en metros por segundo.", formula: "v = Δx / Δt" },
  { id: 9, topic: "DINÁMICA", question: "¿Qué científico formuló las tres leyes clásicas del movimiento?", answers: [{ value: "isaac newton", tier: 2 }, { value: "newton", tier: 1 }, { value: "sir isaac newton", tier: 3 }], explanation: "Isaac Newton presentó las tres leyes del movimiento que relacionan fuerzas y movimiento en la mecánica clásica.", formula: "Segunda ley: ΣF = m · a" },
  { id: 10, topic: "FUERZAS", question: "¿Cómo se llama la fuerza que se opone al movimiento relativo entre dos superficies en contacto?", answers: [{ value: "fricción", tier: 2 }, { value: "friccion", tier: 2 }, { value: "rozamiento", tier: 2 }, { value: "fuerza de fricción", tier: 3 }], explanation: "La fricción actúa paralela a las superficies de contacto y se opone al deslizamiento o a su tendencia.", formula: "Ff = μ · N (modelo de fricción cinética o límite estático)" },
  { id: 11, topic: "MOVIMIENTO", question: "¿Cómo se llama el movimiento en el que un objeto recorre una trayectoria circular con rapidez constante?", answers: [{ value: "movimiento circular uniforme", tier: 3 }, { value: "mcu", tier: 1 }, { value: "circular uniforme", tier: 2 }], explanation: "En el movimiento circular uniforme la rapidez es constante, pero la dirección de la velocidad cambia continuamente.", formula: "ac = v² / r" },
  { id: 12, topic: "GRAVITACIÓN", question: "¿Cómo se llama la trayectoria que sigue un objeto alrededor de otro por efecto de la gravedad?", answers: [{ value: "órbita", tier: 2 }, { value: "orbita", tier: 2 }, { value: "trayectoria orbital", tier: 3 }], explanation: "Una órbita es la trayectoria de un cuerpo alrededor de otro debido a la interacción gravitatoria.", formula: "Para órbitas circulares: v = √(GM/r)" },
  { id: 13, topic: "ONDAS", question: "¿Qué magnitud representa la distancia entre dos crestas consecutivas de una onda?", answers: [{ value: "longitud de onda", tier: 2 }, { value: "lambda", tier: 3 }, { value: "λ", tier: 1 }], explanation: "La longitud de onda es la distancia entre dos puntos equivalentes consecutivos de una onda, como dos crestas.", formula: "v = λ · f" },
  { id: 14, topic: "ONDAS", question: "¿Cómo se llama el tiempo que tarda una onda en completar un ciclo?", answers: [{ value: "periodo", tier: 2 }, { value: "período", tier: 2 }, { value: "tiempo de un ciclo", tier: 3 }], explanation: "El período es el tiempo necesario para completar una oscilación. Es inversamente proporcional a la frecuencia.", formula: "T = 1 / f" },
  { id: 15, topic: "SONIDO", question: "¿El sonido puede propagarse en el vacío? Responde sí o no.", answers: [{ value: "no", tier: 1 }, { value: "no puede", tier: 2 }, { value: "no, necesita un medio", tier: 3 }], explanation: "El sonido es una onda mecánica y necesita un medio material, como aire, agua o sólidos, para propagarse.", formula: "No aplica una fórmula única." },
  { id: 16, topic: "ELECTRICIDAD", question: "¿Cómo se llama el flujo ordenado de carga eléctrica?", answers: [{ value: "corriente eléctrica", tier: 2 }, { value: "corriente", tier: 1 }, { value: "intensidad de corriente", tier: 3 }], explanation: "La corriente eléctrica mide cuánta carga atraviesa una sección de un conductor por unidad de tiempo.", formula: "I = Q / t" },
  { id: 17, topic: "ELECTRICIDAD", question: "¿Qué unidad se utiliza para medir la corriente eléctrica?", answers: [{ value: "amperio", tier: 2 }, { value: "amperios", tier: 2 }, { value: "ampere", tier: 2 }, { value: "a", tier: 1 }], explanation: "El amperio es la unidad básica del Sistema Internacional para la corriente eléctrica.", formula: "1 A = 1 C/s" },
  { id: 18, topic: "ELECTRICIDAD", question: "¿Qué unidad mide la diferencia de potencial eléctrico?", answers: [{ value: "voltio", tier: 2 }, { value: "voltios", tier: 2 }, { value: "volt", tier: 1 }, { value: "v", tier: 1 }], explanation: "La diferencia de potencial, también llamada voltaje, representa energía por unidad de carga entre dos puntos.", formula: "V = E / Q" },
  { id: 19, topic: "ENERGÍA", question: "¿Cuál es la unidad de energía en el Sistema Internacional?", answers: [{ value: "julio", tier: 2 }, { value: "joule", tier: 2 }, { value: "julios", tier: 2 }, { value: "j", tier: 1 }], explanation: "El julio es la unidad de energía y trabajo en el Sistema Internacional.", formula: "1 J = 1 N · m" },
  { id: 20, topic: "TERMODINÁMICA", question: "¿Qué instrumento se utiliza para medir la temperatura?", answers: [{ value: "termómetro", tier: 2 }, { value: "termometro", tier: 2 }, { value: "thermometer", tier: 3 }], explanation: "El termómetro permite medir la temperatura de un cuerpo o del ambiente.", formula: "En el SI, la temperatura se expresa en kelvin (K)." },
  { id: 21, topic: "TERMODINÁMICA", question: "¿Cómo se llama la energía transferida entre cuerpos debido a una diferencia de temperatura?", answers: [{ value: "calor", tier: 2 }, { value: "energia termica transferida", tier: 4 }, { value: "energía térmica transferida", tier: 4 }], explanation: "El calor es energía en tránsito que se transfiere por una diferencia de temperatura; no es lo mismo que la temperatura.", formula: "Q = m · c · ΔT" },
  { id: 22, topic: "FLUIDOS", question: "¿Qué principio explica que la presión aplicada a un fluido encerrado se transmite en todas las direcciones?", answers: [{ value: "principio de pascal", tier: 3 }, { value: "ley de pascal", tier: 2 }, { value: "pascal", tier: 1 }], explanation: "El principio de Pascal establece que un cambio de presión aplicado a un fluido confinado se transmite a todo el fluido y las paredes del recipiente.", formula: "P = F / A" },
  { id: 23, topic: "FLUIDOS", question: "¿Qué fuerza hacia arriba ejerce un fluido sobre un objeto sumergido?", answers: [{ value: "empuje", tier: 2 }, { value: "fuerza de empuje", tier: 3 }, { value: "empuje de arquimedes", tier: 4 }], explanation: "El empuje es la fuerza ascendente que ejerce un fluido sobre un cuerpo sumergido o flotante.", formula: "E = ρ · g · V" },
  { id: 24, topic: "ÓPTICA", question: "¿Cómo se llama el cambio de dirección de la luz al pasar de un medio a otro?", answers: [{ value: "refracción", tier: 2 }, { value: "refraccion", tier: 2 }, { value: "refracción de la luz", tier: 3 }], explanation: "La refracción ocurre cuando la luz cambia de velocidad al pasar entre medios y, generalmente, cambia también de dirección.", formula: "n₁ · sen(θ₁) = n₂ · sen(θ₂)" },
  { id: 25, topic: "ÓPTICA", question: "¿Cómo se llama el rebote de la luz al chocar con una superficie?", answers: [{ value: "reflexión", tier: 2 }, { value: "reflexion", tier: 2 }, { value: "reflejo", tier: 1 }], explanation: "La reflexión es el fenómeno en el que la luz rebota al llegar a una superficie.", formula: "Ángulo de incidencia = ángulo de reflexión" },
  { id: 26, topic: "MAGNETISMO", question: "¿Qué polos magnéticos se atraen entre sí?", answers: [{ value: "polos opuestos", tier: 2 }, { value: "norte y sur", tier: 2 }, { value: "polo norte y polo sur", tier: 3 }], explanation: "Los polos magnéticos opuestos se atraen, mientras que los polos iguales se repelen.", formula: "No aplica una fórmula única." },
  { id: 27, topic: "FÍSICA MODERNA", question: "¿Cuál es la velocidad aproximada de la luz en el vacío?", answers: [{ value: "300000 km/s", tier: 2 }, { value: "300 mil kilometros por segundo", tier: 3 }, { value: "3 por 10 a la 8 metros por segundo", tier: 4 }, { value: "300000000 m/s", tier: 3 }], explanation: "La luz en el vacío viaja a aproximadamente 300.000 kilómetros por segundo, una velocidad límite para la información y la materia.", formula: "c ≈ 3,0 × 10⁸ m/s" },
  { id: 28, topic: "ASTROFÍSICA", question: "¿Cómo se llama una estrella que explota al final de ciertas etapas de su evolución?", answers: [{ value: "supernova", tier: 2 }, { value: "explosión de supernova", tier: 3 }, { value: "super nova", tier: 1 }], explanation: "Una supernova es una explosión estelar extremadamente energética que puede ocurrir en las etapas finales de ciertos tipos de estrellas.", formula: "No aplica una fórmula única." },
  { id: 29, topic: "ASTROFÍSICA", question: "¿Cómo se llama nuestra galaxia?", answers: [{ value: "vía láctea", tier: 2 }, { value: "via lactea", tier: 2 }, { value: "la galaxia vía láctea", tier: 3 }, { value: "milky way", tier: 3 }], explanation: "La Vía Láctea es la galaxia que contiene nuestro Sistema Solar. Tiene cientos de miles de millones de estrellas.", formula: "No aplica una fórmula única." },
  { id: 30, topic: "ASTROFÍSICA", question: "¿Cómo se llama el punto de una órbita en el que un planeta está más cerca del Sol?", answers: [{ value: "perihelio", tier: 3 }, { value: "punto más cercano al sol", tier: 4 }, { value: "perihelion", tier: 4 }], explanation: "El perihelio es el punto de la órbita de un cuerpo alrededor del Sol en el que su distancia al Sol es mínima.", formula: "La distancia orbital varía según la excentricidad de la órbita." }
];

const screens = {
  home: document.getElementById("home"),
  game: document.getElementById("game"),
  results: document.getElementById("results")
};
const $ = (id) => document.getElementById(id);

let missionQuestions = [];
let current = 0;
let score = 0;
let altitude = 0;
let correct = 0;
let timeLeft = 25;
let timerId = null;
let locked = false;
let pendingNext = false;

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function normalize(value) {
  return value.toLocaleLowerCase("es")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9λ/×.,+-]/g, " ")
    .replace(/\s+/g, " ").trim();
}

function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = old;
    }
  }
  return row[b.length];
}

function matchAnswer(input, answers) {
  const cleanInput = normalize(input);
  const exact = answers.find(answer => normalize(answer.value) === cleanInput);
  if (exact) return exact;

  // Acepta como máximo un pequeño error de escritura. Evita aproximaciones
  // demasiado amplias en respuestas cortas o ambiguas.
  const possible = answers
    .map(answer => ({ answer, clean: normalize(answer.value) }))
    .filter(item => item.clean.length >= 6 && cleanInput.length >= 6)
    .map(item => ({ ...item, distance: levenshtein(cleanInput, item.clean) }))
    .filter(item => item.distance <= (item.clean.length >= 11 ? 2 : 1))
    .sort((a, b) => a.distance - b.distance);

  if (!possible.length) return null;
  if (possible.length > 1 && possible[0].distance === possible[1].distance) return null;
  return possible[0].answer;
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => ((value = value * 16807 % 2147483647) - 1) / 2147483646;
}

function getDailyMission() {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const seed = [...dateKey].reduce((total, char) => total + char.charCodeAt(0), 0) * 97;
  const random = seededRandom(seed);
  return [...questionBank]
    .sort(() => random() - 0.5)
    .slice(0, 7);
}

function startMission() {
  current = 0;
  score = 0;
  altitude = 0;
  correct = 0;
  missionQuestions = getDailyMission();
  $("altitude").textContent = "0";
  $("score").textContent = "000";
  $("rocket").style.bottom = "15px";
  showScreen("game");
  loadChallenge();
}

function loadChallenge() {
  clearInterval(timerId);
  locked = false;
  pendingNext = false;
  timeLeft = 25;
  const challenge = missionQuestions[current];
  $("questionNumber").textContent = String(current + 1).padStart(2, "0");
  $("topic").textContent = challenge.topic;
  $("questionText").textContent = challenge.question;
  $("timer").textContent = timeLeft;
  $("progressBar").style.width = `${(current / missionQuestions.length) * 100}%`;
  $("answerInput").value = "";
  $("answerInput").disabled = false;
  $("answerInput").hidden = false;
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  $("explanationCard").hidden = true;
  $("nextBtn").hidden = true;
  $("submitBtn").hidden = false;
  $("answerInput").focus();
  timerId = setInterval(tick, 1000);
}

function tick() {
  timeLeft -= 1;
  $("timer").textContent = timeLeft;
  if (timeLeft <= 0) {
    clearInterval(timerId);
    finishAnswer(null, true);
  }
}

function finishAnswer(matchedAnswer, timedOut = false) {
  if (locked) return;
  locked = true;
  clearInterval(timerId);
  $("answerInput").disabled = true;
  $("submitBtn").hidden = true;

  const challenge = missionQuestions[current];
  const isCorrect = Boolean(matchedAnswer);
  if (isCorrect) {
    const reward = rarityLevels[matchedAnswer.tier].points;
    score += reward;
    altitude += reward;
    correct += 1;
    $("feedback").textContent = `✓ RESPUESTA ACEPTADA · ${rarityLevels[matchedAnswer.tier].name} · +${reward} PUNTOS`;
    $("feedback").className = "feedback good";
    $("altitude").textContent = altitude;
    $("score").textContent = String(score).padStart(3, "0");
    $("rocket").style.bottom = `${15 + Math.min(altitude / 700, 1) * 135}px`;
  } else {
    $("feedback").textContent = timedOut ? "TIEMPO AGOTADO · 0 PUNTOS" : "RESPUESTA NO RECONOCIDA · 0 PUNTOS";
    $("feedback").className = "feedback bad";
  }

  const acceptedAnswers = challenge.answers.map(answer => answer.value);
  $("correctAnswer").textContent = acceptedAnswers[0];
  $("explanationText").textContent = challenge.explanation;
  $("formulaText").textContent = challenge.formula;
  $("explanationCard").hidden = false;
  $("nextBtn").textContent = current === missionQuestions.length - 1 ? "VER RESULTADOS →" : "SIGUIENTE DESAFÍO →";
  $("nextBtn").hidden = false;
  $("progressBar").style.width = `${((current + 1) / missionQuestions.length) * 100}%`;
  pendingNext = true;
}

function submitAnswer(event) {
  event.preventDefault();
  if (locked) return;
  const answer = $("answerInput").value.trim();
  if (!answer) return;
  const match = matchAnswer(answer, missionQuestions[current].answers);
  finishAnswer(match);
}

function nextChallenge() {
  if (!pendingNext) return;
  current += 1;
  if (current < missionQuestions.length) loadChallenge();
  else showResults();
}

function showResults() {
  clearInterval(timerId);
  $("finalAltitude").textContent = `${altitude} KM`;
  $("correctCount").textContent = `${correct} / ${missionQuestions.length}`;
  $("finalScore").textContent = score;
  $("resultMessage").textContent = correct === 7
    ? "¡Excelente misión! ARIEL-1 alcanzó su máximo potencial."
    : correct >= 4
      ? "Buen trabajo, explorador. Cada misión te lleva más lejos."
      : "La exploración continúa. Aprende, inténtalo de nuevo y llega más alto.";
  showScreen("results");
}

$("startBtn").addEventListener("click", startMission);
$("answerForm").addEventListener("submit", submitAnswer);
$("nextBtn").addEventListener("click", nextChallenge);
$("restartBtn").addEventListener("click", startMission);
