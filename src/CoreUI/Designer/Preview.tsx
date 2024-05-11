import WindowCollection from "@/Components/WindowCollection";
import Compiler from "@/Core/Compile/Compiler";
import { BindEventContext, RegisterEvent } from "@/Utils/Index";
import { Component, Vue, Watch } from "vue-facing-decorator";

@Component
export default class Preview extends Vue {
  winEventHandlers = {
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

  // /**
  //  * 获取窗口实例数量
  //  */
  // get WindowInstancesCount() {
  //   return Object.keys(this.$Store.get.Window.Windows).length;
  // }

  // @Watch("WindowInstancesCount")
  // onWindowInstancesCountChanged(nv, ov) {
  //   if (nv && !ov) {
  //     ElMessage({ message: "已进入预览模式，按Ctrl+Alt+X退出", type: "success", duration: 5000 });
  //   }
  // }

  created() {
    ElMessage({ message: "已进入预览模式，按Ctrl+Alt+X退出", type: "success", duration: 5000 });
    BindEventContext(this.winEventHandlers, this);
    RegisterEvent.call(window, this.winEventHandlers);
  }

  unmounted() {
    RegisterEvent.call(window, this.winEventHandlers, true);
    this.winEventHandlers = null;
    this.$Store.dispatch("Window/ClearWindows");
    Compiler.Dispose();
  }

  render() {
    // if (this.WindowInstancesCount == 0) return null;
    return (
      <div class={css.preview}>
        <WindowCollection></WindowCollection>
      </div>
    );
  }
}
