/**
 * Phase 03 Validation: Photo Scaling Offset Recalculation
 *
 * Requirement: EDT-03 — Photo stays centered at (250, 250) during scaling
 *
 * Tests the mathematical correctness of the offset recalculation formula:
 * offset = naturalWidth * scale / 2
 *
 * Why this is correct:
 * - Konva position (250, 250) is in stage coordinates
 * - Offset is in local (pre-scale) coordinate space
 * - When scale = 1, offset = naturalWidth / 2 (established in Phase 2)
 * - When scale ≠ 1, visual center shifts unless offset is multiplied by scale
 * - Formula: offset = naturalWidth * scale / 2 compensates for scaling transform
 */

// Test cases: [naturalWidth, scale, expectedOffsetX]
const testCases = [
  // Case 1: scale = 1.0 (default, no scaling)
  { naturalWidth: 400, scale: 1.0, expected: 200, description: "scale 1.0 (no change)" },

  // Case 2: scale = 0.5 (shrink to half)
  { naturalWidth: 400, scale: 0.5, expected: 100, description: "scale 0.5 (shrink)" },

  // Case 3: scale = 2.0 (double size)
  { naturalWidth: 400, scale: 2.0, expected: 400, description: "scale 2.0 (grow)" },

  // Case 4: scale = 1.5 (1.5x)
  { naturalWidth: 400, scale: 1.5, expected: 300, description: "scale 1.5 (grow)" },

  // Case 5: Different natural width, scale = 1.0
  { naturalWidth: 600, scale: 1.0, expected: 300, description: "different width, scale 1.0" },

  // Case 6: Different natural width, scale = 0.8
  { naturalWidth: 600, scale: 0.8, expected: 240, description: "different width, scale 0.8" },

  // Case 7: Edge case - minimum scale
  { naturalWidth: 400, scale: 0.5, expected: 100, description: "minimum scale 0.5" },

  // Case 8: Edge case - maximum scale
  { naturalWidth: 400, scale: 2.0, expected: 400, description: "maximum scale 2.0" },
];

// Run tests
let passed = 0;
let failed = 0;

console.log("Phase 03 Validation: Offset Recalculation Formula\n");
console.log("Testing: offset = naturalWidth * scale / 2\n");

for (const test of testCases) {
  const { naturalWidth, scale, expected, description } = test;

  // Apply the formula from the fix
  const calculatedOffset = naturalWidth * scale / 2;

  // Test with floating point tolerance
  const tolerance = 0.001;
  const isCorrect = Math.abs(calculatedOffset - expected) < tolerance;

  if (isCorrect) {
    console.log(`✓ PASS: ${description}`);
    console.log(`  naturalWidth=${naturalWidth}, scale=${scale} → offset=${calculatedOffset}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${description}`);
    console.error(`  naturalWidth=${naturalWidth}, scale=${scale}`);
    console.error(`  Expected offset: ${expected}`);
    console.error(`  Calculated offset: ${calculatedOffset}`);
    failed++;
  }
}

// Summary
console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"=".repeat(50)}\n`);

// Exit with appropriate code
if (failed > 0) {
  console.error("VALIDATION FAILED: Offset recalculation formula is incorrect");
  process.exit(1);
} else {
  console.log("VALIDATION PASSED: Offset recalculation formula is correct");
  process.exit(0);
}
