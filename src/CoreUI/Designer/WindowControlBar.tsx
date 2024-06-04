import SvgIcon from "@/Components/SvgIcon";
import { WindowDeclare } from "@/Types/WindowDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { BindEventContext, RegisterEvent } from "@/Utils/Index";
import { Component, Prop, Provide, Vue, Watch } from "vue-facing-decorator";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { JSX } from "vue/jsx-runtime";
import { ElOption, ElSelect } from "element-plus";
import { globalVariate } from "@/Utils/Designer/Form";

type Coord = UtilsDeclare.Coord;
type ControlConfig = ControlDeclare.ControlConfig;

@Component
export default class WindowControlBar extends Vue {
  declare $refs: any;

  @Prop
  formWidth: number;
  @Prop
  formHeight: number;
  @Prop({ default: 25 })
  headHeight: number;
  @Prop({ default: "默认标题" })
  title: string;
  @Prop({ default: false })
  active: boolean;
  @Prop({ default: true })
  showBaseToolKits: boolean;
  @Prop
  zIndex: number;
  @Prop({ default: false })
  dialogWindow: boolean;

  @Prop({ default: true })
  showMaximize: boolean;
  @Prop({ default: true })
  showClose: boolean;
  @Prop({
    default: WindowDeclare.StartPosition.CenterScreen,
  })
  startPosition: WindowDeclare.StartPosition;

  @Prop({ default: false })
  max: boolean;
  @Prop
  instanceId: string;
  @Prop
  winId: string;

  @Provide
  rootConfig: ControlConfig[];

  maximize = false;

  @Watch("maximize")
  maximizeChange(nv, ov) {
    this.UpdateDesktopSize();
  }

  desktopSize: Coord = { x: 0, y: 0 };
  UpdateDesktopSize() {
    let rect = { width: window.innerWidth, height: window.innerHeight };
    this.desktopSize.x = rect.width;
    this.desktopSize.y = innerHeight;
  }

  get windowSize() {
    let w = this.formWidth;
    let h = this.formHeight;

    if (this.maximize) {
      w = this.desktopSize.x;
      h = this.desktopSize.y;
    }

    let size = {
      width: w,
      height: h + this.headHeight,
    };

    if (size.height > innerHeight) {
      size.height = innerHeight;
      size.width += this.maximize ? 0 : 8;
    }

    return size;
  }

  get barStyle() {
    let { width, height } = this.windowSize;
    let l = this.left,
      t = this.top;
    if (this.maximize) l = 0;
    if (this.maximize) t = 0;

    return {
      left: l + "px",
      top: t + "px",
      width: width + "px",
      height: height + "px",
      borderRadius: this.maximize ? 0 : "5px",
      zIndex: this.zIndex,
    };
  }

  get headStyle() {
    return { height: this.headHeight + "px" };
  }

  get containerStyle() {
    let { width, height } = this.windowSize;
    height -= this.headHeight;

    return { width: width + "px", height: height + "px" };
  }

  left = 0;
  top = 0;

  Close() {
    this.$Store.dispatch("Window/CloseWindow", this.instanceId);
  }

  RenderBarButtons() {
    return (
      <div class={css.buttons} onMousedown={(e) => e.stopPropagation()}>
        {this.showMaximize && (
          <SvgIcon
            {...{
              name: "Maximize",
              title: "最大化",
              class: css.max,
              onClick: (_) => {
                this.maximize = !this.maximize;
              },
            }}
          ></SvgIcon>
        )}
        {this.showClose && (
          <SvgIcon
            {...{
              name: "Close",
              title: "关闭",
              class: css.close,
              onClick: this.Close,
            }}
          ></SvgIcon>
        )}
      </div>
    );
  }

  isMove = false;
  offset: Coord = { x: 0, y: 0 };
  StartMove(e: MouseEvent) {
    if (!(e.target as HTMLDivElement).classList.contains(css.head)) return;
    let rect = ((e.target as HTMLElement).parentNode as HTMLElement).getBoundingClientRect();
    let deskRect = this.$Store.get.Window.DesktopDom?.getBoundingClientRect() || { left: 0, top: 0 };
    this.offset = { x: e.clientX - rect.left + deskRect.left, y: e.clientY - rect.top };

    this.isMove = true;
  }

  Move(e: MouseEvent) {
    if (this.isMove && !this.maximize) {
      this.top = e.clientY - this.offset.y;
      this.left = e.clientX - this.offset.x;
    }
  }

  CancelMove() {
    if (this.top < 0) this.top = 0;
    if (this.top > innerHeight) this.top = innerHeight - this.headHeight;
    this.isMove = false;
  }

  created() {
    switch (this.startPosition) {
      case WindowDeclare.StartPosition.Default:
        this.top = this.left = 0;
        break;
      case WindowDeclare.StartPosition.CenterScreen:
        let { width, height } = this.windowSize;

        let rect = this.$Store.get.Window.DesktopDom?.getBoundingClientRect() || {
          width: innerWidth,
          height: innerHeight,
        };
        this.top = rect.height / 2 - height / 2;
        this.left = rect.width / 2 - width / 2;
        break;
    }
    this.$nextTick(() => {
      if (this.max) {
        this.maximize = true;
      }
    });
    this.rootConfig = [this.$Store.get.Window.Windows[this.instanceId].config];
  }

  winEventHandlers = {
    mousemove: this.Move,
    mouseup: this.CancelMove,
    resize: function () {
      this.UpdateDesktopSize();
    },
  };
  mounted() {
    BindEventContext(this.winEventHandlers, this);
    RegisterEvent.call(window, this.winEventHandlers);
  }

  unmounted() {
    RegisterEvent.call(window, this.winEventHandlers, true);
    this.winEventHandlers = null;
    this.rootConfig = null;
  }

  ShowDialogWindow(jsx: JSX.Element) {
    return (
      <div
        style={{
          position: "absolute",
          zIndex: 999999999,
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.2)",
        }}
      >
        {jsx}
      </div>
    );
  }

  /**
   * 窗体标题栏左侧控件组
   */
  RenderTitleBarControls() {
    return (
      <div class={css.titleBarControls}>
        {/* 案号下拉框 */}
        <ElSelect
          filterable
          placeholder="请输入案号"
          {...{
            onDblclick: (e) => {
              e.stopPropagation();
            },
          }}
          style={{
            width: "150px",
          }}
          v-model={globalVariate.ref_no}
        >
          <ElOption label="案号" value="1"></ElOption>
        </ElSelect>
      </div>
    );
  }

  contentLoading = true;
  render() {
    let window = (
      <div
        class={`${css.bar} ${this.active ? css.active : ""}`}
        style={this.barStyle}
        ref={"windowControl"}
        onMousedown={(e) => {
          this.$Store.dispatch("Window/SetFocusWindow", this.instanceId);
        }}
      >
        <div
          class={css.head}
          style={this.headStyle}
          onMousedown={this.StartMove}
          onDblclick={(_) => {
            if (this.showMaximize) this.maximize = !this.maximize;
          }}
        >
          {this.RenderTitleBarControls()}
          {this.title}
          {this.RenderBarButtons()}
        </div>
        <div
          class={css.container}
          style={this.containerStyle}
          v-loading={this.contentLoading}
          element-loading-text="正在加载窗体..."
          element-loading-background="black"
        >
          {this.$slots.default()}
        </div>
      </div>
    );

    return this.dialogWindow ? this.ShowDialogWindow(window) : window;
  }
}
