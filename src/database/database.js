import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'gamestar.db';

let dbInstance = null;

export const getDatabase = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbInstance;
};

// No SDK 54, usamos openDatabaseAsync e execAsync (assíncrono)
export const initDB = async () => {
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
      cover_uri TEXT DEFAULT '',
      release_year TEXT DEFAULT '',
      added_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Migração segura para adicionar cover_uri e release_year caso a tabela já exista
  const colunas = await db.getAllAsync('PRAGMA table_info(Backlog);');
  const nomesColunas = colunas.map((col) => col.name);

  if (!nomesColunas.includes('cover_uri')) {
    await db.execAsync("ALTER TABLE Backlog ADD COLUMN cover_uri TEXT DEFAULT '';");
  }

  if (!nomesColunas.includes('release_year')) {
    await db.execAsync("ALTER TABLE Backlog ADD COLUMN release_year TEXT DEFAULT '';");
  }

  // Carga inicial com mock data se a tabela estiver vazia
  const firstRow = await db.getFirstAsync('SELECT count(*) as count FROM Backlog');

  if (firstRow && firstRow.count === 0) {
    const agora = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO Backlog (rawg_id, title, status, rating, playtime, achievements, review_text, cover_uri, release_year, added_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        3328,
        'The Witcher 3: Wild Hunt',
        'Playing',
        10.0,
        64,
        31,
        'Narrativa impecável e missões secundárias memoráveis.',
        '',
        '2015',
        agora,
        agora,
      ]
    );

    await db.runAsync(
      `INSERT INTO Backlog (rawg_id, title, status, rating, playtime, achievements, review_text, cover_uri, release_year, added_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        4200,
        'Portal 2',
        'Completed',
        9.8,
        14,
        28,
        'Design de puzzles genial do início ao fim.',
        '',
        '2011',
        agora,
        agora,
      ]
    );
  }
};

export const listarJogosBacklog = async () => {
  const db = await getDatabase();
  return await db.getAllAsync(
    'SELECT * FROM Backlog ORDER BY datetime(updated_at) DESC, id DESC'
  );
};

export const buscarJogoBacklogPorId = async (id) => {
  const db = await getDatabase();
  return await db.getFirstAsync('SELECT * FROM Backlog WHERE id = ?', [id]);
};

export const atualizarCapaLocalBacklog = async (id, coverUri) => {
  const db = await getDatabase();
  const agora = new Date().toISOString();
  await db.runAsync(
    'UPDATE Backlog SET cover_uri = ?, updated_at = ? WHERE id = ?',
    [coverUri || '', agora, id]
  );
};
