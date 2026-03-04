# Seguridad: Configuración de Variables de Entorno

## Problema Resuelto

✅ Las credenciales de MongoDB Atlas **NO están** en el código.  
✅ El archivo `.env` está protegido por `.gitignore`.  
✅ Las variables de entorno se configuran por ambiente.

---

## Configuración Local (Desarrollo)

1. **Ve al archivo `.env`** en la raíz del proyecto
   ```bash
   cat .env
   ```

2. **Llena la variable `MONGODB_URI` con tu cadena de conexión:**
   ```dotenv
   PORT=3000
   MONGODB_URI=mongodb+srv://Admin_TDW:9cgV1peSiC0Dkdqb@taskdelaywebdb.tlhaodc.mongodb.net/?appName=TaskDelayWebDB
   NODE_ENV=development
   ```

3. **El archivo `.env` es ignorado por git** (está en `.gitignore`):
   ```bash
   git status  # El .env NO aparecerá
   ```

---

## Configuración Heroku (Producción)

### Opción 1: Dashboard Web (Recomendado)

1. **Log in a Heroku:** https://dashboard.heroku.com

2. **Selecciona tu app:** TaskDelayWeb (o tu nombre)

3. **Ve a Settings:**
   ```
   Dashboard > Tu App > Settings
   ```

4. **Abre "Config Vars"** (haz clic en "Reveal Config Vars")

5. **Crea nuevas variables:**
   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | `mongodb+srv://Admin_TDW:9cgV1peSiC0Dkdqb@taskdelaywebdb.tlhaodc.mongodb.net/?appName=TaskDelayWebDB` |
   | `NODE_ENV` | `production` |

6. **Guarda** — Se desplegará automáticamente

---

### Opción 2: Heroku CLI

```bash
# Instala Heroku CLI (si no lo tienes)
npm install -g heroku

# Login
heroku login

# Configura variables (reemplaza "tu-app" con tu nombre)
heroku config:set MONGODB_URI="mongodb+srv://Admin_TDW:9cgV1peSiC0Dkdqb@taskdelaywebdb.tlhaodc.mongodb.net/?appName=TaskDelayWebDB" --app tu-app
heroku config:set NODE_ENV="production" --app tu-app

# Verifica
heroku config --app tu-app
```

---

## Verificación

### Local
```bash
npm start
# Deberías ver: "Conectado a MongoDB Atlas"
```

### Heroku
```bash
heroku logs --tail --app tu-app
# Deberías ver: "Conectado a MongoDB Atlas"
```

---

## Mejores Prácticas de Seguridad

✅ **DO:**
- [ ] Usar `.gitignore` para credenciales
- [ ] Secrets en Config Vars de Heroku
- [ ] Rotación periódica de contraseñas MongoDB
- [ ] Usar `.env.example` como referencia (sin valores reales)

❌ **DON'T:**
- [ ] Guardar credenciales en código
- [ ] Compartir `.env` en repositonio
- [ ] Usar misma contraseña en dev y prod
- [ ] Exponer URLs en logs públicos

---

## Resetear MongoDB Atlas (si necesitas cambiar contraseña)

1. Ve a: https://cloud.mongodb.com
2. Selecciona tu Database
3. Database Access > Users
4. Haz clic en el usuario `Admin_TDW`
5. Edit > Regenerate Password
6. Actualiza `MONGODB_URI` en Heroku Config Vars

---

¡Tus credenciales están seguras! 🔒
