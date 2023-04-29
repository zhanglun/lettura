
let cache = new Map();
let res = new Map();

function parseSection (dom) {
  const heads = dom.querySelectorAll('h4');
  const hues = dom.querySelectorAll('.hues-wrap');
  console.log("%c Line:8 🥔 hues", "color:#b03734", hues);

  heads.forEach((head, idx) => {
    const block = head.innerText.toLowerCase().trim();
    hues[idx].querySelectorAll('.section-hues-row').forEach(($row) => {
      let [title, value] = $row.innerText.split('\n');
      const key = ['color', block, title.toLowerCase().trim().replace(/\s/, '-')]

      if (cache.get(key)) {
        key.push(cache.get(key) + 1)
      } else {
        cache.set(key, 1)
      }

      res.set(key, value.trim())
    })
  });
}

document.querySelectorAll('.section-hues-wrap').forEach(($wrap) => {
  parseSection($wrap);
})

let json = {};
for (val of res) {
  console.log("%c Line:33 🍭 val", "color:#33a5ff", val);
  json[val[0].join('-')] = val[1];
}

console.log("%c Line:34 🌰 json", "color:#7f2b82", json);
