---
description: Centralized design constants (hex codes, spacing, fonts) for the Muriet Investigation Portal.
---

# 🎨 Design Tokens (Single Source of Truth)

To maintain absolute visual consistency, all components must use these global tokens. **Never** hardcode hex values in JSX.

## 1. Action Colors (Branding)
| Token Name | Hex Value | Usage / Logic |
| :--- | :--- | :--- |
| **`--primary-color`** | `#131E51` | **Approve Actions** (Save, Agree, Process, Record). High-trust Dark Navy. |
| **`--primary-hover`** | `#0a102d` | Hover state for primary buttons. |
| **`--danger-color`** | `#F36E6E` | **Deny Actions** (Cancel, Revoke, Delete, Stop). High-visibility Soft Red. |
| **`--success-color`** | `#10B981` | Positive status tags and confirmation indicators. |
| **`--warning-color`** | `#F59E0B` | Pending states or caution alerts. |

## 2. Typography
- **Primary Font**: `Inter`, system-ui, sans-serif.
- **Base Size**: `16px` (Minimum for all inputs to prevent iOS auto-zoom).
- **Control Weights**: 
  - `700` (Bold) for Page Titles.
  - `800` (Extra Bold) for Section Subheaders.
  - `400` (Regular) for description text.

## 3. Spacing & Gutters
- **`--gutter-s` (16px)**: Internal padding for cards/modals.
- **`--gutter-m` (24px)**: Standard vertical/horizontal gap between form input fields.
- **`--touch-target` (44px)**: Minimum height for any clickable button or input.

## 4. UI Properties
- **Border Radius**: `8px` for buttons, `12px` for cards/modals.
- **Shadows**: 
  - Base: `0 8px 20px rgba(0,0,0,0.08)`
  - Modal: `0 20px 60px rgba(0,0,0,0.2)`
