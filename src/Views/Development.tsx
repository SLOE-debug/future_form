import FileSidebar from "@/Components/VirtualFileSystem/FileSidebar";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Development extends Vue {
  render() {
    return <FileSidebar></FileSidebar>;
  }
}
