import WindowCollection from "@/Components/WindowCollection";
import { WindowDeclare} from "@/Types/WindowDeclare";
import { CloneStruct } from "@/Utils/Designer/Designer";
import { Guid } from "@/Utils/Index";
import { ElMessageBox } from "element-plus";
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

const actions: ActionTree<WindowState, any> = {
  AddWindowConfigs({ state }, windowConfig: WindowConfig[]) {
    state.WindowConfigs.push(...windowConfig);
  },
  CreateWindow({ state, dispatch }, { config, dialog }: { config: WindowConfig; dialog: boolean }) {
    let id = Guid.NewGuid();

    if (config.fixed) {
      if (!state.SingleWindowCreatedFlag[config._id]) {
        state.SingleWindowCreatedFlag[config._id] = id;
      } else {
        dispatch("SetFocusWindow", state.SingleWindowCreatedFlag[config._id]);
        return;
      }
    }

    state.Windows[id] = { config: CloneStruct(config), focusIndex: focusIndex++, dialog };

    dispatch("SetFocusWindow", id);
    return id;
  },
  SetWindowInstance({ state }, { id, instance }) {
    state.WindowInstances[id] = instance;
  },
  async CloseWindow({ state }, id) {
    try {
      let instance = state.WindowInstances[id];
      let dsgs = instance.$Window.dataSourceControls;
      for (let i = 0; i < dsgs.length; i++) {
        let controlName = dsgs[i].config.name;
        let length = instance.$refs[controlName].diffData.size;
        if (length) {
          await ElMessageBox.confirm("当前窗体还有更改未保存！是否要关闭该窗体？", "警告！", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
            center: true,
          });
        }
      }

      let configId = state.Windows[id].config._id;
      delete state.SingleWindowCreatedFlag[configId];
      delete state.Windows[id];
      delete state.WindowInstances[id];
    } catch {}
  },
  ClearWindow({ state }) {
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
