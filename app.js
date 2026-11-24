// APOGEO — Iteración 2 actualizada: banco ampliado, misiones aleatorias, validación y explicaciones.
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
  { id: 30, topic: "ASTROFÍSICA", question: "¿Cómo se llama el punto de una órbita en el que un planeta está más cerca del Sol?", answers: [{ value: "perihelio", tier: 3 }, { value: "punto más cercano al sol", tier: 4 }, { value: "perihelion", tier: 4 }], explanation: "El perihelio es el punto de la órbita de un cuerpo alrededor del Sol en el que su distancia al Sol es mínima.", formula: "La distancia orbital varía según la excentricidad de la órbita." },
  {"id": 31, "topic": "DINÁMICA", "question": "¿Cuál es la unidad de fuerza en el Sistema Internacional?", "answers": [{"value": "newton", "tier": 2}, {"value": "newtons", "tier": 2}, {"value": "n", "tier": 1}], "explanation": "El newton (N) es la unidad de fuerza. Una fuerza de un newton produce en una masa de un kilogramo una aceleración de un metro por segundo al cuadrado.", "formula": "1 N = 1 kg · m/s²"},
  {"id": 32, "topic": "MATERIA", "question": "¿Cuál es la unidad de masa en el Sistema Internacional?", "answers": [{"value": "kilogramo", "tier": 2}, {"value": "kilogramos", "tier": 2}, {"value": "kg", "tier": 1}], "explanation": "El kilogramo es la unidad base de masa del Sistema Internacional. La masa mide la cantidad de materia y también está relacionada con la inercia.", "formula": "Símbolo: kg"},
  {"id": 33, "topic": "DINÁMICA", "question": "¿Cómo se llama la tendencia de un objeto a mantener su estado de reposo o movimiento?", "answers": [{"value": "inercia", "tier": 2}, {"value": "ley de inercia", "tier": 3}], "explanation": "La inercia es la propiedad de los cuerpos de resistirse a cambios en su estado de movimiento. Está relacionada con la masa.", "formula": "Primera ley de Newton: ΣF = 0 → velocidad constante"},
  {"id": 34, "topic": "DINÁMICA", "question": "Según la primera ley de Newton, ¿qué ocurre con un objeto si la fuerza neta sobre él es cero?", "answers": [{"value": "mantiene su estado de movimiento", "tier": 4}, {"value": "permanece en reposo o en movimiento rectilineo uniforme", "tier": 5}, {"value": "permanece en reposo o con velocidad constante", "tier": 4}], "explanation": "Si la fuerza neta es cero, el objeto conserva su velocidad: puede permanecer quieto o seguir en línea recta con rapidez constante.", "formula": "ΣF = 0 → a = 0"},
  {"id": 35, "topic": "TRABAJO Y ENERGÍA", "question": "¿Cómo se llama la energía transferida cuando una fuerza produce un desplazamiento?", "answers": [{"value": "trabajo", "tier": 2}, {"value": "trabajo mecanico", "tier": 3}], "explanation": "En física, el trabajo ocurre cuando una fuerza produce un desplazamiento. Si la fuerza es constante, se relaciona con la componente de la fuerza en la dirección del movimiento.", "formula": "W = F · d · cos(θ)"},
  {"id": 36, "topic": "TRABAJO Y ENERGÍA", "question": "¿Cuál es la unidad de potencia en el Sistema Internacional?", "answers": [{"value": "vatio", "tier": 2}, {"value": "vatios", "tier": 2}, {"value": "watt", "tier": 2}, {"value": "w", "tier": 1}], "explanation": "El vatio mide la rapidez con la que se transfiere energía o se realiza trabajo.", "formula": "1 W = 1 J/s"},
  {"id": 37, "topic": "MOVIMIENTO", "question": "¿Cómo se llama el producto de la masa de un objeto por su velocidad?", "answers": [{"value": "cantidad de movimiento", "tier": 3}, {"value": "momento lineal", "tier": 3}, {"value": "momentum", "tier": 2}], "explanation": "La cantidad de movimiento es una magnitud vectorial que depende de la masa y la velocidad de un cuerpo.", "formula": "p = m · v"},
  {"id": 38, "topic": "MATERIA", "question": "¿Qué magnitud física relaciona la masa de un objeto con el volumen que ocupa?", "answers": [{"value": "densidad", "tier": 2}, {"value": "masa volumica", "tier": 3}], "explanation": "La densidad indica cuánta masa hay por unidad de volumen. Permite comparar qué tan compacta está la materia.", "formula": "ρ = m / V"},
  {"id": 39, "topic": "FLUIDOS", "question": "¿Qué magnitud mide la fuerza ejercida perpendicularmente por unidad de área?", "answers": [{"value": "presion", "tier": 2}, {"value": "presión", "tier": 2}], "explanation": "La presión relaciona la fuerza perpendicular aplicada sobre una superficie con el área sobre la que actúa.", "formula": "P = F / A"},
  {"id": 40, "topic": "TERMODINÁMICA", "question": "¿Cómo se llama la transferencia de calor por contacto directo entre partículas?", "answers": [{"value": "conduccion", "tier": 2}, {"value": "conducción", "tier": 2}, {"value": "conduccion termica", "tier": 3}], "explanation": "La conducción transfiere energía térmica a través de un material o entre cuerpos en contacto, sin transporte global de materia.", "formula": "Ley de Fourier: Q/t = k · A · ΔT / L"},
  {"id": 41, "topic": "TERMODINÁMICA", "question": "¿Cómo se llama la transferencia de calor mediante el movimiento de un fluido?", "answers": [{"value": "conveccion", "tier": 2}, {"value": "convección", "tier": 2}, {"value": "conveccion termica", "tier": 3}], "explanation": "La convección ocurre en líquidos y gases cuando el movimiento del fluido transporta energía térmica.", "formula": "Transferencia de calor por movimiento del fluido"},
  {"id": 42, "topic": "TERMODINÁMICA", "question": "¿Qué mecanismo permite que la energía del Sol llegue a la Tierra a través del vacío?", "answers": [{"value": "radiacion", "tier": 2}, {"value": "radiación", "tier": 2}, {"value": "radiacion electromagnetica", "tier": 3}], "explanation": "La radiación transfiere energía mediante ondas electromagnéticas y no necesita un medio material.", "formula": "La radiación puede propagarse en el vacío"},
  {"id": 43, "topic": "ONDAS", "question": "¿Cómo se llama una onda en la que las partículas vibran perpendicularmente a la dirección de propagación?", "answers": [{"value": "onda transversal", "tier": 2}, {"value": "transversal", "tier": 1}], "explanation": "En una onda transversal, la vibración del medio es perpendicular a la dirección en la que avanza la onda.", "formula": "Ejemplo: onda en una cuerda"},
  {"id": 44, "topic": "ONDAS", "question": "¿Cómo se llama una onda en la que las partículas vibran en la misma dirección en que se propaga?", "answers": [{"value": "onda longitudinal", "tier": 2}, {"value": "longitudinal", "tier": 1}], "explanation": "En una onda longitudinal, las partículas vibran paralelamente a la dirección de propagación. El sonido en el aire es un ejemplo.", "formula": "Ejemplo: sonido en el aire"},
  {"id": 45, "topic": "ONDAS", "question": "¿Qué magnitud de una onda se relaciona con su máxima distancia respecto a la posición de equilibrio?", "answers": [{"value": "amplitud", "tier": 2}, {"value": "amplitud de onda", "tier": 3}], "explanation": "La amplitud es el máximo desplazamiento de un punto del medio respecto a su posición de equilibrio.", "formula": "Se representa comúnmente con A"},
  {"id": 46, "topic": "ONDAS", "question": "¿Qué tipo de ondas pueden propagarse en el vacío?", "answers": [{"value": "ondas electromagneticas", "tier": 3}, {"value": "ondas electromagnéticas", "tier": 3}, {"value": "electromagneticas", "tier": 2}], "explanation": "Las ondas electromagnéticas, como la luz y las ondas de radio, no necesitan un medio material para propagarse.", "formula": "c = λ · f en el vacío"},
  {"id": 47, "topic": "ÓPTICA", "question": "¿Cómo se llama el dispositivo óptico que hace converger o divergir los rayos de luz?", "answers": [{"value": "lente", "tier": 2}, {"value": "una lente", "tier": 2}], "explanation": "Una lente es un elemento óptico que refracta la luz. Según su forma, puede hacer converger o divergir los rayos.", "formula": "Ecuación de lente delgada: 1/f = 1/do + 1/di"},
  {"id": 48, "topic": "ÓPTICA", "question": "¿Cómo se llama la distancia entre el centro óptico de una lente y su foco?", "answers": [{"value": "distancia focal", "tier": 2}, {"value": "longitud focal", "tier": 3}], "explanation": "La distancia focal caracteriza una lente o espejo y determina cómo enfoca la luz.", "formula": "f = distancia focal"},
  {"id": 49, "topic": "ELECTRICIDAD", "question": "¿Cuál es la unidad de carga eléctrica en el Sistema Internacional?", "answers": [{"value": "culombio", "tier": 3}, {"value": "coulomb", "tier": 2}, {"value": "coulombio", "tier": 2}, {"value": "c", "tier": 1}], "explanation": "El culombio es la unidad de carga eléctrica. Una carga de un culombio equivale a la carga transportada por una corriente de un amperio durante un segundo.", "formula": "Q = I · t"},
  {"id": 50, "topic": "ELECTRICIDAD", "question": "¿Qué debe ocurrir para que circule corriente en un circuito eléctrico simple?", "answers": [{"value": "el circuito debe estar cerrado", "tier": 3}, {"value": "estar cerrado", "tier": 2}, {"value": "circuito cerrado", "tier": 2}], "explanation": "En un circuito simple debe existir un camino conductor cerrado y una diferencia de potencial para mantener la corriente.", "formula": "I = V / R"},
  {"id": 51, "topic": "ELECTRICIDAD", "question": "En un circuito en serie, ¿qué magnitud es igual en todos los componentes?", "answers": [{"value": "corriente", "tier": 2}, {"value": "intensidad de corriente", "tier": 3}, {"value": "la corriente electrica", "tier": 3}], "explanation": "En un circuito en serie existe un solo camino para la carga, por lo que la misma corriente atraviesa todos los componentes.", "formula": "I total = I₁ = I₂ = I₃"},
  {"id": 52, "topic": "ELECTRICIDAD", "question": "En un circuito en paralelo, ¿qué magnitud es igual en cada rama ideal?", "answers": [{"value": "voltaje", "tier": 2}, {"value": "tension", "tier": 2}, {"value": "diferencia de potencial", "tier": 3}], "explanation": "En un circuito en paralelo, cada rama está conectada entre los mismos dos puntos, por lo que tiene la misma diferencia de potencial.", "formula": "V total = V₁ = V₂ = V₃"},
  {"id": 53, "topic": "MATERIA", "question": "¿Cómo se llama un material que permite que las cargas eléctricas se muevan con facilidad?", "answers": [{"value": "conductor", "tier": 2}, {"value": "material conductor", "tier": 3}, {"value": "conductor electrico", "tier": 3}], "explanation": "Un conductor permite el movimiento relativamente fácil de cargas eléctricas. Muchos metales son buenos conductores.", "formula": "Ejemplo: cobre"},
  {"id": 54, "topic": "MATERIA", "question": "¿Cómo se llama un material que dificulta el movimiento de las cargas eléctricas?", "answers": [{"value": "aislante", "tier": 2}, {"value": "aislante electrico", "tier": 3}, {"value": "material aislante", "tier": 3}], "explanation": "Un aislante dificulta el movimiento de cargas eléctricas. Se utiliza para reducir el paso no deseado de corriente.", "formula": "Ejemplo: caucho"},
  {"id": 55, "topic": "MAGNETISMO", "question": "¿Cómo se llama la región alrededor de un imán donde actúan fuerzas magnéticas?", "answers": [{"value": "campo magnetico", "tier": 2}, {"value": "campo magnético", "tier": 2}], "explanation": "El campo magnético describe la influencia magnética en el espacio alrededor de un imán, una corriente o ciertos materiales.", "formula": "Se representa con B"},
  {"id": 56, "topic": "ENERGÍA", "question": "¿Qué principio establece que la energía no se crea ni se destruye, solo se transforma?", "answers": [{"value": "ley de conservacion de la energia", "tier": 3}, {"value": "conservacion de la energia", "tier": 3}, {"value": "principio de conservacion de la energia", "tier": 4}], "explanation": "La conservación de la energía establece que la energía total de un sistema aislado permanece constante, aunque cambie de forma.", "formula": "E inicial = E final"},
  {"id": 57, "topic": "ENERGÍA", "question": "¿Cómo se llama la energía almacenada cuando un resorte se estira o comprime?", "answers": [{"value": "energia potencial elastica", "tier": 3}, {"value": "energía potencial elástica", "tier": 3}, {"value": "energia elastica", "tier": 2}], "explanation": "Un resorte deformado almacena energía potencial elástica que puede liberar al volver hacia su posición de equilibrio.", "formula": "Ee = ½ · k · x²"},
  {"id": 58, "topic": "MOVIMIENTO", "question": "Si un objeto cae libremente cerca de la superficie terrestre y se desprecia el aire, ¿qué aceleración tiene?", "answers": [{"value": "9.8 m/s2", "tier": 3}, {"value": "9,8 m/s2", "tier": 3}, {"value": "9.8 metros por segundo al cuadrado", "tier": 4}, {"value": "gravedad", "tier": 1}], "explanation": "En caída libre ideal, la aceleración es la gravedad terrestre, aproximadamente 9,8 m/s², dirigida hacia abajo.", "formula": "g ≈ 9,8 m/s²"},
  {"id": 59, "topic": "MOVIMIENTO", "question": "¿Cómo se llama la trayectoria curva que sigue un objeto lanzado al aire cuando solo actúa la gravedad?", "answers": [{"value": "trayectoria parabolica", "tier": 3}, {"value": "parabola", "tier": 2}, {"value": "movimiento parabolico", "tier": 3}], "explanation": "En el movimiento de proyectil ideal, la combinación de velocidad horizontal constante y aceleración vertical produce una trayectoria parabólica.", "formula": "x = v₀x · t ; y = y₀ + v₀y · t − ½gt²"},
  {"id": 60, "topic": "MOVIMIENTO CIRCULAR", "question": "¿Qué fuerza neta apunta hacia el centro de una trayectoria circular?", "answers": [{"value": "fuerza centripeta", "tier": 3}, {"value": "fuerza centrípeta", "tier": 3}], "explanation": "La fuerza centrípeta es el nombre de la fuerza neta dirigida hacia el centro que mantiene a un objeto en trayectoria circular.", "formula": "Fc = m · v² / r"},
  {"id": 61, "topic": "ROTACIÓN", "question": "¿Cómo se llama la capacidad de una fuerza para producir rotación alrededor de un eje?", "answers": [{"value": "torque", "tier": 2}, {"value": "momento de fuerza", "tier": 3}, {"value": "momento torsor", "tier": 3}], "explanation": "El torque o momento de fuerza mide la tendencia de una fuerza a hacer girar un objeto alrededor de un eje o punto.", "formula": "τ = r · F · sen(θ)"},
  {"id": 62, "topic": "EQUILIBRIO", "question": "¿Cómo se llama el estado de un cuerpo cuando la fuerza neta y el torque neto son cero?", "answers": [{"value": "equilibrio mecanico", "tier": 3}, {"value": "equilibrio", "tier": 2}, {"value": "equilibrio estatico", "tier": 3}], "explanation": "En equilibrio mecánico no hay aceleración lineal ni angular: la fuerza neta y el torque neto son cero.", "formula": "ΣF = 0 y Στ = 0"},
  {"id": 63, "topic": "TERMODINÁMICA", "question": "¿Cuál es la temperatura del cero absoluto en grados Celsius, aproximadamente?", "answers": [{"value": "menos 273.15 grados celsius", "tier": 4}, {"value": "-273.15", "tier": 3}, {"value": "-273.15 °c", "tier": 3}], "explanation": "El cero absoluto corresponde a 0 kelvin, equivalente aproximadamente a −273,15 °C. Es el límite inferior de la temperatura termodinámica.", "formula": "K = °C + 273,15"},
  {"id": 64, "topic": "TERMODINÁMICA", "question": "¿Cuál es la unidad base de temperatura en el Sistema Internacional?", "answers": [{"value": "kelvin", "tier": 2}, {"value": "k", "tier": 1}], "explanation": "El kelvin es la unidad base de temperatura termodinámica en el Sistema Internacional.", "formula": "Símbolo: K"},
  {"id": 65, "topic": "ASTROFÍSICA", "question": "¿Cómo se llama la distancia que recorre la luz en un año?", "answers": [{"value": "año luz", "tier": 2}, {"value": "año-luz", "tier": 2}, {"value": "ano luz", "tier": 2}], "explanation": "Un año luz es una unidad de distancia, no de tiempo. Representa lo que recorre la luz en un año en el vacío.", "formula": "1 año luz ≈ 9,46 × 10¹² km"},
  {"id": 66, "topic": "ASTROFÍSICA", "question": "¿Cómo se llama el fenómeno en el que la luz de un objeto astronómico se desplaza hacia longitudes de onda mayores?", "answers": [{"value": "corrimiento al rojo", "tier": 3}, {"value": "desplazamiento al rojo", "tier": 3}, {"value": "redshift", "tier": 2}], "explanation": "El corrimiento al rojo ocurre cuando la luz observada se desplaza hacia longitudes de onda mayores. En astronomía puede relacionarse con el movimiento de objetos lejanos y la expansión del universo.", "formula": "z = (λ observada − λ emitida) / λ emitida"},
  {"id": 67, "topic": "ASTROFÍSICA", "question": "¿Qué instrumento recoge y permite observar la luz de objetos astronómicos lejanos?", "answers": [{"value": "telescopio", "tier": 2}, {"value": "telescopio astronomico", "tier": 3}], "explanation": "Un telescopio recoge radiación electromagnética de objetos lejanos y ayuda a observar detalles que no se distinguen a simple vista.", "formula": "Los telescopios pueden detectar distintas regiones del espectro electromagnético"},
  {"id": 68, "topic": "ASTROFÍSICA", "question": "¿Cómo se llama el conjunto de una estrella y los cuerpos que orbitan a su alrededor, como planetas y otros objetos?", "answers": [{"value": "sistema planetario", "tier": 3}, {"value": "sistema solar", "tier": 2}], "explanation": "Un sistema planetario está formado por una estrella y los objetos ligados gravitacionalmente que orbitan a su alrededor. Nuestro sistema planetario es el Sistema Solar.", "formula": "La gravedad gobierna las órbitas"},
  {"id": 69, "topic": "GRAVITACIÓN", "question": "¿Qué ley describe la fuerza de atracción entre dos masas separadas por cierta distancia?", "answers": [{"value": "ley de gravitacion universal", "tier": 3}, {"value": "ley de la gravitacion universal", "tier": 3}, {"value": "gravitacion universal", "tier": 2}], "explanation": "La ley de gravitación universal establece que dos masas se atraen con una fuerza proporcional al producto de sus masas e inversamente proporcional al cuadrado de su distancia.", "formula": "F = G · (m₁ · m₂) / r²"},
  {"id": 70, "topic": "FÍSICA MODERNA", "question": "¿Qué relación famosa expresa la equivalencia entre masa y energía?", "answers": [{"value": "e igual a mc al cuadrado", "tier": 4}, {"value": "e=mc2", "tier": 3}, {"value": "e = mc²", "tier": 3}, {"value": "equivalencia masa energia", "tier": 4}], "explanation": "La ecuación de Einstein expresa que la masa está asociada a una cantidad de energía. Es una idea central de la relatividad especial.", "formula": "E = m · c²"}
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

// Mezcla el banco con Fisher–Yates: cada misión recibe 7 preguntas
// distintas y el orden vuelve a mezclarse cada vez que se inicia o reinicia.
let lastMissionSignature = "";

function shuffleQuestions(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomMission() {
  let shuffled = shuffleQuestions(questionBank);
  let signature = shuffled.slice(0, 7).map(question => question.id).sort((a, b) => a - b).join("-");
  // Evita repetir la misma combinación de 7 preguntas en dos rondas consecutivas,
  // aunque el orden sea distinto.
  while (signature === lastMissionSignature) {
    shuffled = shuffleQuestions(questionBank);
    signature = shuffled.slice(0, 7).map(question => question.id).sort((a, b) => a - b).join("-");
  }
  lastMissionSignature = signature;
  return shuffled.slice(0, 7);
}

// Escenarios visuales por hitos de progreso. Son etapas de exploración del juego,
// no una escala astronómica literal de distancias entre planetas.
function updateFlightScene(currentAltitude) {
  const stages = [
    { min: 0, name: "ÓRBITA TERRESTRE", destination: "TIERRA", emoji: "🌍", className: "stage-earth", progress: 0 },
    { min: 100, name: "RUTA LUNAR", destination: "LUNA", emoji: "🌕", className: "stage-moon", progress: 1 },
    { min: 200, name: "SECTOR MARTE", destination: "MARTE", emoji: "🔴", className: "stage-mars", progress: 2 },
    { min: 350, name: "SECTOR JÚPITER", destination: "JÚPITER", emoji: "🪐", className: "stage-jupiter", progress: 3 },
    { min: 500, name: "SECTOR SATURNO", destination: "SATURNO", emoji: "🪐", className: "stage-saturn", progress: 4 }
  ];
  const stage = [...stages].reverse().find(item => currentAltitude >= item.min) || stages[0];
  const scene = $("rocketTrack");
  scene.className = `rocket-track ${stage.className}`;
  $("planetEmoji").textContent = stage.emoji;
  $("planetName").textContent = stage.destination;
  $("sceneLabel").textContent = stage.name;
  $("rocket").style.bottom = `${22 + Math.min(currentAltitude / 700, 1) * 155}px`;
  $("rocket").classList.remove("launching");
  // Reinicia la animación de impulso en cada avance de altitud.
  void $("rocket").offsetWidth;
  $("rocket").classList.add("launching");
}

function startMission() {
  current = 0;
  score = 0;
  altitude = 0;
  correct = 0;
  missionQuestions = getRandomMission();
  $("altitude").textContent = "0";
  $("score").textContent = "000";
  updateFlightScene(0);
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
    updateFlightScene(altitude);
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
  $("resultMessage").textContent = correct === missionQuestions.length
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
