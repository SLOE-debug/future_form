import { App, defineAsyncComponent } from "vue";

const RegisterControls = {
  install(app: App<Element>) {
    app.config.globalProperties.$Controls = [];

    // 使用 import.meta.glob 来动态导入 .tsx 文件
    const Controls = import.meta.glob("@/Controls/**/*.tsx");

    // 遍历所有匹配的文件并动态注册组件
    Object.keys(Controls).forEach((ComponentPath) => {
      const type = ComponentPath.substring(ComponentPath.lastIndexOf("/") + 1, ComponentPath.length - 4);
      app.config.globalProperties.$Controls.push(type);

      // 直接加载组件，不使用异步方式
      Controls[ComponentPath]().then((module: any) => {
        app.component(type, module.default);
      });
    });
  },
};

export default RegisterControls;
