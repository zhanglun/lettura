import fs from "node:fs";
import path from "node:path";

const v = process.argv[2];
console.log("🚀 ~ file: update-version.mjs:3 ~ v:", v);
const pkg = fs.readFileSync(import.meta.dirname + "/../package.json", "utf-8");
const json = JSON.parse(pkg);
const version = json.version;
console.log("🚀 ~ file: update-version.mjs:6 ~ json:", json);
console.log("🚀 ~ file: update-version.mjs:7 ~ version:", version);
