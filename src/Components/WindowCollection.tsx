import FormControl from "@/Controls/FormControl";
import WindowControlBar from "@/CoreUI/Designer/WindowControlBar";
import { BindEventContext, RegisterEvent } from "@/Utils/Index";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class WindowCollection extends Vue {
  declare $refs: { [x: string]: WindowControlBar };

  // el-Select 复制
  CopyElSelect(e: KeyboardEvent) {
    let target = e.target as HTMLElement;
    // 获取父级的父级的父级
    let parent = target.parentElement?.parentElement?.parentElement?.parentElement;
    // 如果父级有 data-value 属性
    if (parent?.hasAttribute("data-value")) {
      // 获取 data-value 的值
      let value = parent.getAttribute("data-value");
      // 如果值不为空
      if (value) {
        // 复制到剪贴板
        navigator.clipboard.writeText(value);
        ElMessage.success("复制成功！");
      }
    }
  }

  // Ctrl + C
  CtrlKeyCCtronl(e: KeyboardEvent) {
    let target = e.target as HTMLElement;
    // 如果当前的 target 是 input，并且 class 是 el-select__input
    if (target.tagName == "INPUT" && target.className == "el-select__input") {
      this.CopyElSelect(e);
    }
  }

  winEventHandlers = {
    keydown: function (e: KeyboardEvent) {
      let funcName = `${e.code}Ctronl`;
      if (e.ctrlKey) funcName = `Ctrl${funcName}`;

      this[funcName]?.(e);
      // let keys = Object.keys(this.$Store.get.Windows).sort(
      //   (a, b) => this.$Store.get.Windows[a].focusIndex - this.$Store.get.Windows[b].focusIndex
      // );
      // if (!keys.length) return;
      // let id = keys[keys.length - 1];
      // if (e.key == "Escape") {
      //   (this.$refs[id] as WindowControlBar).Close();
      // } else {
      //   (this.$refs[id + "Form"] as FormControl)?.KeyDown(e);
      // }
    },
  };
  mounted() {
    BindEventContext(this.winEventHandlers, this);
    RegisterEvent.call(window, this.winEventHandlers);
  }

  unmounted() {
    RegisterEvent.call(window, this.winEventHandlers, true);
    this.winEventHandlers = null;
  }

  render() {
    let keys = Object.keys(this.$Store.get.Window.Windows)
      .filter((s) => !this.$Store.get.Window.Windows[s].subWindow)
      .sort((a, b) => {
        let win1 = this.$Store.get.Window.Windows[a];
        let win2 = this.$Store.get.Window.Windows[b];

        let win1CustomRenderIndex = win1.config.customRenderIndex;
        let win2CustomRenderIndex = win2.config.customRenderIndex;

        // 如果 customRenderIndex = -1，则永远在最底层
        if (win1CustomRenderIndex == -1) return -1;
        if (win2CustomRenderIndex == -1) return 1;
        // 如果 customRenderIndex = 0，则永远在最顶层
        if (win1CustomRenderIndex == 0) return 1;
        if (win2CustomRenderIndex == 0) return -1;

        console.log(win1CustomRenderIndex, win2CustomRenderIndex, win1.focusIndex, win2.focusIndex);

        return win1.focusIndex - win2.focusIndex;
      });

    return keys.map((instanceId, i) => {
      let { config, dialog, subWindow, selected } = this.$Store.get.Window.Windows[instanceId];

      if (subWindow) return null;
      return (
        <WindowControlBar
          {...{
            formWidth: config.width,
            formHeight: config.height,
            title: config.title,
            // 最大化
            max: config.maximize,
            ref: instanceId,
            showMaximize: config.showMaximize,
            showClose: config.showClose,
            zIndex: i + 1,
            instanceId: instanceId,
            key: instanceId,
            dialogWindow: dialog,
            active: selected,
          }}
        >
          <FormControl
            {...{
              locate: { index: 0 },
              instanceId,
              key: instanceId,
              ref: instanceId + "Form",
            }}
          ></FormControl>
        </WindowControlBar>
      );
    });
  }
}
