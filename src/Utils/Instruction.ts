import { App } from "vue";

export const Instruction = {
  install(app: App<Element>) {
    app.directive("focus", (el: HTMLElement) => {
      setTimeout(() => {
        if (el.nodeName === "INPUT") {
          setTimeout(() => {
            el.focus();
          }, 0);
          return;
        }
        el.querySelector("input").focus();
      }, 0);
    });
  },
};
