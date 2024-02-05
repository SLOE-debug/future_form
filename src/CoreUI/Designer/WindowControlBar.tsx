import SvgIcon from "@/Components/SvgIcon";
import { WindowDeclare } from "@/Types/WindowDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { BindEventContext, CapitalizeFirstLetter, RegisterEvent } from "@/Utils/Index";
import { ElIcon, ElInput, ElSelectV2 } from "element-plus";
import { Component, Prop, Provide, Vue, Watch } from "vue-facing-decorator";
import { EventDeclare } from "@/Types/EventDeclare";
import FormControl from "@/Controls/FormControl";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { JSX } from "vue/jsx-runtime";

type Coord = UtilsDeclare.Coord;

type BarKit = EventDeclare.BarKit;

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
    let rect = this.$Store.get.Window.DesktopDom.getBoundingClientRect();
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
    this.$Store.dispatch("CloseWindow", this.instanceId);
  }

  RenderBarButtons() {
    return (
      <div class={css.buttons} onMousedown={(e) => e.stopPropagation()}>
        {this.showMaximize && (
          <SvgIcon
            {...{
              name: "Maximize",
              title: "最大化",
              onMouseenter: (e: MouseEvent) => {
                // gsap.to(e.target, { scale: 1, duration: 0.3 });
              },
              onMouseleave: (e: MouseEvent) => {
                // gsap.to(e.target, { scale: 0.8, duration: 0.3 });
              },
              class: css.max,
              onClick: (_) => {
                if (!this.$Store.get.Designer.Preview) this.maximize = !this.maximize;
              },
            }}
          ></SvgIcon>
        )}
        {this.showClose && (
          <SvgIcon
            {...{
              name: "Close",
              title: "关闭",
              onMouseenter: (e: MouseEvent) => {
                // gsap.to(e.target, { scale: 1, duration: 0.3 });
              },
              onMouseleave: (e: MouseEvent) => {
                // gsap.to(e.target, { scale: 0.8, duration: 0.3 });
              },
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
      case WindowDeclare.StartPosition.CenterScreen:
        let { width, height } = this.windowSize;

        let rect = this.$Store.get.Window.DesktopDom?.getBoundingClientRect() || {
          width: innerWidth,
          height: innerHeight,
        };
        this.top = rect.height / 2 - height / 2;
        this.left = rect.width / 2 - width / 2;
    }
    this.$nextTick(() => {
      if (this.max) {
        this.maximize = true;
        this.left = 0;
        this.top = 0;
      }
    });
    this.rootConfig = [this.$Store.get.Window.Windows[this.instanceId].config.config];

    // if (!this.showBaseToolKits) this.baseToolkits = [];
    this.RenderContentJsx();
  }

  RenderContentJsx() {
    this.contentLoading = true;
    this.contentJsx = null;
    // this.baseToolkits = this.showBaseToolKits ? GetBaseToolKit() : [];
    setTimeout(() => {
      this.contentJsx = this.$slots.default && this.$slots.default();
    }, 50);
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
    this.form = null;
    this.contentJsx = null;
    this.rootConfig = null;
  }

  // baseToolkits: BarKit[] = GetBaseToolKit();

  IconButtonClick(m: BarKit) {
    switch (m.icon) {
      case "WindowBarEdit":
        m.active = !m.active;
        this.form.dataSourceControls.forEach((d) => (d.config.readonly = !d.config.readonly));
        // this.baseToolkits.forEach((otherItem) => {
        //   if ("readonlyDisabled" in otherItem) {
        //     otherItem.readonlyDisabled = !m.active;
        //   }
        // });
        break;
      case "WindowBarSave":
        // ElMessage({ type: "warning", message: "暂未开通，敬请期待！" });
        this.form.dataSourceControls.forEach((d) => d.SaveSource(null));
        break;
      case "WindowBarRefresh":
        this.RenderContentJsx();
        break;
    }
  }

  async BaseToolKitEvent(m: BarKit, type: string, e: any) {
    let methodName = CapitalizeFirstLetter(m.type) + CapitalizeFirstLetter(type) + CapitalizeFirstLetter(m.bindField);

    let res: boolean | Promise<any> = true;
    if (this.form.events.onBarToolKitEventBus) {
      res = this.form.events.onBarToolKitEventBus(null, m, type, e) || true;
      if (res instanceof Promise) {
        res = await res;
      }
    }

    if (res) this[methodName] && this[methodName].apply(this, arguments);
  }

  tiggerFlag = {};
  RenderToolKitItem(m: BarKit) {
    switch (m.type) {
      case "IconButton":
        const iconBtn = (
          <div
            class={css.item}
            title={m.title}
            style={{
              filter: m.disabled || m.readonlyDisabled ? "grayscale(1)" : "",
              boxShadow: m.active ? "inset 0 0 5px black" : "",
              cursor: m.disabled || m.readonlyDisabled ? "not-allowed" : "",
            }}
            onClick={(e) => {
              if (!(m.disabled || m.readonlyDisabled)) this.BaseToolKitEvent(m, "click", e);
            }}
          >
            <SvgIcon {...{ name: m.icon }}></SvgIcon>
          </div>
        );

        for (const k in m.on) {
          iconBtn.props[`on${CapitalizeFirstLetter(k)}`] = m.on[k];
        }

        return iconBtn;
      case "Input":
        const input = (
          <ElInput
            placeholder="案号"
            autocomplete={"on"}
            v-model={m.bindObject[m.bindField]}
            onChange={(v) => {
              this.BaseToolKitEvent(m, "change", { value: v } as unknown as Event);
            }}
          ></ElInput>
        );
        for (const k in m.on) {
          input.props[`on${CapitalizeFirstLetter(k)}`] = m.on[k];
        }

        return input;
      case "select":
        const select = (
          <ElSelectV2
            v-model={m.bindObject[m.bindField]}
            filterable={true}
            remote
            remoteMethod={(query: string) => {
              this.BaseToolKitEvent(m, "remoteMethod", { value: query });
            }}
            onChange={(v) => {
              this.BaseToolKitEvent(m, "change", { value: v });
            }}
            name={m.bindField}
            {...{ placeholder: m.placeholder }}
            popperClass={css.barList}
            options={m.options}
            onVisible-change={(v) => {
              setTimeout(() => {
                this.tiggerFlag[m.bindField] = v;
              }, 300);
            }}
            {...{
              onKeyup: (e: KeyboardEvent) => {
                this.BaseToolKitEvent(m, "keyup", e);
              },
            }}
            style={{ width: m.width + "px", height: "22px", marginRight: "2px" }}
          >
            {{
              default: ({ item }) => {
                let { obj } = item;
                if (m.displayFields?.length) {
                  return m.displayFields.map((df) => (
                    <span style={{ width: df.width + "px" }} class={css.option}>
                      {obj[df.field]}
                    </span>
                  ));
                } else {
                  let keys = Object.keys(obj);
                  return keys.length ? obj[keys[0]] : "";
                }
              },
              prefix: () => {
                return (
                  <ElIcon
                    size={16}
                    style={{ position: "absolute", right: 0, cursor: "pointer" }}
                    color="#666"
                    {...{
                      onClick: (e: MouseEvent) => {
                        this.BaseToolKitEvent(m, "prefixClick", e);
                      },
                    }}
                  >
                    {() => {
                      let icon = this.$.appContext.components["CaretBottom"];
                      return <icon></icon>;
                    }}
                  </ElIcon>
                );
              },
            }}
          </ElSelectV2>
        );

        for (const k in m.on) {
          select.props[`on${CapitalizeFirstLetter(k)}`] = m.on[k];
        }

        return select;
    }
  }

  RenderBarToolKit() {
    return (
      <div class={css.toolKit} style={this.headStyle} onDblclick={(e) => e.stopPropagation()}>
        {/* {this.baseToolkits.map((m) => this.RenderToolKitItem(m))} */}
      </div>
    );
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

  form: FormControl;
  contentLoading = true;
  contentJsx;
  render() {
    let window = (
      <div
        class={`${css.bar} ${this.active ? css.active : ""}`}
        style={this.barStyle}
        ref={"windowControl"}
        onMousedown={(e) => {
          this.$Store.dispatch("SetFocusWindow", this.instanceId);
        }}
      >
        <div
          class={css.head}
          style={this.headStyle}
          onMousedown={this.StartMove}
          onDblclick={(_) => {
            if (this.showMaximize && !this.$Store.get.Designer.Preview) this.maximize = !this.maximize;
          }}
        >
          {this.RenderBarToolKit()}
          {this.title}
          {this.RenderBarButtons()}
        </div>
        <div
          class={css.container}
          style={this.containerStyle}
          v-loading={this.contentLoading}
          element-loading-text="正在加载窗体..."
          element-loading-background="transparent"
        >
          {this.contentJsx}
        </div>
      </div>
    );

    return this.dialogWindow ? this.ShowDialogWindow(window) : window;
  }
}
