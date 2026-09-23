const { supabaseRest } = require("./databaseFallback");

const recipeSelect = [
    "id",
    "titulo",
    "descricao",
    "modoPreparo",
    "tempoPreparo",
    "publica",
    "imagem",
    "dificuldade",
    "criadaPorIA",
    "rascunho",
    "linkImportacao",
    "livroId",
    "usuarioId",
    "createdAt",
    "updatedAt",
    "usuario:Usuario(nome,foto)",
    "ingredientes:ReceitaIngrediente(quantidade,ingrediente:Ingrediente(nome))",
    "categorias:ReceitaCategoria(categoria:Categoria(nome))"
].join(",");

function encode(value) {
    return encodeURIComponent(String(value));
}

async function listRecipes(filters = {}) {
    const query = new URLSearchParams({ select: recipeSelect, order: "createdAt.desc" });

    if (filters.publica !== undefined) query.set("publica", `eq.${filters.publica}`);
    if (filters.usuarioId !== undefined) query.set("usuarioId", `eq.${filters.usuarioId}`);
    if (filters.livroId !== undefined) query.set("livroId", `eq.${filters.livroId}`);

    return supabaseRest(`Receita?${query}`);
}

async function listBooks(usuarioId) {
    const select = "id,titulo,emoji,tag,createdAt,updatedAt,receitas:Receita(id)";
    const books = await supabaseRest(
        `Livro?select=${encode(select)}&usuarioId=eq.${encode(usuarioId)}&order=createdAt.asc`
    );

    return books.map(({ receitas = [], ...book }) => ({
        ...book,
        _count: { receitas: receitas.length }
    }));
}

async function listFavorites(usuarioId) {
    const select = `id,receita:Receita(${recipeSelect})`;
    const favorites = await supabaseRest(
        `Favorito?select=${encode(select)}&usuarioId=eq.${encode(usuarioId)}&order=createdAt.desc`
    );

    return favorites.map((favorite) => favorite.receita).filter(Boolean);
}

async function listUsers() {
    const select = "id,nome,email,foto,plano";
    return supabaseRest(`Usuario?select=${encode(select)}&order=nome.asc`);
}

async function getProfile(usuarioId) {
    const select = [
        "id",
        "nome",
        "email",
        "foto",
        "plano",
        "receitas:Receita(id,criadaPorIA)",
        "favoritos:Favorito(id)",
        "livros:Livro(id)"
    ].join(",");
    const users = await supabaseRest(
        `Usuario?select=${encode(select)}&id=eq.${encode(usuarioId)}&limit=1`
    );

    return users[0] || null;
}

async function listPantry(usuarioId) {
    const select = "ingrediente:Ingrediente(nome)";
    const items = await supabaseRest(
        `IngredienteDisponivel?select=${encode(select)}&usuarioId=eq.${encode(usuarioId)}`
    );

    return items.map((item) => item.ingrediente).filter(Boolean);
}

module.exports = {
    getProfile,
    listBooks,
    listFavorites,
    listPantry,
    listRecipes,
    listUsers,
    recipeSelect
};
