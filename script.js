// ==========================================
// 1. CARREGAMENTO E PREPARAÇÃO DE DADOS
// ==========================================

let stories = [];
let drawings = [];
let quizzes = [];

// Carrega os arquivos
Promise.all([
    fetch('historias_app.json').then(r => r.json()), // JSON gerado pelo Python
    fetch('drawings.json?v=' + new Date().getTime()).then(r => r.json()),
    fetch('quizzes.json').then(r => r.json())
]).then(([storiesData, drawingsData, quizzesData]) => {
    
    // --- ADAPTAÇÃO DE DADOS (A PONTE) ---
    // Transforma o JSON do Python no formato que o App usa
    stories = storiesData.map(s => ({
        id: s.id,                           // UUID
        title: s.titulo,                    // Mapeia 'titulo' para 'title'
        cover: s.url_imagem_capa,           // Mapeia 'url_imagem_capa' para 'cover'
        duration: s.duracao_estimada,       // Duração texto
        audioSrc: s.caminho_audio,          // Caminho do arquivo de áudio real
        // Transforma o texto corrido em lista de parágrafos
        content: s.texto.split('\n').filter(p => p.trim() !== '') 
    }));

    drawings = drawingsData;
    quizzes = quizzesData; 
    
    initApp();
}).catch(err => console.error('Erro ao carregar dados. Verifique os arquivos JSON:', err));

// --- ESTADOS (Favoritos e Progresso) ---
let favorites = [];
try { favorites = JSON.parse(localStorage.getItem('biblia_favorites')) || []; } catch (e) { favorites = []; }

let progress = { storiesRead: [], quizCorrect: 0, totalTime: 0 };
try {
    const saved = JSON.parse(localStorage.getItem('biblia_progress'));
    if (saved && Array.isArray(saved.storiesRead)) progress = saved;
} catch (e) {}

// Variáveis de Controle
let currentStory = null;
let currentQuiz = null;
let currentQuestionIndex = 0;
let currentQuizScore = 0;
let readingStartTime = null;
let audioPlayer = null; // Player de áudio real

// ==========================================
// 2. INICIALIZAÇÃO E NAVEGAÇÃO
// ==========================================

function initApp() {
    renderStories();
    renderFavorites();
    renderColoringGallery();
    renderQuizzes(); // Renderiza a aba de desafios
    updateProgress();
    checkBadges();
    initColorButtons();
}

function initColorButtons() {
    document.querySelectorAll('.color-btn').forEach(btn => {
        if (btn.dataset.color) btn.style.backgroundColor = btn.dataset.color;
    });
}

function showSection(section) {
    // Esconde tudo
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // Mostra a seção desejada
    document.getElementById(`${section}-section`).classList.add('active');
    const navItem = document.querySelector(`.nav-item[onclick="showSection('${section}')"]`);
    if(navItem) navItem.classList.add('active');
    
    // Se sair da tela de histórias, para o áudio
    if (section !== 'stories') stopAudio();
    
    // Atualizações específicas
    if (section === 'quizzes') renderQuizzes();
    if (section === 'progress') { updateProgress(); checkBadges(); }
}

// ==========================================
// 3. RENDERIZAÇÃO (Histórias, Favoritos e Quizzes)
// ==========================================

function renderStories() {
    const grid = document.getElementById('stories-grid');
    grid.innerHTML = stories.map(story => `
        <div class="story-card" onclick="openStory('${story.id}')">
            <img src="${story.cover}" alt="${story.title}" class="story-card-image" loading="lazy">
            <span class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite('${story.id}')">
                ${favorites.includes(story.id) ? '<i class="fa-solid fa-star" style="color:gold"></i>' : '<i class="fa-regular fa-star"></i>'}
            </span>
            <div class="story-card-content">
                <div class="story-title">${story.title}</div>
                <div class="story-meta">
                    <span class="story-ref">História</span>
                    <span><i class="fa-regular fa-clock"></i> ${story.duration}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderFavorites() {
    const grid = document.getElementById('favorites-grid');
    const favoriteStories = stories.filter(s => favorites.includes(s.id));
    
    if (favoriteStories.length === 0) {
        grid.innerHTML = '<p style="color:white; grid-column:1/-1; text-align:center;">Sem favoritos ainda!</p>';
    } else {
        grid.innerHTML = favoriteStories.map(story => `
            <div class="story-card" onclick="openStory('${story.id}')">
                <img src="${story.cover}" alt="${story.title}" class="story-card-image" loading="lazy">
                <span class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite('${story.id}')">
                    <i class="fa-solid fa-star" style="color:gold"></i>
                </span>
                <div class="story-card-content">
                    <div class="story-title">${story.title}</div>
                </div>
            </div>
        `).join('');
    }
}

function renderQuizzes() {
    const grid = document.getElementById('quizzes-grid');
    
    if (!quizzes || quizzes.length === 0) {
        grid.innerHTML = '<p style="color:white; grid-column:1/-1; text-align:center;">Carregando desafios...</p>';
        return;
    }

    grid.innerHTML = quizzes.map(quiz => {
        // Verifica se completou (Chave única ID + sufixo)
        const quizKey = quiz.id + '-quiz-completed';
        const isDone = progress.storiesRead.includes(quizKey);
        
        const statusIcon = isDone 
            ? '<i class="fa-solid fa-medal" style="color:gold; font-size:1.5em;"></i>' 
            : '<i class="fa-regular fa-circle-play" style="color:#667eea; font-size:1.5em;"></i>';
        const borderStyle = isDone ? '5px solid #2ecc71' : '1px solid #eee';

        return `
        <div class="story-card" onclick="openQuiz('${quiz.id}')" style="border-bottom: ${borderStyle}; padding:15px; text-align:center; display:block;">
            <div style="font-size: 3em; margin-bottom:10px;">🧩</div>
            <div class="story-title" style="text-align:center; margin-bottom:10px;">${quiz.title}</div>
            <div style="margin-top:auto;">${statusIcon}</div>
        </div>
    `}).join('');
}

function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    index > -1 ? favorites.splice(index, 1) : favorites.push(id);
    localStorage.setItem('biblia_favorites', JSON.stringify(favorites));
    renderStories();
    renderFavorites();
}

// ==========================================
// 4. LEITOR DE HISTÓRIA E ÁUDIO PLAYER
// ==========================================

function openStory(id) {
    currentStory = stories.find(s => s.id === id);
    if (!currentStory) return;

    if (!progress.storiesRead.includes(id)) {
        progress.storiesRead.push(id);
        saveProgress();
        checkBadges();
    }

    readingStartTime = Date.now();
    
    let paragraphs = currentStory.content.map(p => `<p>${p}</p>`).join('');
    
    document.getElementById('story-reader-content').innerHTML = `
        <div class="story-illustration">
            <img src="${currentStory.cover}" alt="${currentStory.title}">
        </div>
        
        <h2 style="text-align:center; color:#667eea; margin-bottom:10px;">${currentStory.title}</h2>
        
        <div style="text-align:center; margin-bottom:20px; color:#2ecc71; font-weight:bold; font-size:0.9em;">
            <i class="fa-solid fa-headphones"></i> Narração disponível!
        </div>

        <div class="story-content">${paragraphs}</div>
        
        <div style="text-align:center; margin-top:40px;">
            <button onclick="tryGoToQuiz('${currentStory.id}')" style="background:var(--accent); border:none; padding:15px 30px; border-radius:30px; font-weight:bold; cursor:pointer; font-size:1.1em; box-shadow:0 5px 15px rgba(0,0,0,0.2);">
                <i class="fa-solid fa-puzzle-piece"></i> Ir para o Quiz
            </button>
        </div>
    `;

    document.getElementById('story-reader').scrollTop = 0;
    document.getElementById('story-reader').style.display = 'block';
}

function closeReader() {
    document.getElementById('story-reader').style.display = 'none';
    stopAudio();
    
    if (readingStartTime) {
        const timeSpent = Math.round((Date.now() - readingStartTime) / 60000);
        if (timeSpent > 0) {
            progress.totalTime += timeSpent;
            saveProgress();
            updateProgress();
            checkBadges();
        }
    }
    showSection('stories');
}

function tryGoToQuiz(storyId) {
    // Tenta encontrar um quiz que tenha o storyId igual ao ID da história
    const quiz = quizzes.find(q => q.storyId === storyId);
    
    closeReader();
    if (quiz) {
        openQuiz(quiz.id);
    } else {
        // Se não achar direto, leva para a lista
        alert("Quiz não encontrado para esta história específica. Veja a lista completa!");
        showSection('quizzes');
    }
}

// --- PLAYER DE ÁUDIO REAL ---
function toggleAudio() {
    const btn = document.getElementById('audio-btn');

    // 1. Pausa
    if (audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Ouvir';
        return;
    }

    // 2. Retoma
    if (audioPlayer && audioPlayer.paused) {
        audioPlayer.play();
        btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar';
        return;
    }

    // 3. Novo Player
    if (currentStory.audioSrc) {
        audioPlayer = new Audio(currentStory.audioSrc);
        
        audioPlayer.play()
            .then(() => {
                btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar';
            })
            .catch(e => {
                console.error("Erro áudio:", e);
                alert("Não foi possível tocar o áudio. Verifique a pasta 'audios'.");
            });

        audioPlayer.onended = () => {
            btn.innerHTML = '<i class="fa-solid fa-play"></i> Ouvir';
            audioPlayer = null;
        };
    } else {
        alert("Áudio não disponível.");
    }
}

function stopAudio() {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer = null;
        const btn = document.getElementById('audio-btn');
        if(btn) btn.innerHTML = '<i class="fa-solid fa-play"></i> Ouvir';
    }
}

// ==========================================
// 5. SISTEMA DE QUIZ (10 Perguntas)
// ==========================================

function openQuiz(id) {
    currentQuiz = quizzes.find(q => q.id === id);
    if (!currentQuiz) return;

    // Reseta estado
    currentQuestionIndex = 0;
    currentQuizScore = 0;

    renderQuestion();
    document.getElementById('quiz-modal').style.display = 'block';
}

function renderQuestion() {
    const questionObj = currentQuiz.questions[currentQuestionIndex];
    const total = currentQuiz.questions.length;
    const current = currentQuestionIndex + 1;
    const progressPct = ((current - 1) / total) * 100;
    
    document.getElementById('quiz-content').innerHTML = `
        <div style="width:100%; height:10px; background:#eee; border-radius:5px; margin-bottom:20px; overflow:hidden;">
            <div style="width:${progressPct}%; height:100%; background:#2ecc71; transition:0.3s;"></div>
        </div>
        <div style="font-size: 0.9em; color:#888; margin-bottom:5px;">Pergunta ${current} de ${total}</div>
        <h3 style="color:#667eea; margin-bottom: 20px;">${questionObj.q}</h3>
        <div class="quiz-options">
            ${questionObj.options.map((opt, i) => `
                <div class="quiz-option" onclick="checkAnswer(${i})">${opt}</div>
            `).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-feedback"></div>
        <div id="next-btn-container" style="margin-top:20px; display:none;">
            <button onclick="nextQuestion()" style="background:var(--primary); color:white; border:none; padding:12px 30px; border-radius:25px; font-weight:bold; cursor:pointer;">
                Próxima <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
    `;
}

function checkAnswer(selectedIndex) {
    const questionObj = currentQuiz.questions[currentQuestionIndex];
    const feedback = document.getElementById('quiz-feedback');
    const options = document.querySelectorAll('.quiz-option');

    options.forEach((opt, i) => {
        opt.onclick = null;
        opt.style.cursor = 'default';
        if (i === questionObj.correct) opt.classList.add('correct');
        else if (i === selectedIndex) opt.classList.add('incorrect');
    });

    if (selectedIndex === questionObj.correct) {
        currentQuizScore++;
        feedback.innerHTML = '<span style="color:#2ecc71; font-weight:bold;">Acertou! 🎉</span>';
        progress.quizCorrect++;
        updateProgress();
    } else {
        feedback.innerHTML = `<span style="color:#c0392b;">A certa era: <b>${questionObj.options[questionObj.correct]}</b></span>`;
    }
    
    document.getElementById('next-btn-container').style.display = 'block';
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuiz.questions.length) {
        renderQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    const total = currentQuiz.questions.length;
    let message = "", icon = "", color = "";
    
    if (currentQuizScore === total) { message = "Perfeito!"; icon = "🏆"; color = "#f1c40f"; }
    else if (currentQuizScore >= 7) { message = "Muito bem!"; icon = "🌟"; color = "#2ecc71"; }
    else { message = "Continue treinando!"; icon = "📚"; color = "#e67e22"; }

    const quizKey = currentQuiz.id + '-quiz-completed';
    if (!progress.storiesRead.includes(quizKey)) {
        progress.storiesRead.push(quizKey);
        saveProgress();
        checkBadges();
    }

    document.getElementById('quiz-content').innerHTML = `
        <div style="font-size: 5em; margin-bottom: 20px; animation: pop 0.5s;">${icon}</div>
        <h2 style="color:${color};">Quiz Finalizado!</h2>
        <div style="font-size:1.5em; margin:20px 0; padding:20px; background:#f8f9fa; border-radius:15px;">
            Nota: <strong style="color:${color}">${currentQuizScore}</strong> / ${total}
        </div>
        <p>${message}</p>
        <button onclick="closeQuiz()" style="background:var(--secondary); color:white; border:none; padding:15px 40px; border-radius:30px; margin-top:20px; cursor:pointer; font-weight:bold;">Voltar</button>
    `;
    renderQuizzes(); // Atualiza a lista para mostrar medalha
}

function closeQuiz() {
    document.getElementById('quiz-modal').style.display = 'none';
    showSection('quizzes');
}

// ==========================================
// 6. PROGRESSO E BADGES
// ==========================================

function updateProgress() {
    // Conta IDs únicos que não terminam com '-quiz-completed' (histórias)
    const storiesCount = progress.storiesRead.filter(id => !id.includes('-quiz-completed')).length;
    document.getElementById('stories-read').textContent = storiesCount;
    document.getElementById('quiz-correct').textContent = progress.quizCorrect;
}

function checkBadges() {
    const readCount = progress.storiesRead.filter(id => !id.includes('-quiz-completed')).length;
    const badges = [
        { id: 'badge-1', condition: readCount >= 1 },
        { id: 'badge-2', condition: readCount >= 5 },
        { id: 'badge-3', condition: readCount >= 10 },
        { id: 'badge-4', condition: progress.quizCorrect >= 50 }, // Exemplo: 50 acertos totais
        { id: 'badge-5', condition: progress.totalTime >= 30 }
    ];
    badges.forEach(b => {
        const el = document.getElementById(b.id);
        if (el && b.condition && !el.classList.contains('earned')) el.classList.add('earned');
    });
}

function saveProgress() { localStorage.setItem('biblia_progress', JSON.stringify(progress)); }

// ==========================================
// 7. PINTURA (Flood Fill)
// ==========================================

let currentDrawingIndex = null;
let ctx = null;
let currentColor = [231, 76, 60];

function renderColoringGallery() {
    const gallery = document.getElementById('coloring-gallery');
    if (!drawings.length) return;
    gallery.innerHTML = drawings.map((d, i) => `
        <div class="drawing-card" onclick="openColoring(${i})">
            <img src="${d.url}" alt="${d.title}" loading="lazy">
            <div class="drawing-title">${d.title}</div>
        </div>
    `).join('');
}

function openColoring(index) {
    currentDrawingIndex = index;
    const drawingData = drawings[index];
    document.getElementById('coloring-screen').classList.add('active');
    const canvas = document.getElementById('coloring-canvas');
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const savedImage = localStorage.getItem(`saved_drawing_${drawingData.id}`);
    if (savedImage) {
        const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = savedImage;
    } else {
        loadTemplate(drawingData.url);
    }
}

function loadTemplate(url) {
    const img = new Image();
    if (url.startsWith('http')) img.crossOrigin = "Anonymous";
    img.onload = () => {
        const canvas = document.getElementById('coloring-canvas');
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.90;
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    };
    img.src = url;
}

function closeColoring() {
    saveDrawingState(); document.getElementById('coloring-screen').classList.remove('active');
}

function saveDrawingState() {
    if (currentDrawingIndex === null) return;
    const canvas = document.getElementById('coloring-canvas');
    try { localStorage.setItem(`saved_drawing_${drawings[currentDrawingIndex].id}`, canvas.toDataURL()); } catch (e) {}
}

function clearCanvas() {
    if (confirm('Apagar tudo?')) {
        localStorage.removeItem(`saved_drawing_${drawings[currentDrawingIndex].id}`);
        loadTemplate(drawings[currentDrawingIndex].url);
    }
}

document.querySelectorAll('.color-btn[data-color]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
        const hex = btn.dataset.color;
        const bigint = parseInt(hex.replace('#', ''), 16);
        currentColor = [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    });
});

const canvas = document.getElementById('coloring-canvas');
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('touchstart', handleCanvasClick, {passive: false});

function handleCanvasClick(e) {
    if (e.type === 'touchstart') e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);
    floodFill(x, y, currentColor, 60);
}

function floodFill(startX, startY, newColor, tolerance) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = canvas.width; const height = canvas.height;
    const startPos = (startY * width + startX) * 4;
    const startR = pixels[startPos], startG = pixels[startPos+1], startB = pixels[startPos+2];
    if (colorsMatch(startR, startG, startB, newColor[0], newColor[1], newColor[2], 0)) return;
    if (startR < 50 && startG < 50 && startB < 50) return;
    const stack = [startPos];
    const seen = new Uint8Array(pixels.length / 4);
    while (stack.length) {
        const pos = stack.pop();
        const pixelIndex = pos / 4;
        if (seen[pixelIndex]) continue; seen[pixelIndex] = 1;
        const r = pixels[pos], g = pixels[pos+1], b = pixels[pos+2];
        if (colorsMatch(r, g, b, startR, startG, startB, tolerance)) {
            pixels[pos] = newColor[0]; pixels[pos+1] = newColor[1]; pixels[pos+2] = newColor[2]; pixels[pos+3] = 255;
            const x = pixelIndex % width; const y = Math.floor(pixelIndex / width);
            if (x > 0) stack.push(pos - 4); if (x < width - 1) stack.push(pos + 4);
            if (y > 0) stack.push(pos - width * 4); if (y < height - 1) stack.push(pos + width * 4);
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function colorsMatch(r1, g1, b1, r2, g2, b2, tolerance) {
    return Math.abs(r1 - r2) <= tolerance && Math.abs(g1 - g2) <= tolerance && Math.abs(b1 - b2) <= tolerance;
}