import { Module, ActionTree, GetterTree } from "vuex";

export type PageState = {
  FileSidebarWidth: number;
  FileSidebarMinWidth: number;
};

const state: PageState = {
  FileSidebarWidth: 200,
  FileSidebarMinWidth: 150,
};

const actions: ActionTree<PageState, any> = {
  AdjustFileSidebarWidth({ state }, diff: number) {
    if (state.FileSidebarWidth + diff > state.FileSidebarMinWidth) {
      state.FileSidebarWidth += diff;
    }
  },
  ShowFileSidebar({ state }) {
    state.FileSidebarWidth = state.FileSidebarMinWidth;
  },
  HideFileSidebar({ state }) {
    state.FileSidebarWidth = 2;
  },
};

const getters: GetterTree<PageState, any> = {
  FileSidebarWidth: (state) => state.FileSidebarWidth,
  FileSidebarMinWidth: (state) => state.FileSidebarMinWidth,
};

const PageModule: Module<PageState, any> = {
  namespaced: true,
  state,
  actions,
  getters,
};

export default PageModule;
