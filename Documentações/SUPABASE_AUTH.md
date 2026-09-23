# Autenticação com Supabase

O Saboré usa o Supabase Auth para e-mail/senha e Google. O Prisma continua
sendo usado para receitas, livros e demais dados da aplicação.

## 1. Chaves do projeto

No Supabase, abra **Settings > API** e copie a **Publishable key** (a antiga
`anon key` também é aceita).

Preencha a mesma chave nestes dois lugares:

```env
# Back-End/.env
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

```js
// Front-End/assets/js/supabase-config.js
window.SABORE_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_...";
```

Ela pode aparecer no frontend. Não use nem exponha a `service_role key`.

## 2. URLs de redirecionamento

Em **Authentication > URL Configuration** defina:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/login/index.html`

No ambiente publicado, inclua também a URL HTTPS real do site e o caminho
`/login/index.html`.

## 3. Google

1. No Google Cloud Console, crie (ou reutilize) um OAuth Client do tipo **Web
   application**.
2. Em **Authorized JavaScript origins**, adicione `http://localhost:3000`.
3. Em **Authorized redirect URIs**, adicione exatamente:

   `https://dzumxhfglusinxtyflwb.supabase.co/auth/v1/callback`

4. No Supabase, abra **Authentication > Providers > Google**, habilite o
   provedor e cole o Client ID e Client Secret criados no Google Cloud.

## 4. Executar e testar

Reinicie a API dentro de `Back-End`:

```bash
npm run dev
```

Abra `http://localhost:3000/login/index.html`. O botão Google retorna para
essa mesma página, que finaliza a sessão e abre o dashboard.

Contas criadas somente no sistema antigo precisam criar uma senha no Supabase
ou usar a recuperação de senha, pois senhas não são migráveis entre provedores.
