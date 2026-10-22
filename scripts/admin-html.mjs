// بعد البناء: نسخة من index.html للوحة التحكم، بملف manifest بيفتح على /admin.
// هيك لما تنضاف /admin للشاشة الرئيسية، التطبيق بيفتح على لوحة التحكم مش الصفحة الرئيسية.
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("dist/index.html", "utf8");
const admin = html
  .replace('href="/manifest.webmanifest"', 'href="/admin.webmanifest"')
  .replace('name="apple-mobile-web-app-title" content="بَنان"', 'name="apple-mobile-web-app-title" content="إدارة بَنان"');
if (admin === html || !admin.includes("/admin.webmanifest")) throw new Error("admin-html: manifest link not found in dist/index.html");
writeFileSync("dist/admin.html", admin);
console.log("admin-html: wrote dist/admin.html");
