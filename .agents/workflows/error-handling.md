---
description: Patterns for handling validation and global API errors.
---

# 🛡️ Error Handling Patterns

To ensure consistent user feedback, all modules must use these three distinct error handling layers.

## 1. Inline Validation (Field-Level)
- **Trigger**: When a user inputs an invalid email, short password, or incorrect phone/NIDA format.
- **Visual**: A small red error message directly below the input field (`#ef4444`).
- **Logic**: Use a `formErrors` state object.

```jsx
<div>
  <label>{t('form.email')}</label>
  <input type="email" value={email} onChange={handleEmail} />
  {formErrors.email && (
    <span style={{ color: 'var(--danger-color)', fontSize: '11px', fontWeight: 600 }}>
      {formErrors.email}
    </span>
  )}
</div>
```

## 2. Global API Notifications (Toasts)
- **Trigger**: Non-critical errors like network timeouts, successful saves, or secondary fetch failures.
- **Visual**: A floating notification at the top-right (e.g., "Record Updated Successfully" or "Connection Failed. Retrying...").
- **Implementation**: Access via the [ToastContext.jsx](file:///d:/Muriet%20invetigation%20department/src/context/ToastContext.jsx) hook.

```jsx
const { addToast } = useToast();
try {
  const { error } = await supabase.from('cases').insert(newCase);
  if (error) throw error;
  addToast(t('common.save_success'), 'success');
} catch (err) {
  addToast(err.message, 'error');
}
```

## 3. Fatal/Blocker Errors (Modals)
- **Trigger**: Critical failures that prevent any user action, such as "Unauthorized Access" or "Database Migration Required."
- **Visual**: A non-dismissible modal over the entire page.
- **Logic**: Use a dedicated `errorState` to switch the entire module view to an `ErrorState` component.

## 4. Checklist
- [ ] Are required fields marked with `*`?
- [ ] Do API catch blocks always use `addToast`?
- [ ] Is the primary "Save" button disabled during `isLoading`?
