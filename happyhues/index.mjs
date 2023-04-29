import axios from "axios";
import * as cheerio from "cheerio";

let cache = new Map();
let res = new Map();


function parseSection ($, sectionId, dom) {
  const prefix = `color-${sectionId}`;
  const heads = dom.find('h4');

  if (heads.length === 0) {
    dom.find('.section-hues-row').each((i, row) => {
      let title = $(row).find('.hue-title').text().toLowerCase().trim().replace(/\s/ig, '-');
      let value = $(row).find('.hue-hex').text().trim();
      let key = [prefix, title].join('-');

      res.set(key, value.trim())
    })
  } else {
    heads.each((idx, head) => {
      const $hues = $(head).nextUntil('h4');
      const block = $(head).text().toLowerCase().trim();

      $hues.find('.section-hues-row').each((i, row) => {
        let title = $(row).find('.hue-title').text().toLowerCase().trim().replace(/\s/ig, '-');
        let value = $(row).find('.hue-hex').text().trim();
        let key = [prefix, block, title].join('-');

        // if (cache.get(key)) {
        //   cache.set(key, cache.get(key) + 1)
        //   key = `${key}-${cache.get(key)}`
        // } else {
        //   cache.set(key, 1)
        // }
        res.set(key, value.trim())
      })
    });
  }
}

const fetchPages = async () => {
  try {
    const response = await axios.get('https://www.happyhues.co/palettes/14');
    const html = response.data;
    const $ = cheerio.load(html);

    $('.section.wf-section').each((i, wrap) => {
      console.log("🚀 ~ file: index.mjs:40 ~ $ ~ i:", i)
      parseSection($, i + 1, $(wrap));
    });

    let json = {};

    console.log("🚀 ~ file: index.mjs:33 ~ res:", res)
  } catch (err) {
    throw err;
  }
}

// Print all tags in the console
fetchPages().then(titles => console.log(titles));
