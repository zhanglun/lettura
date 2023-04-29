import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";
import StyleDictionary from "style-dictionary";
import path from "path";

function parseSection($, sectionId, dom) {
  const prefix = `color-${sectionId}`;
  const result = new Map();
  const heads = dom.find("h4");

  if (heads.length === 0) {
    dom.find(".section-hues-row").each((i, row) => {
      let title = $(row)
        .find(".hue-title")
        .text()
        .toLowerCase()
        .trim()
        .replace(/\s/gi, "-");
      let value = $(row).find(".hue-hex").text().trim();
      let key = [prefix, title].join("-");

      result.set(key, value.trim());
    });
  } else {
    heads.each((idx, head) => {
      const $hues = $(head).nextUntil("h4");
      const block = $(head).text().toLowerCase().trim();

      $hues.find(".section-hues-row").each((i, row) => {
        let title = $(row)
          .find(".hue-title")
          .text()
          .toLowerCase()
          .trim()
          .replace(/\s/gi, "-");
        let value = $(row).find(".hue-hex").text().trim();
        let key = [prefix, block, title].join("-");

        result.set(key, value.trim());
      });
    });
  }

  return result;
}

const baseUrl = "https://www.happyhues.co/palettes/";
const idLen = Array.from(new Array(17).keys());

const fetchPalette = async (id) => {
  let palette = {};

  try {
    const response = await axios.get(baseUrl + id);
    const html = response.data;
    const $ = cheerio.load(html);

    $(".section.wf-section").each((i, wrap) => {
      let result = parseSection($, i + 1, $(wrap));

      result.forEach((val, key) => {
        palette[key] = { value: val };
      });
    });

    return palette;
  } catch (err) {
    throw err;
  }
};

let list = [];
let p = Promise.resolve();
idLen.forEach((idx) => {
  p = p
    .then(() => {
      return fetchPalette(idx + 1);
    })
    .then((res) => {
      const filename = `palette${idx + 1}`;
      const filepath = `./token/${filename}.json`;

      console.log("🚀 ~ file: index.mjs:83 ~ .then ~ filename:", filename)

      list.push(filename);

      fs.writeFileSync(filepath, JSON.stringify(res, null, "  "));
      setTimeout(() => {
        return Promise.resolve(res);
      }, 2000);
    });
});

p.then(() => {
  console.log(list);
  const sdExtend = StyleDictionary.extend({
    source: ["./token/**/*.json"],
    platforms: {
      scss: {
        transformGroup: "scss",
        buildPath: "dist/scss/",
        files: list.map((filename) => {
          return {
            destination: filename + '.scss',
            format: "scss/variables",
          };
        }),
      },
      css: {
        transformGroup: "css",
        buildPath: "dist/css/",
        files: list.map((filename) => {
          return {
            destination: filename + '.css',
            format: "css/variables",
          };
        }),
      },
      ts: {
        transformGroup: "js",
        buildPath: "dist/ts/",
        files: [...list.map((filename) => {
          return {
            destination: filename + '.ts',
            format: "javascript/es6",
          };
        }), ...list.map((filename) => {
          return {
            destination: filename + '.d.ts',
            format: "typescript/es6-declarations",
          };
        })],
      },
    },
  });

  sdExtend.buildAllPlatforms();
});
