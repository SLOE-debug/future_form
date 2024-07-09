import { App } from "vue";

/**
 * 计算宽度并将Input的内容设置为占位符
 */
function CalculateWidthAndSetPlaceholder(input: HTMLInputElement, placeholder: HTMLSpanElement) {
  setTimeout(() => {
    input.value = placeholder.innerText;
    placeholder.style.display = "none";
    // 计算宽度
    let span = document.createElement("span");
    span.innerText = input.value;
    span.style.whiteSpace = "pre";
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    document.body.appendChild(span);
    input.style.width = span.offsetWidth + 20 + "px";
    span.remove();
    input.select();
  }, 0);
}

/**
 * 选中ElEslectV2的内容
 */
function SelectContent(e: MouseEvent) {
  let el = e.currentTarget as HTMLElement;
  let input = el.querySelector("input") as HTMLInputElement;

  // 占位符 div
  let placeholder = el.querySelector(".el-select__placeholder") as HTMLSpanElement;

  if (!input) return;
  input.onkeydown = (e) => {
    if (e.key === "Delete") {
      el?.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
    }
  };
  input.onclick = (e) => {
    // 如果当前 input 没有内容，则显示占位符
    if (!input.value) {
      CalculateWidthAndSetPlaceholder(input, placeholder);
    }
  };
  input.onblur = (e) => {
    el?.dispatchEvent(new Event("blur"));
  };

  if (!placeholder) return;
  CalculateWidthAndSetPlaceholder(input, placeholder);
}

/**
 * 移出ElSelectV2时，显示占位符
 */
function ShowPlaceholder(e: MouseEvent) {
  let el = e.currentTarget as HTMLElement;
  let placeholder = el.querySelector(".el-select__placeholder") as HTMLSpanElement;
  if (placeholder) placeholder.style.display = "";
}

export const Instruction = {
  install(app: App<Element>) {
    app.directive("focus", {
      mounted(el: HTMLElement) {
        setTimeout(() => {
          if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
            el.focus();
            return;
          }
          el.querySelector("input")?.focus();
          el.querySelector("textarea")?.focus();
        }, 0);
      },
    });
    app.directive("onFocus", {
      mounted(el: HTMLElement, binding) {
        el.querySelector("input").onfocus = binding.value;
      },
      unmounted(el: HTMLElement) {
        el.querySelector("input").onfocus = null;
      },
    });
    // ElSelectV2 组件的复制扩展
    app.directive("el-select-copy", {
      mounted(el: HTMLElement, binding) {
        let wrapper = el.querySelector(".el-select__wrapper") as HTMLElement;

        // let selection = el.querySelector(".el-select__selection") as HTMLElement;
        wrapper.addEventListener("click", SelectContent);
        wrapper.addEventListener("mouseleave", ShowPlaceholder);
        wrapper.onblur = ShowPlaceholder;
      },
      unmounted(el: HTMLElement) {
        let wrapper = el.querySelector(".el-select__wrapper") as HTMLElement;
        // let selection = el.querySelector(".el-select__selection") as HTMLElement;
        wrapper.removeEventListener("click", SelectContent);
        wrapper.removeEventListener("mouseleave", ShowPlaceholder);
        wrapper.onblur = null;
      },
    });
    // ElSelectV2的Delete键删除扩展
    app.directive("el-select-delete", {
      mounted(el: HTMLElement, binding) {
        let wrapper = el.querySelector(".el-select__wrapper") as HTMLElement;
        wrapper.onkeydown = (e) => {
          if (e.key === "Delete") {
            binding && binding.value && binding.value();
          }
          e.stopPropagation();
        };
      },
      unmounted(el: HTMLElement) {
        let wrapper = el.querySelector(".el-select__wrapper") as HTMLElement;
        wrapper.onkeydown = null;
      },
    });
  },
};
