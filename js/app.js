document.addEventListener('DOMContentLoaded', () => {
    const simuladosDisponiveis = [
        { nome: "Cobrança, Preços e Suporte", arquivo: "cobranca_precos.json", categoriaOriginal: "Cobrança, Preços e Suporte" },
        { nome: "Conceitos da Nuvem", arquivo: "conceitos_nuvem.json", categoriaOriginal: "Conceitos da Nuvem" },
        { nome: "Segurança e Conformidade", arquivo: "seguranca_conformidade.json", categoriaOriginal: "Segurança e Conformidade" },
        { nome: "Tecnologia e Serviços da Nuvem", arquivo: "tecnologia_servicos.json", categoriaOriginal: "Tecnologia e Serviços da Nuvem" }
    ];

    const listaSimuladosDiv = document.getElementById('lista-simulados');

    if (listaSimuladosDiv) {
        const ul = document.createElement('ul');
        simuladosDisponiveis.forEach(simulado => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = simulado.nome;
            // Passamos o nome do arquivo e a categoria original como parâmetros na URL
            a.href = `configurar_simulado.html?arquivo=${encodeURIComponent(simulado.arquivo)}&categoria=${encodeURIComponent(simulado.categoriaOriginal)}`;
            li.appendChild(a);
            ul.appendChild(li);
        });
        listaSimuladosDiv.appendChild(ul);
    } else {
        console.error("Elemento com ID 'lista-simulados' não foi encontrado.");
    }
});