import { App } from "vue";
import { createStore, Store } from "vuex";
import VirtualFileSytemModule, { VirtualFileSytemState } from "./Modules/VirtualFileSystem";
import PageModule, { PageState } from "./Modules/Page";

export type RootState = {
  Page: PageState;
  VirtualFileSystem: VirtualFileSytemState;
};
const store: Store<RootState> = createStore({
  modules: {
    Page: PageModule,
    VirtualFileSystem: VirtualFileSytemModule,
  },
});

export default store;

export const vuex = {
  install(app: App<Element>) {
    let get: any = {};
    for (const key in (store as any)._modulesNamespaceMap) {
      get[key.split("/")[0]] = (store as any)._modulesNamespaceMap[key].context.getters;
    }

    store.get = get;

    app.config.globalProperties.$Store = store;

    if (sessionStorage.Token) store.dispatch("SetToken", sessionStorage.Token);
    if (sessionStorage.System) store.dispatch("SetSystem", sessionStorage.System);
  },
};
