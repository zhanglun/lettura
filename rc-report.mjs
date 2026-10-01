// React Compiler 编译覆盖报告：对 src 全量 transform，收集每个函数的
// CompileSuccess / CompileError(bail-out) 事件。仅诊断用，不入仓库。
import babel from "@babel/core";
import fs from "node:fs";
import path from "node:path";
import compilerPlugin from "babel-plugin-react-compiler";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      walk(p, out);
    } else if (/\.(tsx?|jsx?)$/.test(e.name) && !/\.test\.|\.d\.ts$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(SRC);
const report = { compiled: [], clean: [], bailout: [], parseFail: [] };

for (const file of files) {
  const code = fs.readFileSync(file, "utf8");
  const events = [];
  const rel = path.relative(ROOT, file);
  try {
    const result = babel.transformSync(code, {
      filename: file,
      parserOpts: { sourceType: "module", plugins: ["jsx", "typescript"] },
      plugins: [
        [
          compilerPlugin,
          {
            logger: {
              logEvent(fnName, event) {
                events.push({
                  fnName,
                  kind: event.kind,
                  reason: event?.detail?.reason ?? event?.detail?.options?.reason ?? "",
                  loc: event?.loc?.start
                    ? `${event.loc.start.line}:${event.loc.start.column}`
                    : "",
                });
              },
            },
          },
        ],
      ],
    });
    const isCompiled = /compiler-runtime|_c\(/.test(result.code ?? "");
    for (const ev of events) {
      if (ev.kind === "CompileError") {
        report.bailout.push({ file: rel, ...ev });
      }
    }
    const successes = events.filter((e) => e.kind === "CompileSuccess");
    if (successes.length > 0) {
      report.compiled.push({ file: rel, functions: successes.map((s) => s.fnName) });
    } else if (isCompiled && events.length === 0) {
      report.compiled.push({ file: rel, functions: ["(事件未上报，检测到缓存调用)"] });
    } else if (events.length === 0) {
      report.clean.push(rel);
    }
  } catch (err) {
    report.parseFail.push({ file: rel, message: String(err.message).split("\n")[0] });
  }
}

const nComp = report.compiled.reduce((s, f) => s + f.functions.length, 0);
console.log("═══ React Compiler 覆盖报告 ═══");
console.log(`扫描文件: ${files.length}`);
console.log(`编译成功的函数: ${nComp} 个（分布于 ${report.compiled.length} 个文件）`);
console.log(`bail-out: ${report.bailout.length} 个`);
console.log(`无组件/钩子的纯模块: ${report.clean.length} 个`);
console.log(`解析失败: ${report.parseFail.length} 个`);

if (report.bailout.length) {
  console.log("\n─── bail-out 明细（函数 / 位置 / 原因）───");
  for (const b of report.bailout) {
    console.log(`${b.file}  ${b.fnName}  @${b.loc}  ${b.kind}  ${b.reason}`);
  }
}
if (report.parseFail.length) {
  console.log("\n─── 解析失败 ───");
  for (const p of report.parseFail) console.log(`${p.file}: ${p.message}`);
}
console.log("\n─── 已编译函数清单 ───");
for (const c of report.compiled) {
  console.log(`${c.file}: ${c.functions.join(", ")}`);
}
