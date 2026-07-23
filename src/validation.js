// Pure validation helpers — no database, no framework.
// These are the easiest things to UNIT test: given input, assert output.
const PRIORITIES = ["low", "medium", "high"];

function validateTask(input) {
  const errors = [];
  const title = (input && typeof input.title === "string" ? input.title : "").trim();
  const priority = input && input.priority != null ? input.priority : "medium";

  if (!title) errors.push("title is required");
  if (title.length > 200) errors.push("title must be <= 200 characters");
  if (!PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: ${PRIORITIES.join(", ")}`);
  }
  return { valid: errors.length === 0, errors, value: { title, priority } };
}

module.exports = { validateTask, PRIORITIES };
