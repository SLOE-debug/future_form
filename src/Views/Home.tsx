import WindowCollection from "@/Components/WindowCollection";
import Compiler from "@/Core/Compile/Compiler";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Home extends Vue {
  async created() {
    // 添加浏览器页面关闭/刷新事件
    window.addEventListener("beforeunload", (e) => {
      var confirmationMessage = "你有未保存的更改，确定要离开吗？";
      // 标准对于此事件的处理是需要设置returnValue属性
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    });

    window.addEventListener("unload", (e) => {
      fetch(process.env.VUE_APP_API_BASE_URL + "VirtualFile/Leave", {
        method: "GET",
        headers: {
          "X-Client-Id": this.$Store.get.Window.ClientId,
        },
        keepalive: true,
      });
    });

    await this.InitDesktop();
  }

  /**
   * 初始化桌面
   */
  async InitDesktop() {
    // 准备桌面
    let loading = ElLoading.service({
      text: "正在初始化桌面...",
      background: "black",
      body: true,
      target: "body",
    });
    let file = await Compiler.GetStartupFile();
    Compiler.Install(file);
    loading.close();
  }

  render() {
    return <WindowCollection></WindowCollection>;
  }
}
