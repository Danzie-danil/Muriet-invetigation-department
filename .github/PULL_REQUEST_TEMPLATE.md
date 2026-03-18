# Description
Please include a summary of the change and which issue is fixed. Include relevant motivation and context.

## Type of Change
- [ ] 🚀 New Feature (non-breaking change which adds functionality)
- [ ] 🛠️ Bug Fix (non-breaking change which fixes an issue)
- [ ] 🎨 Design/UI Update (CSS, layout, or mobile adaptation)
- [ ] 🛡️ Security / RLS Change

---

# 🛸 Pre-Submission Checklist (MANDATORY)

## 🏗️ Design & UI (Master Standards)
- [ ] **Branding**: Used `#131E51` for Approve buttons and `#F36E6E` for Deny buttons?
- [ ] **Modals**: Implemented the "Function as Children" pattern for local language reactive updates?
- [ ] **Localization**: Every single label and string has a Swahili equivalent in the translation JSON?
- [ ] **Mobile**: Font size is 16px minimum for inputs? Grid layout collapses to single column on mobile?

## 🚀 Performance (Silent Refresh)
- [ ] **useStaleRefresh**: Used for data fetching to prevent full-page flickers?
- [ ] **Real-time**: Supabase channel calls `backgroundRefresh()` for silent updates?

## 🛡️ Database (Schema Standards)
- [ ] **SQL Naming**: Focused SQL file created in `supabase/` with `create_` or `add_` prefix?
- [ ] **RLS**: Row Level Security enabled and policies defined for SELECT, INSERT, UPDATE, DELETE?
- [ ] **Main Schema**: Appended definitions to the main `supabase/schema.sql`?

---

# Screenshots (if applicable)
[Drop screenshots here showing Mobile vs Desktop views]
