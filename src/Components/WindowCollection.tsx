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
    let keys = Object.keys(this.$Store.get.Window.Windows).sort(
      (a, b) => this.$Store.get.Window.Windows[a].focusIndex - this.$Store.get.Window.Windows[b].focusIndex
    );

    return keys.map((instanceId, i) => {
      let { config: win, dialog } = this.$Store.get.Window.Windows[instanceId];

      return (
        <WindowControlBar
          {...{
            formWidth: win.config.width,
            formHeight: win.config.height,
            title: win.config.title,
            ref: instanceId,
            zIndex: i + 1,
            instanceId: instanceId,
            winId: win._id,
            key: instanceId,
            max: win.maximize,
            dialogWindow: dialog,
            showBaseToolKits: win.baseToolKits,
            active: i == keys.length - 1,
          }}
        >
          <FormControl
            {...{
              id: win._id,
              locate: { index: 0 },
              instanceId,
              key: instanceId,
              compiledCode: win.compiledCode,
              className: win.className,
              ref: instanceId + "Form",
              autoRelease: win.fixed || false,
            }}
          ></FormControl>
        </WindowControlBar>
      );
    });
  }
}
