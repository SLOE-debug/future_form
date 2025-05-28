import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import DevelopmentModules from "@/Utils/DevelopmentModules";
import { defineAsyncComponent } from "vue";
import { Component } from "vue-facing-decorator";
import { DropAddControl } from "@/Utils/Designer";

type GroupConfig = ControlDeclare.GroupConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;
type Coord = UtilsDeclare.Coord;

const AsyncSlideSelector = defineAsyncComponent(() => import("@/CoreUI/Designer/Components/SlideSelector"));
const AsyncSvgIcon = defineAsyncComponent(() => import("@/Components/SvgIcon"));

@Component
export default class GroupControl extends Control {
  public override get config() {
    return super.config as GroupConfig;
  }

  Drop(e: DragEvent) {
    DropAddControl(e, this);
    e.stopPropagation();
  }

  slideStartCoord: Coord;
  SlideStart(e: MouseEvent) {
    if (e.button == 0 && e.activity != false && this.designerStore.debug)
      this.slideStartCoord = { x: e.clientX, y: e.clientY };
  }

  SlideEnd(e) {
    if (!e || !e.width || !e.height) return;

    let configs = this.kids
      .map((kid) => this.designerStore.flatConfigs.entities[kid])
      .filter((c) => {
        return (
          c.left < e.left + e.width && c.left + c.width > e.left && c.top < e.top + e.height && c.top + c.height > e.top
        );
      });
    if (configs.length) {
      this.designerStore.SelectControlByConfig(configs);
    }
  }

  async HandleMouseUp(e: MouseEvent) {
    this.slideStartCoord = null;
  }

  mounted(): void {
    this.eventManager.add(window, "mouseup", this.HandleMouseUp, this);
  }

  render() {
    return super.render(
      <>
        {this.designerStore.debug && (
          <AsyncSvgIcon
            {...{
              name: "GruopMove",
              class:
                "absolute top-[-10px] left-[10px] z-[2] cursor-move bg-white flex border border-solid border-[#067bef] rounded-[5px] [&>svg]:p-[2px] mt-[-1px]",
              size: 22,
              "data-type": "Move",
            }}
          />
        )}
        <div
          class="w-full h-full relative overflow-hidden !pointer-events-auto !cursor-auto"
          onDrop={this.isDesignerMode && this.Drop}
          onMousedown={this.designerStore.debug && this.SlideStart}
          style={{
            borderRadius: this.config.round + "px",
            backgroundColor: this.config.bgColor,
            borderWidth: this.config.border + "px",
            borderStyle: this.config.borderStyle,
            borderColor: this.config.borderColor || "auto",
            boxShadow: this.config.sunk ? `0 0 10px ${this.config.borderColor} inset` : "",
            border: this.designerStore.debug ? "1px dashed #999" : "",
          }}
        >
          {this.designerStore.debug && (
            <AsyncSlideSelector
              {...{
                start: this.slideStartCoord,
                onSlideEnd: this.SlideEnd,
              }}
            />
          )}

          {this.kids
            .map((kid) => this.designerStore.flatConfigs.entities[kid])
            .map((c, i) => {
              let control = this.$.appContext.components[c.type + "Control"];
              return <control key={c.id} id={c.id} ref={c.name} style={{ zIndex: i }}></control>;
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
  let { baseProps } = await DevelopmentModules.Load();

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
