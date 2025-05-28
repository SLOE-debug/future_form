import { useDesignerStore } from "@/Stores/DesignerStore";
import { useVirtualFileSystemStore } from "@/Stores/VirtualFileSystemStore";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { Component, Emit, Prop, Vue } from "vue-facing-decorator";

type ControlConfig = ControlDeclare.ControlConfig;
type MenuItem = DesignerDeclare.MenuItem;
type Coord = UtilsDeclare.Coord;

@Component
export default class ContextMenu extends Vue {
  @Prop
  position: Coord;

  get designerStore() {
    return useDesignerStore();
  }

  get virtualFileSystemStore() {
    return useVirtualFileSystemStore();
  }

  get style() {
    let { x, y } = this.position;
    let { left: l, top: t } = this.designerStore.designerSpace?.$el?.getBoundingClientRect() || {
      left: 0,
      top: 0,
    };

    t -= (this.designerStore.designerSpace?.$el as HTMLDivElement)?.scrollTop || 0;

    return {
      top: y - t + "px",
      left: x - l + "px",
    };
  }

  async ViewCode() {
    this.virtualFileSystemStore.SelectFile(this.virtualFileSystemStore.currentFile.children[0]);
  }

  async BringFront() {
    for (const control of this.designerStore.selectedControls) {
      let { del, children } = await control.Delete();
      // 将删除的控件添加到扁平化配置中
      this.designerStore.flatConfigs.entities[del.id] = del;
      // 将控件ID添加到父控件的子控件列表末尾
      children.push(del.id);
    }
  }

  async UnderFloor() {
    for (const control of this.designerStore.selectedControls) {
      let { del, children } = await control.Delete();
      // 将删除的控件添加到扁平化配置中
      this.designerStore.flatConfigs.entities[del.id] = del;
      // 将控件ID添加到父控件的子控件列表开头
      children.unshift(del.id);
    }
  }

  Copy() {
    this.designerStore.designerSpace.CtrlKeyCControl(null);
  }

  Paste() {
    this.designerStore.designerSpace.CtrlKeyVControl(null);
  }

  Delete() {
    this.designerStore.designerSpace.DeleteControl(null);
  }

  MoveUpLevel() {
    const selectedControl = this.designerStore.selectedControls[0];
    const { flatConfigs } = this.designerStore;
    
    // 查找父控件ID
    let parentId = null;
    for (const id in flatConfigs.childrenMap) {
      const children = flatConfigs.childrenMap[id];
      if (children.includes(selectedControl.config.id)) {
        parentId = id;
        break;
      }
    }
    
    if (parentId) {
      const children = flatConfigs.childrenMap[parentId];
      const i = children.findIndex(id => id === selectedControl.config.id);
      if (i < children.length - 1) {
        [children[i], children[i + 1]] = [children[i + 1], children[i]];
      }
    }
  }

  MoveDownLevel() {
    const selectedControl = this.designerStore.selectedControls[0];
    const { flatConfigs } = this.designerStore;
    
    // 查找父控件ID
    let parentId = null;
    for (const id in flatConfigs.childrenMap) {
      const children = flatConfigs.childrenMap[id];
      if (children.includes(selectedControl.config.id)) {
        parentId = id;
        break;
      }
    }
    
    if (parentId) {
      const children = flatConfigs.childrenMap[parentId];
      const i = children.findIndex(id => id === selectedControl.config.id);
      if (i > 0) {
        [children[i - 1], children[i]] = [children[i], children[i - 1]];
      }
    }
  }

  Justify(type: string) {
    let feild = type.replace("Justify", "").replace("Same", "").toLowerCase();
    let controls = this.designerStore.selectedControls.filter((c) => !c.bigShot);
    let bigShot = this.designerStore.bigShotControl;
    let field = "";
    switch (type) {
      case "RightJustify":
      case "VCJustify":
        let { left: l, width: w } = bigShot.config;
        controls.forEach((c) => {
          if (c.config.fromContainer != bigShot.config.fromContainer) return;
          let { left: cl, width: cw } = c.config;
          let offset = cl + cw - (l + w);
          if (type == "VCJustify") offset += w / 2 - cw / 2;

          c.config.left -= offset;
        });
        break;
      case "BottomJustify":
      case "HCJustify":
        let { top: t, height: h } = bigShot.config;
        controls.forEach((c) => {
          if (c.config.fromContainer != bigShot.config.fromContainer) return;
          let { top: ct, height: ch } = c.config;
          let offset = ct + ch - (t + h);
          if (type == "HCJustify") offset += h / 2 - ch / 2;

          c.config.top -= offset;
        });
        break;
      case "SameSize":
        controls.forEach((c) => {
          if (c.config.fromContainer != bigShot.config.fromContainer) return;
          c.config.width = bigShot.config.width;
          c.config.height = bigShot.config.height;
        });
        break;
      case "VDJustify":
        field = "left";
      case "HDJustify":
        if (!field) field = "top";
        let allControls = controls.concat(bigShot);
        allControls.sort((a, b) => a.config[field] - b.config[field]);
        let startControl = allControls[0];
        let endControl = allControls[allControls.length - 1];

        let insideControls = allControls.slice(1, -1);
        if (insideControls.length) {
          let totalLength = endControl.config[field] - startControl.config[field];
          let n = totalLength / (insideControls.length + 1);
          insideControls.forEach((c, i) => {
            c.config[field] = startControl.config[field] + (i + 1) * n;
          });
        }
        break;
      default:
        controls.forEach((c) => {
          if (c.config.fromContainer != bigShot.config.fromContainer) return;
          c.config[feild] = bigShot.config[feild];
        });
        break;
    }
  }

  @Emit("selected")
  Selected(m: MenuItem) {
    // 如果 m.code 是与对齐有关的
    if (m.code.includes("Justify") || m.code.includes("Same")) {
      this.Justify(m.code);
      return;
    }

    this[m.code] && this[m.code]();
  }

  // 这个方法已经不再需要，因为我们直接使用扁平化配置
  GetCurrentControlArray(config: ControlConfig, id: string) {
    // 保留方法以防其他地方调用，但实际逻辑已移至调用方
    return null;
  }

  render() {
    return (
      <div class="contextmenu absolute bg-[#3c3c3c] w-[240px] z-[1000] rounded-[4px]" style={this.style}>
        <ul class="w-full h-full p-[5px]">
          {this.designerStore.menus.map((m) => {
            return (
              <li
                class="h-[25px] text-white text-[14px] flex items-center justify-between p-[0_20px] hover:bg-[#094771]"
                onMousedown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  if (e.button == 0) this.Selected(m);
                }}
              >
                <span>{m.text}</span>
                <span>{m.shortcutKey}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
