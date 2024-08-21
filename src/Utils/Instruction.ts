import { App } from "vue";

// 鼠标按下时的时间
let mouseDownTime: number = 0;
// wrapper 鼠标按下事件
function WrapperMouseDown(e: MouseEvent) {
  mouseDownTime = new Date().getTime();

  let wrapper = e.currentTarget as HTMLElement;
  let input = wrapper.querySelector("input") as HTMLInputElement;
  if (!input) {
    return;
  }
  input.onkeydown = (e) => {
    if (e.key === "Delete") {
      wrapper?.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
    }
  };
}
// wrapper 鼠标抬起事件
function WrapperMouseUp(e: MouseEvent) {
  let mouseUpTime = new Date().getTime();

  // 识别是否为点击事件，如果不是点击事件
  if (mouseUpTime - mouseDownTime > 150) {
    // 保留当前选中的文本
    let selection = window.getSelection();
    let range = selection?.getRangeAt(0);
    setTimeout(() => {
      // 重新选中文本
      selection?.removeAllRanges();
      selection?.addRange(range as Range);
    }, 0);
  }
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
    // ElSelectV2 的 选择placeholder 和 Delete键删除扩展
    app.directive("el-select-selectAndDelete", {
      mounted(el: HTMLElement, binding) {
        let wrapper = el.querySelector(".el-select__wrapper") as HTMLElement;
        // mouseDown 事件
        wrapper.addEventListener("mousedown", WrapperMouseDown);
        // mouseUp 事件
        wrapper.addEventListener("mouseup", WrapperMouseUp);
        // Delete 事件
        wrapper.onkeydown = (e) => {
          if (e.key === "Delete") {
            binding && binding.value && binding.value();
          }
          e.stopPropagation();
        };
      },
      unmounted(el: HTMLElement) {
        let wrapper = el.querySelector(".el-select__wrapper") as HTMLElement;
        wrapper.removeEventListener("mousedown", WrapperMouseDown);
        wrapper.removeEventListener("mouseup", WrapperMouseUp);
        wrapper.onkeydown = null;
      },
    });
  },
};
