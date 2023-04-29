import axios from "axios";
import * as cheerio from "cheerio";

function parseSection ($, sectionId, dom) {
  const prefix = `color-${sectionId}`;
  const result = new Map();
  const heads = dom.find('h4');

  if (heads.length === 0) {
    dom.find('.section-hues-row').each((i, row) => {
      let title = $(row).find('.hue-title').text().toLowerCase().trim().replace(/\s/ig, '-');
      let value = $(row).find('.hue-hex').text().trim();
      let key = [prefix, title].join('-');

      result.set(key, value.trim())
    })
  } else {
    heads.each((idx, head) => {
      const $hues = $(head).nextUntil('h4');
      const block = $(head).text().toLowerCase().trim();

      $hues.find('.section-hues-row').each((i, row) => {
        let title = $(row).find('.hue-title').text().toLowerCase().trim().replace(/\s/ig, '-');
        let value = $(row).find('.hue-hex').text().trim();
        let key = [prefix, block, title].join('-');

        result.set(key, value.trim())
      })
    });
  }

  return result;
}

const baseUrl = 'https://www.happyhues.co/palettes/';
const idLen = Array.from(new Array(2).keys());

const fetchPalette = async (id) => {
  let palette = {};

  try {
    const response = await axios.get(baseUrl + id);
    const html = response.data;
    const $ = cheerio.load(html);

    $('.section.wf-section').each((i, wrap) => {
      let result = parseSection($, i + 1, $(wrap));
      console.log("🚀 ~ file: index.mjs:49 ~ $ ~ result:", result)

      result.forEach((val, key) => {
        palette[key] = { value: val };
      })
    });

    return palette;
  } catch (err) {
    throw err;
  }
}

let list = [];
let p = Promise.resolve();
idLen.forEach((idx) => {
  p = p.then(()=> {
    return fetchPalette(idx + 1)
  }).then((res) => {
    list.push(res)
    return res
  })
})

p.then(() => {
  console.log(list)
})

