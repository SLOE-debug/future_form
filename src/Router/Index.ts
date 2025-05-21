import Home from "@/Views/Home";
import { RootState } from "@/Vuex/Store";
import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";
import { Module } from "vuex";

const routes: RouteRecordRaw[] = [
  {
    path: "/dev",
    name: "Development",
    component: () => import("@/Views/Development"),
  },
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/test",
    name: "Test",
    component: () => import("@/Views/Test"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

/**
 * 加载开发模式下的 Vuex
 */
async function loadDevelopmentStore() {
  let store = (await import("@/Vuex/Store")).default;

  // 是否已加载 Page/Designer/VirtualFileSystem 模块
  let loaded = store.hasModule("Page") && store.hasModule("Designer") && store.hasModule("VirtualFileSystem");
  if (!loaded) {
    const modules = [
      { name: "Page", importModule: import("@/Vuex/Modules/Page") },
      { name: "Designer", importModule: import("@/Vuex/Modules/Designer") },
      { name: "VirtualFileSystem", importModule: import("@/Vuex/Modules/VirtualFileSystem") },
    ];

    for (const { name, importModule } of modules) {
      const module = await importModule;
      store.registerModule(name, module.default as Module<unknown, RootState>);
      store.get[name] = (store as any)._modulesNamespaceMap[`${name}/`].context.getters;
    }
  }
}

/**
 * 路由守卫
 */
router.beforeEach(async (to, from, next) => {
  if (to.name === "Development") {
    await loadDevelopmentStore();
  } else {
    // 为 Store.get 添加虚假的 Designer.Debug 属性
    let store = (await import("@/Vuex/Store")).default;
    store.get.Designer = { Debug: false } as any;
  }

  next();
});

export default router;
