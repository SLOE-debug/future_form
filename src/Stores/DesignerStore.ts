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
import {
  pauseTracking,
  reactive,
  resetTracking,
  shallowReactive,
  shallowRef,
  toRaw,
  triggerRef,
} from "@vue/reactivity";

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
  const formConfig = reactive<ControlConfig>({} as ControlConfig);
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

  const dragState = shallowReactive<{
    isDragging: boolean;
    adjustType: ControlDeclare.AdjustType | null;
    startCoord: { x: number; y: number } | null;
    offset: number[];
    lastMousePos: { x: number; y: number } | null;
  }>({ isDragging: false, adjustType: null, startCoord: null, offset: [], lastMousePos: null });
  // 缓存控件信息为 shallowRef，避免深度 reactive
  const cachedControls = shallowRef<
    Array<{
      el: HTMLDivElement;
      originalLeft: number;
      originalTop: number;
      originalWidth: number;
      originalHeight: number;
      control: Control;
    }>
  >([]);

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
    const rawConfig = toRaw(config);
    Object.assign(formConfig, MakeReactive(rawConfig));
    if (config) FillControlNameCache(config);
  }

  /**
   * 递归地将 config 对象转换为 reactive
   * @param config 控件配置对象
   * @returns reactive 配置对象
   */
  function MakeReactive(config: ControlConfig): ControlConfig {
    if (!config || typeof config !== "object") {
      return config;
    }

    // 创建一个新的对象来避免修改原始对象
    const newConfig: any = {};

    // 递归处理所有属性
    for (const key in config) {
      if (config.hasOwnProperty(key)) {
        const value = config[key];

        if (Array.isArray(value)) {
          // 处理数组：递归处理数组中的每个元素
          newConfig[key] = value.map((item) => MakeReactive(item));
        } else if (value && typeof value === "object") {
          // 处理对象：递归处理
          newConfig[key] = MakeReactive(value);
        } else {
          // 处理基本类型：直接复制
          newConfig[key] = value;
        }
      }
    }

    // 将整个配置对象转换为 reactive
    return reactive(newConfig);
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

  /**
   * 开始拖拽调整
   */
  function BeginDragAdjust(e: MouseEvent, control: Control) {
    if (!debug.value || e.activity === false) return;

    e.activity = false;
    if (e.button !== 0) return;

    const target = e.target as HTMLDivElement;
    const { offset, type } = target.dataset;

    dragState.isDragging = true;
    dragState.startCoord = { x: e.clientX, y: e.clientY };
    dragState.lastMousePos = { x: e.clientX, y: e.clientY };
    if (type) {
      dragState.adjustType = ControlDeclare.AdjustType.Move;
    }
    if (offset) {
      dragState.adjustType = ControlDeclare.AdjustType.Resize;
      dragState.offset = offset.split(",").map((s) => parseInt(s));
    }

    // 将调整类型应用到控件
    control.adjustType = dragState.adjustType;

    // 缓存所有参与拖拽的控件信息
    cachedControls.value = selectedContainerControls.value
      .map((ctrl) => ({
        el: ctrl.$el as HTMLDivElement,
        originalLeft: ctrl.config.left,
        originalTop: ctrl.config.top,
        originalWidth: ctrl.config.width,
        originalHeight: ctrl.config.height,
        control: ctrl,
      }))
      .filter((item) => item.el);

    // 绑定全局事件
    window.addEventListener("mousemove", HandleGlobalMouseMove);
    window.addEventListener("mouseup", HandleGlobalMouseUp);
  }

  /**
   * 全局鼠标移动处理 - 基于缓存的DOM直接操作
   */
  function HandleGlobalMouseMove(e: MouseEvent) {
    if (!dragState.isDragging || !dragState.lastMousePos) return;

    const { x: lastX, y: lastY } = dragState.lastMousePos;
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;

    // 如果移动距离太小，忽略
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

    // 直接操作缓存的DOM元素，不访问任何control相关内容
    switch (dragState.adjustType) {
      case ControlDeclare.AdjustType.Move:
        HandleBatchMoveDOM(deltaX, deltaY);
        break;
      case ControlDeclare.AdjustType.Resize:
        HandleBatchResizeDOM(deltaX, deltaY);
        break;
    }

    // 更新最后的鼠标位置
    dragState.lastMousePos = { x: e.clientX, y: e.clientY };
  }

  /**
   * 批量移动DOM处理 - 直接操作DOM，不访问control
   */
  function HandleBatchMoveDOM(deltaX: number, deltaY: number) {
    cachedControls.value.forEach((cached) => {
      const newLeft = cached.originalLeft + deltaX;
      const newTop = cached.originalTop + deltaY;

      cached.el.style.left = `${newLeft}px`;
      cached.el.style.top = `${newTop}px`;

      // 更新缓存的当前值
      cached.originalLeft = newLeft;
      cached.originalTop = newTop;
    });
  }

  /**
   * 批量调整大小DOM处理 - 直接操作DOM，不访问control
   */
  function HandleBatchResizeDOM(deltaX: number, deltaY: number) {
    const [offsetX, offsetY] = dragState.offset;
    const MIN_SIZE = 20;

    cachedControls.value.forEach((cached) => {
      const adjustX = deltaX * offsetX;
      const adjustY = deltaY * offsetY;
      const isLeft = Math.sign(offsetX) === -1;
      const isTop = Math.sign(offsetY) === -1;

      const canAdjustWidth = cached.originalWidth + adjustX >= MIN_SIZE;
      const canAdjustHeight = cached.originalHeight + adjustY >= MIN_SIZE;

      if (isLeft && canAdjustWidth) {
        const newLeft = cached.originalLeft + -adjustX;
        cached.el.style.left = `${newLeft}px`;
        cached.originalLeft = newLeft;
      }
      if (isTop && canAdjustHeight) {
        const newTop = cached.originalTop + -adjustY;
        cached.el.style.top = `${newTop}px`;
        cached.originalTop = newTop;
      }

      if (canAdjustWidth) {
        const newWidth = cached.originalWidth + adjustX;
        cached.el.style.width = `${newWidth}px`;
        cached.originalWidth = newWidth;
      }
      if (canAdjustHeight) {
        const newHeight = cached.originalHeight + adjustY;
        cached.el.style.height = `${newHeight}px`;
        cached.originalHeight = newHeight;
      }
    });
  }

  /**
   * 全局鼠标抬起处理
   */
  function HandleGlobalMouseUp(e: MouseEvent) {
    if (!dragState.isDragging) return;

    // 暂停依赖收集
    pauseTracking();
    // 批量赋值到 config
    cachedControls.value.forEach((item) => {
      item.control.config.left = item.originalLeft;
      item.control.config.top = item.originalTop;
      item.control.config.width = item.originalWidth;
      item.control.config.height = item.originalHeight;
      item.control.adjustType = null;
    });
    // 恢复并一次性触发
    resetTracking();
    triggerRef(selectedControls);

    // 清理拖拽状态
    dragState.isDragging = false;
    dragState.adjustType = null;
    dragState.startCoord = null;
    dragState.lastMousePos = null;
    dragState.offset = [];
    cachedControls.value = [];

    // 移除全局事件监听
    window.removeEventListener("mousemove", HandleGlobalMouseMove);
    window.removeEventListener("mouseup", HandleGlobalMouseUp);
  }

  return {
    // 状态
    debug,
    formConfig,
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
    BeginDragAdjust,
    UpdateEventNames,
  };
});
