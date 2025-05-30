function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.addEventListener('DOMContentLoaded', () => {
    const areaPergunta = document.getElementById('area-pergunta');
    const areaOpcoes = document.getElementById('area-opcoes');
    const tituloSimuladoH1 = document.getElementById('titulo-simulado');
    const botaoProxima = document.getElementById('botao-proxima');
    const botaoFinalizar = document.getElementById('botao-finalizar');
    const areaResultado = document.getElementById('area-resultado');
    const porcentagemAcertosP = document.getElementById('porcentagem-acertos');
    const feedbackRespostasDiv = document.getElementById('feedback-respostas');
    const botaoVoltar = document.getElementById('botao-voltar');
    const botaoImprimir = document.getElementById('botao-imprimir');

    let perguntas = [];
    let perguntaAtualIndex = 0;
    let respostasUsuario = [];

    areaPergunta.innerHTML = '<p class="text-center text-gray-500">Carregando simulado...</p>';

    const params = new URLSearchParams(window.location.search);
    const arquivoJSON = params.get('arquivo');
    const nomeCategoria = params.get('categoria');
    const numPerguntasParam = params.get('numPerguntas');
    const randomizarParam = params.get('randomizar');

    if (tituloSimuladoH1 && nomeCategoria) {
        tituloSimuladoH1.textContent = `Simulado: ${decodeURIComponent(nomeCategoria)}`;
    } else if (tituloSimuladoH1) {
        tituloSimuladoH1.textContent = "Simulado AWS";
    }

    if (arquivoJSON) {
        fetch(`dados/${arquivoJSON}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) {
                    throw new Error("O arquivo JSON Não contém um array de perguntas.");
                }

                let perguntasProcessadas = [...data];
                if (randomizarParam === 'true') {
                    perguntasProcessadas = embaralharArray(perguntasProcessadas);
                }
                if (numPerguntasParam) {
                    const numDesejado = parseInt(numPerguntasParam);
                    if (numDesejado > 0 && numDesejado < perguntasProcessadas.length) {
                        perguntasProcessadas = perguntasProcessadas.slice(0, numDesejado);
                    }
                }

                perguntas = perguntasProcessadas;
                if (perguntas.length > 0) {
                    respostasUsuario = new Array(perguntas.length).fill(null);
                    mostrarPergunta(perguntaAtualIndex);
                } else {
                    areaPergunta.innerHTML = '<p class="text-red-500">Nenhuma pergunta encontrada para este simulado.</p>';
                    botaoProxima.style.display = 'none';
                    botaoFinalizar.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Erro ao carregar simulado:', error);
                areaPergunta.innerHTML = `<p class="text-red-500">Erro: ${error.message}. Verifique o console para mais detalhes.</p>`;
                botaoProxima.style.display = 'none';
                botaoFinalizar.style.display = 'none';
            });
    } else {
        areaPergunta.innerHTML = '<p class="text-red-500">Nenhum simulado selecionado. Volte para a p�gina inicial.</p>';
        if (tituloSimuladoH1) tituloSimuladoH1.textContent = "Erro na Sele��o";
        botaoProxima.style.display = 'none';
        botaoFinalizar.style.display = 'none';
    }

    function mostrarPergunta(index) {
        if (perguntas.length === 0) {
            areaPergunta.innerHTML = "<p class='text-red-500'>Nenhuma pergunta dispon�vel.</p>";
            areaOpcoes.innerHTML = '';
            botaoProxima.style.display = 'none';
            botaoFinalizar.style.display = 'none';
            return;
        }

        if (index < 0 || index >= perguntas.length) {
            console.error("�ndice inv�lido:", index);
            return;
        }

        const pergunta = perguntas[index];
        areaPergunta.innerHTML = `<p><strong>Pergunta ${index + 1} de ${perguntas.length}:</strong> ${pergunta.text}</p>`;
        areaOpcoes.innerHTML = '';

        const ul = document.createElement('ul');
        const tipoInput = pergunta.correctAnswers.length > 1 ? 'checkbox' : 'radio';
        const limiteSelecoes = tipoInput === 'checkbox' ? pergunta.correctAnswers.length : 1;

        pergunta.options.forEach((opcao, i) => {
            const li = document.createElement('li');
            const input = document.createElement('input');
            input.type = tipoInput;
            input.name = `pergunta_${index}`;
            input.value = i;
            input.id = `opcao_${index}_${i}`;

            // Clique no <li> marca/desmarca o input
            li.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    if (tipoInput === 'radio') {
                        input.checked = true;
                        li.parentElement.querySelectorAll('li').forEach(l => l.classList.remove('selected'));
                        li.classList.add('selected');
                    } else if (tipoInput === 'checkbox') {
                        input.checked = !input.checked;
                        const checkboxesDoGrupo = ul.querySelectorAll(`input[type="checkbox"][name="pergunta_${index}"]`);
                        const marcados = Array.from(checkboxesDoGrupo).filter(cb => cb.checked).length;
                        checkboxesDoGrupo.forEach(cb => {
                            cb.disabled = marcados >= limiteSelecoes && !cb.checked;
                        });
                        li.classList.toggle('selected', input.checked);
                    }
                    input.dispatchEvent(new Event('change'));
                }
            });

            if (respostasUsuario[index] !== null) {
                if (tipoInput === 'radio' && respostasUsuario[index] === i) {
                    input.checked = true;
                    li.classList.add('selected');
                } else if (tipoInput === 'checkbox' && Array.isArray(respostasUsuario[index]) && respostasUsuario[index].includes(i)) {
                    input.checked = true;
                    li.classList.add('selected');
                }
            }

            if (tipoInput === 'checkbox') {
                input.addEventListener('change', () => {
                    const checkboxesDoGrupo = ul.querySelectorAll(`input[type="checkbox"][name="pergunta_${index}"]`);
                    const marcados = Array.from(checkboxesDoGrupo).filter(cb => cb.checked).length;
                    checkboxesDoGrupo.forEach(cb => {
                        cb.disabled = marcados >= limiteSelecoes && !cb.checked;
                    });
                    li.classList.toggle('selected', input.checked);
                });
            } else {
                input.addEventListener('change', () => {
                    li.parentElement.querySelectorAll('li').forEach(l => l.classList.remove('selected'));
                    li.classList.add('selected');
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

        if (tipoInput === 'checkbox') {
            const checkboxesDoGrupo = ul.querySelectorAll(`input[type="checkbox"][name="pergunta_${index}"]`);
            const marcadosAoCarregar = Array.from(checkboxesDoGrupo).filter(cb => cb.checked).length;
            if (marcadosAoCarregar >= limiteSelecoes) {
                checkboxesDoGrupo.forEach(cb => {
                    if (!cb.checked) cb.disabled = true;
                });
            }
        }

        botaoProxima.style.display = index < perguntas.length - 1 ? 'inline-block' : 'none';
        botaoFinalizar.style.display = index === perguntas.length - 1 && perguntas.length > 0 ? 'inline-block' : 'none';
    }

    function salvarRespostaAtual() {
        if (perguntas.length === 0 || perguntaAtualIndex < 0 || perguntaAtualIndex >= perguntas.length) return;

        const pergunta = perguntas[perguntaAtualIndex];
        const tipoInput = pergunta.correctAnswers.length > 1 ? 'checkbox' : 'radio';
        const inputs = areaOpcoes.querySelectorAll(`input[name="pergunta_${perguntaAtualIndex}"]`);

        if (tipoInput === 'radio') {
            const checkedInput = Array.from(inputs).find(input => input.checked);
            respostasUsuario[perguntaAtualIndex] = checkedInput ? parseInt(checkedInput.value) : null;
        } else {
            const checkedInputs = Array.from(inputs).filter(input => input.checked);
            respostasUsuario[perguntaAtualIndex] = checkedInputs.length > 0 ? checkedInputs.map(input => parseInt(input.value)) : null;
        }
    }

    botaoProxima.addEventListener('click', () => {
        salvarRespostaAtual();
        perguntaAtualIndex++;
        if (perguntaAtualIndex < perguntas.length) {
            mostrarPergunta(perguntaAtualIndex);
        }
    });

    botaoFinalizar.addEventListener('click', () => {
        salvarRespostaAtual();
        calcularResultado();
        areaResultado.scrollIntoView({ behavior: 'smooth' });
    });

    // Evento para o bot�o Voltar
    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Evento para o bot�o Imprimir
    if (botaoImprimir) {
        botaoImprimir.addEventListener('click', () => {
            window.print();
        });
    }

    function calcularResultado() {
        let acertos = 0;
        feedbackRespostasDiv.innerHTML = '';

        if (perguntas.length === 0) {
            porcentagemAcertosP.textContent = "Nenhuma pergunta foi respondida.";
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
                if (respostasCorretas.length > 1) {
                    if (Array.isArray(respostaDoUsuario) &&
                        respostaDoUsuario.length === respostasCorretas.length &&
                        respostaDoUsuario.every(val => respostasCorretas.includes(val)) &&
                        respostasCorretas.every(val => respostaDoUsuario.includes(val))) {
                        acertou = true;
                    }
                } else {
                    if (respostasCorretas.includes(respostaDoUsuario)) {
                        acertou = true;
                    }
                }
            }

            if (acertou) acertos++;

            const divPerguntaFeedback = document.createElement('div');
            divPerguntaFeedback.style.marginBottom = '20px';
            divPerguntaFeedback.innerHTML = `
                <h4 class="font-bold text-lg text-aws-blue">Pergunta ${index + 1}: ${pergunta.text}</h4>
                <p>Sua resposta: ${formatarRespostaUsuario(respostaDoUsuario, pergunta.options)}</p>
                <p>Resposta correta: ${formatarRespostasCorretas(pergunta.correctAnswers, pergunta.options)}</p>
                ${acertou ? '<p class="resposta-correta">Você acertou!</p>' : '<p class="resposta-incorreta">Você errou.</p>'}
                <div class="explicacao"><strong>Explicação:</strong> ${pergunta.explanation || "Não disponível."}</div>
                <hr>
            `;
            feedbackRespostasDiv.appendChild(divPerguntaFeedback);
        });

        const porcentagem = perguntas.length > 0 ? (acertos / perguntas.length) * 100 : 0;
        porcentagemAcertosP.textContent = `Você acertou ${acertos} de ${perguntas.length} perguntas (${porcentagem.toFixed(2)}%).`;

        areaPergunta.style.display = 'none';
        areaOpcoes.style.display = 'none';
        botaoProxima.style.display = 'none';
        botaoFinalizar.style.display = 'none';
        areaResultado.style.display = 'block';
    }

    function formatarRespostaUsuario(resposta, opcoes) {
        if (resposta === null || typeof resposta === 'undefined') return "Nenhuma resposta.";
        if (Array.isArray(resposta)) {
            if (resposta.length === 0) return "Nenhuma resposta.";
            return resposta.map(index => opcoes[index] || `Opção inválida (${index})`).join(', ');
        }
        return opcoes[resposta] || `Opção inválida (${resposta})`;
    }

    function formatarRespostasCorretas(indicesCorretos, opcoes) {
        if (!indicesCorretos || indicesCorretos.length === 0) return "Não definida.";
        return indicesCorretos.map(index => opcoes[index] || `Opção inválida (${index})`).join(', ');
    }
});