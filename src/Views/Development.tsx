import Preview from "@/CoreUI/Designer/Preview";
import EditorPage from "@/CoreUI/Editor/EditorPage";
import Sidebar from "@/CoreUI/Sidebar/Sidebar";
import { useDesignerStore } from "@/Stores/DesignerStore";
import { createEditor, disposeEditor } from "@/Utils/Designer";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Development extends Vue {
  get designerStore() {
    return useDesignerStore();
  }

  // 编辑器是否创建完成
  editorCreated = false;

  async created() {
    await createEditor();
    this.editorCreated = true;
    this.designerStore.debug = true;
    document.addEventListener("click", (e) => {
      // 设置设计器为非激活状态
      this.designerStore.isActive = false;
    });
  }

  unmounted() {
    disposeEditor();
  }

  render() {
    return (
      <div
        class="bg-[#0d0d0d] top-0 left-0 w-screen h-screen absolute flex items-center justify-center"
        v-loading={!this.editorCreated}
        element-loading-svg-view-box="-10, -10, 50, 50"
        element-loading-background="rgba(13, 13, 13, 0.9)"
        element-loading-text="正在准备开发环境..."
      >
        {this.editorCreated && (
          <div class="flex w-full h-full">
            <Sidebar />
            <EditorPage />
          </div>
        )}
        {this.designerStore.preview && <Preview />}
      </div>
    );
  }
}
