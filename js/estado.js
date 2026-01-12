// js/estado.js

let estado = {
    version: 0,
    isTest: true,
    contadorMonetary: 0,
    contadorErotic: 0,
    contadorControl: 0,
    recompensasMonetary: [],
    recompensasErotic: [],
    recompensasControl: [],
    imgHeteroAList: [],
    imgHeteroBList: [],
    imgGayAList: [],
    imgGayBList: [],
    imgMujerAList: [],
    imgMujerBList: [],
    imgLesbianaAList: [],
    imgLesbianaBList: [],
    pruebaActual: "",
    ultimaRecompensa: null
    ,
    totalGanado: 0,
    // Acumular datos de la sesión (lista de ensayos)
    sessionTrials: [],
    // Delay elegido antes de cada tarea (ms)
    delayBlancoForNextTrial: 0,
    // Folio de la sesión (si se ingresa)
    folio: ''
};
// Carga un index.txt y devuelve una lista de rutas completas a las imágenes
async function cargarIndex(rutaIndex, rutaBase) {
    const res = await fetch(rutaIndex);
    if (!res.ok) throw new Error(`No se pudo cargar ${rutaIndex}: ${res.status}`);
    const text = await res.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    return lines.map(fn => rutaBase + fn);
}

// Inicializa todas las listas de imágenes leyendo los index.txt en cada carpeta
async function inicializarImagenes() {
    try {
        const [hA, hB, gA, gB, mA, mB, lA, lB] = await Promise.all([
            cargarIndex('assets/HeteroHombre/A/index.txt', 'assets/HeteroHombre/A/'),
            cargarIndex('assets/HeteroHombre/B/index.txt', 'assets/HeteroHombre/B/'),
            cargarIndex('assets/Gay/A/index.txt', 'assets/Gay/A/'),
            cargarIndex('assets/Gay/B/index.txt', 'assets/Gay/B/'),
            cargarIndex('assets/HeteroMujer/A/index.txt', 'assets/HeteroMujer/A/'),
            cargarIndex('assets/HeteroMujer/B/index.txt', 'assets/HeteroMujer/B/'),
            cargarIndex('assets/Lesbiana/A/index.txt', 'assets/Lesbiana/A/'),
            cargarIndex('assets/Lesbiana/B/index.txt', 'assets/Lesbiana/B/')
        ]);

        estado.imgHeteroAList = hA;
        estado.imgHeteroBList = hB;
        estado.imgGayAList = gA;
        estado.imgGayBList = gB;
        estado.imgMujerAList = mA;
        estado.imgMujerBList = mB;
        estado.imgLesbianaAList = lA;
        estado.imgLesbianaBList = lB;

        // Guardar copias originales para poder rellenar si alguna lista se vacía
        estado._origImgHeteroAList = Array.from(hA);
        estado._origImgHeteroBList = Array.from(hB);
        estado._origImgGayAList = Array.from(gA);
        estado._origImgGayBList = Array.from(gB);
        estado._origImgMujerAList = Array.from(mA);
        estado._origImgMujerBList = Array.from(mB);
        estado._origImgLesbianaAList = Array.from(lA);
        estado._origImgLesbianaBList = Array.from(lB);

        // Barajar cada lista individualmente (Fisher-Yates)
        function shuffleArray(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }

        shuffleArray(estado.imgHeteroAList);
        shuffleArray(estado.imgHeteroBList);
        shuffleArray(estado.imgGayAList);
        shuffleArray(estado.imgGayBList);
        shuffleArray(estado.imgMujerAList);
        shuffleArray(estado.imgMujerBList);
        shuffleArray(estado.imgLesbianaAList);
        shuffleArray(estado.imgLesbianaBList);

        console.log('Índices de imágenes cargados y barajados:', {
            heteroA: estado.imgHeteroAList.length,
            heteroB: estado.imgHeteroBList.length,
            gayA: estado.imgGayAList.length,
            gayB: estado.imgGayBList.length,
            mujerA: estado.imgMujerAList.length,
            mujerB: estado.imgMujerBList.length,
            lesbianaA: estado.imgLesbianaAList.length,
            lesbianaB: estado.imgLesbianaBList.length
        });
    } catch (e) {
        console.error('Error al inicializar imágenes:', e);
        // No lanzar para que la aplicación pueda continuar en modo degradado
    }
}

function inicializarListas() {
    // Limpiamos por si se reinicia la prueba
    estado.recompensasMonetary = [];
    estado.recompensasErotic = [];
    estado.recompensasControl = [];

    // Llenar listas (Equivalente al bloque static de CuePanel.java)
    for (let i = 0; i < 4; i++) {
        for (let r = 0; r <= 5; r++) estado.recompensasMonetary.push(r);
        for (let r = 0; r <= 5; r++) estado.recompensasErotic.push(r);
    }
    for (let i = 0; i < 12; i++) estado.recompensasControl.push(3);

    // Barajar (Shuffle)
    estado.recompensasMonetary.sort(() => Math.random() - 0.5);
    estado.recompensasErotic.sort(() => Math.random() - 0.5);
    console.log("Listas inicializadas correctamente");
}

// Devuelve un nombre legible para la versión seleccionada
function obtenerNombreVersion() {
    switch (estado.version) {
        case 0: return "Hombre Hetero";
        case 1: return "Gay";
        case 2: return "Mujer";
        case 3: return "Lesbiana";
        default: return "Desconocida";
    }
}