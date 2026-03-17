# Mobile Search Icon Fix

## Problem
The mobile search icon in the footer was only functioning properly on the first click. After that, it failed to focus the search bar at the top of the dog list page.

## Root Cause
1. The search icon used `window.location.href = '/psi#search'` which caused a full page reload
2. The hash-based approach in `DogList.tsx` cleared the hash after the first focus using `window.history.replaceState(null, '', window.location.pathname)`
3. Subsequent clicks couldn't trigger the focus effect because the hash was already cleared
4. On mobile, full page reloads had timing issues that interfered with the focus logic

## Solution
Implemented a dual-approach fix:

### 1. Footer.tsx Changes
- Added React Router's `useNavigate` and `useLocation` hooks
- Changed search icon click handler to:
  - **If already on `/psi` page**: Dispatch a custom `focus-search` event
  - **If on different page**: Navigate to `/psi#search` using React Router (no full reload)

### 2. DogList.tsx Changes
- Added a new custom event listener for `focus-search` event
- The event handler:
  - Sets `searchActive` state for visual feedback
  - Scrolls to top
  - Focuses the search input after a short delay
  - Removes highlight after 2 seconds
- Simplified the hash-based logic to run only on initial mount
- The hash effect now dispatches the same custom event for consistency

## Benefits
1. **No full page reloads** when already on the `/psi` page
2. **Consistent behavior** on every click (first, second, third, etc.)
3. **Better timing** for focus on mobile devices
4. **Cleaner code** with reusable custom event pattern
5. **Visual feedback** with search highlight that fades after 2 seconds

## Files Modified
- `client/src/components/Footer.tsx`
- `client/src/components/pages/DogList.tsx`

## Testing
The fix has been implemented and should work automatically with the running development server. Test by:
1. Clicking the search icon from any page (should navigate to `/psi` and focus search)
2. Clicking the search icon while already on `/psi` page (should focus search without navigation)
3. Testing on mobile device to ensure keyboard appears on focus
4. Testing rapid multiple clicks to ensure all work correctly