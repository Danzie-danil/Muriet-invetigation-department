---
description: Standards for integrating custom SVGs, masking, and high-fidelity animations.
---

# 🎨 Custom Asset & Icon Workflow

Use this workflow when adding branding-specific SVGs or custom interactive components that go beyond the [Lucide](https://lucide.dev/) baseline.

## 1. SVG Normalization Standard
Before adding any custom SVG to `src/assets/icons/`, you **must** strip hardcoded dimensions to allow the `CustomIcon` container to control scaling.

1. **Remove**: `width`, `height`, and `fill` attributes from the root `<svg>` tag.
2. **Ensure**: `viewBox="0 0 24 24"` (or consistent square aspect ratio) is present.
3. **Format**: Save filenames as `snake_case.svg`.

## 2. The CustomIcon Container Pattern
To allow dynamic color switching (e.g., matching themed buttons), always use the **CSS Masking** approach.

```jsx
// src/components/ui/CustomIcon.jsx standard implementation
import React from 'react';

const icons = import.meta.glob('../../assets/icons/*.svg', { eager: true, as: 'url' });

export default function CustomIcon({ name, size = '24px', color = 'currentColor', style = {} }) {
  const iconPath = icons[`../../assets/icons/${name}.svg`];
  if (!iconPath) return null;

  return (
    <div 
      style={{
        width: size, height: size,
        backgroundColor: color,
        maskImage: `url(${iconPath})`,
        maskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskImage: `url(${iconPath})`,
        WebkitMaskSize: '100% 100%',
        display: 'inline-block',
        ...style
      }}
    />
  );
}
```

## 3. High-Fidelity UI Standards
### A. The "MPID Ease-In" Animation
All custom interactive elements (modals, previews, popups) must use the standardized bouncy entrance:

```css
@keyframes modalEntrance { 
  from { opacity: 0; transform: scale(0.9); } 
  to { opacity: 1; transform: scale(1); } 
}

/* Usage */
animation: modalEntrance 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### B. Standardized Intake Sizes
- **Mugshot Thumbnail**: 35 x 35 mm (`132px`).
- **Mugshot Preview**: 110 x 110 mm (`416px`).
### C. Button Standardization
Always use the [Button.jsx](file:///d:/Muriet%20invetigation%20department/src/components/ui/Button.jsx) component for all interactive actions. 
- **Rule**: Do not override `height`, `borderRadius`, or `boxShadow` in the `style` prop of a Button. 
- **Rationale**: This ensures custom components (like the Photo Preview) stay perfectly in sync with the core modules (like Case Registration).
- **Variants**: Use `variant="primary"` for the main action (Agree/Download) and `variant="secondary"` or `variant="outline"` for alternative paths (Go to Case/Cancel).
- **LUCIDE**: Default for system actions (Edit, Delete, Search, Lock).
- **CUSTOM**: Only for specialized police documents, branding, and proprietary assets (Fingerprints, Scanners, Specific Forms).
