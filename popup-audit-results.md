# Popup and Login Flow Audit Results
Generated: 2025-08-06T02:47:41.997Z

## Summary
- Total users tested: 3
- Popups found: 3
- Screenshots captured: 15
- Issues identified: 3

## Popup Analysis

### free User Popups:
- [class*="cookie"]: 1
- [class*="backdrop"]: 3
- [class*="close"]: 12
- [style*="z-index"]: 2

### premium User Popups:
- [class*="cookie"]: 1
- [class*="backdrop"]: 3
- [class*="close"]: 12
- [style*="z-index"]: 2

### admin User Popups:
- [class*="cookie"]: 1
- [class*="backdrop"]: 3
- [class*="close"]: 12
- [style*="z-index"]: 2


## Login Test Results

### free User:
- Login button found: ✅  
- Email field found: ✅
- Password field found: ✅
- Submit successful: ✅

### premium User:
- Login button found: ✅  
- Email field found: ✅
- Password field found: ✅
- Submit successful: ✅

### admin User:
- Login button found: ✅  
- Email field found: ✅
- Password field found: ✅
- Submit successful: ✅


## Issues Identified

### free - submit_button_not_clickable:
```
locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button[type="submit"]').first()[22m
[2m    - locator resolved to <button type="submit" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">Sign In</button>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="flex-grow">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">We use cookies to enhance your experience, analyz…</p> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  2 × retrying click action[22m
[2m      - waiting 100ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="p-6">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  2 × retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="flex-grow">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">We use cookies to enhance your experience, analyz…</p> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="p-6">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="p-6">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  - retrying click action[22m
[2m    - waiting 500ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <div class="flex-grow">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  - retrying click action[22m
[2m    - waiting 500ms[22m

```
Selector: button[type="submit"]

### premium - submit_button_not_clickable:
```
locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button[type="submit"]').first()[22m
[2m    - locator resolved to <button type="submit" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">Sign In</button>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="flex-grow">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">We use cookies to enhance your experience, analyz…</p> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  2 × retrying click action[22m
[2m      - waiting 100ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="p-6">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  2 × retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="flex-grow">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">We use cookies to enhance your experience, analyz…</p> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="p-6">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="p-6">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  - retrying click action[22m
[2m    - waiting 500ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <div class="flex-grow">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  - retrying click action[22m
[2m    - waiting 500ms[22m

```
Selector: button[type="submit"]

### admin - submit_button_not_clickable:
```
locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button[type="submit"]').first()[22m
[2m    - locator resolved to <button type="submit" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">Sign In</button>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="flex-grow">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">We use cookies to enhance your experience, analyz…</p> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  2 × retrying click action[22m
[2m      - waiting 100ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="p-6">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  2 × retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="flex-grow">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">We use cookies to enhance your experience, analyz…</p> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="p-6">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="p-6">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  - retrying click action[22m
[2m    - waiting 500ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <div class="flex-grow">…</div> from <slot>…</slot> subtree intercepts pointer events[22m
[2m  - retrying click action[22m
[2m    - waiting 500ms[22m

```
Selector: button[type="submit"]


## Screenshots Captured
- audit-free-01-initial.png
- audit-free-02-before-login-click.png
- audit-free-03-after-login-click.png
- audit-free-04-form-filled.png
- audit-free-05-after-submit.png
- audit-premium-01-initial.png
- audit-premium-02-before-login-click.png
- audit-premium-03-after-login-click.png
- audit-premium-04-form-filled.png
- audit-premium-05-after-submit.png
- audit-admin-01-initial.png
- audit-admin-02-before-login-click.png
- audit-admin-03-after-login-click.png
- audit-admin-04-form-filled.png
- audit-admin-05-after-submit.png
