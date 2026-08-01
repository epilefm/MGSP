# Intranet MTS

Sistema interno dividido em `backend/` (Node/Express + MySQL) e `frontend/` (React).

## Como rodar

### 1. Pré-requisitos
- Node.js e npm instalados.
- MySQL rodando em `localhost:3306`, com o banco `mydb` e o usuário `materiais` com permissão de acesso a partir de `localhost` (veja "Problema conhecido" abaixo).

### 2. Instalar dependências (uma vez)
```
npm run install:all
```
Ou manualmente: `npm install` dentro de `backend/` e de `frontend/`.

### 3. Configurar login (uma vez, depois de resolver o acesso ao MySQL)
```
cd backend
mysql -u materiais -p mydb < db/migrations/001_auth_schema.sql
node scripts/seedAdmin.js SEU_KNOX "sua-senha" "Seu Nome"
```
Isso cria as tabelas de usuário/departamento e um usuário com acesso a todos os departamentos.

### 4. Rodar
```
npm run dev
```
Sobe backend (porta 8080) e frontend (porta 3000) juntos. Ou separadamente: `npm run start:backend` / `npm run start:frontend`.

## Estrutura
- `backend/index.js` — bootstrap do Express, monta os routers por departamento.
- `backend/routes/<Departamento>/` — rotas espelhando as pastas de `frontend/src/components/<Departamento>/`.
- `backend/routes/shared/` — rotas usadas por mais de um departamento.
- `backend/middleware/auth.js` — autenticação (JWT) e permissão por departamento.
- `frontend/src/config/api.js` — URL base da API (via `REACT_APP_API_URL` no `.env`).
- `frontend/src/auth/` — contexto de autenticação e proteção de rotas.

## Problema conhecido: acesso ao MySQL
O usuário `materiais` está com "Access denied" ao conectar via `localhost`. Provavelmente esse usuário só tinha permissão liberada para o IP antigo da rede da empresa. Resolva no MySQL:
```sql
GRANT ALL ON mydb.* TO 'materiais'@'localhost' IDENTIFIED BY '1234';
FLUSH PRIVILEGES;
```
(ajuste a senha se for diferente do valor em `backend/.env`)
