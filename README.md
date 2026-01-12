# TaskDelayWeb - Backend Server

Servidor Node.js + Express para almacenar y gestionar sesiones de la aplicación TaskDelayWeb.

## Características

- ✅ Almacenamiento de sesiones en SQLite3
- ✅ Registro detallado de ensayos (trials) con todos los parámetros
- ✅ API REST para consultar, guardar y eliminar datos
- ✅ Estadísticas generales
- ✅ CORS habilitado para conectar desde el cliente web

## Requisitos

- Node.js >= 14.0
- npm (incluido con Node.js)

## Instalación

1. **Navega a la carpeta del servidor:**
   ```bash
   cd server
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

## Uso

### Desarrollo Local

```bash
npm start
```

El servidor se iniciará en `http://localhost:3000`

### Base de Datos

La base de datos SQLite se creará automáticamente en `server/taskdelay.db` la primera vez que se ejecute el servidor.

## Estructura de la Base de Datos

### Tabla: `sessions`
Almacena información general de cada sesión.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único (PK) |
| folio | TEXT | Folio de la sesión (UNIQUE) |
| version | TEXT | Versión (Hombre Hetero, Gay, Mujer, Lesbiana) |
| totalGanado | INTEGER | Dinero total ganado |
| fecha | TEXT | Fecha/hora de la sesión |
| createdAt | DATETIME | Timestamp de creación |
| updatedAt | DATETIME | Timestamp de última actualización |

### Tabla: `trials`
Almacena datos detallados de cada ensayo dentro de una sesión.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único (PK) |
| sessionId | INTEGER | ID de la sesión (FK) |
| nombrePrueba | TEXT | Tipo (Monetary, Erotic, Control) |
| delayPantallaBlanca | INTEGER | Delay en ms (1500-4500) |
| tamanoRecompensa | TEXT | Tamaño (A o B) |
| probabilidad | INTEGER | Probabilidad (25, 50, 75) |
| tiempoRespuesta | INTEGER | Tiempo respuesta en ms |
| exitoPrueba | INTEGER | 1 si pasó discriminación, 0 si no |
| exitoProbabilidad | INTEGER | 1 si ganó recompensa, 0 si no |
| calificacion | INTEGER | Calificación (1-9) |
| createdAt | DATETIME | Timestamp |

## API Endpoints

### 1. POST `/api/sessions`
**Guardar una sesión completa con todos sus ensayos**

**Request:**
```json
{
  "folio": "A001",
  "version": "Hombre Hetero",
  "totalGanado": 250,
  "fecha": "09/01/2026, 15:30:45",
  "trials": [
    {
      "nombrePrueba": "Monetary",
      "delayPantallaBlanca": 2500,
      "tamanoRecompensa": "A",
      "probabilidad": 75,
      "tiempoRespuesta": 450,
      "exitoPrueba": true,
      "exitoProbabilidad": true,
      "calificacion": 7
    },
    ...
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Sesión guardada exitosamente",
  "sessionId": 1,
  "trialsCount": 60
}
```

### 2. GET `/api/sessions`
**Obtener todas las sesiones (últimas 100)**

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": 1,
      "folio": "A001",
      "version": "Hombre Hetero",
      "totalGanado": 250,
      "fecha": "09/01/2026, 15:30:45",
      "createdAt": "2026-01-09T15:30:45.123Z",
      "updatedAt": "2026-01-09T15:30:45.123Z"
    },
    ...
  ]
}
```

### 3. GET `/api/sessions/:id`
**Obtener una sesión específica con todos sus ensayos**

**Response:**
```json
{
  "success": true,
  "session": { ... },
  "trials": [
    {
      "id": 1,
      "sessionId": 1,
      "nombrePrueba": "Monetary",
      "delayPantallaBlanca": 2500,
      ...
    },
    ...
  ]
}
```

### 4. GET `/api/sessions/folio/:folio`
**Obtener sesión por folio (búsqueda por identificador)**

**Response:**
Igual que `/api/sessions/:id`

### 5. DELETE `/api/sessions/:id`
**Eliminar una sesión y sus ensayos asociados**

**Response:**
```json
{
  "success": true,
  "message": "Sesión eliminada"
}
```

### 6. GET `/api/stats`
**Obtener estadísticas generales**

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalSessions": 10,
    "totalMoneyWon": 2500,
    "avgMoneyPerSession": 250,
    "totalTrials": 600
  }
}
```

## Configuración para Producción

### Despliegue en Heroku

1. **Crear archivo `Procfile`:**
   ```
   web: node server/server.js
   ```

2. **Crear cuenta en [Heroku](https://www.heroku.com)**

3. **Instalar Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

4. **Crear aplicación:**
   ```bash
   heroku create tu-app-name
   ```

5. **Desplegar:**
   ```bash
   git push heroku main
   ```

### Despliegue en un VPS (DigitalOcean, AWS, etc.)

1. **SSH a tu servidor**

2. **Instalar Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clonar repositorio y navegar a `server`**

4. **Instalar dependencias:**
   ```bash
   npm install --production
   ```

5. **Usar PM2 para mantener el proceso activo:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "taskdelay-api"
   pm2 save
   pm2 startup
   ```

6. **Configurar Nginx como proxy inverso:**
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Conectar desde el Cliente

En el cliente (TaskDelayWeb), la URL del servidor debe estar configurada. Si está en producción, cambia `localhost:3000` a tu dominio:

```javascript
// En el cliente, cambiar en tareas.js:
const SERVER_URL = 'https://tu-servidor.com'; // Cambiar aquí

async function sendSessionToServer(sessionObj) {
    const res = await fetch(SERVER_URL + '/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionObj)
    });
    return await res.json();
}
```

## Monitoreo y Logs

- Los logs aparecen en la consola
- Para logs persistentes en producción, configura un servicio como [Winston](https://www.npmjs.com/package/winston) o usa los logs nativos de tu hosting

## Troubleshooting

### Error: "Cannot find module 'express'"
```bash
npm install
```

### Puerto 3000 ya está en uso
```bash
# Cambiar puerto:
PORT=3001 npm start
```

### Error de base de datos LOCKED
Reinicia el servidor. SQLite tiene limitaciones de concurrencia; para apps con muchos usuarios, considera migrar a PostgreSQL.

## Licencia

MIT
