import WindowCollection from "@/Components/WindowCollection";
import Compiler from "@/Core/Compile/Compiler";
import { Guid } from "@/Utils/Index";
import { ElNotification } from "element-plus";
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

    await this.InitDesktop();
    this.LinkSSE();
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
    await Compiler.CheckUpdate();
    let file = await Compiler.GetStartupFile();
    Compiler.Install(file);
    loading.close();
  }

  /**
   * 链接SSE
   */
  async LinkSSE() {
    let url = process.env.VUE_APP_API_BASE_URL + "VirtualFile/SSE";
    let eventSource = new EventSource(url + "?id=" + Guid.NewGuid());
    eventSource.onmessage = (e) => {
      let { updateFiles, isNotifyUser } = JSON.parse(e.data);
      console.log("收到以下文件更新：");
      for (const file of updateFiles) {
        console.log(file.fullPath);
      }
      Compiler.UpdateFileCache(updateFiles);
      if (isNotifyUser) {
        ElNotification({
          title: "版本已更新",
          message: (
            <>
              <p>有新的版本已发布！</p>
              <p>以防数据丢失，请保存您的工作。</p>
              <p>并刷新页面以获取最新版本。</p>
            </>
          ),
          type: "warning",
          position: "bottom-right",
          duration: 0,
          zIndex: 9999999,
        });
      }
    };
    eventSource.onerror = (e) => {
      console.error("推送更新出错！", e);
    };
  }

  render() {
    return (
      <>
        <div class={css.bg}>林达刘案件管理系统</div>
        <WindowCollection></WindowCollection>
      </>
    );
  }
}
