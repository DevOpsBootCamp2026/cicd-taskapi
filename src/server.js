const { createApp } = require("./app");
const { initDb } = require("./db");

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    createApp().listen(PORT, () => console.log(`taskapi listening on ${PORT}`));
  })
  .catch((err) => {
    console.error("failed to start:", err.message);
    process.exit(1);
  });
