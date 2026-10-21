import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { initDatabase } from './src/services/database';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (err) {
        setDbError(err.message || 'Falha ao iniciar o banco de dados.');
      }
    }

    setup();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Gamestar</Text>
      <Text style={styles.subtitle}>Game Backlog & Review Tracker</Text>

      <View style={styles.statusBox}>
        {!dbReady && !dbError && (
          <>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={styles.statusText}>Inicializando SQLite...</Text>
          </>
        )}

        {dbReady && (
          <Text style={styles.successText}>
            ✓ Banco SQLite e tabela Backlog prontos!
          </Text>
        )}

        {dbError && (
          <Text style={styles.errorText}>Erro: {dbError}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 32,
  },
  statusBox: {
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: '#CBD5E1',
    fontSize: 14,
  },
  successText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '600',
  },
});
