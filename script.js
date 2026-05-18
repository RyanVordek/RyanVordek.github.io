// ==========================================
// 1. ENGINE 3D INTERATIVA (DRACONIC REACTOR)
// ==========================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('webgl-container').appendChild(renderer.domElement);

const light = new THREE.PointLight(0xff9d00, 2, 50);
scene.add(light);

// GRUPO DO REATOR (Para mover tudo junto)
const reactorGroup = new THREE.Group();
// Move o reator para o lado DIREITO da tela, tirando ele de trás do texto
reactorGroup.position.x = 4; 
scene.add(reactorGroup);

// Núcleo
const coreGeo = new THREE.IcosahedronGeometry(1.5, 2);
const coreMat = new THREE.MeshBasicMaterial({ color: 0xff9d00, wireframe: true, transparent: true, opacity: 0.7 });
const core = new THREE.Mesh(coreGeo, coreMat);
reactorGroup.add(core);

// Anéis
const createRing = (radius, color, rotationX, rotationY) => {
    const geo = new THREE.TorusGeometry(radius, 0.015, 16, 100);
    const mat = new THREE.MeshBasicMaterial({ color: color });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.set(rotationX, rotationY, 0);
    reactorGroup.add(ring);
    return ring;
};

const rings = [
    createRing(2.2, 0xa200ff, Math.PI/2, 0),
    createRing(2.5, 0xff9d00, 0, Math.PI/4),
    createRing(2.8, 0xffffff, Math.PI/4, Math.PI/4)
];

camera.position.z = 6;

// Interatividade do Mouse (Parallax)
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.001;
    mouseY = (event.clientY - windowHalfY) * 0.001;
});

let clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Rotação natural
    core.rotation.y += 0.005;
    rings[0].rotation.z += 0.01;
    rings[1].rotation.x += 0.015;
    rings[2].rotation.y += 0.01;

    // Pulsação suave
    const scale = 1 + Math.sin(time * 2) * 0.05;
    core.scale.set(scale, scale, scale);

    // Efeito Parallax (Reator segue o mouse de forma fluida)
    targetX = mouseX * 2;
    targetY = mouseY * 2;
    reactorGroup.rotation.y += 0.05 * (targetX - reactorGroup.rotation.y);
    reactorGroup.rotation.x += 0.05 * (targetY - reactorGroup.rotation.x);

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Ajusta a posição em telas menores
    reactorGroup.position.x = window.innerWidth < 768 ? 0 : 4;
});

// ==========================================
// 2. GITHUB API & FILTROS INTERATIVOS
// ==========================================
const EXCLUDE_REPOS = ['RyanVordek', 'RyanVordek.github.io']; 
let allFetchedRepos = []; // Armazena os dados para os filtros

async function fetchProjects() {
    const listContainer = document.getElementById('projects-list');
    try {
        const [resUser, resOrg] = await Promise.all([
            fetch('https://api.github.com/users/RyanVordek/repos'),
            fetch('https://api.github.com/users/NarraLume-Project/repos')
        ]);

        const dataUser = await resUser.json();
        const dataOrg = await resOrg.json();
        
        allFetchedRepos = [...dataUser, ...dataOrg]
            .filter(repo => !repo.fork && !EXCLUDE_REPOS.includes(repo.name))
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        renderProjects('all'); // Renderiza tudo inicialmente
        setupFilters();

    } catch (e) {
        listContainer.innerHTML = '<p class="loading">Falha na sincronização. Verifique a API.</p>';
    }
}

function renderProjects(filterType) {
    const listContainer = document.getElementById('projects-list');
    listContainer.innerHTML = '';

    const filteredRepos = allFetchedRepos.filter(repo => {
        const isOrg = repo.owner.login === 'NarraLume-Project';
        if (filterType === 'personal') return !isOrg;
        if (filterType === 'narralume') return isOrg;
        return true; // 'all'
    });

    if(filteredRepos.length === 0) {
        listContainer.innerHTML = '<p class="loading">Nenhum repositório encontrado para este filtro.</p>';
        return;
    }

    filteredRepos.forEach(repo => {
        const isOrg = repo.owner.login === 'NarraLume-Project';
        const row = document.createElement('a');
        row.className = 'project-row';
        row.href = repo.html_url;
        row.target = '_blank';
        
        row.innerHTML = `
            <div>
                <h3>${repo.name} ${isOrg ? '<span class="org-tag">[NARRALUME]</span>' : ''}</h3>
            </div>
            <div>
                <p>${repo.description || 'Sem documentação.'}</p>
            </div>
            <div class="project-meta">
                <span>${repo.language || 'Config'}</span><br>
                <span>★ ${repo.stargazers_count}</span>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active de todos
            buttons.forEach(b => b.classList.remove('active'));
            // Adiciona no clicado
            e.target.classList.add('active');
            // Renderiza baseado no data-filter
            renderProjects(e.target.dataset.filter);
        });
    });
}

// Inicializa
if (window.innerWidth < 768) reactorGroup.position.x = 0; // Ajuste inicial mobile
fetchProjects();
