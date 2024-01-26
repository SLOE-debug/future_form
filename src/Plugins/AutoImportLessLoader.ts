let fs = require("fs");
let path = require("path");

module.exports = function (source) {
  let relativePath = this.resourcePath.replace(path.resolve("src") + "\\", "");
  let lessPath = path.join("@/Assets/Styles/", relativePath).replace(".tsx", ".less");
  let fullLessPath = path.resolve(lessPath.replace("@", "src"));
  let exists = fs.existsSync(fullLessPath);
  if (exists) {
    let prefix = `import css from "${lessPath.replace(/\\/gi, "/")}";`;

    if (path.basename(this.resourcePath) == "App.tsx") prefix = `import "${lessPath.replace(/\\/gi, "/")}";`;
    source = prefix + source;
  }

  return source;
};
