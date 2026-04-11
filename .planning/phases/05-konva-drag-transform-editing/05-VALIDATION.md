---
phase: 5
slug: konva-drag-transform-editing
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-11
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — browser-only app, manual + visual verification |
| **Config file** | none |
| **Quick run command** | `open index.html` (or `python3 -m http.server 8080`) |
| **Full suite command** | Manual UAT checklist (see below) |
| **Estimated runtime** | ~2 minutes manual verification |

---

## Sampling Rate

- **After every task commit:** Open `index.html`, verify task acceptance criteria visually
- **After every plan wave:** Run full manual UAT checklist
- **Before `/gsd-verify-work`:** All manual checklist items must pass
- **Max feedback latency:** ~2 minutes (manual browser check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | EDT-01 | — | N/A | manual | open index.html, upload photo, drag photo to new position | ✅ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | EDT-02 | — | N/A | manual | open index.html, upload photo, verify transformer handles appear | ✅ W0 | ⬜ pending |
| 05-01-03 | 01 | 2 | EDT-02 | — | N/A | manual | resize photo with corner handle, verify aspect ratio maintained | ✅ W0 | ⬜ pending |
| 05-01-04 | 01 | 2 | EDT-03 | — | N/A | manual | download PNG, verify transformer handles not visible in image | ✅ W0 | ⬜ pending |
| 05-01-05 | 01 | 3 | EDT-01 | — | N/A | manual | verify photo slider is removed from UI | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

This is a single-file browser app with no test framework. All verification is manual/visual.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Photo drag repositioning | EDT-01 | Browser canvas interaction, no DOM to query | Upload photo, click and drag it to a new position, verify it moves |
| Transformer handles appear on click | EDT-02 | Visual Konva canvas elements, not DOM | Upload photo, click on it, verify 8 anchor handles appear around photo |
| Aspect-ratio locked resize | EDT-02 | Visual proportional behavior | Drag corner handle, verify photo scales proportionally without distortion |
| Handles hidden in export | EDT-03 | Visual inspection of downloaded file | Click download, open downloaded PNG, verify no handles visible |
| Drag boundary clamping | EDT-01 | Interaction at canvas edges | Drag photo to edge, verify at least 50px remains visible within canvas |
| Slider removed from UI | EDT-01 | UI element removal | Verify no photo scale slider in UI after loading |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
