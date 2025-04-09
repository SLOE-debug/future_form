import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { CacheFunction, Guid } from "@/Utils/Index";
import { defineAsyncComponent } from "vue";
import { Component } from "vue-facing-decorator";

// 仅在开发模式下导入的模块
const UtilDesigner = CacheFunction(() => import("@/Utils/Designer/Designer"));
const UtilControl = CacheFunction(() => import("@/Utils/Designer/Controls"));
const CoreUndoStack = CacheFunction(() => import("@/Core/Designer/UndoStack/Stack"));

type GroupConfig = ControlDeclare.GroupConfig;
type ControlConfig = ControlDeclare.ControlConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;
type Coord = UtilsDeclare.Coord;

const AsyncSlideSelector = defineAsyncComponent(() => import("@/CoreUI/Designer/Components/SlideSelector"));
const AsyncSvgIcon = defineAsyncComponent(() => import("@/Components/SvgIcon"));

@Component
export default class GroupControl extends Control {
  declare config: GroupConfig;

  async Drop(e: DragEvent) {
    let { CreateControlByDragEvent, CreateControlName } = await UtilDesigner();
    let { Stack, StackAction } = await CoreUndoStack();

    let config = CreateControlByDragEvent.call(this, e) as ControlConfig;

    config.id = Guid.NewGuid();
    CreateControlName(config);
    config.top -= config.height / 2;
    config.left -= config.width / 2;
    config.fromContainer = this.config.name;

    this.config.$children.push(config);
    this.$nextTick(() => {
      this.$Store.dispatch(
        "Designer/AddStack",
        new Stack(this.$refs[config.name] as Control, null, null, StackAction.Create)
      );
    });
    e.stopPropagation();
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
        c.left < e.left + e.width && c.left + c.width > e.left && c.top < e.top + e.height && c.top + c.height > e.top
      );
    });
    if (configs.length) {
      this.$Store.dispatch("Designer/SelectControlByConfig", configs);
    }
  }

  async Cancel(e: MouseEvent) {
    await super.Cancel(e);
    this.slideStartCoord = null;
  }

  render() {
    return super.render(
      <>
        {this.$Store.get.Designer.Debug && (
          <AsyncSvgIcon
            {...{
              name: "GruopMove",
              class:
                "absolute top-[-10px] left-[10px] z-[2] cursor-move bg-white flex border border-solid border-[#067bef] rounded-[5px] [&>svg]:p-[2px] mt-[-1px]",
              size: 22,
              onMousedown: (e) => {
                this.Pick(e);
                this.BeginAdjust(e);
              },
              "data-type": "Move",
            }}
          />
        )}
        <div
          class="w-full h-full relative overflow-hidden !pointer-events-auto !cursor-auto"
          onDrop={this.$Store.get.Designer.Debug && this.Drop}
          onMousedown={this.$Store.get.Designer.Debug && this.SlideStart}
          style={{
            borderRadius: this.config.round + "px",
            backgroundColor: this.config.bgColor,
            borderWidth: this.config.border + "px",
            borderStyle: this.config.borderStyle,
            borderColor: this.config.borderColor || "auto",
            boxShadow: this.config.sunk ? `0 0 10px ${this.config.borderColor} inset` : "",
            border: this.$Store.get.Designer.Debug ? "1px dashed #999" : "",
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

          {this.config.$children.map((c, i) => {
            let control = this.$.appContext.components[c.type + "Control"];
            return <control key={c.id} config={c} ref={c.name} style={{ zIndex: i }}></control>;
          })}
        </div>
      </>
    );
  }
  static GetDefaultConfig(): GroupConfig {
    return { width: 200, height: 180, type: "Group", round: 10, container: true, sunk: false };
  }
}

export async function GetProps() {
  let { baseProps } = await UtilControl();

  const fieldMap: ConfiguratorItem[] = [
    ...baseProps.filter(
      (p) => p.field != "readonly" && p.field != "disabled" && p.field != "required" && p.field != "errorMessage"
    ),
    {
      name: "凹陷背景",
      des: "控件背景色是否是凹陷的",
      type: DesignerDeclare.InputType.ElSwitch,
      field: "sunk",
    },
  ];
  return fieldMap;
}

export function GetEvents() {
  const eventMap: ConfiguratorItem[] = [];
  return eventMap;
}
