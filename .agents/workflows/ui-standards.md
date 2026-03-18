---
description: Universal UI/UX standards, button branding, and localized modal patterns.
---

# Universal UI & UX Standards

Refer to [design-tokens.md](file:///d:/Muriet%20invetigation%20department/.agents/workflows/design-tokens.md) for all hex codes and constants.

## 1. Action Button Branding (Code Usage)
Do not use hardcoded hex values in buttons. Use the [Button.jsx](file:///d:/Muriet%20invetigation%20department/src/components/ui/Button.jsx) component with specific **variants**.

```jsx
// CORRECT: High-trust "Approve" style
<Button variant="primary">Accept / Save / Record</Button> 

// CORRECT: High-visibility "Deny" style
<Button variant="danger">Cancel / Deny / Delete</Button>
```

## 2. Modal Hierarchy & Grid Logic
Every modal must replicate the structure used in the **Case Registration** form.

1. **Sub-Headers**: Separate sections with high-contrast uppercase labels & icons.
2. **Grid Layouts**:
   - **Correct**: ![Grid Correct: 2 columns for smaller fields, 1 column for textareas](https://placehold.co/130x40/131E51/white?text=GRID+OK)
   - **Incorrect**: ![Grid Incorrect: All fields stacked in 1 column](https://placehold.co/130x40/F36E6E/white?text=STACKED+NO)
   - Use `grid-template-columns: 1fr 1fr;` for related bio-data.

## 3. Localization: "Function as Children" Pattern
All modals must feature a local language toggle. This is implemented via a callback to `children` in the [Modal.jsx](file:///d:/Muriet%20invetigation%20department/src/components/ui/Modal.jsx) component.

```jsx
// Mandatory Implementation
<Modal title={(mt) => mt('module.title')}>
  {(t, lang) => (
    <div className="u-stack">
      <label>{t('form.field_label')}</label>
      <input placeholder={lang === 'en' ? 'Search...' : 'Tafuta...'} />
    </div>
  )}
</Modal>
```

## 4. Naming Conventions (React)
- **Components**: PascalCase (e.g., `EvidenceModal.jsx`).
- **State/Props**: camelCase (e.g., `isModalOpen`).
- **Files**: PascalCase for components, kebab-case for assets.

## 5. Asset Management
- **Icons**: Prefer [lucide-react](https://lucide.dev/icons/) (SVG-based). 
- **Storage**: Store static images in `src/assets/`. Use `.webp` for photos.
- **Naming**: `description-type.extension` (e.g., `stamp-logo.webp`).

## 6. Table Responsiveness & Mobile Transformation
When implementing data tables, follow these standards to ensure usability on smaller screens:

### A. Sticky Action Column (Tablet/Small Desktop)
- Apply `position: sticky` and `right: 0` to the 'Action' header and cell.
- Ensure the background color of the sticky cell is solid (e.g., `var(--bg-surface)`) to prevent text overlap during scroll.
- Add a `box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.05)` to the sticky column to indicate depth.

### B. Mobile Card Transformation (< 768px)
- **Mobile-First Standard**: Switch from `<table>` to a `.u-stack` of cards for screens smaller than 768px.
- **Visual Priority**: Each card must prominently display the main identifier (e.g., RB Number).
- **Fast Access**: The "View" or "Action" button must be fixed at the bottom of the card or top-right for instant access.

### C. Touch Target Compliance
- Ensure all action buttons (like the "View" button) are at least **44px** in height on mobile devices.
