
    // Hide loading screen after page loads
    window.addEventListener('load', () => {
      setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
      }, 500);
    });

    // Smooth fade-in on scroll
    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll){
      entries.forEach(entry => {
        if(!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        appearOnScroll.unobserve(entry.target);
      });
    }, appearOptions);
    faders.forEach(fader => appearOnScroll.observe(fader));

    // Cursor glow follow
    const cursor = document.getElementById('cursor-glow');
    document.addEventListener('mousemove', e => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });

    // Navigation scroll highlight
    const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
    const sections = document.querySelectorAll('section');
    const snapContainer = document.getElementById('snap-container');
    
    snapContainer.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if(snapContainer.scrollTop >= sectionTop) {
          current = section.getAttribute('id');
        }
      });
      navLinks.forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('href') === '#' + current) {
          link.classList.add('active');
        }
      });
    });

    // Smooth scroll to sections
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if(target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Close mobile menu if open
          document.querySelector('.mobile-menu').classList.remove('open');
        }
      });
    });

    // Theme toggle
    const themeBtn = document.querySelector('.theme-toggle');
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
    });

    // Load saved theme
    if(localStorage.getItem('theme') === 'light') {
      document.body.classList.add('light-theme');
    }

    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      mobileToggle.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
    });

    // Three.js Scene
    const canvas = document.getElementById('three-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create particles
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i*3] = (Math.random() - 0.5) * 200;
      positions[i*3 + 1] = (Math.random() - 0.5) * 200;
      positions[i*3 + 2] = (Math.random() - 0.5) * 200;

      velocities[i*3] = (Math.random() - 0.5) * 0.3;
      velocities[i*3 + 1] = (Math.random() - 0.5) * 0.3;
      velocities[i*3 + 2] = (Math.random() - 0.5) * 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({ 
      color: 0xa855f7, 
      size: 1,
      transparent: true,
      opacity: 0.6
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    function animate() {
      requestAnimationFrame(animate);

      const pos = geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        pos[i*3] += velocities[i*3];
        pos[i*3 + 1] += velocities[i*3 + 1];
        pos[i*3 + 2] += velocities[i*3 + 2];

        if (pos[i*3] > 100 || pos[i*3] < -100) velocities[i*3] *= -1;
        if (pos[i*3 + 1] > 100 || pos[i*3 + 1] < -100) velocities[i*3 + 1] *= -1;
        if (pos[i*3 + 2] > 100 || pos[i*3 + 2] < -100) velocities[i*3 + 2] *= -1;
      }

      geometry.attributes.position.needsUpdate = true;
      points.rotation.y += 0.0005;
      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });