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
    const personalRankingDiv = document.getElementById('personal-ranking');
    const botaoVoltar = document.getElementById('botao-voltar');
    const botaoImprimir = document.getElementById('botao-imprimir');

    let perguntas = [];
    let perguntaAtualIndex = 0;
    let respostasUsuario = [];

    areaPergunta.innerHTML = '<p class="text-center text-gray-500">Carregando simulado...</p>';
    areaOpcoes.innerHTML = '';

    const params = new URLSearchParams(window.location.search);
    const arquivoJSON = params.get('arquivo');
    const nomeCategoria = params.get('categoria');
    const numPerguntasParam = params.get('numPerguntas');
    const randomizarParam = params.get('randomizar');

    // console.log('Parâmetros da URL:', { arquivoJSON, nomeCategoria, numPerguntasParam, randomizarParam });

    if (tituloSimuladoH1 && nomeCategoria) {
        tituloSimuladoH1.textContent = `Simulado: ${decodeURIComponent(nomeCategoria)}`;
    } else if (tituloSimuladoH1) {
        tituloSimuladoH1.textContent = "Simulado AWS";
    }

    if (arquivoJSON) {
        // console.log(`Tentando carregar JSON: dados/${arquivoJSON}`);
        fetch(`dados/${arquivoJSON}`)
            .then(response => {
                // console.log('Resposta do fetch:', response);
                if (!response.ok) {
                    throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // console.log('Dados JSON recebidos:', data);
                if (!Array.isArray(data)) {
                    throw new Error("O arquivo JSON não contém um array de perguntas.");
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
                // console.log('Perguntas processadas:', perguntas);
                if (perguntas.length > 0) {
                    respostasUsuario = new Array(perguntas.length).fill(null);
                    mostrarPergunta(perguntaAtualIndex);
                } else {
                    areaPergunta.innerHTML = '<p class="text-red-500 font-bold">Nenhuma pergunta encontrada para este simulado com os critérios selecionados.</p>';
                    areaOpcoes.innerHTML = '';
                    botaoProxima.style.display = 'none';
                    botaoFinalizar.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Erro ao carregar simulado:', error);
                areaPergunta.innerHTML = `<p class="text-red-500 font-bold">Erro ao carregar o simulado: ${error.message}. Verifique se o arquivo JSON está na pasta 'dados' e no formato correto.</p>`;
                areaOpcoes.innerHTML = '';
                botaoProxima.style.display = 'none';
                botaoFinalizar.style.display = 'none';
            });
    } else {
        console.warn('Nenhum arquivo JSON especificado na URL.');
        areaPergunta.innerHTML = '<p class="text-red-500 font-bold">Nenhum simulado selecionado. Volte para a página inicial e escolha um.</p>';
        areaOpcoes.innerHTML = '';
        if (tituloSimuladoH1) tituloSimuladoH1.textContent = "Erro na Seleção";
        botaoProxima.style.display = 'none';
        botaoFinalizar.style.display = 'none';
    }

    function mostrarPergunta(index) {
        // console.log('Mostrando pergunta:', index, perguntas[index]);
        if (perguntas.length === 0) {
            areaPergunta.innerHTML = "<p class='text-red-500 font-bold'>Nenhuma pergunta disponível.</p>";
            areaOpcoes.innerHTML = '';
            botaoProxima.style.display = 'none';
            botaoFinalizar.style.display = 'none';
            return;
        }

        if (index < 0 || index >= perguntas.length) {
            console.error("Índice inválido:", index);
            areaPergunta.innerHTML = "<p class='text-red-500 font-bold'>Erro: Índice de pergunta inválido.</p>";
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
        try {
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
            // console.log('Respostas do usuário:', respostasUsuario);
        } catch (error) {
            console.error('Erro ao salvar resposta:', error);
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

    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    if (botaoImprimir) {
        botaoImprimir.addEventListener('click', () => {
            window.print();
        });
    }

    function calcularResultado() {
        try {
            let acertos = 0;
            feedbackRespostasDiv.innerHTML = '';
            const simuladoNome = decodeURIComponent(new URLSearchParams(window.location.search).get('categoria')) || "Desconhecido";

            if (perguntas.length === 0) {
                porcentagemAcertosP.textContent = "Nenhuma pergunta foi respondida.";
                areaPergunta.style.display = 'none';
                areaOpcoes.style.display = 'none';
                botaoProxima.style.display = 'none';
                botaoFinalizar.style.display = 'none';
                areaResultado.style.display = 'block';
                personalRankingDiv.innerHTML = '<p class="text-red-500">Nenhum resultado para comparar.</p>';
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
                    <hr />
                `;
                feedbackRespostasDiv.appendChild(divPerguntaFeedback);
            });

            const porcentagem = perguntas.length > 0 ? (acertos / perguntas.length) * 100 : 0;
            porcentagemAcertosP.textContent = `Você acertou ${acertos} de ${perguntas.length} perguntas (${acertos.toFixed(2)}%).`;

            // Salvar resultado no localStorage
            const resultado = {
                simulado: simuladoNome,
                pontuacao: porcentagem.toFixed(2),
                data: new Date().toLocaleString('pt-BR')
            };
            const chaveStorage = `simulado_${simuladoNome.replace(/\s/g, '_')}`;
            let historico = JSON.parse(localStorage.getItem(chaveStorage) || '[]');
            historico.push(resultado);
            localStorage.setItem(chaveStorage, JSON.stringify(historico));

            // Comparar com a última tentativa
            if (historico.length > 1) {
                const ultimaPontuacao = parseFloat(historico[historico.length - 2].pontuacao);
                const atualPontuacao = parseFloat(resultado.pontuacao);
                if (atualPontuacao > ultimaPontuacao) {
                    personalRankingDiv.innerHTML = `<p class="improved">Parabéns! Você melhorou em relação à última tentativa (${atualPontuacao}% vs ${ultimaPontuacao}%).</p>`;
                } else if (atualPontuacao === ultimaPontuacao) {
                    personalRankingDiv.innerHTML = `<p>Mesmo desempenho da última vez (${atualPontuacao}%). Tente melhorar!</p>`;
                } else {
                    personalRankingDiv.innerHTML = `<p class="no-improvement">Sua pontuação caiu (${atualPontuacao}% vs ${ultimaPontuacao}%). Tente novamente!</p>`;
                }
            } else {
                personalRankingDiv.innerHTML = `<p>Primeira tentativa! Sua pontuação: ${resultado.pontuacao}%.</p>`;
            }

            areaPergunta.style.display = 'none';
            areaOpcoes.style.display = 'none';
            botaoProxima.style.display = 'none';
            botaoFinalizar.style.display = 'none';
            areaResultado.style.display = 'block';
        } catch (error) {
            console.error('Erro ao calcular resultado:', error);
            personalRankingDiv.innerHTML = '<p class="text-red-500">Erro ao processar resultado.</p>';
        }
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