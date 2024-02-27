import EditorPage from "@/CoreUI/Editor/EditorPage";
import Sidebar from "@/CoreUI/Sidebar/Sidebar";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Development extends Vue {
  created() {
    this.$Store.dispatch("Designer/SetDebug", true);
    this.$nextTick(() => {
      this.$Store.dispatch(
        "VirtualFileSystem/SelectFile",
        this.$Store.get.VirtualFileSystem.Root.directories[0].files[1]
      );
    });
  }

  render() {
    return (
      <>
        <Sidebar></Sidebar>
        <EditorPage></EditorPage>
      </>
    );
  }
}
