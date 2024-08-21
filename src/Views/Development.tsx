import Preview from "@/CoreUI/Designer/Preview";
import EditorPage from "@/CoreUI/Editor/EditorPage";
import Sidebar from "@/CoreUI/Sidebar/Sidebar";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Development extends Vue {
  created() {
    this.$Store.dispatch("Designer/SetDebug", true);
    document.addEventListener("click", (e) => {
      // 设置设计器为非激活状态
      this.$Store.dispatch("Designer/SetActive", false);
    });
  }

  render() {
    return (
      <div class="bg-[#0d0d0d] top-0 left-0 w-screen h-screen absolute">
        <Sidebar></Sidebar>
        <EditorPage></EditorPage>
        {this.$Store.get.Designer.Preview && <Preview></Preview>}
      </div>
    );
  }
}
