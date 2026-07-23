const request = require("supertest");
const { createApp } = require("../../src/app");
const { pool, initDb } = require("../../src/db");

const app = createApp();

beforeAll(async () => {
  await initDb();               // ensure the table exists (CI provides Postgres)
});

beforeEach(async () => {
  await pool.query("TRUNCATE tasks RESTART IDENTITY");   // clean slate per test
});

afterAll(async () => {
  await pool.end();             // close the pool so Jest can exit
});

describe("Task API (integration)", () => {
  test("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  test("POST then GET a task (round trip)", async () => {
    const create = await request(app)
      .post("/api/tasks")
      .send({ title: "Write tests", priority: "high" });
    expect(create.status).toBe(201);
    expect(create.body.task).toMatchObject({ title: "Write tests", priority: "high", done: false });

    const id = create.body.task.id;
    const get = await request(app).get(`/api/tasks/${id}`);
    expect(get.status).toBe(200);
    expect(get.body.task.title).toBe("Write tests");
  });

  test("POST with invalid data returns 400 + errors", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toContain("title is required");
  });

  test("GET /api/tasks lists created tasks (newest first)", async () => {
    await request(app).post("/api/tasks").send({ title: "first" });
    await request(app).post("/api/tasks").send({ title: "second" });
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(2);
    expect(res.body.tasks[0].title).toBe("second");
  });

  test("PATCH toggle flips done", async () => {
    const { body } = await request(app).post("/api/tasks").send({ title: "toggle me" });
    const res = await request(app).patch(`/api/tasks/${body.task.id}/toggle`);
    expect(res.status).toBe(200);
    expect(res.body.task.done).toBe(true);
  });

  test("DELETE removes a task (then 404)", async () => {
    const { body } = await request(app).post("/api/tasks").send({ title: "delete me" });
    const del = await request(app).delete(`/api/tasks/${body.task.id}`);
    expect(del.status).toBe(204);
    const get = await request(app).get(`/api/tasks/${body.task.id}`);
    expect(get.status).toBe(404);
  });

  test("GET missing task returns 404", async () => {
    const res = await request(app).get("/api/tasks/99999");
    expect(res.status).toBe(404);
  });
});
