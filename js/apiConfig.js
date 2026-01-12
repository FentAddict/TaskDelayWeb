// Configuración de API para TaskDelayWeb

// Cambiar esta URL según donde esté desplegado el servidor
const API_CONFIG = {
    // Desarrollo local
    development: 'http://localhost:3000',
    
    // Producción (cambiar a tu dominio)
    production: 'https://tu-servidor.com',
    
    // Endpoints
    endpoints: {
        sessions: '/api/sessions',
        sessionById: '/api/sessions/:id',
        sessionByFolio: '/api/sessions/folio/:folio',
        stats: '/api/stats'
    }
};

// Determinar el ambiente (puedes ajustar esto según tus necesidades)
const ENVIRONMENT = 'development'; // Cambiar a 'production' en hosting

// URL base de la API
const API_BASE_URL = API_CONFIG[ENVIRONMENT];

console.log(`📡 API configurada para: ${ENVIRONMENT} (${API_BASE_URL})`);
