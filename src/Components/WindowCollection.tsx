import FormControl from "@/Controls/FormControl";
import WindowControlBar from "@/CoreUI/Designer/WindowControlBar";
import { BindEventContext, RegisterEvent } from "@/Utils/Index";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class WindowCollection extends Vue {
  declare $refs: { [x: string]: WindowControlBar };

  created() {
    this.$Store.dispatch("Window/SetWindowCollection", this);
  }

  winEventHandlers = {
    keydown: function (e) {
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
    this.$Store.dispatch("Window/SetWindowCollection", null);
    this.$Store.dispatch("Window/ClearWindowConfigs");
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
