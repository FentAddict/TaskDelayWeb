// 1. Esta es la función que el HTML busca al hacer clic
function iniciarPrueba(versionSeleccionada) {
    // Cargar índices de imágenes primero (async). Si falla, continuamos en modo degradado.
    // Verificar folio único en localStorage antes de empezar
    const folioInputVal = (window.getFolio && typeof window.getFolio === 'function') ? window.getFolio() : '';
    if (folioInputVal) {
        try {
            const sesiones = JSON.parse(localStorage.getItem('sesiones') || '[]');
            if (sesiones.some(s => String(s.folio || '').trim() === String(folioInputVal).trim())) {
                alert('El folio "' + folioInputVal + '" ya existe. Por favor ingresa un folio diferente.');
                return;
            }
        } catch (e) {
            console.warn('No se pudo verificar folios en localStorage:', e);
        }
    }

    inicializarImagenes().then(() => {
        inicializarListas();
        estado.version = versionSeleccionada;
        // Registrar folio y reiniciar datos de sesión
        if (window.getFolio) estado.folio = window.getFolio();
        estado.sessionTrials = [];
        estado.totalGanado = 0;
        estado.isTest = true;
        mostrarPanel('cue-panel');
        // ocultar botón de sesiones cuando empieza la prueba
        const sessionsBtn = document.getElementById('sessions-btn');
        if (sessionsBtn) sessionsBtn.classList.add('hidden');
        // ocultar botón de inicio cuando empieza la prueba
        const homeBtn = document.getElementById('home-btn');
        if (homeBtn) homeBtn.classList.add('hidden');
        flujoCuePanel();
    }).catch(err => {
        console.error('Error cargando índices de imágenes:', err);
        // Intentar continuar aun así
        inicializarListas();
        estado.version = versionSeleccionada;
        if (window.getFolio) estado.folio = window.getFolio();
        estado.sessionTrials = [];
        estado.totalGanado = 0;
        estado.isTest = true;
        mostrarPanel('cue-panel');
        flujoCuePanel();
    });
}

// 2. Función auxiliar para cambiar de "pantalla"
function mostrarPanel(idPanel) {
    // Ocultamos todas las secciones que tengan la clase 'panel'
    const paneles = document.querySelectorAll('.panel');
    paneles.forEach(p => p.classList.add('hidden'));
    
    // Mostramos solo la que necesitamos
    const panelActivo = document.getElementById(idPanel);
    if (panelActivo) {
        panelActivo.classList.remove('hidden');
    } else {
        console.error("No se encontró el panel con ID: " + idPanel);
    }
}

// 3. Función para dejar la pantalla en blanco (entre Cue y Task)
function ocultarTodosLosPaneles() {
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
}