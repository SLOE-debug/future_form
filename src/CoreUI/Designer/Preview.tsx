import WindowCollection from "@/Components/WindowCollection";
import Compiler from "@/Core/Compile/Compile";
import { BindEventContext, RegisterEvent } from "@/Utils/Index";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Preview extends Vue {
  winEventHandlers = {
    keydown: function (e) {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "x") {
        this.$Store.dispatch("Designer/SetPreview", false);
      }
      e.preventDefault();
    },
  };
  created() {
    BindEventContext(this.winEventHandlers, this);
    RegisterEvent.call(window, this.winEventHandlers);
    ElMessage({ message: "已进入预览模式，按Ctrl+Alt+X退出", type: "success", duration: 5000 });
  }

  unmounted() {
    RegisterEvent.call(window, this.winEventHandlers, true);
    this.winEventHandlers = null;
    this.$Store.dispatch("Window/ClearWindows");
    Compiler.Dispose();
  }

  render() {
    return (
      <div class={css.preview}>
        <WindowCollection></WindowCollection>
      </div>
    );
  }
}
