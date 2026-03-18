---
description: Combined master standards for frontend design, performance, feedback, and mobile responsiveness.
---

# 🏗️ Frontend Master Standards (UX, Design, & Performance)

This document groups all portal workflows into a single system of truth. Refer to specific files for technical code snippets.

---

## 🎨 1. Design & Branding (Single Source of Truth)
Refer to [design-tokens.md](file:///d:/Muriet%20invetigation%20department/.agents/workflows/design-tokens.md) for all hex codes and constants.

- **Branding**: All buttons must use `variant="primary"` (`#131E51`) or `variant="danger"` (`#F36E6E`).
- **Typography**: Inter (16px minimum). Page titles Bold (700), Section subheaders Extra Bold (800).
- **Gutters**: Use `var(--gutter-m)` (24px) between inputs and cards.

---

## 📘 2. UI & UX Standards
Refer to [ui-standards.md](file:///d:/Muriet%20invetigation%20department/.agents/workflows/ui-standards.md) for layout hierarchy.

- **Modals**: Must implement the **"Function as Children"** pattern for localized content. 
- **Tables**: Use **Sticky Action Columns** for tablet/desktop and **Card Transformation** for mobile (< 768px). 
- **Mobile**: Grid columns auto-collapse to 1-column. Buttons must be **44x44px**. 

---

## 🚀 3. Performance & Data Patterns
Refer to [create-module.md](file:///d:/Muriet%20invetigation%20department/.agents/workflows/create-module.md) for fetch logic.

- **Silent Refresh**: Use `useStaleRefresh` and `backgroundRefresh()` for all background updates.
- **Loading UX**: Text first, Media second. Use **Skeleton Shimmers** for images/files ONLY.

---

## 🛡️ 4. Global Error Handling
Refer to [error-handling.md](file:///d:/Muriet%20invetigation%20department/.agents/workflows/error-handling.md) for toast & validation logic.

- **Inline Errors**: Red text (#ef4444) directly below fields for validation.
- **Toasts**: Floating top-right notifications for all API success/failure messages.

---

## 🗄️ 5. Database Schema & Migration
Refer to [schema-standards.md](file:///d:/Muriet%20invetigation%20department/.agents/workflows/schema-standards.md) for SQL rules.

- **Naming**: `create_` or `add_` prefixes for `.sql` files in `supabase/`.
- **Mandatory RLS**: All tables ENABLE RLS and define policies for ALL CRUD operations.
- **Public Publication**: Add tables to `supabase_realtime` if they require front-end "Silent Refresh."

---

## 📝 6. Developer Final Checklist
- [ ] Buttons use correct `variant` props?
- [ ] Every label has a Swahili translation?
- [ ] Database changes synchronized to `supabase/schema.sql`?
- [ ] Pull Request checklist completed in `PR_TEMPLATE.md`?

*Last Updated: March 2026*
