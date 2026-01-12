const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'taskdelay.db');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Inicializar base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error abriendo base de datos:', err);
    } else {
        console.log('Conectado a SQLite en:', DB_PATH);
        initDatabase();
    }
});

// Crear tablas si no existen
function initDatabase() {
    db.serialize(() => {
        // Tabla de sesiones
        db.run(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                folio TEXT NOT NULL UNIQUE,
                version TEXT NOT NULL,
                totalGanado INTEGER NOT NULL,
                fecha TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creando tabla sessions:', err);
            else console.log('Tabla sessions lista');
        });

        // Tabla de ensayos (trials) - vinculada a sesiones
        db.run(`
            CREATE TABLE IF NOT EXISTS trials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sessionId INTEGER NOT NULL,
                nombrePrueba TEXT,
                delayPantallaBlanca INTEGER,
                tamanoRecompensa TEXT,
                probabilidad INTEGER,
                tiempoRespuesta INTEGER,
                exitoPrueba INTEGER,
                exitoProbabilidad INTEGER,
                calificacion INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) console.error('Error creando tabla trials:', err);
            else console.log('Tabla trials lista');
        });
    });
}

// =====================
// RUTAS API
// =====================
// Servir frontend
app.use(express.static(path.join(__dirname, 'public')));
// GET / - Verificar que el servidor está corriendo
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
    const { folio, version, totalGanado, fecha, trials } = req.body;

    if (!folio || !version) {
        return res.status(400).json({ error: 'folio y version son requeridos' });
    }

    // Insertar sesión
    db.run(
        `INSERT INTO sessions (folio, version, totalGanado, fecha)
         VALUES (?, ?, ?, ?)`,
        [folio, version, totalGanado || 0, fecha || new Date().toLocaleString('es-ES')],
        function(err) {
            if (err) {
                // Si hay duplicado de folio, actualizar en lugar de insertar
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'El folio ya existe' });
                }
                console.error('Error insertando sesión:', err);
                return res.status(500).json({ error: 'Error guardando sesión' });
            }

            const sessionId = this.lastID;

            // Insertar ensayos si existen
            if (Array.isArray(trials) && trials.length > 0) {
                const stmt = db.prepare(
                    `INSERT INTO trials (
                        sessionId, nombrePrueba, delayPantallaBlanca, tamanoRecompensa,
                        probabilidad, tiempoRespuesta, exitoPrueba, exitoProbabilidad, calificacion
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                );

                let trialCount = 0;
                trials.forEach((trial) => {
                    stmt.run(
                        sessionId,
                        trial.nombrePrueba || null,
                        trial.delayPantallaBlanca || null,
                        trial.tamanoRecompensa || null,
                        trial.probabilidad || null,
                        trial.tiempoRespuesta || null,
                        trial.exitoPrueba ? 1 : 0,
                        trial.exitoProbabilidad ? 1 : 0,
                        trial.calificacion || null
                    );
                    trialCount++;
                });

                stmt.finalize((err) => {
                    if (err) {
                        console.error('Error insertando ensayos:', err);
                    }
                    res.status(201).json({
                        success: true,
                        message: 'Sesión guardada exitosamente',
                        sessionId: sessionId,
                        trialsCount: trialCount
                    });
                });
            } else {
                res.status(201).json({
                    success: true,
                    message: 'Sesión guardada exitosamente',
                    sessionId: sessionId,
                    trialsCount: 0
                });
            }
        }
    );
});

// GET /api/sessions - Obtener todas las sesiones
app.get('/api/sessions', (req, res) => {
    db.all(
        `SELECT * FROM sessions ORDER BY createdAt DESC LIMIT 100`,
        (err, rows) => {
            if (err) {
                console.error('Error obteniendo sesiones:', err);
                return res.status(500).json({ error: 'Error obteniendo sesiones' });
            }
            res.json({ success: true, sessions: rows || [] });
        }
    );
});

// GET /api/sessions/:id - Obtener una sesión con sus ensayos
app.get('/api/sessions/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        `SELECT * FROM sessions WHERE id = ?`,
        [id],
        (err, session) => {
            if (err) {
                console.error('Error obteniendo sesión:', err);
                return res.status(500).json({ error: 'Error obteniendo sesión' });
            }

            if (!session) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }

            // Obtener ensayos asociados
            db.all(
                `SELECT * FROM trials WHERE sessionId = ? ORDER BY id ASC`,
                [id],
                (err, trials) => {
                    if (err) {
                        console.error('Error obteniendo ensayos:', err);
                        return res.status(500).json({ error: 'Error obteniendo ensayos' });
                    }

                    res.json({
                        success: true,
                        session: session,
                        trials: trials || []
                    });
                }
            );
        }
    );
});

// GET /api/sessions/folio/:folio - Obtener sesión por folio
app.get('/api/sessions/folio/:folio', (req, res) => {
    const { folio } = req.params;

    db.get(
        `SELECT * FROM sessions WHERE folio = ?`,
        [folio],
        (err, session) => {
            if (err) {
                console.error('Error obteniendo sesión:', err);
                return res.status(500).json({ error: 'Error obteniendo sesión' });
            }

            if (!session) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }

            // Obtener ensayos asociados
            db.all(
                `SELECT * FROM trials WHERE sessionId = ? ORDER BY id ASC`,
                [session.id],
                (err, trials) => {
                    if (err) {
                        console.error('Error obteniendo ensayos:', err);
                        return res.status(500).json({ error: 'Error obteniendo ensayos' });
                    }

                    res.json({
                        success: true,
                        session: session,
                        trials: trials || []
                    });
                }
            );
        }
    );
});

// DELETE /api/sessions/:id - Eliminar una sesión (y sus ensayos)
app.delete('/api/sessions/:id', (req, res) => {
    const { id } = req.params;

    db.run(
        `DELETE FROM sessions WHERE id = ?`,
        [id],
        function(err) {
            if (err) {
                console.error('Error eliminando sesión:', err);
                return res.status(500).json({ error: 'Error eliminando sesión' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }

            res.json({ success: true, message: 'Sesión eliminada' });
        }
    );
});

// GET /api/stats - Estadísticas generales
app.get('/api/stats', (req, res) => {
    db.get(
        `SELECT 
            COUNT(*) as totalSessions,
            SUM(totalGanado) as totalMoneyWon,
            AVG(totalGanado) as avgMoneyPerSession
         FROM sessions`,
        (err, stats) => {
            if (err) {
                console.error('Error obteniendo estadísticas:', err);
                return res.status(500).json({ error: 'Error obteniendo estadísticas' });
            }

            db.get(
                `SELECT COUNT(*) as totalTrials FROM trials`,
                (err, trialStats) => {
                    if (err) {
                        console.error('Error obteniendo estadísticas de ensayos:', err);
                        return res.status(500).json({ error: 'Error obteniendo estadísticas' });
                    }

                    res.json({
                        success: true,
                        stats: {
                            ...stats,
                            totalTrials: trialStats.totalTrials
                        }
                    });
                }
            );
        }
    );
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
    console.log(`📊 Base de datos: ${DB_PATH}`);
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
    console.log('\nCerrando base de datos...');
    db.close((err) => {
        if (err) console.error(err);
        else console.log('Base de datos cerrada');
        process.exit(0);
    });
});
