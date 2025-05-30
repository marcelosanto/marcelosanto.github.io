// Fun��o para embaralhar um array (Algoritmo de Fisher-Yates)
function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Troca de elementos
    }
    return array;
}

document.addEventListener('DOMContentLoaded', () => {
    // Sele��o dos elementos do DOM
    const areaPergunta = document.getElementById('area-pergunta');
    const areaOpcoes = document.getElementById('area-opcoes');
    const tituloSimuladoH1 = document.getElementById('titulo-simulado');
    const botaoProxima = document.getElementById('botao-proxima');
    const botaoFinalizar = document.getElementById('botao-finalizar');
    const areaResultado = document.getElementById('area-resultado');
    const porcentagemAcertosP = document.getElementById('porcentagem-acertos');
    const feedbackRespostasDiv = document.getElementById('feedback-respostas');

    // Vari�veis de estado do simulado
    let perguntas = [];
    let perguntaAtualIndex = 0;
    let respostasUsuario = [];

    // 1. Ler os par�metros da URL
    const params = new URLSearchParams(window.location.search);
    const arquivoJSON = params.get('arquivo');
    const nomeCategoria = params.get('categoria');
    const numPerguntasParam = params.get('numPerguntas');
    const randomizarParam = params.get('randomizar');

    // Atualizar t�tulo da p�gina com o nome da categoria
    if (tituloSimuladoH1 && nomeCategoria) {
        tituloSimuladoH1.textContent = `Simulado: ${decodeURIComponent(nomeCategoria)}`;
    } else if (tituloSimuladoH1) {
        tituloSimuladoH1.textContent = "Simulado AWS"; // T�tulo padr�o
    }

    // 2. Carregar e processar o arquivo JSON
    if (arquivoJSON) {
        fetch(`dados/${arquivoJSON}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP ${response.status} ao carregar o arquivo JSON: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) {
                    throw new Error("O arquivo JSON Não cont�m um array de perguntas.");
                }

                let perguntasProcessadas = [...data]; // Clona para manipulação

                // Randomizar se solicitado
                if (randomizarParam === 'true') {
                    perguntasProcessadas = embaralharArray(perguntasProcessadas);
                }

                // Selecionar o n�mero de perguntas se especificado e válido
                if (numPerguntasParam) {
                    const numDesejado = parseInt(numPerguntasParam);
                    if (numDesejado > 0 && numDesejado < perguntasProcessadas.length) {
                        perguntasProcessadas = perguntasProcessadas.slice(0, numDesejado);
                    }
                    // Se numDesejado <= 0 ou >= total, usa todas (j� cortadas ou Não pela randomização)
                }

                perguntas = perguntasProcessadas; // Define o array final de perguntas

                if (perguntas.length > 0) {
                    respostasUsuario = new Array(perguntas.length).fill(null);
                    mostrarPergunta(perguntaAtualIndex);
                } else {
                    areaPergunta.innerHTML = '<p>Nenhuma pergunta encontrada para este simulado com os crit�rios selecionados.</p>';
                    botaoProxima.style.display = 'none';
                    botaoFinalizar.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Falha ao buscar ou processar o simulado:', error);
                areaPergunta.innerHTML = `<p>Erro ao carregar o simulado: ${error.message}. Verifique o console para mais detalhes e se o arquivo JSON est� no formato esperado e no local correto (pasta 'dados').</p>`;
                botaoProxima.style.display = 'none';
                botaoFinalizar.style.display = 'none';
            });
    } else {
        areaPergunta.innerHTML = '<p>Nenhum simulado selecionado. Volte para a p�gina inicial e escolha um.</p>';
        if (tituloSimuladoH1) tituloSimuladoH1.textContent = "Erro na Sele��o";
        botaoProxima.style.display = 'none';
        botaoFinalizar.style.display = 'none';
    }

    // 3. Fun��o para mostrar uma pergunta
    function mostrarPergunta(index) {
        if (perguntas.length === 0) {
            areaPergunta.innerHTML = "<p>Nenhuma pergunta dispon�vel para os crit�rios selecionados.</p>";
            areaOpcoes.innerHTML = '';
            botaoProxima.style.display = 'none';
            botaoFinalizar.style.display = 'none';
            return;
        }

        if (index < 0 || index >= perguntas.length) {
            console.error("�ndice de pergunta inválido:", index);
            return;
        }

        const pergunta = perguntas[index];
        areaPergunta.innerHTML = `<p><strong>Pergunta ${index + 1} de ${perguntas.length}:</strong> ${pergunta.text}</p>`;
        areaOpcoes.innerHTML = ''; // Limpa op��es anteriores

        const ul = document.createElement('ul');
        const tipoInput = pergunta.correctAnswers.length > 1 ? 'checkbox' : 'radio';
        const limiteSelecoes = (tipoInput === 'checkbox') ? pergunta.correctAnswers.length : 1;

        pergunta.options.forEach((opcao, i) => {
            const li = document.createElement('li');
            const input = document.createElement('input');
            input.type = tipoInput;
            input.name = `pergunta_${index}`;
            input.value = i;
            input.id = `opcao_${index}_${i}`;

            // Verifica se j� existe uma resposta para esta pergunta e marca
            if (respostasUsuario[index] !== null) {
                if (tipoInput === 'radio' && respostasUsuario[index] === i) {
                    input.checked = true;
                } else if (tipoInput === 'checkbox' && Array.isArray(respostasUsuario[index]) && respostasUsuario[index].includes(i)) {
                    input.checked = true;
                }
            }

            // Adicionar o event listener para limitar sele��es de checkbox
            if (tipoInput === 'checkbox') {
                input.addEventListener('change', () => {
                    const checkboxesDoGrupo = areaOpcoes.querySelectorAll(`input[type="checkbox"][name="pergunta_${index}"]`);
                    const marcados = Array.from(checkboxesDoGrupo).filter(cb => cb.checked).length;

                    if (marcados >= limiteSelecoes) {
                        checkboxesDoGrupo.forEach(cb => {
                            if (!cb.checked) {
                                cb.disabled = true;
                            }
                        });
                    } else {
                        checkboxesDoGrupo.forEach(cb => {
                            cb.disabled = false;
                        });
                    }
                });
            }

            const label = document.createElement('label');
            label.htmlFor = `opcao_${index}_${i}`;
            label.textContent = opcao;

            li.appendChild(input);
            li.appendChild(label);
            ul.appendChild(li);
        });
        areaOpcoes.appendChild(ul);

        // Reavaliar o estado dos checkboxes desabilitados ao carregar a pergunta
        if (tipoInput === 'checkbox') {
            const checkboxesDoGrupo = areaOpcoes.querySelectorAll(`input[type="checkbox"][name="pergunta_${index}"]`);
            const marcadosAoCarregar = Array.from(checkboxesDoGrupo).filter(cb => cb.checked).length;
            if (marcadosAoCarregar >= limiteSelecoes) {
                checkboxesDoGrupo.forEach(cb => {
                    if (!cb.checked) {
                        cb.disabled = true;
                    }
                });
            }
        }

        // Controlar visibilidade dos bot�es
        botaoProxima.style.display = (index < perguntas.length - 1) ? 'inline-block' : 'none';
        botaoFinalizar.style.display = (index === perguntas.length - 1 && perguntas.length > 0) ? 'inline-block' : 'none';
    }

    // 4. Fun��o para salvar a resposta atual
    function salvarRespostaAtual() {
        // Garante que Não tentaremos salvar se Não houver perguntas ou o �ndice for inválido
        if (perguntas.length === 0 || perguntaAtualIndex < 0 || perguntaAtualIndex >= perguntas.length) {
            return;
        }

        const pergunta = perguntas[perguntaAtualIndex];
        const tipoInput = pergunta.correctAnswers.length > 1 ? 'checkbox' : 'radio';
        const inputs = areaOpcoes.querySelectorAll(`input[name="pergunta_${perguntaAtualIndex}"]`);

        if (tipoInput === 'radio') {
            const checkedInput = Array.from(inputs).find(input => input.checked);
            respostasUsuario[perguntaAtualIndex] = checkedInput ? parseInt(checkedInput.value) : null;
        } else { // checkbox
            const checkedInputs = Array.from(inputs).filter(input => input.checked);
            respostasUsuario[perguntaAtualIndex] = checkedInputs.length > 0 ? checkedInputs.map(input => parseInt(input.value)) : null;
        }
    }

    // 5. L�gica do bot�o "Pr�xima Pergunta"
    botaoProxima.addEventListener('click', () => {
        salvarRespostaAtual();
        perguntaAtualIndex++;
        if (perguntaAtualIndex < perguntas.length) {
            mostrarPergunta(perguntaAtualIndex);
        }
    });

    // 6. L�gica do bot�o "Finalizar Simulado"
    botaoFinalizar.addEventListener('click', () => {
        salvarRespostaAtual();
        calcularResultado();
    });

    // 7. Fun��o para calcular e mostrar o resultado
    function calcularResultado() {
        let acertos = 0;
        feedbackRespostasDiv.innerHTML = ''; // Limpa feedback anterior

        if (perguntas.length === 0) {
            porcentagemAcertosP.textContent = "Nenhuma pergunta foi respondida neste simulado.";
            areaPergunta.style.display = 'none';
            areaOpcoes.style.display = 'none';
            botaoProxima.style.display = 'none';
            botaoFinalizar.style.display = 'none';
            areaResultado.style.display = 'block';
            return;
        }

        perguntas.forEach((pergunta, index) => {
            const respostaDoUsuario = respostasUsuario[index];
            const respostasCorretas = pergunta.correctAnswers;

            let acertou = false;
            if (respostaDoUsuario !== null) {
                if (respostasCorretas.length > 1) { // M�ltipla escolha (checkbox)
                    if (Array.isArray(respostaDoUsuario) &&
                        respostaDoUsuario.length === respostasCorretas.length &&
                        respostaDoUsuario.every(val => respostasCorretas.includes(val)) &&
                        respostasCorretas.every(val => respostaDoUsuario.includes(val))) {
                        acertou = true;
                    }
                } else { // Escolha �nica (radio)
                    // respostasCorretas � um array com um �nico elemento.
                    // respostaDoUsuario � um n�mero (�ndice).
                    if (respostasCorretas.includes(respostaDoUsuario)) {
                        acertou = true;
                    }
                }
            }

            if (acertou) {
                acertos++;
            }

            // Adicionar feedback para cada pergunta
            const divPerguntaFeedback = document.createElement('div');
            divPerguntaFeedback.style.marginBottom = '20px';
            divPerguntaFeedback.innerHTML = `
                <h4>Pergunta ${index + 1}: ${pergunta.text}</h4>
                <p>Sua resposta: ${formatarRespostaUsuario(respostaDoUsuario, pergunta.options)}</p>
                <p>Resposta correta: ${formatarRespostasCorretas(pergunta.correctAnswers, pergunta.options)}</p>
                ${acertou ? '<p class="resposta-correta">Você acertou!</p>' : '<p class="resposta-incorreta">Você errou.</p>'}
                <div class="explicacao"><strong>Explicação:</strong> ${pergunta.explanation || "Não disponível."}</div>
                <hr>
            `;
            feedbackRespostasDiv.appendChild(divPerguntaFeedback);
        });

        const porcentagem = (perguntas.length > 0) ? (acertos / perguntas.length) * 100 : 0;
        porcentagemAcertosP.textContent = `Você acertou ${acertos} de ${perguntas.length} perguntas (${porcentagem.toFixed(2)}%).`;

        // Esconder �rea de perguntas e bot�es de navegação
        areaPergunta.style.display = 'none';
        areaOpcoes.style.display = 'none';
        botaoProxima.style.display = 'none';
        botaoFinalizar.style.display = 'none';

        // Mostrar �rea de resultado
        areaResultado.style.display = 'block';
    }

    // Fun��es auxiliares para formatar a exibi��o das respostas
    function formatarRespostaUsuario(resposta, opcoes) {
        if (resposta === null || typeof resposta === 'undefined') return "Nenhuma resposta.";
        if (Array.isArray(resposta)) { // Checkbox
            if (resposta.length === 0) return "Nenhuma resposta.";
            return resposta.map(index => opcoes[index] || `Opção inválida (${index})`).join(', ');
        }
        return opcoes[resposta] || `Opção inválida (${resposta})`; // Radio
    }

    function formatarRespostasCorretas(indicesCorretos, opcoes) {
        if (!indicesCorretos || indicesCorretos.length === 0) return "Não definida.";
        return indicesCorretos.map(index => opcoes[index] || `Opção inválida (${index})`).join(', ');
    }
});