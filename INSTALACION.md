# Instalación y Despliegue de TaskDelayWeb

## Estructura del Proyecto

```
TaskDelayWeb/
├── index.html                 # Página principal del cliente
├── css/
│   └── styles.css             # Estilos
├── js/
│   ├── apiConfig.js           # Configuración de API (NUEVO)
│   ├── estado.js              # Estado global
│   ├── tareas.js              # Lógica de tareas
│   └── navegacion.js          # Navegación
├── assets/                    # Imágenes y recursos
├── server/                    # 🆕 SERVIDOR BACKEND
│   ├── server.js              # Servidor Node.js + Express
│   ├── package.json           # Dependencias
│   ├── .env.example           # Variables de entorno
│   └── README.md              # Documentación del servidor
└── (Datos en MongoDB Atlas)   # Ahora la aplicación usa MongoDB Atlas
```

## Paso 1: Instalar el Cliente (Frontend)

El cliente ya está listo. Asegúrate de tener la siguiente estructura:

- `index.html` con el botón de "Historial"
- Carpeta `js/` con los scripts
- Carpeta `assets/` con las imágenes
- Carpeta `css/` con los estilos

## Paso 2: Instalar el Servidor (Backend)

### En tu máquina local:

1. **Navega a la carpeta `server`:**
   ```bash
   cd server
   ```

2. **Instala Node.js (si no lo tienes):**
   - Descarga desde: https://nodejs.org/
   - Versión recomendada: LTS (v18 o superior)

3. **Instala las dependencias del servidor:**
   ```bash
   npm install
   ```

4. **Verifica que se creó `node_modules/`:**
   ```bash
   ls node_modules
   ```

### Ejecutar el servidor localmente:

```bash
npm start
```

Deberías ver:

```
🚀 Servidor TaskDelayWeb corriendo en http://localhost:3000
📊 Base de datos: C:\...\server\taskdelay.db

Endpoints disponibles:
  POST   /api/sessions           - Guardar sesión
  GET    /api/sessions           - Obtener todas las sesiones
  GET    /api/sessions/:id       - Obtener sesión por ID
  GET    /api/sessions/folio/:folio - Obtener sesión por folio
  DELETE /api/sessions/:id       - Eliminar sesión
  GET    /api/stats              - Estadísticas generales
```

## Paso 3: Conectar el Cliente al Servidor

### Configuración Local (desarrollo):

El archivo `js/apiConfig.js` ya está configurado para usar `http://localhost:3000` en modo desarrollo.

**Para verificar que funciona:**

1. Abre un navegador y ve a: `http://localhost:5500` (o tu servidor local)
   - Si usas VS Code: extensión "Live Server"
   - Si usas Python: `python -m http.server 8000`

4. Llena un folio y realiza una prueba completa

3. Cuando termine, deberías ver en la consola:
   ```
   📤 Enviando sesión a: http://localhost:3000/api/sessions
   ✅ Sesión guardada en servidor: { success: true, sessionId: "<mongo-id>", ... }
   ```

4. Los datos se guardarán en tu instancia de MongoDB Atlas (configurada vía `MONGODB_URI`)

## Paso 4: Desplegar en Producción

### Opción A: Heroku (Recomendado para principiantes)

1. **Crea una cuenta en https://www.heroku.com**

2. **Instala Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

3. **Login:**
   ```bash
   heroku login
   ```

4. **Crea la aplicación:**
   ```bash
   heroku create tu-app-taskdelay
   ```

5. **Despliega:**
   ```bash
   git push heroku main
   ```

6. **Obtén la URL:**
   ```bash
   heroku open
   ```

7. **Actualiza `js/apiConfig.js` en producción:**
   ```javascript
   const ENVIRONMENT = 'production';
   ```
   Y usa tu URL de Heroku.

### Opción B: DigitalOcean / AWS (VPS)

#### Preparación:

1. **Crea un droplet en DigitalOcean o instancia en AWS**
   - OS: Ubuntu 20.04 LTS
   - RAM mínima: 512MB
   - Almacenamiento: 20GB

2. **SSH a tu servidor:**
   ```bash
   ssh root@tu_ip
   ```

3. **Instala Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Instala Git:**
   ```bash
   sudo apt-get install -y git
   ```

5. **Clona tu repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/taskdelay-web.git
   cd taskdelay-web/server
   npm install --production
   ```

#### Ejecutar con PM2 (gestor de procesos):

1. **Instala PM2 globalmente:**
   ```bash
   npm install -g pm2
   ```

2. **Inicia el servidor:**
   ```bash
   pm2 start server.js --name "taskdelay-api"
   ```

3. **Configura para que inicie al reiniciar:**
   ```bash
   pm2 startup
   pm2 save
   ```

#### Configura Nginx como proxy (opcional pero recomendado):

1. **Instala Nginx:**
   ```bash
   sudo apt-get install -y nginx
   ```

2. **Edita la configuración:**
   ```bash
   sudo nano /etc/nginx/sites-available/default
   ```

3. **Reemplaza el contenido con:**
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

4. **Reinicia Nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

#### SSL/HTTPS con Let's Encrypt:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### Opción C: Docker

1. **Crea `Dockerfile` en la carpeta `server`:**
   ```dockerfile
   FROM node:18
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Construye la imagen:**
   ```bash
   docker build -t taskdelay-api .
   ```

3. **Ejecuta el contenedor:**
   ```bash
   docker run -p 3000:3000 taskdelay-api
   ```

## Testing del Servidor

### Prueba el servidor con curl:

```bash
# Ver servidor activo
curl http://localhost:3000

# Enviar una sesión de prueba
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "folio": "TEST001",
    "version": "Hombre Hetero",
    "totalGanado": 150,
    "fecha": "09/01/2026, 15:00:00",
    "trials": []
  }'

# Ver todas las sesiones
curl http://localhost:3000/api/sessions

# Ver estadísticas
curl http://localhost:3000/api/stats
```

## Actualizar apiConfig.js para Producción

En `js/apiConfig.js`, cambia:

```javascript
// ANTES (desarrollo):
const ENVIRONMENT = 'development';

// DESPUÉS (producción):
const ENVIRONMENT = 'production';

// Y actualiza production con tu URL:
production: 'https://tu-dominio.com',
```

## Troubleshooting

### Error: "Port 3000 is already in use"
```bash
# Encuentra qué está usando el puerto:
lsof -i :3000
# Mata el proceso:
kill -9 <PID>
```

### La base de datos no se crea
- Verifica permisos en la carpeta `server/`
- Intenta crear manualmente:
  ```bash
  touch taskdelay.db
  ```

### No se conecta al servidor desde el cliente
- Verifica que el servidor está corriendo: `curl http://localhost:3000`
- Revisa la consola del navegador (F12 → Console)
- Asegúrate de que `apiConfig.js` está cargado
- Comprueba CORS está habilitado en `server.js`

## Monitoreo en Producción

### Ver logs del servidor:
```bash
pm2 logs taskdelay-api
```

### Ver estadísticas en tiempo real:
```bash
curl https://tu-dominio.com/api/stats
```

## Backup de Base de Datos

Los datos están en MongoDB Atlas. Para respaldos, usa `mongodump` o las herramientas del proveedor Atlas:

```bash
# Ejemplo: backup local con mongodump
mongodump --uri "$MONGODB_URI" --archive=backup_$(date +%F).gz --gzip
```

---

¡Listo! Tu aplicación TaskDelayWeb ahora está lista para producción. 🚀
