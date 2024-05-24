import WindowCollection from "@/Components/WindowCollection";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { WindowDeclare } from "@/Types/WindowDeclare";
import { CloneStruct } from "@/Utils/Index";
import { BaseWindow } from "@/Utils/Designer/Form";
import { Guid } from "@/Utils/Index";
import { Module, ActionTree, GetterTree } from "vuex";

type WindowConfig = WindowDeclare.WindowConfig;
type DesktopWindowInstances = WindowDeclare.DesktopWindowInstances;

export type WindowState = {
  WindowConfigs: WindowConfig[];
  $WindowCollection: WindowCollection;
  DesktopDom: HTMLDivElement;
  Windows: { [x: string]: DesktopWindowInstances };
  WindowInstances: { [x: string]: any };
  SingleWindowCreatedFlag: { [x: string]: string };
};

const state: WindowState = {
  WindowConfigs: [],
  Windows: {},
  WindowInstances: {},
  SingleWindowCreatedFlag: {},
  $WindowCollection: null,
  DesktopDom: null,
};

let focusIndex = 0;
type OpenWindowParams = {
  config: ControlDeclare.FormConfig;
  dialog: boolean;
  subWindow: boolean;
  instance: BaseWindow;
};

const actions: ActionTree<WindowState, any> = {
  AddWindowConfigs({ state }, windowConfig: WindowConfig[]) {
    state.WindowConfigs.push(...windowConfig);
  },
  SetWindowInstance({ state }, { id, instance }) {
    state.WindowInstances[id] = instance;
  },
  ClearWindows({ state }) {
    state.Windows = {};
    state.WindowInstances = {};
  },
  ClearWindowConfigs({ state }) {
    state.WindowConfigs = [];
  },
  SetFocusWindow({ state }, id: string) {
    state.Windows[id].focusIndex = focusIndex++;
  },
  SetWindowCollection({ state }, windowCollection: WindowCollection) {
    state.$WindowCollection = windowCollection;
  },
  SetDesktopDom({ state }, dom: HTMLDivElement) {
    state.DesktopDom = dom;
  },
  // 以下内容3.0重构的
  CreateWindow({ state, dispatch }, p: OpenWindowParams) {
    let id = Guid.NewGuid();
    state.Windows[id] = {
      config: CloneStruct(p.config),
      focusIndex: focusIndex++,
      dialog: p.dialog,
      instance: p.instance,
      subWindow: p.subWindow,
    };
    dispatch("SetFocusWindow", id);
    return id;
  },
  async CloseWindow({ state }, id) {
    state.Windows[id].instance.Dispose();
    delete state.Windows[id];
  },
  // 关闭所有窗口
  async CloseAllWindows({ state }) {
    for (let id in state.Windows) {
      if (state.Windows[id].subWindow) continue;
      state.Windows[id].instance.Dispose();
      delete state.Windows[id];
    }
  },
};

const getters: GetterTree<WindowState, any> = {
  WindowConfigs: (state) => state.WindowConfigs,
  Windows: (state) => state.Windows,
  WindowInstances: (state) => state.WindowInstances,
  SingleWindowCreatedFlag: (state) => state.SingleWindowCreatedFlag,
  $WindowCollection: (state) => state.$WindowCollection,
  DesktopDom: (state) => state.DesktopDom,
};

const WindowModule: Module<WindowState, any> = {
  namespaced: true,
  state,
  actions,
  getters,
};

export default WindowModule;
