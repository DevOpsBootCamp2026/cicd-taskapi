const { validateTask, PRIORITIES } = require("../../src/validation");

describe("validateTask (unit)", () => {
  test("accepts a valid task and trims the title", () => {
    const r = validateTask({ title: "  Buy milk  ", priority: "high" });
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.value).toEqual({ title: "Buy milk", priority: "high" });
  });

  test("defaults priority to medium when missing", () => {
    const r = validateTask({ title: "No priority" });
    expect(r.valid).toBe(true);
    expect(r.value.priority).toBe("medium");
  });

  test("rejects an empty title", () => {
    const r = validateTask({ title: "   " });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("title is required");
  });

  test("rejects a title longer than 200 chars", () => {
    const r = validateTask({ title: "x".repeat(201) });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("title must be <= 200 characters");
  });

  test("rejects an invalid priority", () => {
    const r = validateTask({ title: "ok", priority: "urgent" });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/priority must be one of/);
  });

  test("PRIORITIES are the three expected levels", () => {
    expect(PRIORITIES).toEqual(["low", "medium", "high"]);
  });
});
