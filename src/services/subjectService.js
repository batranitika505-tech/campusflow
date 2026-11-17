const { readData } = require("../utils/fileStorage");

// Get all unique subjects sorted alphabetically
async function getAllSubjects() {
  const assignments = await readData();
  const subjectsSet = new Set();

  for (const item of assignments) {
    if (item.subject && typeof item.subject === "string" && item.subject.trim()) {
      subjectsSet.add(item.subject.trim());
    }
  }

  return Array.from(subjectsSet).sort((a, b) => a.localeCompare(b));
}

module.exports = {
  getAllSubjects,
};
