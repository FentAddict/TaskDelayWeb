const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || '';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Conectar a MongoDB Atlas usando mongoose
if (!MONGODB_URI) {
    console.warn('MONGODB_URI no está definido. Define la variable de entorno para conectar a MongoDB Atlas.');
} else {
    mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log('Conectado a MongoDB Atlas');
    }).catch((err) => {
        console.error('Error conectando a MongoDB:', err);
    });
}

// Definir esquemas y modelos
const TrialSchema = new mongoose.Schema({
    nombrePrueba: { type: String },
    delayPantallaBlanca: { type: Number },
    tamanoRecompensa: { type: String },
    probabilidad: { type: Number },
    tiempoRespuesta: { type: Number },
    exitoPrueba: { type: Boolean },
    exitoProbabilidad: { type: Boolean },
    calificacion: { type: Number }
}, { _id: false });

const SessionSchema = new mongoose.Schema({
    folio: { type: String, required: true, unique: true },
    version: { type: String, required: true },
    totalGanado: { type: Number, default: 0 },
    fecha: { type: String, default: () => new Date().toLocaleString('es-ES') },
    trials: { type: [TrialSchema], default: [] }
}, { timestamps: true });

const Session = mongoose.model('Session', SessionSchema);

// =====================
// RUTAS API
// =====================
// Servir frontend (no servir automáticamente index.html para permitir página de bienvenida personalizada)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// GET / - Servir la página de bienvenida como página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

// GET /api/status - Verificar que el servidor está corriendo
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        message: 'TaskDelayWeb API Server',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// POST /api/sessions - Guardar una sesión completa con sus ensayos
app.post('/api/sessions', (req, res) => {
    (async () => {
        try {
            const { folio, version, totalGanado, fecha, trials } = req.body;

            if (!folio || !version) {
                return res.status(400).json({ error: 'folio y version son requeridos' });
            }

            const session = new Session({
                folio,
                version,
                totalGanado: totalGanado || 0,
                fecha: fecha || new Date().toLocaleString('es-ES'),
                trials: Array.isArray(trials) ? trials : []
            });

            await session.save();

            res.status(201).json({
                success: true,
                message: 'Sesión guardada exitosamente',
                sessionId: session._id,
                trialsCount: session.trials.length
            });
        } catch (err) {
            if (err.code === 11000) {
                return res.status(409).json({ error: 'El folio ya existe' });
            }
            console.error('Error guardando sesión:', err);
            res.status(500).json({ error: 'Error guardando sesión' });
        }
    })();
});

// GET /api/sessions - Obtener todas las sesiones
app.get('/api/sessions', (req, res) => {
    (async () => {
        try {
            const sessions = await Session.find().sort({ createdAt: -1 }).limit(100).lean().exec();
            // Convertir _id a id para compatibilidad con el frontend
            const sessionsWithId = sessions.map(s => ({
                ...s,
                id: s._id
            }));
            res.json({ success: true, sessions: sessionsWithId || [] });
        } catch (err) {
            console.error('Error obteniendo sesiones:', err);
            res.status(500).json({ error: 'Error obteniendo sesiones' });
        }
    })();
});

// GET /api/sessions/:id - Obtener una sesión con sus ensayos
app.get('/api/sessions/:id', (req, res) => {
    const { id } = req.params;

    (async () => {
        try {
            const session = await Session.findById(id).lean().exec();
            if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
            // Convertir _id a id para compatibilidad con el frontend
            const sessionWithId = {
                ...session,
                id: session._id
            };
            res.json({ success: true, session: sessionWithId, trials: session.trials || [] });
        } catch (err) {
            console.error('Error obteniendo sesión:', err);
            res.status(500).json({ error: 'Error obteniendo sesión' });
        }
    })();
});

// GET /api/sessions/folio/:folio - Obtener sesión por folio
app.get('/api/sessions/folio/:folio', (req, res) => {
    const { folio } = req.params;

    (async () => {
        try {
            const session = await Session.findOne({ folio }).lean().exec();
            if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
            // Convertir _id a id para compatibilidad con el frontend
            const sessionWithId = {
                ...session,
                id: session._id
            };
            res.json({ success: true, session: sessionWithId, trials: session.trials || [] });
        } catch (err) {
            console.error('Error obteniendo sesión:', err);
            res.status(500).json({ error: 'Error obteniendo sesión' });
        }
    })();
});

// DELETE /api/sessions/:id - Eliminar una sesión (y sus ensayos)
app.delete('/api/sessions/:id', (req, res) => {
    const { id } = req.params;
    (async () => {
        try {
            const deleted = await Session.findByIdAndDelete(id).exec();
            if (!deleted) return res.status(404).json({ error: 'Sesión no encontrada' });
            res.json({ success: true, message: 'Sesión eliminada' });
        } catch (err) {
            console.error('Error eliminando sesión:', err);
            res.status(500).json({ error: 'Error eliminando sesión' });
        }
    })();
});

// GET /api/stats - Estadísticas generales
app.get('/api/stats', (req, res) => {
    (async () => {
        try {
            const totalSessions = await Session.countDocuments().exec();
            const agg = await Session.aggregate([
                {
                    $group: {
                        _id: null,
                        totalMoneyWon: { $sum: '$totalGanado' },
                        avgMoneyPerSession: { $avg: '$totalGanado' }
                    }
                }
            ]).exec();

            const trialsAgg = await Session.aggregate([
                { $project: { trialsCount: { $size: { $ifNull: ['$trials', []] } } } },
                { $group: { _id: null, totalTrials: { $sum: '$trialsCount' } } }
            ]).exec();

            res.json({
                success: true,
                stats: {
                    totalSessions,
                    totalMoneyWon: agg[0] ? agg[0].totalMoneyWon : 0,
                    avgMoneyPerSession: agg[0] ? agg[0].avgMoneyPerSession : 0,
                    totalTrials: trialsAgg[0] ? trialsAgg[0].totalTrials : 0
                }
            });
        } catch (err) {
            console.error('Error obteniendo estadísticas:', err);
            res.status(500).json({ error: 'Error obteniendo estadísticas' });
        }
    })();
});

// =====================
// MANEJO DE ERRORES
// =====================

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error general
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// =====================
// INICIAR SERVIDOR
// =====================

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor TaskDelayWeb corriendo en http://localhost:${PORT}`);
    console.log(`📊 Base de datos: ${MONGODB_URI ? 'MongoDB Atlas (MONGODB_URI)' : 'No configurada'}`);
    console.log(`\nEndpoints disponibles:`);
    console.log(`  POST   /api/sessions           - Guardar sesión`);
    console.log(`  GET    /api/sessions           - Obtener todas las sesiones`);
    console.log(`  GET    /api/sessions/:id       - Obtener sesión por ID`);
    console.log(`  GET    /api/sessions/folio/:folio - Obtener sesión por folio`);
    console.log(`  DELETE /api/sessions/:id       - Eliminar sesión`);
    console.log(`  GET    /api/stats              - Estadísticas generales\n`);
});

// Cerrar BD al terminar
process.on('SIGINT', () => {
    console.log('\nCerrando conexión a MongoDB...');
    mongoose.disconnect().then(() => {
        console.log('Conexión a MongoDB cerrada');
        process.exit(0);
    }).catch((err) => {
        console.error('Error al desconectar MongoDB:', err);
        process.exit(1);
    });
});
