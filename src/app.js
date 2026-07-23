const express = require("express");
const { pool } = require("./db");
const { validateTask } = require("./validation");

function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.get("/api/tasks", async (_req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM tasks ORDER BY id DESC");
      res.json({ tasks: rows });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    const { valid, errors, value } = validateTask(req.body);
    if (!valid) return res.status(400).json({ errors });
    try {
      const { rows } = await pool.query(
        "INSERT INTO tasks (title, priority) VALUES ($1,$2) RETURNING *",
        [value.title, value.priority]
      );
      res.status(201).json({ task: rows[0] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM tasks WHERE id=$1", [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: "not found" });
      res.json({ task: rows[0] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/tasks/:id/toggle", async (req, res) => {
    try {
      const { rows } = await pool.query(
        "UPDATE tasks SET done = NOT done WHERE id=$1 RETURNING *",
        [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: "not found" });
      res.json({ task: rows[0] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const { rowCount } = await pool.query("DELETE FROM tasks WHERE id=$1", [req.params.id]);
      if (!rowCount) return res.status(404).json({ error: "not found" });
      res.status(204).end();
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return app;
}

module.exports = { createApp };
