// 1. WEBGL: DRACONIC REACTOR ENGINE
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('webgl-container').appendChild(renderer.domElement);

// Luzes
const light = new THREE.PointLight(0xff9d00, 2, 50);
light.position.set(0, 0, 0);
scene.add(light);

// NÚCLEO (O Coração do Reator)
const coreGeo = new THREE.IcosahedronGeometry(1.5, 2);
const coreMat = new THREE.MeshBasicMaterial({ 
    color: 0xff9d00, 
    wireframe: true,
    transparent: true,
    opacity: 0.8
});
const core = new THREE.Mesh(coreGeo, coreMat);
scene.add(core);

// ANÉIS ESTABILIZADORES (Torus)
const rings = [];
const createRing = (radius, color, rotationX, rotationY) => {
    const geo = new THREE.TorusGeometry(radius, 0.02, 16, 100);
    const mat = new THREE.MeshBasicMaterial({ color: color });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = rotationX;
    ring.rotation.y = rotationY;
    scene.add(ring);
    return ring;
};

rings.push(createRing(2.2, 0xa200ff, Math.PI/2, 0)); // Anel Roxo
rings.push(createRing(2.5, 0xff9d00, 0, Math.PI/4));  // Anel Laranja
rings.push(createRing(2.8, 0xffffff, Math.PI/4, Math.PI/4)); // Anel Branco

// PARTÍCULAS DE ENERGIA
const particlesGeo = new THREE.BufferGeometry();
const particlesCount = 500;
const posArray = new Float32Array(particlesCount * 3);

for(let i=0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 15;
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({ size: 0.02, color: 0xa200ff });
const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);

camera.position.z = 6;

// Loop de Animação
let clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    core.rotation.y += 0.01;
    // Efeito Pulsação (Reactor Heartbeat)
    const scale = 1 + Math.sin(time * 2) * 0.1;
    core.scale.set(scale, scale, scale);

    // Rotação dos anéis
    rings[0].rotation.z += 0.01;
    rings[1].rotation.x += 0.02;
    rings[2].rotation.y += 0.015;

    particlesMesh.rotation.y += 0.001;

    renderer.render(scene, camera);
}
animate();

// Responsividade
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// 2. GITHUB API: SYNC ENGINE
const EXCLUDE_REPOS = ['RyanVordek', 'RyanVordek.github.io']; 

async function syncProjects() {
    const grid = document.getElementById('projects-grid');
    try {
        const [res1, res2] = await Promise.all([
            fetch('https://api.github.com/users/RyanVordek/repos'),
            fetch('https://api.github.com/users/NarraLume-Project/repos')
        ]);

        const data1 = await res1.json();
        const data2 = await res2.json();
        
        let allRepos = [...data1, ...data2]
            .filter(repo => !repo.fork && !EXCLUDE_REPOS.includes(repo.name))
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        grid.innerHTML = '';

        allRepos.forEach(repo => {
            const isOrg = repo.owner.login === 'NarraLume-Project';
            const card = document.createElement('a');
            card.className = 'project-card';
            card.href = repo.html_url;
            card.target = '_blank';
            
            card.innerHTML = `
                <div>
                    <h3>${repo.name}</h3>
                    <p>${repo.description || 'Nenhuma descrição fornecida para este sistema.'}</p>
                </div>
                <div class="project-footer">
                    <span class="org-tag">${isOrg ? '[NARRALUME]' : '[PERSONAL]'}</span>
                    <span>${repo.language || 'Code'}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = '<p>Falha na sincronização de dados.</p>';
    }
}
syncProjects();
