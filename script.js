// ==========================================
// 1. CONFIGURAÇÃO THREE.JS (ESTÉTICA RONYNN)
// ==========================================
const container = document.getElementById('webgl-container');

// Cena, Câmera e Renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// O Globo Wireframe
const sphereGeometry = new THREE.SphereGeometry(4, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x88ccff, 
    wireframe: true,
    transparent: true,
    opacity: 0.5
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
// Posiciona a esfera à direita, como no exemplo
sphere.position.set(5, 0, -5); 
scene.add(sphere);

// O Chão (Grid/Malha)
const gridHelper = new THREE.GridHelper(40, 40, 0x444488, 0x222255);
gridHelper.position.y = -4;
scene.add(gridHelper);

camera.position.z = 5;

// Animação e responsividade 3D
function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.002;
    sphere.rotation.x += 0.001;
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();


// ==========================================
// 2. LÓGICA DE DADOS (USUÁRIO + ORGANIZAÇÃO)
// ==========================================
const grid = document.getElementById('projects-grid');

// LISTA DE LIXO: Coloque aqui o nome exato dos repositórios que NÃO devem aparecer.
const EXCLUDE_REPOS = [
    'RyanVordek', 
    'RyanVordek.github.io'
]; 

async function fetchAllRepos() {
    try {
        // Dispara as duas chamadas simultaneamente para não perder tempo
        const [userResponse, orgResponse] = await Promise.all([
            fetch('https://api.github.com/users/RyanVordek/repos?per_page=100'),
            fetch('https://api.github.com/users/NarraLume-Project/repos?per_page=100')
        ]);

        const userData = userResponse.ok ? await userResponse.json() : [];
        const orgData = orgResponse.ok ? await orgResponse.json() : [];

        // Junta tudo em um único array
        let allRepos = [...userData, ...orgData];

        // Filtro implacável: remove forks e repositórios da lista de exclusão
        allRepos = allRepos.filter(repo => !repo.fork && !EXCLUDE_REPOS.includes(repo.name));

        // Ordena por data de atualização (mais recente primeiro)
        allRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        grid.innerHTML = ''; // Limpa a mensagem de carregamento

        if (allRepos.length === 0) {
            grid.innerHTML = '<div class="status-msg">Nenhum repositório válido encontrado.</div>';
            return;
        }

        allRepos.forEach(repo => {
            const card = document.createElement('a');
            card.className = 'project-item';
            card.href = repo.html_url;
            card.target = '_blank';

            const description = repo.description || 'Sem descrição. Você precisa documentar isso no GitHub.';
            const language = repo.language || 'Code';
            
            // Adiciona uma tag visual se o projeto for do NarraLume
            const ownerTag = repo.owner.login === 'NarraLume-Project' ? ' <b>[NarraLume]</b>' : '';

            card.innerHTML = `
                <div class="project-info">
                    <h3>${repo.name}${ownerTag}</h3>
                    <p>${description}</p>
                </div>
                <span class="tech-lang">${language}</span>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        grid.innerHTML = '<div class="status-msg">Erro crítico ao buscar dados do GitHub API.</div>';
    }
}

fetchAllRepos();
