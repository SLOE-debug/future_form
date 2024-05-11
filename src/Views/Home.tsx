import WindowCollection from "@/Components/WindowCollection";
import Compiler from "@/Core/Compile/Compiler";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Development extends Vue {
  async created() {
    // 懒加载入口文件
    Compiler.LazyLoad();
  }

  render() {
    return <WindowCollection></WindowCollection>;
  }
}
