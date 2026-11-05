# Gamestar

Rede social para registrar os jogos que você está jogando, zerou, pausou ou abandonou, e ver o que outros jogadores estão jogando.

Aplicativo mobile desenvolvido em React Native com Expo (SDK 58) para a disciplina de Desenvolvimento para Dispositivos Móveis (SPODEDM).

## Como funciona

- **Contas e perfis:** cada pessoa cria uma conta com nome de usuário; perfis são públicos para quem está logado.
- **Catálogo de jogos:** a busca procura na base do Gamestar e no catálogo da [IGDB](https://www.igdb.com), que cobre PC, consoles, mobile e clássicos. Ao escolher um jogo da IGDB, ele é importado para a base e seus dados são atualizados automaticamente a cada 30 dias.
- **Pedidos de jogos:** usuários não cadastram jogos. Se um jogo não for encontrado, o usuário faz um pedido e um administrador o adiciona (pela IGDB ou manualmente) ou recusa.
- **Lista pessoal:** status (Jogando, Zerado, Abandonado, Pausado, Lista de Desejos), plataforma, nota de 0 a 5 estrelas, horas jogadas e resenha.
- **Social:** seguir jogadores, feed com a atividade de quem você segue e página de cada jogo com a nota da crítica e as avaliações da comunidade.

Backend: [Supabase](https://supabase.com) (PostgreSQL, autenticação, regras de acesso por linha e Edge Functions).

## Configuração (uma vez)

### Supabase
1. Crie um projeto gratuito no Supabase.
2. Em **SQL Editor**, cole e execute o conteúdo de `supabase/schema.sql`.
3. Em **Authentication → Sign In / Providers → Email**, mantenha o provedor ativo e desative **Confirm email** (para testes).
4. Copie `.env.example` para `.env` e preencha com a **Project URL** e a **Publishable key** (Project Settings → API Keys).

### IGDB (catálogo de jogos)
1. Em [dev.twitch.tv/console](https://dev.twitch.tv/console), registre um aplicativo (categoria *Application Integration*, tipo *Confidential*) e gere o **Client ID** e o **Client Secret**.
2. No Supabase, em **Edge Functions → Secrets**, adicione `IGDB_CLIENT_ID` e `IGDB_CLIENT_SECRET`.
3. Em **Edge Functions → Deploy a new function → Via Editor**, crie a função `catalog` com o conteúdo de `supabase/functions/catalog/index.ts`.

### Administrador
No **SQL Editor**, troque pelo seu nome de usuário e execute:

```sql
update public.profiles set is_admin = true where username = 'seu_usuario';
```

## Como executar

```bash
npm install
npx expo start --clear
```

Abra no celular com o app **Expo Go** (versão para SDK 58).

Dados de jogos fornecidos pela [IGDB.com](https://www.igdb.com).
