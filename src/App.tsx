import { ElConfigProvider } from "element-plus";
import { Component, Vue } from "vue-facing-decorator";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";

@Component
export default class App extends Vue {
  render() {
    return (
      <ElConfigProvider locale={zhCn} zIndex={99999}>
        <router-view />
      </ElConfigProvider>
    );
  }
}
