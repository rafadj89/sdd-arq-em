# ⚡ Project Tracker Electromovilidad — UPME

Herramienta de gestión de proyectos tipo Kanban para el proyecto de Interoperabilidad de Electromovilidad de la UPME (Resolución 40559/2025).

## Características

- **Tableros Kanban** con drag & drop (SortableJS)
- **2 Tableros activos**:
  - 🏢 **Equipo Gerencial** — Gestión resolución, proveedores, reuniones (5 columnas)
  - 💻 **Equipo Desarrollo** — Implementación end-to-end (6 columnas)
- **Autenticación** con gestión de usuarios administrada
- **Seguimiento completo** de tareas: fecha creación, movimientos por columna, fecha finalización
- **Estado = Columna** — El estado de cada tarea corresponde a la columna donde se encuentra
- **Vista "Mi Trabajo"** — Tareas filtradas por responsable
- **Dashboard** con KPIs, gráficos y carga por responsable
- **Compromisos** — Seguimiento de compromisos y reuniones
- **Informes mensuales** auto-generados para gerencia (imprimibles)
- **Export/Import JSON** para backup de datos

## Usuarios Pre-configurados

| Email | Contraseña | Rol | Equipo |
|-------|-----------|-----|--------|
| admin@upme.gov.co | Admin2026! | Administrador | Ambos |
| arquitecto@upme.gov.co | Arq2026! | Miembro | Desarrollo |
| dev@upme.gov.co | Dev2026! | Miembro | Desarrollo |
| devops@upme.gov.co | DevOps2026! | Miembro | Desarrollo |
| legal@upme.gov.co | Legal2026! | Miembro | Gerencial |
| pm@upme.gov.co | PM2026! | Miembro | Ambos |

> El administrador puede crear/editar/desactivar usuarios desde la vista ⚙️ Administración.

## Ejecución Local

```bash
# Opción 1: Python
cd tracker-electromovilidad
python3 -m http.server 8090

# Opción 2: Node.js
npx serve .

# Opción 3: Abrir directamente
open index.html
```

Acceder en: http://localhost:8090

---

## 🚀 Estrategia de Despliegue en Google Cloud Platform (GCP)

### Arquitectura Recomendada

```
┌─────────────────────────────────────────────────────┐
│                  Google Cloud Platform                │
│                                                       │
│  ┌──────────────────┐    ┌───────────────────────┐   │
│  │  Firebase Hosting │    │  Firebase Auth         │   │
│  │  (CDN Global)     │◄──►│  (Gestión usuarios)   │   │
│  │  index.html       │    │  Admin-managed         │   │
│  │  app.js           │    └───────────────────────┘   │
│  └────────┬─────────┘                                 │
│           │                                           │
│           ▼                                           │
│  ┌──────────────────┐    ┌───────────────────────┐   │
│  │  Cloud Firestore  │    │  Cloud Functions       │   │
│  │  (Base de datos)  │    │  (Lógica backend)      │   │
│  │  Real-time sync   │    │  - Reportes PDF        │   │
│  │  Multi-usuario    │    │  - Notificaciones      │   │
│  └──────────────────┘    └───────────────────────┘   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Opción A: Firebase (Recomendada — Más Rápida)

Firebase es parte nativa de GCP. Esta opción ofrece:
- **Cero servidores** que administrar (serverless)
- **Real-time sync** — Todos los usuarios ven cambios en tiempo real
- **Firebase Auth** — Autenticación segura con gestión de usuarios
- **CDN Global** — Carga rápida desde cualquier ubicación
- **Free Tier** generoso (suficiente para equipos < 50 personas)
- **Deploy en minutos**, no horas

#### Paso 1: Crear Proyecto Firebase

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Crear proyecto (o usar proyecto GCP existente)
firebase init
# Seleccionar: Hosting, Firestore, Authentication
# Directorio público: .  (raíz actual)
# SPA: Sí
```

#### Paso 2: Configurar Firebase Auth

En la consola Firebase (https://console.firebase.google.com):
1. Ir a **Authentication** > **Sign-in method**
2. Habilitar **Email/Password**
3. Ir a **Users** > Crear usuarios manualmente (o por Admin SDK)

#### Paso 3: Configurar Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer/escribir
    match /projects/{projectId}/{document=**} {
      allow read, write: if request.auth != null;
    }
    // Solo admins pueden gestionar usuarios
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

#### Paso 4: Desplegar

```bash
firebase deploy
# ✅ Hosting: https://tu-proyecto.web.app
# ✅ Firestore rules desplegadas
```

#### Costos Estimados (Firebase)

| Recurso | Free Tier | Costo Estimado/mes |
|---------|-----------|-------------------|
| Hosting | 10 GB/mes | $0 (suficiente) |
| Firestore | 1 GB storage, 50K reads/day | $0 (suficiente) |
| Auth | 10K users/mes | $0 (suficiente) |
| **Total equipo < 20 personas** | | **$0/mes** |

---

### Opción B: Cloud Run (Docker — Más Control)

Para organizaciones que prefieren contenedores y más control.

#### Dockerfile

```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Desplegar en Cloud Run

```bash
# Build y push imagen
gcloud builds submit --tag gcr.io/PROJECT_ID/tracker-electromovilidad

# Deploy
gcloud run deploy tracker-electromovilidad \
  --image gcr.io/PROJECT_ID/tracker-electromovilidad \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

#### Costos Estimados (Cloud Run)

| Recurso | Free Tier | Costo Estimado/mes |
|---------|-----------|-------------------|
| Cloud Run | 2M requests/mes | $0 (suficiente) |
| Container Registry | 0.5 GB | ~$0.03 |
| **Total** | | **~$0-5/mes** |

---

### Opción C: App Engine (Simple — Auto-scaling)

```yaml
# app.yaml
runtime: python39
handlers:
  - url: /(.*)
    static_files: \1
    upload: .*
  - url: /
    static_files: index.html
    upload: index.html
```

```bash
gcloud app deploy
```

---

## Migración a Multi-usuario Real (Firebase)

Para pasar de localStorage (modo local) a Firebase (modo producción):

### 1. Agregar Firebase SDK al HTML

```html
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
```

### 2. Inicializar Firebase

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
```

### 3. Reemplazar localStorage por Firestore

```javascript
// En lugar de: localStorage.setItem(KEY, JSON.stringify(DATA))
// Usar:
async function saveData() {
  await db.collection('projects').doc('main').set(DATA);
}

async function loadData() {
  const doc = await db.collection('projects').doc('main').get();
  DATA = doc.exists ? doc.data() : getDefaultData();
}

// Real-time listener para sincronización
db.collection('projects').doc('main').onSnapshot(doc => {
  DATA = doc.data();
  renderAll(); // Actualizar UI automáticamente
});
```

### 4. Reemplazar auth local por Firebase Auth

```javascript
// Login
async function doLogin() {
  const email = document.getElementById('login-email').value;
  const pw = document.getElementById('login-password').value;
  try {
    await auth.signInWithEmailAndPassword(email, pw);
    // Firebase maneja la sesión automáticamente
  } catch(e) {
    showError('Credenciales inválidas');
  }
}

// Observer de sesión
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    showApp();
  } else {
    showLogin();
  }
});
```

---

## Roadmap de Evolución

### Fase 1 — Actual (Local)
- ✅ Kanban con drag & drop
- ✅ 2 tableros (Gerencial + Desarrollo)
- ✅ Autenticación local
- ✅ Historial de movimientos
- ✅ Dashboard + Informes
- ✅ Export/Import JSON

### Fase 2 — Firebase (Multi-usuario)
- [ ] Migrar a Firebase Auth
- [ ] Migrar a Firestore
- [ ] Real-time sync entre usuarios
- [ ] Notificaciones por email (Cloud Functions)
- [ ] Deploy en Firebase Hosting

### Fase 3 — Avanzado
- [ ] Comentarios en tareas
- [ ] Archivos adjuntos (Cloud Storage)
- [ ] Sprints con velocidad
- [ ] Burndown charts
- [ ] Integración con Slack/Teams
- [ ] API REST para integraciones
- [ ] App móvil (PWA)

---

## Tecnologías

| Componente | Tecnología |
|-----------|-----------|
| Frontend | HTML5 + TailwindCSS (CDN) |
| Drag & Drop | SortableJS 1.15 (CDN) |
| Gráficos | Chart.js (CDN) |
| Persistencia Local | localStorage |
| Persistencia Prod | Firebase Firestore |
| Auth Prod | Firebase Authentication |
| Hosting | Firebase Hosting / Cloud Run |
| CI/CD | Cloud Build + firebase deploy |

---

*Project Tracker Electromovilidad — UPME — Resolución 40559/2025*
