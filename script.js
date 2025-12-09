// ==========================================
// 1. CARREGAMENTO DE DADOS
// ==========================================

let stories = [];
let drawings = [];
let quizzes = [];

Promise.all([
    fetch('stories.json').then(r => r.json()),
    fetch('drawings.json').then(r => r.json()),
    fetch('quizzes.json').then(r => r.json())
]).then(([storiesData, drawingsData, quizzesData]) => {
    stories = storiesData;
    drawings = drawingsData;
    quizzes = quizzesData;
    initApp();
}).catch(err => console.error('Erro ao carregar dados:', err));

let favorites = [];
try { favorites = JSON.parse(localStorage.getItem('biblia_favorites')) || []; } catch (e) { favorites = []; }

let progress = { storiesRead: [], quizCorrect: 0, totalTime: 0 };
try {
    const saved = JSON.parse(localStorage.getItem('biblia_progress'));
    if (saved && Array.isArray(saved.storiesRead)) progress = saved;
} catch (e) {}

let currentStory = null;
let currentQuiz = null;
let readingStartTime = null;
let audio = null;

// ==========================================
// 2. INICIALIZAÇÃO
// ==========================================

function initApp() {
    renderStories();
    renderFavorites();
    renderColoringGallery();
    renderQuizzes();
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
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`${section}-section`).classList.add('active');
    const navItem = document.querySelector(`.nav-item[onclick="showSection('${section}')"]`);
    if(navItem) navItem.classList.add('active');
    
    if (section === 'quizzes') renderQuizzes();
    if (section === 'progress') { updateProgress(); checkBadges(); }
}

// ==========================================
// 3. RENDERIZAÇÃO (ATUALIZADA PARA IMAGENS)
// ==========================================

function renderStories() {
    const grid = document.getElementById('stories-grid');
    grid.innerHTML = stories.map(story => `
        <div class="story-card" onclick="openStory(${story.id})">
            <img src="${story.cover}" alt="${story.title}" class="story-card-image" loading="lazy">
            
            <span class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${story.id})">
                ${favorites.includes(story.id) ? '<i class="fa-solid fa-star" style="color:gold"></i>' : '<i class="fa-regular fa-star"></i>'}
            </span>

            <div class="story-card-content">
                <div class="story-title">${story.title}</div>
                <div class="story-meta">
                    <span class="story-ref">${story.bibleRef || 'Bíblia'}</span>
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
            <div class="story-card" onclick="openStory(${story.id})">
                <img src="${story.cover}" alt="${story.title}" class="story-card-image" loading="lazy">
                <span class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${story.id})">
                    <i class="fa-solid fa-star" style="color:gold"></i>
                </span>
                <div class="story-card-content">
                    <div class="story-title">${story.title}</div>
                    <div class="story-meta">
                        <span class="story-ref">${story.bibleRef || 'Bíblia'}</span>
                        <span><i class="fa-regular fa-clock"></i> ${story.duration}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function renderQuizzes() {
    const grid = document.getElementById('quizzes-grid');
    grid.innerHTML = quizzes.map(quiz => {
        const isDone = progress.storiesRead.includes(quiz.id + '-quiz');
        return `
        <div class="story-card" onclick="openQuiz(${quiz.id})" style="border-bottom: 5px solid ${isDone ? '#2ecc71' : '#ccc'}; padding:15px; text-align:center;">
            <div style="font-size: 3em;">🧩</div>
            <div class="story-title" style="text-align:center; margin-top:10px;">${quiz.title}</div>
            <div style="margin-top:10px; font-size:1.5em;">
                ${isDone ? '<i class="fa-solid fa-circle-check" style="color:#2ecc71"></i>' : '<i class="fa-regular fa-circle-question" style="color:#ccc"></i>'}
            </div>
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
// 4. LEITOR E QUIZ
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
        
        <h2 style="text-align:center; color:#667eea; margin-bottom:5px;">${currentStory.title}</h2>
        <p style="text-align:center; color:#888; margin-bottom:20px; font-size:0.9em;">
            <i class="fa-solid fa-book-bible"></i> ${currentStory.bibleRef || 'História Bíblica'}
        </p>

        <div class="story-content">${paragraphs}</div>
        
        <div style="text-align:center; margin-top:40px;">
            <button onclick="goToQuizFromStory(${currentStory.id})" style="background:var(--accent); border:none; padding:15px 30px; border-radius:30px; font-weight:bold; cursor:pointer; font-size:1.1em; box-shadow:0 5px 15px rgba(0,0,0,0.2);">
                <i class="fa-solid fa-puzzle-piece"></i> Ir para o Quiz
            </button>
        </div>
    `;

    document.getElementById('story-reader').scrollTop = 0;
    document.getElementById('story-reader').style.display = 'block';
}

function closeReader() {
    document.getElementById('story-reader').style.display = 'none';
    if (audio) { speechSynthesis.cancel(); audio = null; document.getElementById('audio-btn').innerHTML = '<i class="fa-solid fa-play"></i> Ouvir'; }
    
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

function goToQuizFromStory(storyId) {
    closeReader();
    const quiz = quizzes.find(q => q.storyId === storyId);
    if(quiz) openQuiz(quiz.id);
    else showSection('quizzes');
}

function openQuiz(id) {
    currentQuiz = quizzes.find(q => q.id === id);
    if (!currentQuiz) return;

    document.getElementById('quiz-content').innerHTML = `
        <div style="font-size: 4em; margin-bottom: 10px;">🧩</div>
        <h2 style="color:#667eea; margin-bottom: 20px;">${currentQuiz.title}</h2>
        <div class="quiz-question">${currentQuiz.question}</div>
        <div class="quiz-options">
            ${currentQuiz.options.map((opt, i) => `<div class="quiz-option" onclick="checkAnswer(${i})">${opt}</div>`).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-feedback"></div>
    `;
    document.getElementById('quiz-modal').style.display = 'block';
}

function closeQuiz() {
    document.getElementById('quiz-modal').style.display = 'none';
    showSection('quizzes');
}

function checkAnswer(selectedIndex) {
    const feedback = document.getElementById('quiz-feedback');
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((opt, i) => {
        opt.onclick = null; opt.style.cursor = 'default';
        if (i === currentQuiz.correct) opt.classList.add('correct');
        else if (i === selectedIndex) opt.classList.add('incorrect');
    });
    if (selectedIndex === currentQuiz.correct) {
        feedback.textContent = 'Parabéns! Você acertou! 🎉'; feedback.style.color = '#27ae60';
        const qid = currentQuiz.id + '-quiz';
        if (!progress.storiesRead.includes(qid)) {
            progress.quizCorrect++; progress.storiesRead.push(qid);
            saveProgress(); checkBadges(); updateProgress();
        }
    } else {
        feedback.textContent = 'Ops! Tente novamente.'; feedback.style.color = '#c0392b';
    }
}

function toggleAudio() {
    const btn = document.getElementById('audio-btn');
    if (audio) { speechSynthesis.cancel(); audio = null; btn.innerHTML = '<i class="fa-solid fa-play"></i> Ouvir'; return; }
    const text = currentStory.content.join(' ');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.onend = () => { audio = null; btn.innerHTML = '<i class="fa-solid fa-play"></i> Ouvir'; };
    speechSynthesis.speak(utterance); audio = utterance; btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar';
}

// ==========================================
// 5. PROGRESSO E PINTURA
// ==========================================

function updateProgress() {
    const storiesCount = progress.storiesRead.filter(id => typeof id === 'number').length;
    document.getElementById('stories-read').textContent = storiesCount;
    document.getElementById('quiz-correct').textContent = progress.quizCorrect;
}

function checkBadges() {
    const readCount = progress.storiesRead.filter(id => typeof id === 'number').length;
    const badges = [
        { id: 'badge-1', condition: readCount >= 1 },
        { id: 'badge-2', condition: readCount >= 5 },
        { id: 'badge-3', condition: readCount >= 10 },
        { id: 'badge-4', condition: progress.quizCorrect >= 5 },
        { id: 'badge-5', condition: progress.totalTime >= 30 }
    ];
    badges.forEach(b => {
        const el = document.getElementById(b.id);
        if (el && b.condition && !el.classList.contains('earned')) el.classList.add('earned');
    });
}

function saveProgress() { localStorage.setItem('biblia_progress', JSON.stringify(progress)); }

let currentDrawingIndex = null;
let ctx = null;
let currentColor = [231, 76, 60];

function renderColoringGallery() {
    const gallery = document.getElementById('coloring-gallery');
    if(!drawings.length) return;
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