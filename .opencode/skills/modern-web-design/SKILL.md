---
name: modern-web-design
description: Premium web design patterns — glassmorphism, micro-interactions, scrollytelling, bold minimalism
source: freshtechbro/claudedesignskills
---

# Modern Web Design — Premium Patterns

## Design Principles
- **Performance-first**: LCP < 2.5s, use GPU transforms only
- **Bold minimalism**: Large typography, ample white space, 3-5 color palette
- **Micro-interactions**: Purposeful feedback on hover/click/scroll
- **Scrollytelling**: Content reveals as user scrolls

## Premium Effects

### 1. Glassmorphism
```css
.glass {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.25);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}
```

### 2. Fluid Typography
```css
--font-size-xl: clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem);
--font-size-2xl: clamp(2.5rem, 2rem + 2.5vw, 4rem);
```

### 3. Magnetic Buttons
```javascript
btn.addEventListener('mousemove', (e) => {
  const rect = btn.getBoundingClientRect();
  const x = (e.clientX - rect.left - rect.width/2) * 0.3;
  const y = (e.clientY - rect.top - rect.height/2) * 0.3;
  btn.style.transform = `translate(${x}px, ${y}px)`;
});
btn.addEventListener('mouseleave', () => {
  btn.style.transform = 'translate(0, 0)';
});
```

### 4. Accessibility
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
