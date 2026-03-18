import React from 'react';

// Use Vite's glob import to automatically find all SVG files in the icons assets directory
const icons = import.meta.glob('../../assets/icons/*.svg', { eager: true, as: 'url' });

/**
 * CustomIcon component for rendering branding-specific SVGs with dynamic coloring.
 * Supports standard sizing and CSS-mask based colorization.
 * 
 * @param {string} name - The filename of the SVG (without extension) in src/assets/icons/
 * @param {string} size - The width and height of the icon (e.g., '24px')
 * @param {string} color - The background color for the mask (e.g., 'var(--primary-color)')
 * @param {object} style - Additional styles to apply to the container
 */
export default function CustomIcon({ name, size = '24px', color = 'currentColor', style = {} }) {
  const iconPath = icons[`../../assets/icons/${name}.svg`];
  
  if (!iconPath) {
    console.warn(`[CustomIcon] Icon "${name}" not found in assets/icons/`);
    return null;
  }

  return (
    <div 
      role="img"
      aria-label={`${name} icon`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        maskImage: `url(${iconPath})`,
        maskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskImage: `url(${iconPath})`,
        WebkitMaskSize: '100% 100%',
        display: 'inline-block',
        flexShrink: 0,
        ...style
      }}
    />
  );
}
