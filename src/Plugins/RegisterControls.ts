import { App } from "vue";

const RegisterControls = {
  install(app: App<Element>) {
    app.config.globalProperties.$Controls = [];
    let Controls = require.context("@/Controls", true, /\.tsx$/);
    Controls.keys().forEach((ComponentPath) => {
      let type = ComponentPath.substring(2, ComponentPath.length - 4);
      app.config.globalProperties.$Controls.push(type);
      let Commpone = __webpack_require__(Controls.resolve(ComponentPath));
      app.component(type, Commpone.default);
    });
  },
};

export default RegisterControls;
