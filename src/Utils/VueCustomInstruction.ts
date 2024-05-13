import { App } from "vue";

export const VueCustomInstruction = {
  install(app: App<Element>) {
    app.directive("onFocus", (el: HTMLElement, binding) => {
      el.querySelector("input").onfocus = binding.value;
    });
  },
};
