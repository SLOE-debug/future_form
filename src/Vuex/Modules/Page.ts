import { Module, ActionTree, GetterTree } from "vuex";

export type PageState = {
  SidebarWidth: number;
  SidebarMinWidth: number;
};

const state: PageState = {
  SidebarWidth: 200,
  SidebarMinWidth: 150,
};

const actions: ActionTree<PageState, any> = {
  AdjustSidebarWidth({ state }, diff: number) {
    if (state.SidebarWidth + diff > state.SidebarMinWidth) {
      state.SidebarWidth += diff;
    }
  },
  ShowSidebar({ state }) {
    state.SidebarWidth = state.SidebarMinWidth;
  },
  HideSidebar({ state }) {
    state.SidebarWidth = 2;
  },
};

const getters: GetterTree<PageState, any> = {
  SidebarWidth: (state) => state.SidebarWidth,
  SidebarMinWidth: (state) => state.SidebarMinWidth,
};

const PageModule: Module<PageState, any> = {
  namespaced: true,
  state,
  actions,
  getters,
};

export default PageModule;
