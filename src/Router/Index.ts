import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/dev",
    name: "Development",
    component: () => import("@/Views/Development"),
  },
  {
    path: "/",
    name: "Home",
    component: () => import("@/Views/Home"),
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
 * 路由守卫
 */
router.beforeEach(async (to, from, next) => {
  next();
});

export default router;
