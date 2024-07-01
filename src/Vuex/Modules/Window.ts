import { WindowDeclare } from "@/Types/WindowDeclare";
import { CloneStruct, Guid } from "@/Utils/Index";
import { Module, ActionTree, GetterTree } from "vuex";
import SubWindowControl from "@/Controls/SubWindowControl";

type DesktopWindowInstances = WindowDeclare.DesktopWindowInstances;

export type WindowState = {
  /**
   * 桌面窗体实例
   */
  Windows: { [x: string]: DesktopWindowInstances };
};

const state: WindowState = {
  Windows: {},
};

let focusIndex = 0;

/**
 * 通过 params 创建窗体实例对象
 */
function CreateWindowInstance(params: DesktopWindowInstances): DesktopWindowInstances {
  return {
    config: CloneStruct(params.instance.formConfig),
    focusIndex: focusIndex++,
    dialog: params.dialog,
    instance: params.instance,
    subWindow: params.subWindow,
    selected: false,
  };
}

// 旧的选中窗体
let oldSelectedId = "";

const actions: ActionTree<WindowState, any> = {
  /**
   * 设置焦点窗体
   */
  SetFocusWindow({ state }, id: string) {
    let win = state.Windows[id];

    win.focusIndex = focusIndex++;

    // 如果当前不是子窗体
    if (!win.subWindow) {
      // 如果有旧的选中窗体
      if (oldSelectedId && state.Windows[oldSelectedId]) {
        state.Windows[oldSelectedId].selected = false;
      }

      // 设置当前窗体为选中
      win.selected = true;
      oldSelectedId = id;
    }
    // 获取 window 实例 $Window 的 focus 事件
    let { onFocus } = win.instance?.$Window?.events || {};
    onFocus && onFocus();
  },
  /**
   * 创建窗体
   */
  CreateWindow({ state, dispatch }, p: DesktopWindowInstances) {
    let id = Guid.NewGuid();
    let window = CreateWindowInstance(p);
    state.Windows[id] = window;

    // 如果不是子窗体
    if (!p.subWindow) dispatch("SetFocusWindow", id);

    // 如果是子窗体，并且p.instance.$Window存在，则更新子窗体的实例ID
    if (p.subWindow && p.instance.$Window) {
      let subWindowControl = p.instance.$Window.$parent as SubWindowControl;
      subWindowControl.subWinInstanceId = id;
    }

    return id;
  },
  async CloseWindow({ state }, id) {
    state.Windows[id].instance.Dispose();
    delete state.Windows[id];
  },
  // 关闭所有窗体
  async CloseAllWindows({ state }) {
    for (let id in state.Windows) {
      if (state.Windows[id].subWindow) continue;
      state.Windows[id].instance.Dispose();
      delete state.Windows[id];
    }

    oldSelectedId = "";
  },
  // 刷新窗体
  async RefreshWindow({ state, dispatch }, id) {
    // 存储当前窗体的配置
    let window = state.Windows[id];
    // 关闭当前窗体
    window.instance.Dispose(true);
    delete state.Windows[id];

    return await dispatch("CreateWindow", window);
  },
};

const getters: GetterTree<WindowState, any> = {
  Windows: (state) => state.Windows,
};

const WindowModule: Module<WindowState, any> = {
  namespaced: true,
  state,
  actions,
  getters,
};

export default WindowModule;
