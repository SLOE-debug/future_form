import EditorPage from "@/CoreUI/Editor/EditorPage";
import Sidebar from "@/CoreUI/Sidebar/Sidebar";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Development extends Vue {
  created() {
    this.$Store.dispatch("Designer/SetDebug", true);
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
