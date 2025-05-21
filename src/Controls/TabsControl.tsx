import Control from "@/CoreUI/Designer/Control";
import { Stack, StackAction } from "@/Core/Designer/UndoStack/Stack";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { Cache, Guid } from "@/Utils";
import { defineAsyncComponent } from "vue";
import { Component, Watch } from "vue-facing-decorator";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { AddControlDeclareToDesignerCode } from "@/Utils/Designer/Designer";
import DevelopmentModules from "@/Utils/DevelopmentModules";

type ControlConfig = ControlDeclare.ControlConfig;
type TabsConfig = ControlDeclare.TabsConfig;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

type Coord = UtilsDeclare.Coord;

const AsyncSlideSelector = defineAsyncComponent(() => import("@/CoreUI/Designer/Components/SlideSelector"));

@Component
export default class TabsControl extends Control {
  declare config: TabsConfig;

  @Watch("config.value")
  valueChange() {
    this.$Store.get.Designer.Debug && this.$Store.dispatch("Designer/RenderControlConfigurator");
  }

  async Drop(e: DragEvent) {
    let { CreateControlByDragEvent, CreateControlName } = await DevelopmentModules.Load();

    let config = CreateControlByDragEvent.call(this, e) as ControlConfig;

    config.id = Guid.NewGuid();
    CreateControlName(config);
    config.top -= config.height / 2;
    config.left -= config.width / 2;
    config.fromContainer = this.config.name;
    config.fromTabId = this.config.value;

    this.config.$children.push(config);
    this.$nextTick(() => {
      this.$Store.dispatch(
        "Designer/AddStack",
        new Stack(this.$refs[config.name] as Control, null, null, StackAction.Create)
      );
    });
    AddControlDeclareToDesignerCode(config);
    e.stopPropagation();
  }

  get NavWidth() {
    return this.config.width - this.BtnsWidth - this.config.border * 2;
  }

  get BtnsWidth() {
    return this.$Store.get.Designer.Debug ? 50 : 0;
  }

  GetContentWidth() {
    let content = this.$refs["tabContent"] as HTMLElement;

    let totalWidth = 0;
    for (const c of content.children) {
      if (c.classList.contains(css.tabItem)) {
        let childRect = c.getBoundingClientRect();
        totalWidth += childRect.width;
      }
    }
    return totalWidth;
  }

  ShouldAddScrollbar() {
    this.$nextTick(() => {
      let totalWidth = this.GetContentWidth();

      if (totalWidth >= this.NavWidth) {
        this.needsScroll = true;
      }
    });
  }

  slideStartCoord: Coord;
  SlideStart(e: MouseEvent) {
    if (e.button == 0 && e.activity != false && this.$Store.get.Designer.Debug)
      this.slideStartCoord = { x: e.clientX, y: e.clientY };
  }

  SlideEnd(e) {
    if (!e || !e.width || !e.height) return;

    let configs = this.config.$children.filter((c) => {
      return (
        c.fromTabId == this.config.value &&
        c.left < e.left + e.width &&
        c.left + c.width > e.left &&
        c.top < e.top + e.height &&
        c.top + c.height > e.top
      );
    });
    if (configs.length) {
      this.$Store.dispatch("Designer/SelectControlByConfig", configs);
    }
  }

  async Cancel(e: MouseEvent) {
    // await super.Cancel(e);
    this.slideStartCoord = null;
  }

  needsScroll = false;

  get ContentOffset() {
    if (!this.needsScroll) return;
    return {
      marginLeft: this.scrollLeft + "px",
    };
  }
  scrollLeft = 0;

  foldSize = 16;
  headHeight = 40;
  headHide = false;

  mounted() {
    this.ShouldAddScrollbar();
    if (this.$Store.get.Designer.Debug) this.config.scrollTop = {};
    this.eventManager.add(window, "mouseup", this.Cancel, this);
  }

  /**
   * tab头部部分
   */
  RenderTabHead() {
    return this.config.tabs
      .filter((t) => (this.$Store.get.Designer.Debug ? true : t.visible != false))
      .map((t, i) => (
        <div
          class={css.tabItem + (this.config.value == t.id ? " " + css.active : "")}
          style={!i ? this.ContentOffset : {}}
          onClick={(e: MouseEvent) => {
            this.config.value = t.id;
            e.stopPropagation();
          }}
        >
          {t.name}
          {this.$Store.get.Designer.Debug && (
            <FontAwesomeIcon
              icon="circle-xmark"
              style={{
                color: this.config.value == t.id ? "white" : "#606266",
              }}
              {...{
                onClick: (e: MouseEvent) => {
                  let index = this.config.tabs.findIndex((m) => m.id == t.id);
                  this.config.tabs.splice(index, 1);
                  e.stopPropagation();
                },
              }}
            />
          )}
        </div>
      ));
  }

  /**
   * 开发模式下，拖动、添加、收缩等操作
   */
  RenderDebugTools() {
    return (
      <>
        <div class={css.btns} style={{ width: this.BtnsWidth - 5 + "px" }}>
          <div
            {...{
              style: {
                fontSize: "14px",
              },
              onClick: async (e: MouseEvent) => {
                this.config.tabs.push({ id: Guid.NewGuid(), name: "Tab", visible: true });
                this.ShouldAddScrollbar();
                e.stopPropagation();
              },
            }}
          >
            <FontAwesomeIcon icon="plus" />
          </div>
          <div
            {...{
              style: {
                fontSize: "14px",
                cursor: "move",
              },
              "data-type": "Move",
            }}
          >
            <FontAwesomeIcon icon="up-down-left-right" />
          </div>
        </div>
        <div
          class={css.fold}
          style={{
            width: this.foldSize + "px",
            height: this.foldSize + "px",
            left: this.config.width / 2 - this.foldSize / 2 + "px",
            top: this.headHeight - this.foldSize / 2 + "px",
          }}
          onClick={() => {
            this.headHide = !this.headHide;
          }}
        >
          <FontAwesomeIcon
            icon={"angle-up"}
            style={{ fontSize: "10px", transform: this.headHide ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </>
    );
  }

  /**
   * 横向滚动条及操作按钮
   */
  RenderScroll() {
    return (
      <>
        <div
          class={css.navPrev}
          style={{ left: 0, top: 0 }}
          onClick={(e: MouseEvent) => {
            let totalWidth = (this.$refs["tabContent"] as HTMLElement).clientWidth;
            let mulriple = Math.round(this.GetContentWidth() / totalWidth);
            let currentMulriple = this.scrollLeft / totalWidth;
            if (currentMulriple < mulriple && this.scrollLeft) {
              this.scrollLeft += totalWidth;
            }

            e.stopPropagation();
          }}
        >
          <FontAwesomeIcon icon="angle-left" style={{ fontSize: "14px" }} />
        </div>
        <div
          class={css.navNext}
          style={{ right: 0, top: 0 }}
          onClick={(e: MouseEvent) => {
            let totalWidth = (this.$refs["tabContent"] as HTMLElement).clientWidth;
            let mulriple = Math.round(this.GetContentWidth() / totalWidth);
            let currentMulriple = Math.abs(this.scrollLeft / totalWidth);
            if (currentMulriple < mulriple) {
              this.scrollLeft -= totalWidth;
            }

            e.stopPropagation();
          }}
        >
          <FontAwesomeIcon icon="angle-right" style={{ fontSize: "14px" }} />
        </div>
      </>
    );
  }

  // 父窗体的rect
  parentRect: DOMRect;

  // 当 config.padding 改变时
  @Watch("config.padding")
  paddingChange() {
    this.parentFormControl.$nextTick(() => {
      this.parentRect = this.parentFormControl.$el.getBoundingClientRect();
    });
  }

  get baseStyle() {
    let style: any = {};

    let winControl = this.parentFormControl.windowControlBar;
    let width = 0,
      height = 0;

    if (!this.parentRect) {
      this.parentFormControl.$nextTick(() => {
        this.parentRect = this.parentFormControl.$el.getBoundingClientRect();
      });
    } else {
      width = this.parentRect.width;
      height = this.parentRect.height;
    }

    // 开发模式下，没有 windowControlBar，所以不需要计算
    if (winControl) {
      let {
        maximize,
        containerStyle: { minHeight, minWidth },
      } = winControl;

      if (maximize) {
        width = minWidth.replace("px", "") - 0;
        height = minHeight.replace("px", "") - 0;
      }
    }

    // 是否是全部
    if (this.config.padding.includes("all")) {
      return {
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      };
    }

    this.config.padding.sort();

    // 上下左右
    for (const p of this.config.padding) {
      switch (p) {
        case "top":
          // 如果有height属性，则设置高度
          style = {
            ...style,
            top: 0,
            minHeight: style.minHeight ? "100%" : this.config.height + this.config.top + "px",
          };
          break;
        case "bottom":
          style = {
            ...style,
            minHeight: this.config.height + (height - (this.config.top + this.config.height)) + "px",
          };
          break;
        case "left":
          style = { ...style, left: 0, minWidth: this.config.width + this.config.left + "px" };
          break;
        case "right":
          style = {
            ...style,
            minWidth: style.minWidth
              ? "100%"
              : this.config.width + (width - (this.config.left + this.config.width)) + "px",
          };
          break;
      }
    }

    // 如果有最小高度，则设置最大高度为最小高度
    if (style.minHeight) style.maxHeight = style.minHeight;
    if (style.minWidth) style.maxWidth = style.minWidth;

    return {
      ...style,
      ...super.baseStyle,
    };
  }

  render() {
    return super.render(
      <div class={css.tabs}>
        <div
          class={css.head}
          style={{ marginTop: this.headHide ? -this.headHeight + "px" : "0px", height: this.headHeight + "px" }}
        >
          <div class={css.nav + (this.needsScroll ? " " + css.scrollNav : "")} style={{ width: this.NavWidth + "px" }}>
            {this.needsScroll && this.RenderScroll()}

            <div class={css.content} ref={"tabContent"}>
              {this.RenderTabHead()}
            </div>
          </div>
          {this.$Store.get.Designer.Debug && this.RenderDebugTools()}
        </div>
        <div class={css.container}>
          {this.config.tabs
            .filter((t) => (this.$Store.get.Designer.Debug ? true : t.visible != false))
            .map((t) => {
              return (
                <div
                  class={css.pane}
                  onDrop={this.$Store.get.Designer.Debug && this.Drop}
                  onMousedown={this.$Store.get.Designer.Debug && this.SlideStart}
                  style={{
                    display: this.config.value == t.id ? "block" : "none",
                  }}
                  onScroll={(e) => {
                    if (this.$Store.get.Designer.Debug)
                      this.config.scrollTop[this.config.value] = (e.target as HTMLDivElement).scrollTop;
                  }}
                >
                  {this.$Store.get.Designer.Debug && (
                    <AsyncSlideSelector
                      {...{
                        start: this.slideStartCoord,
                        onSlideEnd: this.SlideEnd,
                      }}
                    />
                  )}
                  {this.config.$children
                    .filter((c) => c.fromTabId == t.id)
                    .map((c, i) => {
                      let control = this.$.appContext.components[c.type + "Control"];
                      return <control key={c.id} config={c} ref={c.name} style={{ zIndex: i }}></control>;
                    })}
                </div>
              );
            })}
        </div>
      </div>
    );
  }

  static GetDefaultConfig(): TabsConfig {
    let id = Guid.NewGuid();
    return {
      width: 540,
      height: 320,
      type: "Tabs",
      container: true,
      value: id,
      tabs: [{ id, name: "Tab", visible: true }],
      border: 1,
      borderColor: "#dcdfe6",
      borderStyle: "solid",
      padding: [],
    };
  }
}

export async function GetProps(config: TabsConfig) {
  let { baseProps } = await DevelopmentModules.Load();

  const fieldMap: ConfiguratorItem[] = [
    ...baseProps.filter((p) => p.field != "round"),
    // 填充，上下左右
    {
      name: "填充",
      des: "tabs控件的填充",
      type: DesignerDeclare.InputType.ElSelect,
      field: "padding",
      options: [
        { label: "上", value: "top" },
        { label: "下", value: "bottom" },
        { label: "左", value: "left" },
        { label: "右", value: "right" },
        { label: "全部", value: "all" },
      ],
      multiple: true,
    },
  ];

  if (config.value && config.tabs.length) {
    let i = config.tabs.findIndex((m) => m.id == config.value);

    fieldMap.push(
      ...[
        {
          name: "标签名称",
          des: "Tab当前标签的名称",
          type: DesignerDeclare.InputType.ElInput,
          field: { ref: config.tabs[i], key: "name" },
        },
        {
          name: "标签可见",
          des: "Tab当前标签是否可见",
          type: DesignerDeclare.InputType.ElSwitch,
          field: { ref: config.tabs[i], key: "visible" },
        },
      ]
    );
  }

  return fieldMap;
}

export async function GetEvents() {
  let { baseEvents } = await DevelopmentModules.Load();

  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
