---
description: How to create new modules that follow the "Data Persistence" and "Silent Refresh" patterns.
---

# Creating a New Portal Module

To ensure data remains persistently visible and never "flickers" or disappears on tab refocus, follow these steps when building new modules.

## 1. Use the `useStaleRefresh` Hook
Instead of manually managing `isLoading` and `fetch` logic, use the project's standard hook:
`src/hooks/useStaleRefresh.js`

### Implementation Steps:
1. Define your Supabase fetch function.
2. Pass it to `useStaleRefresh`.
3. Use the `refresh` (foreground) and `backgroundRefresh` (silent) functions.

## 2. Silent Real-time Updates
When setting up Supabase Real-time channels, always call `backgroundRefresh()` instead of a standard refresh. This ensures the UI updates in the background without showing a loading spinner.

```javascript
useEffect(() => {
  const channel = supabase
    .channel('your-channel')
    .on('postgres_changes', { event: '*', table: 'your_table' }, () => backgroundRefresh())
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [backgroundRefresh]);
```

## 3. Loading State UX
Always follow bridge loading logic in your JSX:
- **ONLY** show the full-page spinner or table loading row if `isLoading` is true **AND** your data array length is `0`.
- If data already exists, let the user continue reading/interacting while the update happens silently.

## 4. Reference Template
A complete boilerplate for a standard module can be found at: 
`src/templates/ModuleTemplate.jsx`

## 5. Pre-Checklist
- [ ] Does the module use `useStaleRefresh`?
- [ ] Are real-time updates calling `backgroundRefresh`?
- [ ] Does the JSX check `data.length === 0` before showing a loader?
- [ ] Is `withTimeout` used on the Supabase query to prevent hanging?
