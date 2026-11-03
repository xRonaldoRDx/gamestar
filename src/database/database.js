import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'gamestar.db';

let dbInstance = null;

export const getDatabase = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbInstance;
};

/**
 * Inicializa a tabela Backlog no SQLite usando a API moderna assíncrona (Expo SDK 58).
 */
export const initDB = async () => {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS Backlog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rawg_id INTEGER,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Lista de Desejos',
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

  // Migração segura de colunas para bancos criados em fases anteriores
  const colunas = await db.getAllAsync('PRAGMA table_info(Backlog);');
  const nomesColunas = colunas.map((col) => col.name);

  if (!nomesColunas.includes('cover_uri')) {
    await db.execAsync("ALTER TABLE Backlog ADD COLUMN cover_uri TEXT DEFAULT '';");
  }

  if (!nomesColunas.includes('release_year')) {
    await db.execAsync("ALTER TABLE Backlog ADD COLUMN release_year TEXT DEFAULT '';");
  }

  // Normaliza registros de fases anteriores para a escala 0..5 e status em português
  await db.runAsync('UPDATE Backlog SET rating = ROUND(rating / 2.0, 1) WHERE rating > ?', [5]);
  await db.runAsync('UPDATE Backlog SET status = ? WHERE status = ?', ['Jogando', 'Playing']);
  await db.runAsync('UPDATE Backlog SET status = ? WHERE status = ?', ['Zerado', 'Completed']);
  await db.runAsync('UPDATE Backlog SET status = ? WHERE status = ?', ['Lista de Desejos', 'Backlog']);
  await db.runAsync('UPDATE Backlog SET status = ? WHERE status = ?', ['Abandonado', 'Dropped']);

  // Carga inicial caso a tabela esteja vazia
  const firstRow = await db.getFirstAsync('SELECT count(*) as count FROM Backlog');

  if (firstRow && firstRow.count === 0) {
    const agora = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO Backlog (rawg_id, title, status, rating, playtime, achievements, review_text, cover_uri, release_year, added_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        3328,
        'The Witcher 3: Wild Hunt',
        'Jogando',
        5.0,
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
        'Zerado',
        4.5,
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

/**
 * READ (All): Lista todos os jogos do Backlog ordenados pela última atualização.
 */
export const listarJogosBacklog = async () => {
  const db = await getDatabase();
  return await db.getAllAsync(
    'SELECT * FROM Backlog ORDER BY datetime(updated_at) DESC, id DESC'
  );
};

/**
 * READ (One): Busca um registro específico pelo ID com bind variable (?).
 */
export const buscarJogoBacklogPorId = async (id) => {
  const db = await getDatabase();
  return await db.getFirstAsync('SELECT * FROM Backlog WHERE id = ?', [id]);
};

/**
 * CREATE: Insere uma nova avaliação na tabela Backlog usando runAsync e bind variables (?).
 * @returns {Promise<number>} ID do registro inserido (lastInsertRowId)
 */
export const inserirJogoBacklog = async ({
  rawg_id = null,
  title,
  status = 'Lista de Desejos',
  rating = 0,
  playtime = 0,
  achievements = 0,
  review_text = '',
  cover_uri = '',
  release_year = '',
}) => {
  const db = await getDatabase();
  const agora = new Date().toISOString();

  const resultado = await db.runAsync(
    `INSERT INTO Backlog (
      rawg_id,
      title,
      status,
      rating,
      playtime,
      achievements,
      review_text,
      cover_uri,
      release_year,
      added_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rawg_id ? Number(rawg_id) : null,
      String(title || '').trim(),
      String(status || 'Lista de Desejos'),
      Number(rating) || 0,
      Number(playtime) || 0,
      Number(achievements) || 0,
      String(review_text || '').trim(),
      String(cover_uri || ''),
      String(release_year || '').trim(),
      agora,
      agora,
    ]
  );

  return resultado.lastInsertRowId;
};

/**
 * UPDATE: Atualiza os dados de uma avaliação existente usando runAsync e bind variables (?).
 */
export const atualizarJogoBacklog = async (
  id,
  {
    title,
    status,
    rating = 0,
    playtime = 0,
    achievements = 0,
    review_text = '',
    cover_uri = '',
    release_year = '',
  }
) => {
  const db = await getDatabase();
  const agora = new Date().toISOString();

  await db.runAsync(
    `UPDATE Backlog
     SET title = ?,
         status = ?,
         rating = ?,
         playtime = ?,
         achievements = ?,
         review_text = ?,
         cover_uri = ?,
         release_year = ?,
         updated_at = ?
     WHERE id = ?`,
    [
      String(title || '').trim(),
      String(status || 'Lista de Desejos'),
      Number(rating) || 0,
      Number(playtime) || 0,
      Number(achievements) || 0,
      String(review_text || '').trim(),
      String(cover_uri || ''),
      String(release_year || '').trim(),
      agora,
      Number(id),
    ]
  );
};

/**
 * DELETE: Remove uma avaliação da tabela Backlog usando runAsync e bind variable (?).
 */
export const deletarJogoBacklog = async (id) => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM Backlog WHERE id = ?', [Number(id)]);
};

/**
 * Atualiza exclusivamente o caminho local (file://) da capa salva via expo-file-system.
 */
export const atualizarCapaLocalBacklog = async (id, coverUri) => {
  const db = await getDatabase();
  const agora = new Date().toISOString();
  await db.runAsync(
    'UPDATE Backlog SET cover_uri = ?, updated_at = ? WHERE id = ?',
    [coverUri || '', agora, Number(id)]
  );
};
