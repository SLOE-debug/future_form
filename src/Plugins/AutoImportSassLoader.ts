let fs = require("fs");
let path = require("path");

module.exports = function (source) {
  let relativePath = this.resourcePath.replace(path.resolve("src") + "\\", "");
  let sassPath = path.join("@/Assets/Sass/", relativePath).replace(".tsx", ".scss");
  let fullPath = path.resolve(sassPath.replace("@", "src"));
  let exists = fs.existsSync(fullPath);
  if (exists) {
    let prefix = `import css from "${sassPath.replace(/\\/gi, "/")}";`;

    if (path.basename(this.resourcePath) == "App.tsx") prefix = `import "${sassPath.replace(/\\/gi, "/")}";`;
    source = prefix + source;
  }

  return source;
};
