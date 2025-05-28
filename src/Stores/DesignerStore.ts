import { defineStore } from "pinia";
import { ref, computed } from "vue";
import * as ts from "typescript";
import FormControl from "@/Controls/FormControl";
import type Control from "@/CoreUI/Designer/Control";
import DesignerSpace from "@/CoreUI/Designer/DesignerSpace";
import type { Stack } from "@/Core/Designer/UndoStack/Stack";
import { ControlDeclare, DesignerDeclare, VritualFileSystemDeclare } from "@/Types";
import { FillControlNameCache } from "@/Utils/Designer/Designer";
import { GetDesignerBackgroundFile } from "@/Utils/VirtualFileSystem/Index";
import { GetBaseControlProps } from "@/Utils/Designer/Controls";
import { reactive, shallowReactive } from "@vue/reactivity";

type ControlConfig = ControlDeclare.ControlConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;
type MenuItem = DesignerDeclare.MenuItem;

type IDirectory = VritualFileSystemDeclare.IDirectory;
type IFile = VritualFileSystemDeclare.IFile;


/**
 * 获取当前窗体的所有引用
 * @param obj 窗体的vue对象
 * @returns 所有引用
 */
export function GetAllRefs(obj: any) {
  const stack = [obj];
  const refs: Record<string, any> = {};

  while (stack.length > 0) {
    const current = stack.pop();

    if (current.$refs && Object.keys(current.$refs).length) {
      for (const refKey in current.$refs) {
        if (Object.prototype.hasOwnProperty.call(current.$refs, refKey)) {
          if (current.$refs[refKey]) {
            refs[refKey] = current.$refs[refKey];
            stack.push(current.$refs[refKey]);
          }
        }
      }
    }
  }

  return refs;
}

/**
 * 检查一组控件是否为相同类型
 */
function SameType(controls: Control[]): boolean {
  let type;
  for (let i = 0; i < controls.length; i++) {
    const m = controls[i];
    if (!type) type = m.config.type;
    else if (m.config.type != type) return false;
  }

  return !!type && true;
}

// 模块外部变量
let pushStackTimeOut: NodeJS.Timeout;
let tempStacks: Stack[] = [];

export const useDesignerStore = defineStore("designer", () => {
  // 状态 (State)
  const debug = ref<boolean>(false);
  const selectedControls = ref<Control[]>([]);
  const bigShotControl = ref<Control | null>(null);
  const controlProps = ref<ConfiguratorItem[]>([]);
  const controlEvents = ref<ConfiguratorItem[]>([]);
  const formDesigner = ref<FormControl | null>(null);
  const designerSpace = ref<DesignerSpace | null>(null);
  const menus = ref<MenuItem[]>([]);
  const preview = ref<boolean>(false);
  const stacks = ref<(Stack | Stack[])[]>([]);
  const copyControlJson = ref<string>("");
  const controlNames = ref<string[]>([]);
  const isActive = ref<boolean>(false);
  const eventNames = ref<string[]>([]);


  const flatConfigs = {
    entities: shallowReactive({}) as Record<string, ControlConfig>,
    childrenMap: shallowReactive({}) as Record<string, string[]>,
  };

  const selectedContainerControls = computed(() =>
    selectedControls.value.filter((c) => {
      if (bigShotControl.value) {
        return c.config.fromContainer === bigShotControl.value.config.fromContainer;
      }
      return true;
    })
  );

  /**
   * 更新事件名称列表
   * @param root 文件系统根目录
   * @param currentFile 当前文件
   */
  async function UpdateEventNames(root: IDirectory, currentFile: IFile | null) {
    if (!currentFile) {
      eventNames.value = [];
      return;
    }

    const file = GetDesignerBackgroundFile(root, currentFile);
    if (!file) {
      eventNames.value = [];
      return;
    }

    const code = file.content;
    const sourceFile = ts.createSourceFile("temp.ts", code, ts.ScriptTarget.ESNext, true);
    const events: string[] = [];

    // 递归获取所有方法
    function GetEvents(node: ts.Node) {
      if (node.kind === ts.SyntaxKind.MethodDeclaration) {
        events.push((node as any).name.getText());
      }
      ts.forEachChild(node, GetEvents);
    }

    ts.forEachChild(sourceFile, GetEvents);
    eventNames.value = events;
  }

  /**
   * 撤销操作
   */
  function Undo() {
    const stack = stacks.value.pop();
    if (Array.isArray(stack)) {
      stack.forEach((s) => s.Undo());
    } else {
      stack?.Undo();
    }
  }

  /**
   * 添加一个操作到撤销栈
   */
  function AddStack(stack: Stack) {
    if (!stack.Efficient() && stack.action !== DesignerDeclare.StackAction.SwitchContainer) return;

    if (pushStackTimeOut) clearTimeout(pushStackTimeOut);
    tempStacks.push(stack);

    pushStackTimeOut = setTimeout(() => {
      if (tempStacks.length === 1) {
        stacks.value.push(tempStacks[0] as Stack & Stack[]);
      } else {
        stacks.value.push(tempStacks as unknown as Stack & Stack[]);
      }
      tempStacks = [];
    }, 150);
  }

  /**
   * 设置表单设计器
   */
  function SetFormDesigner(value: FormControl) {
    formDesigner.value = value;
    if (!value) return;
    SelectControl([value]);
  }

  /**
   * 渲染控件配置器
   */
  async function RenderControlConfigurator() {
    let props: ConfiguratorItem[] = [];
    let events: ConfiguratorItem[] = [];

    if (selectedControls.value.length === 1 || SameType(selectedControls.value)) {
      const control = selectedControls.value[0];
      const { type } = control.config;
      const { GetProps, GetEvents } = await import(`@/Controls/${type}Control.tsx`);

      if (GetProps) {
        props = [...GetBaseControlProps(control.config, control), ...(await GetProps(control.config, control))];
      }

      events = GetEvents ? await GetEvents(control.config, control) : [];

      props = props.map((m) => {
        const p = { ...m };
        p.config = control.config;
        return p;
      });

      events = events.map((m) => {
        const e = { ...m };
        e.config = control.config;
        return e;
      });
    }

    controlProps.value = props;
    controlEvents.value = events;
  }

  /**
   * 通过配置选择控件
   */
  function SelectControlByConfig(configs: ControlConfig[]) {
    const refs = GetAllRefs(formDesigner.value);
    const controls = configs.map((c) => refs[c.name]) as Control[];
    return SelectControl(controls);
  }

  /**
   * 选择控件
   */
  function SelectControl(controls: Control[]) {
    if (!debug.value) return;

    // 清除选中
    selectedControls.value.forEach((oc) => {
      oc.selected = false;
      oc.bigShot = false;
      // 调用 unSelected 方法
      oc.unSelected();
    });

    // 选中
    controls.forEach((c) => {
      c.selected = true;
    });

    // 设置选中
    selectedControls.value = controls;
    RenderControlConfigurator();

    // 如果只有一个控件，清除 "大人物"
    if (controls.length === 1) {
      bigShotControl.value = null;
    } else {
      // 如果有多个控件，最后一个控件为 "大人物"，为对齐/调整/缩放等操作的参考控件
      const lastControl = controls[controls.length - 1];
      lastControl.bigShot = true;
      // 设置 "大人物"
      bigShotControl.value = lastControl;
    }

    // 设置菜单
    SetMenus(controls);

    return controls;
  }

  /**
   * 复制控件
   */
  function CopyControl() {
    const controls = selectedControls.value
      .filter((c) => c.config.type !== "Form")
      .map((c) => c.Clone())
      .filter((c) => !!c);

    return JSON.stringify(controls);
  }

  /**
   * 清除选中的控件
   */
  function ClearSelected() {
    selectedControls.value.forEach((oc) => {
      oc.selected = false;
      oc.bigShot = false;
    });
    selectedControls.value = [];
  }

  /**
   * 设置菜单项
   */
  function SetMenus(controls: Control[]) {
    menus.value = [
      { text: "查看代码", code: "ViewCode", shortcutKey: "F7" },
      { text: "粘贴", code: "Paste", shortcutKey: "Ctrl+C" },
    ];

    if (controls.length && controls[0].config.type !== "Form") {
      menus.value.splice(
        1,
        0,
        ...[
          { text: "置于顶层", code: "BringFront" },
          { text: "置于底层", code: "UnderFloor" },
          { text: "复制", code: "Copy" },
        ]
      );
      menus.value.push({ text: "删除", code: "Delete" });
    }

    if (controls.length === 1) {
      menus.value.push({ text: "上移一层", code: "MoveUpLevel" }, { text: "下移一层", code: "MoveDownLevel" });
    }

    if (controls.length > 1) {
      menus.value.push(
        ...[
          { code: "LeftJustify", text: "左对齐" },
          { code: "RightJustify", text: "右对齐" },
          { code: "VCJustify", text: "垂直居中对齐" },
          { code: "TopJustify", text: "上对齐" },
          { code: "HCJustify", text: "水平居中对齐" },
          { code: "BottomJustify", text: "下对齐" },
          { code: "SameHeight", text: "同高" },
          { code: "SameWidth", text: "同宽" },
          { code: "SameSize", text: "大小相同" },
          { code: "VDJustify", text: "水平分布" },
          { code: "HDJustify", text: "垂直分布" },
        ]
      );
    }
  }

  /**
   * 设置表单配置
   */
  function SetFormConfig(config: ControlConfig) {
    FlattenFormConfig(config);
    if (config) FillControlNameCache(config);
  }

  // 拍平 formConfig 的所有控件配置
  function FlattenFormConfig(config: ControlConfig) {
    if (!config || typeof config !== "object") return;

    flatConfigs.entities = {};
    flatConfigs.childrenMap = {};

    function flatten({ $children, ...rest }: ControlConfig) {
      flatConfigs.entities[rest.id] = rest;
      if ($children?.length) {
        flatConfigs.childrenMap[rest.id] = $children.map((c) => c.id);
        $children.forEach((child) => flatten(child));
      }
    }

    flatten(config);
  }

  /**
   * 设置预览模式
   */
  function SetPreview(value: boolean) {
    preview.value = value;
    debug.value = !value;
  }

  /**
   * 通过名称获取控件实例
   */
  function GetControlByName(name: string) {
    let controls: any[] = [formDesigner.value];

    while (controls.length) {
      const control = controls.shift();
      if (!control || !control.$refs) continue;
      if (control.$refs[name]) return control.$refs[name];
      controls.push(...Object.values(control.$refs));
    }

    return null;
  }


  return {
    // 状态
    debug,
    flatConfigs,
    selectedControls,
    bigShotControl,
    controlProps,
    controlEvents,
    formDesigner,
    designerSpace,
    menus,
    preview,
    stacks,
    copyControlJson,
    controlNames,
    isActive,
    eventNames,
    // 计算属性
    selectedContainerControls,

    // 方法
    Undo,
    AddStack,
    SetFormDesigner,
    RenderControlConfigurator,
    SelectControlByConfig,
    SelectControl,
    CopyControl,
    ClearSelected,
    SetMenus,
    SetFormConfig,
    SetPreview,
    GetControlByName,
    UpdateEventNames,
  };
});
