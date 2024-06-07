import { ActionTree, GetterTree, Module } from "vuex";

export type IndexState = {
  System: string;
};

const state: IndexState = {
  System: "",
};

// 解析当前的 localhost.href 中的 System 参数
const url = new URL(location.href);
const System = url.searchParams.get("System");
if (System) state.System = System;
else state.System = "ceshi";

const actions: ActionTree<IndexState, any> = {};

const getters: GetterTree<IndexState, any> = {
  System: (state) => state.System,
};

const IndexModule: Module<IndexState, any> = {
  namespaced: true,
  state,
  actions,
  getters,
};

export default IndexModule;
