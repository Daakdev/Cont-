# Cont+ - Sistema de Gestión

## 📋 Descripción

Backend y Frontend para el sistema de gestión Cont+ desplegado en Aiven (MySQL) y Render.

---

## 🚀 Configuración para Desarrollo Local

### 1. Requisitos Previos

- Node.js >= 18.0.0
- MySQL (local o Aiven)

### 2. Configuración de Variables de Entorno

Crea un archivo `backend/.env` con las siguientes variables:

```env
# Desarrollo local (variables individuales)
DB_HOST=tu-host-aiven
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña
DB_NAME=cont_plus

# Opcional: JWT Secret para tokens
JWT_SECRET=tu-secreto-muy-largo-y-seguro
```

### 3. Instalación y Ejecución

```bash
# Instalar dependencias
cd backend
npm install

# Ejecutar en desarrollo
npm run dev
# o en producción
npm start
```

---

## ☁️ Despliegue en Render (Producción)

### Método 1: Blueprint (Automatizado)

1. Sube tu código a GitHub
2. Ve al Dashboard de Render
3. New → Blueprint
4. Selecciona el archivo `render.yaml` de tu repositorio
5. Configura las variables de entorno

### Método 2: Manual

#### Backend (Web Service)

1. **Crear servicio Web** en Render
2. **Configuración:**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. **Variables de entorno (Environment):**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=mysql://user:password@host:port/database
   JWT_SECRET=genera-un-secret-seguro-aqui
   ```

#### Frontend (Static Site)

1. **Crear servicio Static** en Render
2. **Configuración:**
   - Root Directory: `fronted`
   - Build Command: `npm install`
   - Start Command: `npx serve -s pages -l 8080`
   - Publish Directory: `pages`

---

## 🔧 Configuración de Base de Datos Aiven

### Obtener DATABASE_URL

1. Ve a tu consola de Aiven
2. Selecciona tu servicio MySQL
3. Copia la **Connection String** (DATABASE_URL)
4. Formato: `mysql://USUARIO:CONTRASEÑA@HOST:PORT/NOMBRE_BD?ssl-mode=REQUIRED`

### Configuración SSL

Asegúrate de agregar `?ssl-mode=REQUIRED` al final de la URI si no está incluido.

---

## 📝 Estructura del Proyecto

```
Cont+/
├── backend/
│   ├── config/
│   │   └── db.js          # Conexión a MySQL (soporta DATABASE_URL)
│   ├── routes/
│   │   └── auth.js        # Rutas de autenticación
│   ├── index.js           # Servidor Express
│   ├── package.json
│   └── .env               # ⚠️ No subir a Git
├── fronted/
│   ├── assets/
│   ├── pages/
│   │   ├── index.html
│   │   └── users.html
├── render.yaml            # Blueprint de despliegue
└── README.md
```

---

## 🔐 Notas de Seguridad

- ✅ El `.env` está excluido del repositorio (ver `.gitignore`)
- ⚠️ Antes de desplegar, genera un `JWT_SECRET` seguro:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- ✅ La conexión a MySQL usa SSL por defecto con Aiven

---

## 📞 Endpoints del API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/health` | Verificar estado del servidor |

---

## 🐛 Solución de Problemas

### Error de conexión a BD
- Verifica que la `DATABASE_URL` sea correcta
- Confirma que el servicio de Aiven esté activo
- Verifica las reglas de firewall en Aiven

### Error de CORS
- Agrega tu dominio de producción a la lista de `allowedOrigins` en `backend/index.js`

### Error 503 en Render
- Verifica que el servicio haya terminado de desplegarse
- Revisa los logs en el dashboard de Render

