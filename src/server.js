const app = require("./app");

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`CampusFlow server running at http://localhost:${PORT}`);
});
