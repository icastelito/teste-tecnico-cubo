# CineHub - Guia de Instalação e Execução

Sistema completo de gerenciamento de filmes desenvolvido com React, NestJS, PostgreSQL e Redis.

## Pré-requisitos

Antes de começar, você precisará instalar as seguintes ferramentas no seu computador.

### Node.js

O projeto requer Node.js versão 18 ou superior.

**Windows:**

1. Acesse https://nodejs.org
2. Baixe a versão LTS (recomendada)
3. Execute o instalador e siga as instruções
4. Verifique a instalação abrindo o PowerShell e executando:

```
node --version
```

**Linux (Ubuntu/Debian):**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS:**

```bash
brew install node@18
```

### pnpm

Este projeto utiliza pnpm como gerenciador de pacotes. Para instalar:

```bash
npm install -g pnpm
```

Verifique a instalação:

```bash
pnpm --version
```

### Docker e Docker Compose

O projeto utiliza Docker para executar PostgreSQL e Redis.

**Windows:**

1. Baixe Docker Desktop em https://www.docker.com/products/docker-desktop
2. Execute o instalador
3. Reinicie o computador se solicitado
4. Abra o Docker Desktop e aguarde inicializar

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

Após executar os comandos, faça logout e login novamente.

**macOS:**

```bash
brew install --cask docker
```

Abra o Docker Desktop após a instalação.

Verifique a instalação:

```bash
docker --version
docker-compose --version
```

## Clonando o Repositório

```bash
git clone <url-do-repositorio>
cd cubo
```

## Configuração do Backend

### 1. Instalar Dependências

```bash
cd cinehub-back
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `cinehub-back`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com as seguintes configurações:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cinehub"

# JWT
JWT_SECRET="sua-chave-secreta-jwt-muito-forte-e-aleatoria"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Resend (Email)
RESEND_API_KEY="re_sua_chave_aqui"
FROM_EMAIL="noreply@seudominio.com"

# Cloudflare R2 (Storage)
R2_ACCOUNT_ID="seu-account-id"
R2_ACCESS_KEY_ID="sua-access-key"
R2_SECRET_ACCESS_KEY="sua-secret-key"
R2_BUCKET_NAME="cinehub"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"

# Application
API_PREFIX="api"
PORT=3000
```

**Observações importantes:**

-   **JWT_SECRET**: Gere uma string aleatória forte. Exemplo usando Node.js:

    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```

-   **RESEND_API_KEY**: Obtenha em https://resend.com (plano gratuito disponível)

-   **Cloudflare R2**: Crie uma conta em https://cloudflare.com e configure um bucket R2. Alternativamente, você pode usar AWS S3 compatível.

### 3. Iniciar Banco de Dados e Redis

Na pasta `cinehub-back`, execute:

```bash
docker-compose up -d
```

Isso iniciará containers Docker com PostgreSQL e Redis em background.

Para verificar se os containers estão rodando:

```bash
docker ps
```

### 4. Executar Migrações do Banco de Dados

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

### 5. Iniciar o Backend

```bash
pnpm start:dev
```

O backend estará rodando em `http://localhost:3000`

Para verificar se está funcionando, acesse:

```
http://localhost:3000/api/health
```

## Configuração do Frontend

### 1. Instalar Dependências

Abra um novo terminal e execute:

```bash
cd cinehub-front
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `cinehub-front`:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Iniciar o Frontend

```bash
pnpm dev
```

O frontend estará rodando em `http://localhost:5173`

Abra seu navegador e acesse esse endereço para usar a aplicação.

## Testando a Aplicação

### Executar Testes do Backend

```bash
cd cinehub-back
pnpm test:e2e
```

### Criar Usuário de Teste

1. Acesse `http://localhost:5173` no navegador
2. Clique em "Criar conta"
3. Preencha os dados e crie sua conta
4. Faça login com suas credenciais

## Comandos Úteis

### Backend

```bash
# Modo desenvolvimento
pnpm start:dev

# Build para produção
pnpm build

# Executar produção
pnpm start:prod

# Abrir Prisma Studio (interface visual do banco)
pnpm prisma:studio

# Executar testes
pnpm test:e2e

# Limpar dados de teste
pnpm test:clean
```

### Frontend

```bash
# Modo desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Preview do build
pnpm preview

# Linting
pnpm lint
```

### Docker

```bash
# Iniciar containers
docker-compose up -d

# Parar containers
docker-compose down

# Ver logs dos containers
docker-compose logs -f

# Reiniciar containers
docker-compose restart
```

## Solução de Problemas

### Erro de conexão com o banco de dados

Verifique se o Docker está rodando:

```bash
docker ps
```

Se não aparecer nenhum container, inicie novamente:

```bash
cd cinehub-back
docker-compose up -d
```

### Erro "Port already in use"

Se a porta 3000 ou 5173 já estiver em uso, você pode:

1. Mudar a porta no arquivo `.env` do backend (PORT=3002)
2. Ou finalizar o processo que está usando a porta

**Windows:**

```powershell
netstat -ano | findstr :3000
taskkill /PID <numero-do-pid> /F
```

**Linux/macOS:**

```bash
lsof -i :3000
kill -9 <PID>
```

### Erro ao executar migrações

Certifique-se que o banco de dados está rodando e que a URL no `.env` está correta.

Tente resetar o banco (ATENÇÃO: isso apagará todos os dados):

```bash
pnpm prisma:migrate reset
```

### Erro ao fazer upload de imagens

Verifique se as credenciais do Cloudflare R2 no `.env` estão corretas.

Para testar apenas localmente sem upload real, você pode comentar as validações de upload no código temporariamente.

### Frontend não consegue se comunicar com o backend

1. Verifique se o backend está rodando em `http://localhost:3000`
2. Verifique se o `VITE_API_URL` no `.env` do frontend está correto
3. Verifique o console do navegador para mensagens de erro de CORS

## Estrutura do Projeto

```
cubo/
├── cinehub-back/          # Backend NestJS
│   ├── src/               # Código fonte
│   ├── prisma/            # Schema e migrações do banco
│   ├── test/              # Testes E2E
│   └── docker-compose.yml # Configuração Docker
│
└── cinehub-front/         # Frontend React
    ├── src/               # Código fonte
    ├── public/            # Assets estáticos
    └── .env               # Variáveis de ambiente
```

## Próximos Passos

Após a instalação bem-sucedida:

1. Crie sua conta na aplicação
2. Faça login
3. Adicione seu primeiro filme
4. Explore os filtros e busca
5. Teste o upload de imagens (poster e backdrop)
6. Alterne entre tema claro e escuro

## Suporte

Se encontrar problemas durante a instalação:

1. Verifique se todas as versões dos pré-requisitos estão corretas
2. Certifique-se de que todos os containers Docker estão rodando
3. Verifique os logs do backend e frontend para mensagens de erro
4. Consulte a documentação adicional em `cinehub-back/API-EXAMPLES.md`

## Informações Adicionais

-   Documentação da API: `cinehub-back/API-EXAMPLES.md`
-   Rotas de filmes: `cinehub-back/ROTAS-FILMES.md`
-   Rotas de usuários: `cinehub-back/ROTAS-USUARIOS.md`
-   Collection do Postman: `cinehub-back/CineHub-API.postman_collection.json`
