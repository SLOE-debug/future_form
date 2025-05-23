import WindowCollection from "@/Components/WindowCollection";
import Compiler from "@/Core/Compile/Compiler";
import { useDesignerStore } from "@/Stores/designerStore";
import { EventManager } from "@/Utils";
import { ElMessage } from "element-plus";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Preview extends Vue {
  get designerStore() {
    return useDesignerStore();
  }

  // 键盘按下处理器
  async HandleKeydown(e: KeyboardEvent) {
    const { nodeName } = e.target as HTMLElement;
    if (nodeName == "INPUT" || nodeName == "TEXTAREA") return;

    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "x") {
      await this.$Store.dispatch("Window/CloseAllWindows");
      this.designerStore.SetPreview(false);
    }
    e.preventDefault();
  }

  eventManager: EventManager = new EventManager();
  created() {
    this.eventManager.add(window, "keydown", this.HandleKeydown, this);
    ElMessage({ message: "已进入预览模式，按Ctrl+Alt+X退出", type: "success", duration: 5000 });
  }

  unmounted() {
    this.eventManager?.removeAll();
    this.eventManager = null;
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
