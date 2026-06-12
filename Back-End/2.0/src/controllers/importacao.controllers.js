const prisma = require("../data/prisma");

const importar = async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ erro: "A URL de importação é obrigatória." });
    }

    const isTiktok = url.toLowerCase().includes("tiktok");
    
    if (isTiktok) {
        return res.status(200).json({
            title: 'Macarrão Cremoso One-Pot (Tiktok)',
            ingredients: ['Macarrão Espaguete', 'Tomate Cereja', 'Queijo Feta', 'Azeite de Oliva', 'Manjericão Fresco'],
            steps: [
                'Em uma assadeira de vidro, coloque o queijo feta no centro e espalhe os tomates cereja ao redor.',
                'Regue tudo generosamente com azeite de oliva e tempere com sal e pimenta.',
                'Asse em forno médio (200°C) por 25 minutos até o queijo derreter e tomates dourarem.',
                'Cozinhe o espaguete em água com sal.',
                'Amasse o queijo assado com os tomates para formar um creme espesso, misture a massa cozida e finalize com folhas de manjericão.'
            ],
            time: 30,
            difficulty: 'Fácil',
            diet: 'vegetariano'
        });
    }

    return res.status(200).json({
        title: 'Macarrão Cremoso Rápido Importado',
        ingredients: ['Espaguete (200g)', 'Creme de Leite (1 caixinha)', 'Bacon em cubos (100g)', 'Parmesão ralado'],
        steps: [
            'Cozinhe o macarrão em água fervente com sal.',
            'Frite o bacon até ficar dourado e crocante.',
            'Adicione o creme de leite e misture bem.',
            'Incorpore a massa cozida e termine com bastante queijo parmesão.'
        ],
        time: 15,
        difficulty: 'Fácil',
        diet: 'none'
    });
};

module.exports = { importar };