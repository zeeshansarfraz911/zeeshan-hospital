---
name: 3d-parallax-premium
description: Premium 3D parallax web design patterns — Apple-level cinematic effects
version: 1.0
source: Codrops, Mirax, Builder.io (2026)
---

# 3D Parallax Premium Web Design

## Stack Recommendations (2026)

| Complexity | Stack | Best For |
|-----------|-------|----------|
| **Light** | Vanilla JS + CSS transforms | Simple parallax, hero sections |
| **Medium** | GSAP + ScrollTrigger + CSS 3D | Scroll-driven animations, card effects |
| **Heavy** | Three.js + GSAP + WebGL | Cinematic 3D worlds, product showcases |

## Technique 1: Vanilla Parallax (No Libraries)

```javascript
// Pure CSS transform parallax — runs on compositor thread
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  layers.forEach((layer, i) => {
    const speed = 0.2 + (i * 0.1); // 0.2, 0.3, 0.4...
    layer.style.transform = `translateY(${scrollY * speed}px)`;
  });
});
```

**Key rules:**
- Speed multipliers: 0.2–0.5 feels natural, >0.7 causes motion sickness
- Use `transform`, not `top/left` — GPU accelerated
- Add `will-change: transform` to optimized elements
- Respect `prefers-reduced-motion`

## Technique 2: GSAP ScrollTrigger (Medium)

```javascript
// Scroll-driven 3D card tilt
gsap.to('.card', {
  scrollTrigger: {
    trigger: '.section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true
  },
  rotationX: 15,
  rotationY: -10,
  transformPerspective: 1000,
  ease: 'none'
});
```

## Technique 3: Three.js + Camera Path (Heavy)

```javascript
// Camera moves through Z-space as user scrolls
const camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 100);
let scrollTarget = 0;
let scrollCurrent = 0;

window.addEventListener('scroll', () => {
  scrollTarget = window.scrollY;
});

function animate() {
  scrollCurrent += (scrollTarget - scrollCurrent) * 0.05;
  camera.position.z = scrollCurrent * 0.01;
  requestAnimationFrame(animate);
}
```

## Apple-Level Design Patterns

### 1. Hero 3D Tilt (Mouse-driven)
```javascript
hero.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 6;
  const y = (e.clientY / window.innerHeight - 0.5) * -6;
  hero.style.transform = 
    `perspective(1000px) rotateY(${x}deg) rotateX(${y}deg)`;
});
```

### 2. Glassmorphism Cards
```css
.glass-card {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.25);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}
```

### 3. Animated Gradient Mesh
```css
.gradient-mesh {
  background: 
    radial-gradient(ellipse 80% 60% at 0% 20%, rgba(13,148,136,0.08), transparent),
    radial-gradient(ellipse 60% 50% at 100% 80%, rgba(2,132,199,0.06), transparent);
  background-size: 200% 200%;
  animation: meshShift 8s ease infinite;
}
@keyframes meshShift {
  0%, 100% { background-position: 0% 50%; }
  33% { background-position: 100% 0%; }
  66% { background-position: 50% 100%; }
}
```

### 4. Text Reveal (Split animation)
```css
.text-reveal {
  clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);
  transition: clip-path 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.text-reveal.visible {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}
```

### 5. Smooth Scroll (Lenis alternative)
```javascript
// Smooth scroll with lerp — no external library
let target = 0;
let current = 0;
const ease = 0.08;

window.addEventListener('scroll', () => { target = window.scrollY; });

function smoothScroll() {
  current += (target - current) * ease;
  document.body.style.transform = `translateY(-${current}px)`;
  requestAnimationFrame(smoothScroll);
}
// Requires: body { position: fixed; width: 100%; }
// Wrapper height: document.body.clientHeight
```

## Performance Checklist
- [ ] Cap DPR at 1.5 for WebGL (`dpr={[1, 1.5]}`)
- [ ] Respect `prefers-reduced-motion`
- [ ] Disable heavy effects on mobile (<768px)
- [ ] Use `will-change` sparingly (only on animated elements)
- [ ] Transform operations only (no layout triggers)
- [ ] Compress all images to WebP/AVIF
- [ ] Lazy load below-fold 3D content

## Resources (2026)
- [Codrops: Scroll-Driven 3D World](https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/)
- [Mirax: Cinematic 3D Scroll GSAP](https://mirax.cc/articles/cinematic-3d-scroll-gsap-nextjs-react-three-fiber)
- [Builder.io: Vanilla Parallax 2026](https://www.builder.io/blog/parallax-scrolling-effect)
- [Codrops: Horizontal Parallax Gallery](https://tympanus.net/codrops/2026/02/19/creating-a-smooth-horizontal-parallax-gallery-from-dom-to-webgl/)
