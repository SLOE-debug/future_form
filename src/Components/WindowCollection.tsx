import FormControl from "@/Controls/FormControl";
import WindowControlBar from "@/CoreUI/Designer/WindowControlBar";
import { BindEventContext, RegisterEvent } from "@/Utils/Index";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class WindowCollection extends Vue {
  declare $refs: { [x: string]: WindowControlBar };

  created() {
    // this.$Store.dispatch("Window/SetWindowCollection", this);
  }

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
    // this.$Store.dispatch("Window/SetWindowCollection", null);
    // this.$Store.dispatch("Window/ClearWindowConfigs");
  }

  render() {
    let keys = Object.keys(this.$Store.get.Window.Windows)
      .filter((s) => !this.$Store.get.Window.Windows[s].subWindow)
      .sort((a, b) => this.$Store.get.Window.Windows[a].focusIndex - this.$Store.get.Window.Windows[b].focusIndex);

    return keys.map((instanceId, i) => {
      let { config, dialog, subWindow } = this.$Store.get.Window.Windows[instanceId];

      if (subWindow) return null;
      return (
        <WindowControlBar
          {...{
            formWidth: config.width,
            formHeight: config.height,
            title: config.title,
            // 最大化
            max: config.maximize,
            showTitleBarControls: config.showTitleBarControls,
            ref: instanceId,
            zIndex: i + 1,
            instanceId: instanceId,
            key: instanceId,
            dialogWindow: dialog,
            active: i == keys.length - 1,
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
