---
name: gsap-scrolltrigger
description: GSAP & ScrollTrigger for professional scroll-driven animations, parallax, and 3D integration
source: freshtechbro/claudedesignskills
---

# GSAP & ScrollTrigger — Professional Web Design

## Quick Start
```javascript
gsap.registerPlugin(ScrollTrigger);

// Fade in on scroll
gsap.from(".element", {
  opacity: 0, y: 50, duration: 1,
  scrollTrigger: { trigger: ".element", start: "top 80%", scrub: 1 }
});
```

## Key Patterns for Zeeshan Hospital

### 1. Hero 3D Parallax
```javascript
gsap.to(".hero-bg", { y: 200, ease: "none",
  scrollTrigger: { trigger: ".hero", start: "top bottom", end: "bottom top", scrub: true }
});
gsap.to(".hero-content", { y: -50,
  scrollTrigger: { trigger: ".hero", start: "top bottom", end: "bottom top", scrub: true }
});
```

### 2. Card Stagger Reveal
```javascript
gsap.utils.toArray(".service-card").forEach((card, i) => {
  gsap.from(card, { y: 60, opacity: 0, duration: 0.8,
    scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none reverse" }
  });
});
```

### 3. Counter Animation
```javascript
gsap.to(".stat-number", { innerText: 10000, duration: 2, snap: "innerText",
  scrollTrigger: { trigger: ".stats", start: "top 80%" }
});
```

### Easing Reference
- `power1.out` — subtle deceleration
- `power2.inOut` — smooth acceleration/deceleration  
- `power4.out` — strong deceleration
- `elastic.out` — bouncy
- `expo.inOut` — dramatic
- `"none"` — linear (for scrubbed scroll)
