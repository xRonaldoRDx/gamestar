import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'gamestar.db';

let dbInstance = null;

/**
 * Retorna a instância ativa do banco de dados SQLite (Singleton).
 */
export async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbInstance;
}

/**
 * Inicializa o banco de dados local e cria a tabela Backlog caso não exista.
 */
export async function initDatabase() {
  try {
    const db = await getDatabase();

    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS Backlog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rawg_id INTEGER,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Backlog',
        rating REAL DEFAULT 0,
        playtime INTEGER DEFAULT 0,
        achievements INTEGER DEFAULT 0,
        review_text TEXT DEFAULT '',
        added_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    console.log('[SQLite] Tabela Backlog inicializada com sucesso.');
    return true;
  } catch (error) {
    console.error('[SQLite] Erro ao inicializar banco de dados:', error);
    throw error;
  }
}
