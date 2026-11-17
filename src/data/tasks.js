
const tasks = [
  {
    id: 1,
    title: "Complete DBMS assignment",
    description: "Finish normalization exercises",
    status: "pending",
    priority: "high",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Prepare for JavaScript test",
    description: "Revise promises and async/await",
    status: "in-progress",
    priority: "medium",
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    title: "Submit npm package project",
    description: "Prepare GitHub repository and documentation",
    status: "completed",
    priority: "high",
    createdAt: new Date().toISOString()
  }
];

module.exports = tasks;
