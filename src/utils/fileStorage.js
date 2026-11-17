
const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_FILE = path.join(__dirname, "../data/assignments.json");

async function readData() {
  try {
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(fileContent);

    if (!Array.isArray(data)) {
      throw new Error("Assignment data must be an array");
    }

    return data;
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeData([]);
      return [];
    }

    throw error;
  }
}

async function writeData(data) {
  if (!Array.isArray(data)) {
    throw new TypeError("Data must be an array");
  }

  const content = JSON.stringify(data, null, 2);

  await fs.writeFile(DATA_FILE, content, "utf-8");
}

async function getNextId() {
  const assignments = await readData();

  if (assignments.length === 0) {
    return 1;
  }

  return Math.max(...assignments.map((assignment) => assignment.id)) + 1;
}

module.exports = {
  readData,
  writeData,
  getNextId,
};
