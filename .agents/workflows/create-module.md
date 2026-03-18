---
description: How to create new modules that follow the "Data Persistence" and "Silent Refresh" patterns.
---

# Creating a New Portal Module

Refer to [ui-standards.md](file:///d:/Muriet%20invetigation%20department/.agents/workflows/ui-standards.md) for UI components and [schema-standards.md](file:///d:/Muriet%20invetigation%20department/.agents/workflows/schema-standards.md) for database rules.

## 1. Eliminate Data "Flicker" (Silent Refresh)
Instead of manual fetching, use the [useStaleRefresh.js](file:///d:/Muriet%20invetigation%20department/src/hooks/useStaleRefresh.js) hook.

### ❌ INCORRECT (Traditional Fetch)
```jsx
// ❌ Problem: Shows a global spinner, hiding data every time an update occurs.
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
  fetchData().then(() => setIsLoading(false));
}, []);

if (isLoading) return <LoadingSpinner />; // ❌ Flickers empty screen!
return <div>{data}</div>;
```

### ✅ CORRECT (Silent Refresh)
```jsx
// ✅ Benefit: Keeps showing "Stale" data while fetching "Fresh" data in the background.
const { data, isLoading, backgroundRefresh } = useStaleRefresh(fetchData);

// Only show spinner on first-time load (no data yet)
if (isLoading && data.length === 0) return <LoadingSpinner />; 
return <div>{data}</div>;

// ⚡ Silent Real-time Integration
useEffect(() => {
  const channel = supabase.channel('table-changes')
    .on('postgres_changes', { event: '*', table: 'my_table' }, () => backgroundRefresh()) // 🔄 No spinner!
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [backgroundRefresh]);
```

## 2. Standard Vertical Hierarchy
All sections must start with a small icon and high-contrast sub-header as described in UI Standards.

1. **Sub-Header**: 
   ```jsx
   <div className="section-subtitle">
     <Table size={16} /> DATA SECTION TITLE
   </div>
   ```
2. **Grid Layout**: 
   - Row-based: ![Row-based OK](https://placehold.co/130x40/131E51/white?text=ROW+OK)
   - Stacked: ![Stacked NO](https://placehold.co/130x40/F36E6E/white?text=STACKED+NO)
   - Use `grid-responsive` with `repeat(auto-fit, minmax(300px, 1fr))` for list cards.

## 3. Reference Template
A complete boilerplate for a standard module can be found at: 
[ModuleTemplate.jsx](file:///d:/Muriet%20invetigation%20department/src/templates/ModuleTemplate.jsx)

## 4. Submission Checklist
- [ ] Is `useStaleRefresh` being used?
- [ ] Are real-time updates calling `backgroundRefresh` (**Silent Refresh**)?
- [ ] Is the "Function as Children" pattern ([ui-standards.md](file:///d:/Muriet%20invetigation%20department/.agents/workflows/ui-standards.md#L28-L40)) used for all modals?
- [ ] Are Approve buttons using `variant="primary"` and Deny buttons using `variant="danger"`?
- [ ] Has every string been translated to Swahili?
