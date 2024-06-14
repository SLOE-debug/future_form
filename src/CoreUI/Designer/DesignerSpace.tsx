import FormControl from "@/Controls/FormControl";
import { Component, Prop, Provide, Vue } from "vue-facing-decorator";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { BindEventContext, RegisterEvent } from "@/Utils/Index";
import ContextMenu from "@/CoreUI/Designer/Components/ContextMenu";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import {
  CreateControlByDragEvent,
  CreateControlName,
  FindControlsByKeyValue,
  FindControlsByType,
} from "@/Utils/Designer/Designer";
import { Stack, StackAction } from "@/Core/Designer/UndoStack/Stack";
import Control from "./Control";
import { AddControlDeclareToDesignerCode } from "@/Utils/Designer/Designer";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";

type ControlConfig = ControlDeclare.ControlConfig;

type Coord = UtilsDeclare.Coord;

/**
 * 绘制区域
 */
@Component
export default class DesignerSpace extends Vue {
  @Prop
  height: string;

  declare $refs: any;

  Drop(e: DragEvent) {
    let config = CreateControlByDragEvent.call(this, e) as ControlConfig;
    this.AddControl(false, config);
    AddControlDeclareToDesignerCode(config);
  }

  AddControl(paste: boolean, ...configs: ControlConfig[]) {
    configs.forEach((c) => {
      CreateControlName(c);
      c.top -= paste ? this.pasteOffset : c.height / 2;
      c.left -= paste ? this.pasteOffset : c.width / 2;
      console.log(c);

      let containerConfig =
        c.fromContainer && FindControlsByKeyValue(this.$Store.get.Designer.FormConfig, "name", c.fromContainer);
      if (containerConfig) {
        containerConfig.$children.push(c);
      } else {
        delete c.fromContainer;
        delete c.fromTabId;
        this.$Store.get.Designer.FormConfig.$children.push(c);
      }
      this.$nextTick(() => {
        this.$Store.dispatch(
          "Designer/AddStack",
          new Stack(
            this.GetContainerByContainerName(c.fromContainer)[c.name] as Control,
            null,
            null,
            StackAction.Create
          )
        );
      });
    });
  }

  /**
   * 通过空间配置的 fromContainer 属性获取容器
   */
  GetContainerByContainerName(name: string) {
    if (!name) return this.$refs["form"].$refs;

    // 获取表单下的refs列表
    let refs = Object.keys(this.$refs["form"].$refs).map((k) => this.$refs["form"].$refs[k]);

    do {
      let ref = refs.shift();
      if (ref.config.name == name) return ref.$refs;
      if (ref.$refs) refs.push(...Object.keys(ref.$refs).map((k) => ref.$refs[k]));
    } while (refs.length);
  }

  DeleteControl(e: KeyboardEvent): ControlConfig[] {
    if (!this.$Store.get.Designer.Active) return;
    let delControls = this.$Store.get.Designer.SelectedContainerControls.map((c) => c.Delete()?.del).filter((c) => c);
    if (delControls.length) this.$Store.dispatch("Designer/ClearSelected");

    return delControls;
  }

  pasteCount = 0;
  get pasteOffset() {
    return +(-20 * this.pasteCount).toFixed(4);
  }

  async CtrlKeyCControl(e: KeyboardEvent) {
    this.$Store.dispatch("Designer/SetCopyControlJson", await this.$Store.dispatch("Designer/CopyControl"));
    this.pasteCount = 1;
  }

  async CtrlKeyVControl(e: KeyboardEvent) {
    try {
      let configs = JSON.parse(this.$Store.get.Designer.CopyControlJson);
      this.AddControl(true, ...configs);
      this.pasteCount++;
      this.$nextTick(() => {
        this.$Store.dispatch("Designer/SelectControlByConfig", configs);
      });
    } catch {}
  }

  async CtrlKeyAControl(e: KeyboardEvent) {
    await this.$Store.dispatch(
      "Designer/SelectControlByConfig",
      FindControlsByType(this.$Store.get.Designer.FormConfig)
    );
    e.preventDefault();
  }

  async CtrlKeyZControl(e: KeyboardEvent) {
    await this.$Store.dispatch("Designer/Undo");
    e.preventDefault();
  }

  // EscapeControl(e: KeyboardEvent) {
  //   this.$router.push({ path: "/FormList" });
  //   e.preventDefault();
  // }

  F7Control(e: KeyboardEvent) {
    this.$Store.dispatch("VirtualFileSystem/SelectFile", this.$Store.get.VirtualFileSystem.CurrentFile.children[0]);
    e.preventDefault();
  }

  Arrow(type) {
    this.$Store.get.Designer.SelectedControls.forEach((sc) => {
      switch (type) {
        case "ArrowRight":
          sc.config.left++;
          break;
        case "ArrowLeft":
          sc.config.left--;
          break;
        case "ArrowUp":
          sc.config.top--;
          break;
        case "ArrowDown":
          sc.config.top++;
          break;
      }
    });
  }

  @Provide
  rootConfig;
  created() {
    if (!this.$Store.get.VirtualFileSystem.CurrentFile.extraData) {
      this.$Store.get.VirtualFileSystem.CurrentFile.extraData = FormControl.GetDefaultConfig();
    }
    this.rootConfig = [this.$Store.get.VirtualFileSystem.CurrentFile.extraData];
    this.$Store.dispatch("Designer/ClearSelected");
    this.$Store.dispatch("Designer/SetFormConfig", this.rootConfig[0]);
  }

  winEventHandlers = {
    keydown: function (e: KeyboardEvent) {
      if (
        (e.target as HTMLElement).nodeName == "INPUT" || // 输入框
        (e.target as HTMLElement).nodeName == "TEXTAREA" || // 文本框
        this.$Store.get.VirtualFileSystem.CurrentFile?.suffix != VritualFileSystemDeclare.FileType.FormDesigner
      )
        return;

      let funcName = e.code + "Control";
      if (e.ctrlKey) funcName = "Ctrl" + funcName;

      if (e.code.startsWith("Arrow")) {
        this.Arrow(e.code);
        e.preventDefault();
      } else this[funcName]?.(e);
    },
    mousedown: function () {
      this.menu = false;
    },
  };
  async mounted() {
    BindEventContext(this.winEventHandlers, this);
    RegisterEvent.call(window, this.winEventHandlers);
    await this.$Store.dispatch("Designer/SetDesignerSpace", this);
  }

  async unmounted() {
    RegisterEvent.call(window, this.winEventHandlers, true);
    this.winEventHandlers = null;
    await this.$Store.dispatch("Designer/SetDesignerSpace", null);
    this.$Store.dispatch("Designer/ClearStack");
  }

  menu: boolean = false;
  menuPos: Coord = { x: 0, y: 0 };
  render() {
    return (
      <div
        style={{ height: this.height }}
        class={css.workspace}
        onDragover={(e) => e.preventDefault()}
        onDrop={this.Drop}
        onContextmenu={(e) => {
          if (!this.$Store.get.Designer.Debug) return;
          this.menu = true;
          this.menuPos = { x: e.clientX, y: e.clientY };
          e.preventDefault();
        }}
        onClick={(e) => {
          this.$Store.dispatch("Designer/SetActive", true);
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
            locate: { index: 0 },
            ref: "form",
          }}
        ></FormControl>
      </div>
    );
  }
}
