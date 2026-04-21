import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

document.addEventListener("DOMContentLoaded", () => {

    // --- 1. LENIS SMOOTH SCROLL ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // cinematic custom easing
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    // Ensure GSAP ScrollTrigger stays synced with Lenis
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);


    // --- 2. CUSTOM CURSOR ---
    const cursor = document.getElementById("cursor");
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        gsap.to(cursor, { x: mouseX - 20, y: mouseY - 20, duration: 0.18, ease: "power2.out" });
    });

    // Hover scale logic removed per user specification.


    // --- 4. GSAP SCROLL ANIMATIONS ---
    gsap.registerPlugin(ScrollTrigger);

    // Hero Entry Animation
    const heroTl = gsap.timeline();
    heroTl.from(".hero-left p, .hero-left div", { x: -100, opacity: 0, duration: 1, stagger: 0.2, ease: "power3.out" })
        .from(".hero-right p, .hero-right div", { x: 100, opacity: 0, duration: 1, stagger: 0.2, ease: "power3.out" }, "-=1")
        .from(".avatar-container img", { y: 50, opacity: 0, scale: 0.9, duration: 1.5, ease: "power3.out" }, "-=0.8");

    // Fade up animations
    const fadeUpElements = gsap.utils.toArray('.fade-up');
    fadeUpElements.forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: "top 85%", onEnter: () => el.classList.add('visible') });
    });

    // Timeline Glow Fill Acceleration
    gsap.to(".timeline-glow", {
        scrollTrigger: { trigger: "#about", start: "top center", end: "bottom center", scrub: true },
        scaleY: 1, ease: "none"
    });

    // Horizontal Scroll for "MY WORK"
    const workSection = document.getElementById("work");
    const scrollContainer = document.querySelector(".horizontal-scroll-container");
    let getScrollAmount = () => -(scrollContainer.scrollWidth - window.innerWidth);
    const hScrollTween = gsap.to(scrollContainer, { x: getScrollAmount, ease: "none" });
    ScrollTrigger.create({ trigger: workSection, start: "top top", end: () => `+=${getScrollAmount() * -1}`, pin: true, animation: hScrollTween, scrub: 1, invalidateOnRefresh: true });


    // --- 5. 3D FLOATING BUBBLE REPULSION PHYSICS ---
    const bubbleContainer = document.getElementById("bubble-container");
    if (bubbleContainer) {
        const techList = [
            { text: "Excel", icon: "ph-table" },
            { text: "Python", icon: "https://cdn.simpleicons.org/python/white" },
            { text: "Numpy", icon: "https://cdn.simpleicons.org/numpy/white" },
            { text: "Pandas", icon: "https://cdn.simpleicons.org/pandas/white" },
            { text: "Power BI", icon: "ph-chart-bar" },
            { text: "SQL", icon: "https://cdn.simpleicons.org/mysql/white" },
            { text: "Power Query", icon: "ph-database" },
            { text: "n8n", icon: "https://cdn.simpleicons.org/n8n/white" }
        ];

        let bubbles = [];
        const repelRadius = 250;
        const repelForce = 6;
        const springForce = 0.03;
        const friction = 0.85;

        // Initialize bubbles
        techList.forEach((tech, i) => {
            const el = document.createElement("div");
            el.className = "tech-bubble";
            // Make them naturally centered
            el.style.top = "50%";
            el.style.left = "50%";

            // Increase size for legibility
            const size = 160 + Math.random() * 40;
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;

            const imgHtml = tech.icon.startsWith("ph-")
                ? `<i class="ph-fill ${tech.icon} text-[36px] mb-2" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.6));"></i>`
                : `<img src="${tech.icon}" width="36" height="36" alt="${tech.text}">`;

            el.innerHTML = `
                ${imgHtml}
                <span>${tech.text}</span>
            `;
            bubbleContainer.appendChild(el);

            // Increase cluster spread so the bigger balls don't overlap as tightly
            const angle = (i / techList.length) * Math.PI * 2;
            const radius = 120 + Math.random() * 150;
            const targetX = Math.cos(angle) * radius;
            const targetY = Math.sin(angle) * radius;

            let phase = Math.random() * Math.PI * 2;

            bubbles.push({
                el,
                x: targetX,
                y: targetY,
                vx: 0,
                vy: 0,
                targetX,
                targetY,
                phase
            });
        });

        // Mouse coordinates relative to container center
        let pMouseX = 9999;
        let pMouseY = 9999;

        bubbleContainer.addEventListener("mousemove", (e) => {
            const rect = bubbleContainer.getBoundingClientRect();
            pMouseX = (e.clientX - rect.left) - rect.width / 2;
            pMouseY = (e.clientY - rect.top) - rect.height / 2;
        });

        // When leaving, push mouse out of gravity range instantly
        bubbleContainer.addEventListener("mouseleave", () => {
            pMouseX = 9999;
            pMouseY = 9999;
        });

        // Physics Animation Loop
        function animateBubbles() {
            bubbles.forEach((b) => {
                const dx = pMouseX - b.x;
                const dy = pMouseY - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < repelRadius) {
                    const force = (repelRadius - dist) / repelRadius;
                    // Accelerate away from mouse
                    b.vx -= (dx / dist) * force * repelForce;
                    b.vy -= (dy / dist) * force * repelForce;
                }

                // Spring back to cluster target position
                const sx = b.targetX - b.x;
                const sy = b.targetY - b.y;
                b.vx += sx * springForce;
                b.vy += sy * springForce;

                // Organic baseline floating (Sine waves)
                b.phase += 0.05;
                const floatY = Math.sin(b.phase) * 0.4;
                b.vy += floatY;

                // Apply friction multiplier
                b.vx *= friction;
                b.vy *= friction;

                // Update structural position
                b.x += b.vx;
                b.y += b.vy;

                // 3D rotation simulates rolling away from forces
                const rotX = -b.vy * 0.6;
                const rotY = b.vx * 0.6;

                // Update DOM transforms with X/Y and 3D Rotation
                b.el.style.transform = `translate(-50%, -50%) translate3d(${b.x}px, ${b.y}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
            });

            requestAnimationFrame(animateBubbles);
        }

        animateBubbles();
    }

    // --- 6. MAGNETIC BUTTONS (SOCIAL SIDEBAR) ---
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            // Calculate distance from center of icon
            const x = (e.clientX - rect.left - rect.width / 2) * 0.4;
            const y = (e.clientY - rect.top - rect.height / 2) * 0.4;
            // Float toward cursor smoothly
            gsap.to(btn, { x: x, y: y, duration: 0.3, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
            // Spring back to original position
            gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
        });
    });

});



// =========================
// 3D CHARACTER MODEL (THREE.JS)
// =========================

        const canvas = document.getElementById("character-canvas");

        if (canvas) {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
            camera.position.z = 9; // Move camera back to see the full model
            camera.position.y = 0;

            const renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true
            });

            renderer.setClearColor(0x000000, 0);
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.outputColorSpace = THREE.SRGBColorSpace; // Ensures correct color rendering

            // Add stronger lighting for the model
            const ambient = new THREE.AmbientLight(0xffffff, 2);
            scene.add(ambient);

            const sunLight = new THREE.DirectionalLight(0xffffff, 4);
            sunLight.position.set(5, 5, 5);
            scene.add(sunLight);

            const purpleLight = new THREE.PointLight(0xBC95FF, 10, 10);
            purpleLight.position.set(-3, 2, 2);
            scene.add(purpleLight);

            // Load the GLTF Model
            const loader = new GLTFLoader();
            let model;

            loader.load('scene.gltf', (gltf) => {
                model = gltf.scene;
                
                // Auto-center the model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);
                
                // Scale adjustment (tweak these numbers if it's too big/small)
                model.scale.set(1.2, 1.2, 1.2); 

                model.position.set(0, -0.3, 0);
                
                scene.add(model);
            }, undefined, (error) => {
                console.error("Error loading model:", error);
            });

            function animate() {
                requestAnimationFrame(animate);
                if (model) {
                    model.rotation.y += 0.005; // Gentle rotation
                    model.position.y = Math.sin(Date.now() * 0.001) * 0.1; // Floating effect
                }
                renderer.render(scene, camera);
            }
            animate();
        }

    // Resize fix
    window.addEventListener("resize", () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });




