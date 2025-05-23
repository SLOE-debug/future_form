import FormControl from "@/Controls/FormControl";
import { Component, Prop, Vue } from "vue-facing-decorator";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { EventManager } from "@/Utils";
import ContextMenu from "@/CoreUI/Designer/Components/ContextMenu";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { AddControlToDesigner, DropAddControl, FindControlsByType } from "@/Utils/Designer/Designer";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { editor } from "../Editor/EditorPage";
import { useDesignerStore } from "@/Stores/designerStore";

type ControlConfig = ControlDeclare.ControlConfig;
type Coord = UtilsDeclare.Coord;

/**
 * 绘制区域
 */
@Component
export default class DesignerSpace extends Vue {
  @Prop
  height: string;

  get config() {
    return this.designerStore.formConfig;
  }

  get designerStore() {
    return useDesignerStore();
  }

  Drop(e: DragEvent) {
    DropAddControl(e, this);
  }

  AddControl(paste: boolean, ...configs: ControlConfig[]) {
    for (const c of configs) {
      AddControlToDesigner(c, this, paste, this.pasteOffset);
    }
  }

  async DeleteControl(e: KeyboardEvent): Promise<ControlConfig[]> {
    if (!this.designerStore.isActive) return;

    let delControls = [];
    for (const c of this.designerStore.selectedContainerControls) {
      delControls.push(await c.Delete());
    }
    // this.$Store.get.Designer.SelectedContainerControls.map(async (c) => {
    //   return (await c.Delete())?.del;
    // }).filter((c) => c);
    if (delControls.length) this.designerStore.ClearSelected();
    if (delControls.length) return delControls;
  }

  pasteCount = 0;
  get pasteOffset() {
    return +(-20 * this.pasteCount).toFixed(4);
  }

  async CtrlKeySControl(e: KeyboardEvent) {
    editor.Save();
  }

  async CtrlShiftAltKeySControl(e: KeyboardEvent) {
    editor.SaveAll();
  }

  async CtrlKeyCControl(e: KeyboardEvent) {
    this.designerStore.copyControlJson = await this.designerStore.CopyControl();
    this.pasteCount = 1;
  }

  async CtrlKeyVControl(e: KeyboardEvent) {
    try {
      let configs = JSON.parse(this.designerStore.copyControlJson);
      this.AddControl(true, ...configs);
      this.pasteCount++;
      this.$nextTick(() => {
        this.designerStore.SelectControlByConfig(configs);
      });
    } catch {}
  }

  async CtrlKeyAControl(e: KeyboardEvent) {
    await this.$Store.dispatch("Designer/SelectControlByConfig", FindControlsByType(this.designerStore.formConfig));
    e.preventDefault();
  }

  async CtrlKeyZControl(e: KeyboardEvent) {
    await this.designerStore.Undo();
    e.preventDefault();
  }

  F7Control(e: KeyboardEvent) {
    this.$Store.dispatch("VirtualFileSystem/SelectFile", this.$Store.get.VirtualFileSystem.CurrentFile.children[0]);
    e.preventDefault();
  }

  Arrow(type) {
    const directions = {
      ArrowRight: { axis: "left", delta: 1 },
      ArrowLeft: { axis: "left", delta: -1 },
      ArrowUp: { axis: "top", delta: -1 },
      ArrowDown: { axis: "top", delta: 1 },
    };

    const { axis, delta } = directions[type] || {};

    if (axis && delta) {
      this.designerStore.selectedControls.forEach((sc) => {
        sc.config[axis] += delta;
      });
    }
  }

  // 键盘按下处理
  HandleKeydown(e: KeyboardEvent) {
    if (
      (e.target as HTMLElement).nodeName == "INPUT" || // 输入框
      (e.target as HTMLElement).nodeName == "TEXTAREA" || // 文本框
      this.$Store.get.VirtualFileSystem.CurrentFile?.suffix != VritualFileSystemDeclare.FileType.FormDesigner
    )
      return;

    let funcName = e.code + "Control";
    if (e.ctrlKey) funcName = "Ctrl" + funcName;
    if (e.shiftKey) funcName = "Shift" + funcName;
    if (e.altKey) funcName = "Alt" + funcName;

    if (e.code.startsWith("Arrow")) {
      this.Arrow(e.code);
      e.preventDefault();
    } else this[funcName]?.(e);
  }

  created() {
    if (!this.$Store.get.VirtualFileSystem.CurrentFile.extraData) {
      this.$Store.get.VirtualFileSystem.CurrentFile.extraData = FormControl.GetDefaultConfig();
    }
    this.designerStore.ClearSelected();
    this.designerStore.SetFormConfig(this.$Store.get.VirtualFileSystem.CurrentFile.extraData);
  }

  eventManager: EventManager = new EventManager();
  async mounted() {
    this.eventManager.addBatch(
      window,
      {
        keydown: this.HandleKeydown,
        mousedown: (e: MouseEvent) => {
          this.menu = false;
        },
      },
      this
    );
    this.designerStore.designerSpace = this;
  }

  async unmounted() {
    this.eventManager?.removeAll();
    this.eventManager = null;
    this.designerStore.designerSpace = null;
    this.designerStore.stacks = [];
  }

  menu: boolean = false;
  menuPos: Coord = { x: 0, y: 0 };
  render() {
    return (
      <div
        style={{ height: this.height }}
        class={[css.workspace, "w-full h-full overflow-auto select-none relative"].join(" ")}
        onDragover={(e) => e.preventDefault()}
        onDrop={this.Drop}
        onContextmenu={(e) => {
          if (!this.designerStore.debug) return;
          this.menu = true;
          this.menuPos = { x: e.clientX, y: e.clientY };
          e.preventDefault();
        }}
        onClick={(e) => {
          this.designerStore.isActive = true;
          e.stopPropagation();
        }}
      >
        <ContextMenu
          v-show={this.menu}
          {...{
            position: this.menuPos,
            onClick: (_) => (this.menu = false),
          }}
        ></ContextMenu>
        <FormControl
          {...{
            l: false,
            t: false,
            lt: false,
            lb: false,
            rt: false,
            move: false,
            // locate: { index: 0 },
            config: this.$Store.get.VirtualFileSystem.CurrentFile.extraData,
            ref: "form",
          }}
        ></FormControl>
      </div>
    );
  }
}
