import WindowCollection from "@/Components/WindowCollection";
import Compiler from "@/Core/Compile/Compiler";
import { BindEventContext, RegisterEvent } from "@/Utils/Index";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Preview extends Vue {
  declare winEventHandlers;

  created() {
    this.winEventHandlers = {
      keydown: async function (e) {
        if (
          (e.target as HTMLElement).nodeName == "INPUT" || // 输入框
          (e.target as HTMLElement).nodeName == "TEXTAREA" // 文本框
        )
          return;

        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "x") {
          await this.$Store.dispatch("Window/CloseAllWindows");
          this.$Store.dispatch("Designer/SetPreview", false);
        }
        e.preventDefault();
      },
    };
    ElMessage({ message: "已进入预览模式，按Ctrl+Alt+X退出", type: "success", duration: 5000 });
    BindEventContext(this.winEventHandlers, this);
    RegisterEvent.call(window, this.winEventHandlers);
  }

  unmounted() {
    RegisterEvent.call(window, this.winEventHandlers, true);
    this.winEventHandlers = null;
    Compiler.Dispose();
  }

  render() {
    return (
      <div class="preview absolute bg-[#000000CC] left-0 top-0 w-full h-full z-[999]">
        <WindowCollection></WindowCollection>
      </div>
    );
  }
}
