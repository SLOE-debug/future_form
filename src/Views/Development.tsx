import EditorPage from "@/CoreUI/Editor/EditorPage";
import FileSidebar from "@/CoreUI/VirtualFileSystem/FileSidebar";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Development extends Vue {
  render() {
    return (
      <>
        <FileSidebar></FileSidebar>
        <EditorPage></EditorPage>
      </>
    );
  }
}
