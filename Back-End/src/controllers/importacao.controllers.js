const importar = async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ erro: "A URL de importação é obrigatória." });
    }

    // Não devolvemos receitas inventadas. A extração real precisa ser conectada
    // a um serviço de transcrição/análise antes de disponibilizar o recurso.
    return res.status(501).json({
        erro: "A importação automática ainda não está configurada.",
        detalhe: `Não foi possível extrair uma receita real da URL: ${url}`
    });
};

module.exports = { importar };
