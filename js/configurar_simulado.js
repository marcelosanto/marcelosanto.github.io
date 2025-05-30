document.addEventListener('DOMContentLoaded', () => {
    const nomeCategoriaSimuladoStrong = document.getElementById('nome-categoria-simulado');
    const numPerguntasInput = document.getElementById('num-perguntas');
    const randomizarCheckbox = document.getElementById('randomizar-perguntas');
    const botaoIniciarSimulado = document.getElementById('botao-iniciar-simulado');
    const tituloConfigSimuladoH1 = document.getElementById('titulo-config-simulado');

    // Ler os par�metros da URL (arquivo e categoria)
    const params = new URLSearchParams(window.location.search);
    const arquivoJSON = params.get('arquivo');
    const nomeCategoria = params.get('categoria');

    if (nomeCategoria) {
        const decodedNomeCategoria = decodeURIComponent(nomeCategoria);
        if (nomeCategoriaSimuladoStrong) {
            nomeCategoriaSimuladoStrong.textContent = decodedNomeCategoria;
        }
        if (tituloConfigSimuladoH1) {
            tituloConfigSimuladoH1.textContent = `Configurar Simulado: ${decodedNomeCategoria}`;
        }
    } else {
        if (nomeCategoriaSimuladoStrong) {
            nomeCategoriaSimuladoStrong.textContent = "N/A";
        }
        if (tituloConfigSimuladoH1) {
            tituloConfigSimuladoH1.textContent = `Configurar Simulado`;
        }
    }

    if (!arquivoJSON) {
        alert("Erro: Arquivo do simulado n�o especificado. Por favor, volte e selecione um simulado.");
        if (botaoIniciarSimulado) {
            botaoIniciarSimulado.disabled = true;
        }
        return;
    }

    // Adicionar funcionalidade ao bot�o "Iniciar Simulado"
    if (botaoIniciarSimulado) {
        botaoIniciarSimulado.addEventListener('click', () => {
            const numPerguntas = numPerguntasInput.value ? parseInt(numPerguntasInput.value) : 0;
            const randomizar = true;

            // Construir a URL para simulado.html com todos os par�metros
            let urlSimulado = `simulado.html?arquivo=${encodeURIComponent(arquivoJSON)}`;
            urlSimulado += `&categoria=${encodeURIComponent(nomeCategoria || '')}`; // Passa a categoria adiante

            if (numPerguntas > 0) {
                urlSimulado += `&numPerguntas=${numPerguntas}`;
            }
            if (randomizar) {
                urlSimulado += `&randomizar=true`;
            }

            window.location.href = urlSimulado; // Redireciona para a p�gina do simulado
        });
    }
});