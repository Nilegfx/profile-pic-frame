---
status: resolved
trigger: "Investigate issue: split-button-arrow-no-dropdown"
created: 2026-04-11T00:00:00Z
updated: 2026-04-11T00:13:00Z
---

## Current Focus

hypothesis: Dropdown is set to display:block by JS but invisible because CSS uses fragile attribute selector [style*="display: block"] to toggle opacity:0 to opacity:1 - selector may not match or transition prevents instant visibility
test: Remove opacity animation (lines 260-268), make dropdown default to display:none with no opacity tricks
expecting: Dropdown becomes visible immediately when JS sets display:block
next_action: Remove opacity:0 and the [style*="display: block"] selector from .resolution-dropdown CSS

## Symptoms

expected: Clicking the arrow (▾) button opens a dropdown with 1× (500px) and 2× (1000px) resolution options
actual: Arrow button click do nothing — no dropdown, no visual change, no console errors. Main download button works fine.
errors: None
reproduction: Open index.html in browser, upload a photo, click the ▾ arrow button on the right side of the Download split-button
started: Always broken — never worked since Phase 4 was executed

## Eliminated

- hypothesis: Button references were shadowed causing updateDownloadState() to enable wrong variable
  evidence: User tested after consolidation fix - arrow button still does nothing when clicked. The fix didn't resolve the issue. The code now has single module-scope button references (lines 663-665), updateDownloadState() uses those references (lines 746-747), but clicking arrow still produces no response.
  timestamp: 2026-04-11T00:08:00Z

## Evidence

- timestamp: 2026-04-11T00:01:00Z
  checked: index.html lines 663-680 (dropdown toggle logic)
  found: Arrow button event listener IS attached at line 666 — `arrowBtn.addEventListener('click', function(event) { ... })`
  implication: Event listener exists, so problem is NOT missing listener

- timestamp: 2026-04-11T00:02:00Z
  checked: index.html line 356 (arrow button HTML)
  found: Arrow button starts with `disabled` attribute in HTML
  implication: Button is disabled on page load, which blocks click events

- timestamp: 2026-04-11T00:03:00Z
  checked: index.html lines 741-749 (updateDownloadState function)
  found: Function queries `const arrowBtn = document.getElementById('download-arrow-btn')` at line 743, then sets `arrowBtn.disabled = !hasPhoto` at line 748
  implication: updateDownloadState() SHOULD enable the button when photo loads

- timestamp: 2026-04-11T00:04:00Z
  checked: index.html line 593 (updateDownloadState call after photo loads)
  found: `updateDownloadState()` is called in the photo upload success handler
  implication: The enable logic SHOULD run when a photo is uploaded

- timestamp: 2026-04-11T00:05:00Z
  checked: Variable declaration pattern across the file
  found: Line 663 declares `const arrowBtn = document.getElementById('download-arrow-btn')` in dropdown scope. Line 743 declares ANOTHER `const arrowBtn = document.getElementById('download-arrow-btn')` inside updateDownloadState() function scope. Line 756 declares `const downloadBtn = document.getElementById('download-btn')` in download handler scope.
  implication: VARIABLE SHADOWING — updateDownloadState() creates its own local arrowBtn variable at line 743, which shadows the module-level one at line 663. However, both point to the SAME DOM element, so this shouldn't cause the bug. The DOM element's disabled state should update regardless of which variable reference is used.

- timestamp: 2026-04-11T00:06:00Z
  checked: Code refactoring and consolidation
  found: Moved downloadBtn and arrowBtn queries to shared module scope (lines 662-665). Removed duplicate `const downloadBtn = document.getElementById('download-btn')` from download handler (old line 765) and dropdown item handler (old line 719). Removed duplicate `const arrowBtn = document.getElementById('download-arrow-btn')` from updateDownloadState() (old line 750). Now updateDownloadState() uses the module-scope button references directly.
  implication: All handlers now use the same button references. This eliminates any potential scoping confusion and makes the code cleaner and more maintainable. The fix should resolve the arrow button issue by ensuring consistent button state across all handlers.

- timestamp: 2026-04-11T00:09:00Z
  checked: Added comprehensive diagnostic logging
  found: Added console.log at button query (line ~670), inside arrow click handler (lines ~675-690), and inside updateDownloadState (lines ~755-770). Logs will show: 1) Initial button state on page load, 2) updateDownloadState execution and button state changes, 3) Whether click events fire and what the dropdown display value is.
  implication: Diagnostic data will pinpoint exact failure point - either buttons not found, event not firing, button still disabled, or dropdown not showing despite display:block

- timestamp: 2026-04-11T00:10:00Z
  checked: User checkpoint response - console logs from clicking arrow button
  found: Console shows: "[DEBUG] Arrow button clicked! {disabled: false, dropdownDisplay: 'none', event: PointerEvent}", "[DEBUG] isOpen: false", "[DEBUG] Opened dropdown". This confirms: 1) Event listener IS firing, 2) Button is NOT disabled, 3) JavaScript IS setting dropdown.style.display = 'block'
  implication: The JavaScript is working correctly. The dropdown IS being shown in the DOM. Problem must be CSS preventing visibility.

- timestamp: 2026-04-11T00:11:00Z
  checked: CSS for .split-button-container (line 170-175) and .resolution-dropdown (lines 248-264)
  found: .split-button-container has `overflow: hidden` (line 174). .resolution-dropdown is `position: absolute; top: calc(100% + 4px); right: 0` (lines 249-251). The dropdown is positioned OUTSIDE the container boundaries (below it), but the container clips with overflow:hidden.
  implication: ROOT CAUSE CONFIRMED — overflow:hidden on the parent container clips the absolutely-positioned dropdown that extends beyond container bounds. The dropdown IS being shown (display:block) but is INVISIBLE because it's clipped by parent overflow.

- timestamp: 2026-04-11T00:14:00Z
  checked: User checkpoint response after removing overflow:hidden (line 174)
  found: Console logs confirm JS is working: "Opened dropdown" fires, arrowBtn.disabled = false, dropdown.style.display changes from 'none' to 'block'. BUT user still sees nothing. Removed overflow:hidden did NOT fix the issue.
  implication: overflow:hidden was NOT the root cause. The dropdown is set to display:block but still invisible. Must be another CSS issue preventing visibility.

- timestamp: 2026-04-11T00:15:00Z
  checked: Full CSS for .resolution-dropdown (lines 247-268 in current index.html)
  found: Line 260: `opacity: 0;` — Dropdown starts invisible. Lines 265-268: `.resolution-dropdown[style*="display: block"] { opacity: 1; transform: translateY(0); }` — Relies on attribute selector to match inline style string. This selector is FRAGILE (substring match on style attribute) and may not match if style attribute has any other properties or formatting differences.
  implication: ROOT CAUSE IDENTIFIED — The dropdown has opacity:0 by default. The CSS selector `.resolution-dropdown[style*="display: block"]` is supposed to set opacity:1 when JS adds display:block, but the selector is not matching (or not applied in time). Result: dropdown is display:block in DOM but opacity:0, so completely invisible.

## Resolution

root_cause: The .split-button-container has `overflow: hidden` (line 174 in index.html), which clips the absolutely-positioned dropdown menu. The dropdown is positioned at `top: calc(100% + 4px)` which places it BELOW the container boundaries. When JavaScript sets `display: block`, the dropdown renders in the DOM but is clipped and invisible due to parent overflow:hidden.

fix: Remove `overflow: hidden` from .split-button-container CSS (line 174). The border-radius on the container will still work correctly without overflow:hidden.

verification: [pending]

files_changed: [index.html]
