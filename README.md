
# Simulado AWS

Bem-vindo ao **Simulado AWS**, um sistema web para prática de questões preparatórias para certificações AWS, como Practitioner, Solutions Architect e Developer Associate. Este projeto permite configurar simulados com número variável de perguntas, randomização de ordem e feedback detalhado com explicações, além de uma interface moderna e responsiva.

O projeto está hospedado no GitHub Pages em [https://marcelosanto.github.io](https://marcelosanto.github.io).

## Funcionalidades

-   **Seleção de Simulados**: Escolha entre categorias para AWS Practitioner.
-   **Configuração Personalizada**: Defina o número de perguntas e ative/desative a randomização.
-   **Interface Interativa**: Responda perguntas com opções de escolha única (radio) ou múltipla (checkbox), com clique em qualquer parte da opção para selecionar.
-   **Feedback Detalhado**: Veja resultados com porcentagem de acertos, respostas corretas e explicações.
-   **Navegação Intuitiva**: Botões para avançar, finalizar, voltar à página inicial e imprimir resultados.
-   **Design Moderno**: Interface responsiva com Tailwind CSS, transições suaves e suporte a acessibilidade (atributos ARIA).

## Tecnologias Utilizadas

-   **HTML5**: Estrutura das páginas (`index.html`, `simulado.html`, `configurar_simulado.html`).
-   **CSS**: Tailwind CSS (via CDN) com personalizações para a identidade visual da AWS.
-   **JavaScript**: Lógica para carregar perguntas de arquivos JSON, gerenciar respostas e exibir resultados.
-   **Font Awesome**: Ícones para botões e elementos visuais.
-   **GitHub Pages**: Hospedagem do site.

## Estrutura do Projeto

```
marcelosanto.github.io/
├── dados/
│   ├── cobrança_precos_suporte.json
│   ├── conceitos_nuvem.json
│   ├── seguranca_conformidade.json
│   └── tecnologia_servicos.json
├── estilos.css
├── script.js
├── index.html
├── simulado.html
├── configurar_simulado.html
└── README.md

```

-   **`dados/`**: Contém os arquivos JSON com as perguntas dos simulados.
-   **`estilos.css`**: Estilos personalizados com Tailwind CSS.
-   **`script.js`**: Lógica para carregar perguntas, gerenciar respostas e calcular resultados.
-   **`index.html`**: Página inicial com a lista de simulados.
-   **`simulado.html`**: Interface do simulado com perguntas, opções e resultados.
-   **`configurar_simulado.html`**: Página para configurar o número de perguntas e randomização.

## Como Executar

### Pré-requisitos

-   Um navegador moderno (Chrome, Firefox, Edge, etc.).
-   Acesso à internet para carregar Tailwind CSS e Font Awesome via CDN.
-   Um servidor local (opcional) para testes locais (ex.: `Live Server` no VS Code).

### Passos para Executar Localmente

1.  **Clonar o Repositório**:
    
    ```bash
    git clone https://github.com/marcelosanto/marcelosanto.github.io.git
    cd marcelosanto.github.io
    
    ```
    
2.  **Verificar Arquivos JSON**:
    
    -   Certifique-se de que a pasta `dados/` contém os arquivos JSON (ex.: `cobrança_precos_suporte.json`, `conceitos_nuvem.json`, `seguranca_conformidade.json`).
    -   Cada arquivo JSON deve ter o seguinte formato:
        
        ```json
        [
            {
                "text": "Texto da pergunta",
                "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
                "correctAnswers": [0], // Índices das opções corretas
                "explanation": "Explicação da resposta."
            },
            ...
        ]
        
        ```
        
3.  **Iniciar um Servidor Local**:
    
    -   Use uma extensão como `Live Server` no VS Code ou execute:
        
        ```bash
        python -m http.server 8000
        
        ```
        
    -   Acesse `http://localhost:8000` no navegador.
4.  **Testar o Simulado**:
    
    -   Abra `index.html`, escolha um simulado (ex.: AWS Practitioner).
    -   Configure o simulado em `configurar_simulado.html` (opcional).
    -   Responda às perguntas em `simulado.html`, veja os resultados e use os botões "Voltar" ou "Imprimir".

### Hospedagem no GitHub Pages

O projeto está configurado para rodar no GitHub Pages:

-   Acesse [https://marcelosanto.github.io](https://marcelosanto.github.io) para ver a página inicial.
-   Certifique-se de que a pasta `dados/` e os arquivos JSON estão no repositório.

## Como Usar

1.  **Escolher um Simulado**:
    
    -   Na página inicial (`index.html`), clique em um dos simulados disponíveis.
    -   Você será redirecionado para `configurar_simulado.html`.
2.  **Configurar o Simulado**:
    
    -   Insira o número de perguntas desejado (ou deixe em branco para todas).
    -   Marque a opção para randomizar as perguntas, se desejar.
    -   Clique em "Iniciar Simulado" para ir para `simulado.html`.
3.  **Responder Perguntas**:
    
    -   Clique em qualquer parte da opção (texto ou área ao redor) para marcar/desmarcar radio ou checkbox.
    -   Use "Próxima Pergunta" para avançar ou "Finalizar Simulado" para ver os resultados.
4.  **Ver Resultados**:
    
    -   Veja a porcentagem de acertos, respostas corretas e explicações.
    -   Use o botão "Voltar para Início" para retornar a `index.html`.
    -   Use o botão "Imprimir Resultados" para imprimir apenas a área de resultados.

## Resolução de Problemas

-   **Perguntas não aparecem**:
    
    -   Verifique o console do navegador (F12, aba "Console") para erros.
    -   Confirme que o arquivo JSON (ex.: `dados/practitioner.json`) existe e está no formato correto.
    -   Certifique-se de que a URL de `simulado.html` contém os parâmetros corretos (ex.: `simulado.html?arquivo=practitioner.json&categoria=Practitioner`).
    -   Teste localmente com um servidor para evitar problemas de caminhos relativos.
-   **Estilos não carregam**:
    
    -   Confirme que `estilos.css` está no diretório raiz.
    -   Verifique a conexão com a internet para carregar Tailwind CSS e Font Awesome via CDN.
-   **Botões não funcionam**:
    
    -   Certifique-se de que `script.js` está carregado (verifique o `<script>` em `simulado.html`).
    -   Confira o console para erros de JavaScript.

## Contribuições

Contribuições são bem-vindas! Para sugerir melhorias:

1.  Fork o repositório.
2.  Crie uma branch (`git checkout -b feature/nova-funcionalidade`).
3.  Faça commit das alterações (`git commit -m "Adiciona nova funcionalidade"`).
4.  Envie um pull request.

## Licença

Este projeto é licenciado sob a MIT License.

## Contato

Desenvolvido por Marcelo Santo. Para dúvidas ou sugestões, abra uma issue no repositório ou entre em contato via [GitHub](https://github.com/marcelosanto).
