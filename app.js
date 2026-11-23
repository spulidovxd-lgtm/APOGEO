// APOGEO — Iteración 1: prototipo funcional.
// La rareza está preasignada a respuestas de demostración; no representa
// todavía estadísticas reales de respuestas de una comunidad.

const challenges = [
  { topic: "MECÁNICA", question: "¿Cómo se llama la energía que tiene un objeto debido a su movimiento?", answers: [
    { text: "energia cinetica", tier: 2 }, { text: "energía cinética", tier: 2 }, { text: "cinética", tier: 1 }
  ]},
  { topic: "FUERZAS", question: "¿Qué fuerza atrae los objetos hacia el centro de la Tierra?", answers: [
    { text: "gravedad", tier: 2 }, { text: "fuerza gravitacional", tier: 3 }, { text: "gravitacion", tier: 1 }
  ]},
  { topic: "MOVIMIENTO", question: "¿Qué magnitud física mide el cambio de velocidad con respecto al tiempo?", answers: [
    { text: "aceleracion", tier: 2 }, { text: "aceleración", tier: 2 }
  ]},
  { topic: "ONDAS", question: "¿Cómo se llama el número de ciclos de una onda por segundo?", answers: [
    { text: "frecuencia", tier: 2 }, { text: "frecuencia de onda", tier: 3 }
  ]},
  { topic: "ELECTRICIDAD", question: "¿Qué unidad se utiliza para medir la resistencia eléctrica?", answers: [
    { text: "ohmio", tier: 2 }, { text: "ohmios", tier: 2 }, { text: "ohm", tier: 1 }, { text: "omega", tier: 3 }
  ]},
  { topic: "ENERGÍA", question: "¿Cómo se llama la energía almacenada debido a la posición o configuración de un objeto?", answers: [
    { text: "energia potencial", tier: 2 }, { text: "energía potencial", tier: 2 }, { text: "potencial", tier: 1 }
  ]},
  { topic: "ASTROFÍSICA", question: "¿Cómo se llama el límite alrededor de un agujero negro a partir del cual nada puede escapar?", answers: [
    { text: "horizonte de sucesos", tier: 4 }, { text: "horizonte de eventos", tier: 3 }, { text: "horizonte", tier: 1 }
  ]}
];

const tiers = [
  { name: "ÓRBITA BAJA", points: 10 },
  { name: "ESTRATOSFERA", points: 20 },
  { name: "LÍNEA DE KÁRMÁN", points: 30 },
  { name: "ESTACIÓN ESPACIAL", points: 50 },
  { name: "SALTO LUNAR", points: 80 },
  { name: "SUPERNOVA", points: 100 }
];

const screens = {
  home: document.getElementById("home"),
  game: document.getElementById("game"),
  results: document.getElementById("results")
};
const $ = (id) => document.getElementById(id);

let current = 0;
let score = 0;
let altitude = 0;
let correct = 0;
let timeLeft = 25;
let timerId = null;
let locked = false;

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function normalize(value) {
  return value.toLocaleLowerCase("es").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[.,!?¿¡]/g, "")
    .replace(/\s+/g, " ").trim();
}

function startMission() {
  current = 0; score = 0; altitude = 0; correct = 0;
  showScreen("game");
  loadChallenge();
}

function loadChallenge() {
  clearInterval(timerId);
  locked = false;
  timeLeft = 25;
  const challenge = challenges[current];
  $("questionNumber").textContent = String(current + 1).padStart(2, "0");
  $("topic").textContent = challenge.topic;
  $("questionText").textContent = challenge.question;
  $("timer").textContent = timeLeft;
  $("progressBar").style.width = `${(current / challenges.length) * 100}%`;
  $("answerInput").value = "";
  $("answerInput").disabled = false;
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  $("answerInput").focus();
  timerId = setInterval(tick, 1000);
}

function tick() {
  timeLeft -= 1;
  $("timer").textContent = timeLeft;
  if (timeLeft <= 0) {
    clearInterval(timerId);
    finishAnswer(false, null, true);
  }
}

function finishAnswer(isCorrect, tier, timedOut = false) {
  if (locked) return;
  locked = true;
  clearInterval(timerId);
  $("answerInput").disabled = true;

  if (isCorrect && tier) {
    const reward = tiers[tier].points;
    score += reward;
    altitude += reward;
    correct += 1;
    $("feedback").textContent = `✓ RESPUESTA ACEPTADA · ${tiers[tier].name} · +${reward} PUNTOS`;
    $("feedback").className = "feedback good";
    $("altitude").textContent = altitude;
    $("score").textContent = String(score).padStart(3, "0");
    $("rocket").style.bottom = `${15 + Math.min(altitude / 700, 1) * 135}px`;
  } else {
    $("feedback").textContent = timedOut ? "TIEMPO AGOTADO · 0 PUNTOS" : "RESPUESTA NO RECONOCIDA · 0 PUNTOS";
    $("feedback").className = "feedback bad";
  }

  $("progressBar").style.width = `${((current + 1) / challenges.length) * 100}%`;
  setTimeout(() => {
    current += 1;
    if (current < challenges.length) loadChallenge();
    else showResults();
  }, 1500);
}

function submitAnswer(event) {
  event.preventDefault();
  if (locked) return;
  const answer = normalize($("answerInput").value);
  if (!answer) return;
  const match = challenges[current].answers.find(item => normalize(item.text) === answer);
  finishAnswer(Boolean(match), match ? match.tier : null);
}

function showResults() {
  clearInterval(timerId);
  $("finalAltitude").textContent = `${altitude} KM`;
  $("correctCount").textContent = `${correct} / ${challenges.length}`;
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
$("restartBtn").addEventListener("click", startMission);
