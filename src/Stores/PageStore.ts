import { defineStore } from "pinia";
import { ref } from "vue";

export const usePageStore = defineStore("page", () => {
  const sidebarWidth = ref(200);
  const sidebarMinWidth = ref(150);

  function AdjustSidebarWidth(diff: number) {
    if (sidebarWidth.value + diff > sidebarMinWidth.value) {
      sidebarWidth.value += diff;
    }
  }

  function ShowSidebar() {
    sidebarWidth.value = sidebarMinWidth.value;
  }

  function HideSidebar() {
    sidebarWidth.value = 2;
  }

  return {
    sidebarWidth,
    sidebarMinWidth,

    AdjustSidebarWidth,
    ShowSidebar,
    HideSidebar,
  };
});
