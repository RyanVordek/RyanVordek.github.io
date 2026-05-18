// CONFIGURAÇÃO DO FUNDO INTERATIVO (SISTEMA DE PARTÍCULAS)
const canvas = document.getElementById('cosmic-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const mouse = { x: null, y: null, radius: 150 };

// Ajusta o tamanho do canvas ao ecrã
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2 + 1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 190, 254, 0.5)';
        ctx.fill();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Reposiciona se sair das bordas
        if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

        // Interação com o Rato (Efeito gravidade suave)
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= dx * force * 0.02;
            this.y -= dy * force * 0.02;
        }
    }
}

function initParticles() {
    particles = [];
    // Quantidade de partículas baseada na largura do ecrã para evitar lentidão
    const quantity = Math.floor((canvas.width * canvas.height) / 9000);
    for (let i = 0; i < Math.min(quantity, 120); i++) {
        particles.push(new Particle());
    }
}

function drawLines() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                let opacity = (1 - (distance / 100)) * 0.15;
                ctx.strokeStyle = `rgba(180, 190, 254, ${opacity})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    drawLines();
    requestAnimationFrame(animate);
}

// Ouvintes de Eventos do Rato
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

window.addEventListener('resize', resizeCanvas);


// CONSUMO DA API DO GITHUB (FOCADO EM PERFORMANCE)
const GITHUB_USERNAME = 'RyanVordek';
const grid = document.getElementById('projects-grid');

// Filtro explícito para só mostrar os teus projetos reais e evitar lixo/testes
const EXCLUDE_REPOS = []; 

async function fetchGitHubRepos() {
    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30`);
        if (!response.ok) throw new Error('Falha ao comunicar com a API do GitHub');
        
        const data = await response.ok ? await response.json() : [];
        grid.innerHTML = ''; // Limpa a mensagem de carregamento

        // Filtra repositórios clonados (forks) ou intencionalmente escondidos
        const validRepos = data.filter(repo => !repo.fork && !EXCLUDE_REPOS.includes(repo.name));

        if (validRepos.length === 0) {
            grid.innerHTML = '<div class="status-msg">Nenhum repositório público encontrado.</div>';
            return;
        }

        validRepos.forEach(repo => {
            const card = document.createElement('a');
            card.className = 'project-card';
            card.href = repo.html_url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';

            // Garante que descrições nulas fiquem limpas
            const description = repo.description ? repo.description : 'Sem descrição disponível de momento.';
            const language = repo.language ? repo.language : 'Script';

            card.innerHTML = `
                <div>
                    <div class="project-title">${repo.name}</div>
                    <p class="project-desc">${description}</p>
                </div>
                <div class="project-meta">
                    <span class="tech-lang">${language}</span>
                    <span class="stars">★ ${repo.stargazers_count}</span>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        grid.innerHTML = '<div class="status-msg">Erro ao carregar os projetos através do GitHub API. Verifica a tua ligação.</div>';
    }
}

// Inicialização síncrona dos motores
resizeCanvas();
animate();
fetchGitHubRepos();