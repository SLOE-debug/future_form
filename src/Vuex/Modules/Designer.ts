import FormControl from "@/Controls/FormControl";
import Control from "@/CoreUI/Designer/Control";
import DesignerSpace from "@/CoreUI/Designer/DesignerSpace";
import { Stack } from "@/Core/Designer/UndoStack/Stack";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { FillControlNameCache } from "@/Utils/Designer/Designer";
import { Module, ActionTree, GetterTree } from "vuex";
import { GetProps as GetBaseProps } from "@/CoreUI/Designer/Control";
import * as ts from "typescript";
import { GetDesignerBackgroundFile } from "@/Utils/VirtualFileSystem/Index";

type ControlConfig = ControlDeclare.ControlConfig;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;
type MenuItem = DesignerDeclare.MenuItem;

export type DesignerState = {
  Debug: boolean;
  FormConfig: ControlConfig;
  SelectedControls: Control[];
  SelectedContainerControls?: Control[];
  BigShotControl: Control;
  ControlProps: ConfiguratorItem[];
  ControlEvents: ConfiguratorItem[];
  $FormDesigner: FormControl;
  $DesignerSpace: DesignerSpace;
  Menus: MenuItem[];
  EventNames: string[];
  Preview: boolean;
  Stacks: Stack[] | Stack[][];
  CopyControlJson: string;
  ControlNames: string[];
};

const state: DesignerState = {
  Debug: false,
  FormConfig: null,
  SelectedControls: [],
  BigShotControl: null,
  ControlProps: [],
  ControlEvents: [],
  $FormDesigner: null,
  $DesignerSpace: null,
  Menus: [],
  EventNames: [],
  Preview: false,
  Stacks: [],
  CopyControlJson: "",
  ControlNames: [],
};

/**
 * 获取当前窗体的所有引用
 * @param obj 窗体的vue对象
 * @returns 所有引用
 */
export function GetAllRefs(obj) {
  const stack = [obj];
  const refs = {};

  while (stack.length > 0) {
    const current = stack.pop();

    if (current.$refs && Object.keys(current.$refs).length) {
      for (const refKey in current.$refs) {
        if (current.$refs.hasOwnProperty(refKey)) {
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

function SameType(controls: Control[]) {
  let type;
  for (let i = 0; i < controls.length; i++) {
    const m = controls[i];
    if (!type) type = m.config.type;
    else if (m.config.type != type) return false;
  }

  return !!type && true;
}

let pushStackTimeOut: NodeJS.Timeout;
let tempStacks: Stack[] = [];

const actions: ActionTree<DesignerState, any> = {
  Undo({ state }) {
    let stack = state.Stacks.pop();
    if (Array.isArray(stack)) {
      stack.forEach((s) => s.Undo());
    } else {
      stack?.Undo();
    }
  },
  AddStack({ state }, stack: Stack) {
    if (!stack.Efficient()) return;
    if (pushStackTimeOut) clearTimeout(pushStackTimeOut);
    tempStacks.push(stack);
    pushStackTimeOut = setTimeout(() => {
      if (tempStacks.length == 1) state.Stacks.push(tempStacks[0] as Stack & Stack[]);
      else state.Stacks.push(tempStacks as Stack & Stack[]);
      tempStacks = [];
    }, 150);
  },
  ClearStack({ state }) {
    state.Stacks = [];
  },
  SetDebug({ state }, debug) {
    state.Debug = debug;
  },
  SetDesignerSpace({ state }, designerSpace: DesignerSpace) {
    state.$DesignerSpace = designerSpace;
  },
  SetFormDesigner({ state }, formDesigner) {
    state.$FormDesigner = formDesigner;
  },
  RenderControlConfigurator({ state }) {
    let props: ConfiguratorItem[] = [];
    let events: ConfiguratorItem[] = [];
    if (state.SelectedControls.length == 1 || SameType(state.SelectedControls)) {
      let { GetProps, GetEvents } = require(`@/Controls/${state.SelectedControls[0].config.type}Control.tsx`);

      if (GetProps) {
        props = [
          ...GetBaseProps(state.SelectedControls[0].config, state.SelectedControls[0]),
          ...GetProps(state.SelectedControls[0].config, state.SelectedControls[0]),
        ];
      }

      events = GetEvents ? GetEvents(state.SelectedControls[0].config) : [];

      props = props.map((m) => {
        let p = { ...m };
        p.config = state.SelectedControls[0].config;
        return p;
      });
      events = events.map((m) => {
        let e = { ...m };
        e.config = state.SelectedControls[0].config;
        return e;
      });
    }
    state.ControlProps = props;
    state.ControlEvents = events;
  },
  SelectControlByConfig({ state, dispatch }, configs: ControlConfig[]) {
    let refs = GetAllRefs(state.$FormDesigner);
    let controls = configs.map((c) => refs[c.name]) as Control[];

    return dispatch("SelectControl", controls);
  },
  SelectControl({ state, dispatch }, controls: Control[]) {
    if (!state.Debug) return;
    state.SelectedControls.forEach((oc) => {
      oc.selected = false;
      oc.bigShot = false;
    });
    controls.forEach((c) => {
      c.selected = true;
    });
    state.SelectedControls = controls;
    dispatch("RenderControlConfigurator");
    if (controls.length == 1) {
      state.BigShotControl = null;
    } else {
      controls[controls.length - 1].bigShot = true;
      state.BigShotControl = controls[controls.length - 1];
    }
    dispatch("SetMenus", controls);

    return controls;
  },
  CopyControl({ state }) {
    let controls = state.SelectedControls.filter((c) => c.config.type != "Form")
      .map((c) => c.Clone())
      .filter((c) => !!c);

    return JSON.stringify(controls);
  },
  ClearSelected({ state }) {
    state.SelectedControls.forEach((oc) => {
      oc.selected = false;
      oc.bigShot = false;
    });
    state.SelectedControls = [];
  },
  SetMenus({ state }, control: Control[]) {
    state.Menus = [
      { text: "查看代码", code: "ViewCode", shortcutKey: "F7" },
      { text: "粘贴", code: "Paste", shortcutKey: "Ctrl+C" },
    ];

    if (control.length && control[0].config.type != "Form") {
      state.Menus.splice(
        1,
        0,
        ...[
          { text: "置于顶层", code: "BringFront" },
          { text: "置于底层", code: "UnderFloor" },
          { text: "复制", code: "Copy" },
        ]
      );
      state.Menus.push({ text: "删除", code: "Delete" });
    }
    if (control.length == 1) {
      state.Menus.push({ text: "上移一层", code: "MoveUpLevel" }, { text: "下移一层", code: "MoveDownLevel" });
    }

    if (control.length > 1) {
      state.Menus.push(
        ...[
          {
            code: "LeftJustify",
            text: "左对齐",
          },
          {
            code: "RightJustify",
            text: "右对齐",
          },
          {
            code: "VCJustify",
            text: "垂直居中对齐",
          },
          {
            code: "TopJustify",
            text: "上对齐",
          },
          {
            code: "HCJustify",
            text: "水平居中对齐",
          },
          {
            code: "BottomJustify",
            text: "下对齐",
          },
          {
            code: "SameHeight",
            text: "同高",
          },
          {
            code: "SameWidth",
            text: "同宽",
          },
          {
            code: "SameSize",
            text: "大小相同",
          },
          {
            code: "VDJustify",
            text: "水平分布",
          },
          {
            code: "HDJustify",
            text: "垂直分布",
          },
        ]
      );
    }
  },
  SetFormConfig({ state }, config: ControlConfig) {
    state.FormConfig = config;
    if (config) FillControlNameCache(config);
  },
  SetPreview({ state }, preview: boolean) {
    state.Preview = preview;
    state.Debug = !preview;
  },
  SetCopyControlJson({ state }, json: string) {
    state.CopyControlJson = json;
  },
};

const getters: GetterTree<DesignerState, any> = {
  Debug: (state) => state.Debug,
  ControlProps: (state) => state.ControlProps,
  ControlEvents: (state) => state.ControlEvents,
  FormConfig: (state) => state.FormConfig,
  SelectedControls: (state) => state.SelectedControls,
  $FormDesigner: (state) => state.$FormDesigner,
  $DesignerSpace: (state) => state.$DesignerSpace,
  Menus: (state) => state.Menus,
  EventNames: (state, getters, rootState) => {
    let file = GetDesignerBackgroundFile();
    if (!file) return [];
    let code = file.content;
    let sourceFile = ts.createSourceFile("temp.ts", code, ts.ScriptTarget.ESNext, true);
    let events = [];
    // 递归获取所有方法
    function GetEvents(node) {
      if (node.kind == ts.SyntaxKind.MethodDeclaration) {
        events.push(node.name.getText());
      }
      ts.forEachChild(node, GetEvents);
    }
    ts.forEachChild(sourceFile, GetEvents);
    return events;
  },
  Preview: (state) => state.Preview,
  BigShotControl: (state) => state.BigShotControl,
  SelectedContainerControls: (state) =>
    state.SelectedControls.filter((c) => {
      if (state.BigShotControl) return c.config.fromContainer == state.BigShotControl.config.fromContainer;
      return true;
    }),
  Stacks: (state) => state.Stacks,
  CopyControlJson: (state) => state.CopyControlJson,
  ControlNames: (state) => state.ControlNames,
};

const DesignerModule: Module<DesignerState, any> = {
  namespaced: true,
  state,
  actions,
  getters,
};

export default DesignerModule;
