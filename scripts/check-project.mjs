import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "src/main.jsx",
  "src/App.jsx",
  "src/config/firebase.js",
  "src/pages/admin/AdminDashboardPage.jsx",
  "src/pages/student/StudentDashboardPage.jsx",
  "src/pages/student/ApplyScholarshipPage.jsx",
  "src/pages/admin/ApplicationReviewPage.jsx",
  "database.rules.json",
];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("Missing required files:\n" + missing.join("\n"));
  process.exit(1);
}
JSON.parse(fs.readFileSync(path.join(root, "database.rules.json"), "utf8"));
console.log(`Project structure OK (${required.length} core files verified).`);
