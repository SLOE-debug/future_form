import FormControl from "@/Controls/FormControl";
import WindowControlBar from "@/CoreUI/Designer/WindowControlBar";
import { BindEventContext, RegisterEvent } from "@/Utils/Index";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class WindowCollection extends Vue {
  declare $refs: { [x: string]: WindowControlBar };

  /**
   * Escape 键关闭窗体
   */
  async EscapeCtronl(e: KeyboardEvent) {
    let keys = this.WindowInstancesKeys;
    if (!keys.length) return;
    let { instance, config } = this.$Store.get.Window.Windows[keys[keys.length - 1]];
    let { onBeforeClose } = instance.$Window.events;
    // 获取 onBeforeClose 的返回值，如果是 Promise 则等待 Promise 结束
    let result = onBeforeClose?.();
    if (result instanceof Promise) {
      result = await result;
    }

    // 如果 result 为 false，则不关闭窗体
    if (result === false) return;
    // 如果 config.showClose 为 false，则不关闭窗体
    if (config.showClose === false) return;
    instance.Close();
  }

  declare winEventHandlers;
  mounted() {
    this.winEventHandlers = {
      keydown: function (e: KeyboardEvent) {
        let funcName = `${e.code}Ctronl`;
        if (e.ctrlKey) funcName = `Ctrl${funcName}`;
        this[funcName]?.(e);
      },
    };
    BindEventContext(this.winEventHandlers, this);
    RegisterEvent.call(window, this.winEventHandlers);
  }

  unmounted() {
    RegisterEvent.call(window, this.winEventHandlers, true);
    this.winEventHandlers = null;
  }

  /**
   * 获取窗体实例
   */
  get WindowInstancesKeys() {
    return Object.keys(this.$Store.get.Window.Windows)
      .filter((s) => !this.$Store.get.Window.Windows[s].subWindow)
      .sort(this.WindowDesktopInsatnceSorter.bind(this));
  }

  /**
   * 窗体实例显示顺序排序器
   */
  WindowDesktopInsatnceSorter(a, b) {
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

    return win1.focusIndex - win2.focusIndex;
  }

  render() {
    let keys = this.WindowInstancesKeys;

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
            // 是否需要高度滚动条
            heightScroll: config.heightScroll,
            // 是否显示窗体控制条
            showControlBar: config.showControlBar,
          }}
        >
          <FormControl
            {...{
              config,
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
