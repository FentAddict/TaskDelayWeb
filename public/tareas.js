// Estado de los contadores (basado en CuePanel.java)

let tareaActual = {
    tipoFigura: null, // 0 = cuadrado, 1 = triángulo
    clicked: false,
    startTime: 0,
    exito: false,
    tiempoRespuesta: 0
    ,
    selectedVersion: null,
    selectedVersionName: null
};

// Función para inicializar y barajar listas (Equivale al bloque static en Java)
function inicializarListas() {
    // Llenar listas Monetary (4 ciclos de 6 tipos = 24)
    for (let i = 0; i < 4; i++) {
        for (let r = 0; r <= 5; r++) estado.recompensasMonetary.push(r);
    }
    // Llenar listas Erotic (4 ciclos de 6 tipos = 24)
    for (let i = 0; i < 4; i++) {
        for (let r = 0; r <= 5; r++) estado.recompensasErotic.push(r);
    }
    // Llenar Control (12)
    for (let i = 0; i < 12; i++) estado.recompensasControl.push(3);

    // Barajar (Shuffle)
    estado.recompensasMonetary.sort(() => Math.random() - 0.5);
    estado.recompensasErotic.sort(() => Math.random() - 0.5);
}
function obtenerSiguientePrueba() {
    let tipo; // 0=Monetary, 1=Erotic, 2=Control

    // Lógica de ensayos de práctica (primeros 3 son Control)
    if (estado.contadorControl < 3) {
        tipo = 2;
    } else {
        // Probabilidades: 11% Control, 44% Erotic, 45% Monetary
        let p = Math.random();
        if (p <= 0.11) tipo = 2;
        else if (p <= 0.55) tipo = 1;
        else tipo = 0;
    }

    // Validar si ya se llegó al máximo de cada una
    if (tipo === 2 && estado.contadorControl >= 12) return obtenerSiguientePrueba(); 
    if (tipo === 1 && estado.contadorErotic >= 24) return obtenerSiguientePrueba();
    if (tipo === 0 && estado.contadorMonetary >= 24) return obtenerSiguientePrueba();

    return tipo;
}
function flujoCuePanel() {
    const ensayoLabel = document.getElementById('ensayo-label');
    const sessionsBtn = document.getElementById('sessions-btn');
    if(sessionsBtn) sessionsBtn.classList.add('hidden');

    // Si ya se completaron todas las pruebas, mostrar total final
    if (estado.contadorMonetary >= 24 && estado.contadorErotic >= 24 && estado.contadorControl >= 12) {
        mostrarTotalFinal();
        return;
    }

    const tipo = obtenerSiguientePrueba();
    const cueImg = document.getElementById('cue-img');
    if(estado.contadorControl<3){
        ensayoLabel.style.visibility = 'visible';
        estado.isTest = true;
    }else{
        ensayoLabel.style.visibility = 'hidden';
        estado.isTest = false;
    }
    // Determinar imagen según el tipo y la recompensa disponible
    let recompensa;
    if (tipo === 0) {
        recompensa = estado.recompensasMonetary.shift(); // Saca el primero de la lista
        cueImg.src = `assets/MONEY${obtenerSufijo(recompensa)}.png`;
        estado.pruebaActual = "Monetary";
        estado.contadorMonetary++;
        estado.ultimaRecompensa = recompensa;
        // Guardar en tareaActual para el registro del ensayo
        tareaActual.recompensaVal = recompensa;
    } else if (tipo === 1) {
        // Determinar la versión activa de forma global (no depender de tareaActual que se limpia)
        const versionName = (typeof obtenerNombreVersion === 'function') ? obtenerNombreVersion() : (tareaActual.selectedVersionName || String(estado.version));
        recompensa = estado.recompensasErotic.shift();
        estado.pruebaActual = "Erotic";
        if (versionName === "Hombre Hetero" || versionName === "Lesbiana") {
            cueImg.src = `assets/EROTIC${obtenerSufijo(recompensa)}.png`;
        } else {
            cueImg.src = `assets/EROTIC${obtenerSufijo(recompensa)}2.png`;
        }
        estado.contadorErotic++;
        estado.ultimaRecompensa = recompensa;
        tareaActual.recompensaVal = recompensa;
    } else {
        cueImg.src = "assets/circulo.png";
        estado.pruebaActual = "Control";
        estado.contadorControl++;
        estado.ultimaRecompensa = null;
        tareaActual.recompensaVal = null;
    }

    // Mostrar el panel
    mostrarPanel('cue-panel');

    // Primer temporizador de 2.5 segundos
    setTimeout(() => {
        ocultarTodosLosPaneles(); // Pantalla blanca
        
        // Segundo temporizador aleatorio (1500ms a 4500ms)
        const delayBlanco = Math.floor(Math.random() * (4500 - 1500 + 1)) + 1500;
        // Guardar el delay para que la tarea lo registre
        estado.delayBlancoForNextTrial = delayBlanco;

        setTimeout(() => {
            iniciarTareaDiscriminacion(); // Siguiente clase: DiscriminationTaskPanel
        }, delayBlanco);

    }, 2500);
}

// Función auxiliar para los nombres de tus archivos
function obtenerSufijo(r) {
    const mapas = ["75A", "50A", "25A", "75B", "50B", "25B"];
    return mapas[r];
}
function iniciarTareaDiscriminacion() {
    tareaActual.clicked = false;
    tareaActual.exito = false;
    tareaActual.tipoFigura = Math.floor(Math.random() * 2); // 0 o 1
    // Guardar la versión seleccionada (índice y nombre legible)
    tareaActual.selectedVersion = estado.version;
    if (typeof obtenerNombreVersion === 'function') {
        tareaActual.selectedVersionName = obtenerNombreVersion();
    } else {
        tareaActual.selectedVersionName = String(estado.version);
    }
    console.log("Versión seleccionada:", tareaActual.selectedVersionName);
    
    const targetImg = document.getElementById('target-img');
    
    // Configurar imagen según el azar
    if (tareaActual.tipoFigura === 0) {
        targetImg.src = "assets/square.png";
        console.log("Figura: Cuadrado (Esperando clic derecho)");
    } else {
        targetImg.src = "assets/triangle.png";
        console.log("Figura: Triángulo (Esperando clic izquierdo)");
    }

    mostrarPanel('discrimination-panel');
    tareaActual.startTime = Date.now();
    // Registrar el delay que se aplicó antes de esta tarea
    tareaActual.delayPantallaBlanca = estado.delayBlancoForNextTrial || 0;

    // Temporizador de 1 segundo (igual que en Java)
    setTimeout(() => {
        if (!tareaActual.clicked) {
            tareaActual.clicked = true;
            tareaActual.tiempoRespuesta = 1000; // Máximo tiempo permitido
            console.log("No diste clic a tiempo.");
            tareaActual.exito = false;
            irARewardPanel();
        }
    }, 1000);
}

// Manejador de clics (Izquierdo y Derecho)
document.getElementById('target-img').addEventListener('mousedown', function(e) {
    if (tareaActual.clicked) return;

    tareaActual.clicked = true;
    tareaActual.tiempoRespuesta = Date.now() - tareaActual.startTime;
    
    // Identificar el botón presionado
    // e.button: 0 = Izquierdo, 2 = Derecho
    const esIzquierdo = (e.button === 0);
    const esDerecho = (e.button === 2);

    if (tareaActual.tipoFigura === 1 && esIzquierdo) {
        // Triángulo + Clic Izquierdo = Éxito
        tareaActual.exito = true;
    } else if (tareaActual.tipoFigura === 0 && esDerecho) {
        // Cuadrado + Clic Derecho = Éxito
        tareaActual.exito = true;
    } else {
        tareaActual.exito = false;
    }

    console.log(`Clic detectado en ${tareaActual.tiempoRespuesta}ms. Éxito: ${tareaActual.exito}`);
    irARewardPanel();
});

// IMPORTANTE: Bloquear el menú contextual para permitir el clic derecho
document.addEventListener('contextmenu', event => event.preventDefault());
function irARewardPanel() {
    // Si la prueba fue de tipo 'Control', saltamos directo al siguiente ciclo (CuePanel)
    if (estado.pruebaActual === "Control") {
        console.log("Prueba de control: Mostrando pantalla vacía/estática.");
        mostrarPanel('reward-panel');
        document.getElementById('reward-img').src = "assets/Static.gif";
        document.getElementById('dinerillo').innerText = "";
        
        // Registrar ensayo de control sin calificación (0)
        registrarEnsayo(0);
        
        setTimeout(flujoCuePanel, 2500);
        return;
    }

    // Si el usuario falló la tarea de discriminación (clic incorrecto o fuera de tiempo)
    if (!tareaActual.exito) {
        console.log("Tarea fallida: Mostrando pantalla vacía/estática.");
        mostrarPanel('reward-panel');
        document.getElementById('reward-img').src = "assets/Static.gif";
        document.getElementById('dinerillo').innerText = "";
        
        // Registrar ensayo fallido sin calificación (0)
        registrarEnsayo(0);
        
        setTimeout(flujoCuePanel, 2500);
        return;
    }

    // Si tuvo éxito, calculamos la probabilidad según el tipo de recompensa
    const recompensaVal = estado.ultimaRecompensa; // El número 0-5 que guardamos en CuePanel
    const probabilidad = obtenerProbabilidad(recompensaVal);
    const exitoProbabilidad = Math.random() <= probabilidad;


    // Guardar resultado de la probabilidad en el objeto de tarea
    tareaActual.exitoProbabilidad = exitoProbabilidad;

    mostrarPanel('reward-panel');
    const rewardImg = document.getElementById('reward-img');
    const dinerilloDiv = document.getElementById('dinerillo');

    if (exitoProbabilidad) {
        console.log(`Éxito de probabilidad (${probabilidad * 100}%).`);
        // Cargamos la imagen correspondiente (Monetary o Erotic)
        // Obtener imagen de recompensa de forma segura (refill si es necesario)
        const rewardPath = getRewardImage(tareaActual.selectedVersionName, estado.ultimaRecompensa);
        rewardImg.src = rewardPath;
        
        // Si es monetario, mostramos el texto del "dinerillo"
        if (estado.pruebaActual === "Monetary") {
            rewardImg.src = "assets/MoneyRewardImg.jpg";
            const valor = obtenerValorDinerillo(recompensaVal);
            dinerilloDiv.innerText = valor;
            estado.totalGanado = (estado.totalGanado || 0) + valor;
            console.log("Dinero acumulado:", estado.totalGanado);
        } else {
            dinerilloDiv.innerText = "";
        }

        // Después de la recompensa, vamos a calificar (RatePanel)
        setTimeout(() => {
            irARatePanel();
        }, 2500);
    } else {
        console.log("Fallo de probabilidad: Mostrando estática.");
        rewardImg.src = "assets/Static.gif";
        dinerilloDiv.innerText = "";
        
        // Registrar ensayo con fallo de probabilidad sin calificación (0)
        registrarEnsayo(0);
        
        setTimeout(flujoCuePanel, 2500);
    }
}

function mostrarTotalFinal() {
    const total = estado.totalGanado || 0;
    const folio = window.getFolio ? window.getFolio() : 'Sin folio';
    const version = (typeof obtenerNombreVersion === 'function') ? obtenerNombreVersion() : (tareaActual.selectedVersionName || 'Desconocida');
    
    // Guardar sesión en localStorage
    const sesiones = JSON.parse(localStorage.getItem('sesiones') || '[]');
    const nuevaSesion = {
        folio: folio,
        version: version,
        totalGanado: total,
        fecha: new Date().toLocaleString('es-ES'),
        trials: estado.sessionTrials || []
    };
    sesiones.push(nuevaSesion);
    localStorage.setItem('sesiones', JSON.stringify(sesiones));

    // Intentar enviar al servidor si existe un endpoint configurado
    if (typeof sendSessionToServer === 'function') {
        sendSessionToServer(nuevaSesion).catch(err => console.warn('No se pudo enviar la sesión al servidor:', err));
    }
    
    alert("Fin de las pruebas. Total ganado: $" + total);
    const main = document.getElementById('main-container');
    // Asegurar que el botón de inicio esté visible de nuevo
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) homeBtn.classList.remove('hidden');
    if (main) {
        main.innerHTML = `<section class="panel"><h2>Fin de las pruebas</h2><p>Total ganado: $${total}</p><p><a href="#" onclick="location.reload(); return false;">Volver al inicio</a></p></section>`;
    }
}

// Mapeo de probabilidades según tu código Java
function obtenerProbabilidad(recompensa) {
    if (recompensa === 0 || recompensa === 3) return 0.75; // 75A y 75B
    if (recompensa === 1 || recompensa === 4) return 0.50; // 50A y 50B
    if (recompensa === 2 || recompensa === 5) return 0.25; // 25A y 25B
    return 0;
}

function obtenerValorDinerillo(recompensa) {
    // Aquí puedes poner los valores que usa tu ImageLoader.getValorActual()
    if(recompensa >=3){
        return Math.floor(Math.random()*(50-30)+30);
    }else{
        return Math.floor(Math.random()*(20-5)+5);
    }
}
// Helper para obtener una imagen de recompensa segura (refill si la lista está vacía)
function getRewardImage(versionName, recompensaVal) {
    // Determinar la lista objetivo según versión y tipo A/B
    const isB = (typeof recompensaVal === 'number' && recompensaVal >= 3);
    let listName = null;
    if (versionName === 'Hombre Hetero') listName = isB ? 'imgHeteroBList' : 'imgHeteroAList';
    else if (versionName === 'Gay') listName = isB ? 'imgGayBList' : 'imgGayAList';
    else if (versionName === 'Mujer') listName = isB ? 'imgMujerBList' : 'imgMujerAList';
    else if (versionName === 'Lesbiana') listName = isB ? 'imgLesbianaBList' : 'imgLesbianaAList';
    else return 'assets/Static.gif';

    // Si la lista no existe o está vacía, intentar rellenarla desde la copia original
    if (!estado[listName] || estado[listName].length === 0) {
        const origName = '_orig' + listName.charAt(0).toUpperCase() + listName.slice(1);
        if (estado[origName] && estado[origName].length > 0) {
            // Clonar y barajar la copia original
            estado[listName] = Array.from(estado[origName]);
            // Shuffle
            for (let i = estado[listName].length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [estado[listName][i], estado[listName][j]] = [estado[listName][j], estado[listName][i]];
            }
            console.warn(`Lista ${listName} vacía. Rellenando desde ${origName} y barajando.`);
        } else {
            console.warn(`Lista ${listName} vacía y no existe copia original. Usando placeholder.`);
            return 'assets/Static.gif';
        }
    }

    const path = estado[listName].pop();
    if (!path) {
        console.warn(`Imagen no encontrada en ${listName}, devolviendo placeholder.`);
        return 'assets/Static.gif';
    }
    return path;
}
function irARatePanel() {
    const radioGroup = document.getElementById('radio-group');
    radioGroup.innerHTML = ""; // Limpiar botones anteriores

    let calificacionDada = false;

    // Crear los 9 botones de radio
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = "rate-button";
        btn.onclick = () => {
            calificacionDada = true;
            registrarCalificacion(i);
        };
        radioGroup.appendChild(btn);
    }

    mostrarPanel('rate-panel');

    // Auto-cerrar después de 2.5 segundos
    setTimeout(() => {
        // Si el usuario no dio calificación, registrar como 0
        if (!calificacionDada) {
            registrarCalificacion(0);
        }
    }, 2500);
}

// Enviar la sesión completa al servidor (si existe backend)
async function sendSessionToServer(sessionObj) {
    try {
        const base = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : '';
        const endpoint = (typeof API_CONFIG !== 'undefined' && API_CONFIG.endpoints && API_CONFIG.endpoints.sessions) ? API_CONFIG.endpoints.sessions : '/api/sessions';
        const url = base + endpoint;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionObj)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    } catch (e) {
        console.warn('Error enviando sesión al servidor:', e);
        throw e;
    }
}

function registrarCalificacion(valor) {
    console.log("Calificación registrada: " + valor);
    ocultarTodosLosPaneles(); // Cerrar ratePanel
    
    // Registrar el ensayo con la calificación
    registrarEnsayo(valor);

    // Limpiar tareaActual para el siguiente ensayo
    tareaActual = {
        tipoFigura: null,
        clicked: false,
        startTime: 0,
        exito: false,
        tiempoRespuesta: 0,
        recompensaVal: null,
        delayPantallaBlanca: null,
        exitoProbabilidad: null
    };

    // Volver al flujo
    setTimeout(flujoCuePanel, 1000);
}

// Registrar el ensayo en la base de datos
function registrarEnsayo(calificacion) {
    console.log("Ensayo siendo registrado con calificación: " + calificacion);
    try {
        const trial = {
            nombrePrueba: estado.pruebaActual || null,
            delayPantallaBlanca: tareaActual.delayPantallaBlanca || null,
            tamanoRecompensa: (typeof tareaActual.recompensaVal === 'number') ? (tareaActual.recompensaVal >= 3 ? 'B' : 'A') : null,
            probabilidad: (typeof tareaActual.recompensaVal === 'number') ? (obtenerProbabilidad(tareaActual.recompensaVal) * 100) : null,
            tiempoRespuesta: tareaActual.tiempoRespuesta || null,
            exitoPrueba: !!tareaActual.exito,
            exitoProbabilidad: !!tareaActual.exitoProbabilidad,
            calificacion: calificacion
        };
        estado.sessionTrials.push(trial);
        console.log('Ensayo registrado:', trial);
    } catch (e) {
        console.error('Error registrando ensayo:', e);
    }
}

