import { ControlDeclare, DesignerDeclare, UtilsDeclare } from "@/Types";
import DevelopmentModules from "../DevelopmentModules";
import Control from "@/CoreUI/Designer/Control";
import { GetFormAllControls } from "./Designer";
import { DeepClone } from ".";
import { useDesignerStore } from "@/Stores/DesignerStore";
import { useVirtualFileSystemStore } from "@/Stores/VirtualFileSystemStore";

type ControlConfig = ControlDeclare.ControlConfig;
type TabsConfig = ControlDeclare.TabsConfig;
type ContainerInfo = DesignerDeclare.ContainerInfo;
type Coord = UtilsDeclare.Coord;

/**
 * 全局容器管理器 - 静态方法模式
 * 管理所有控件的容器关系，避免每个控件都创建实例
 */
class GlobalContainerManager {

  /**
   * 检查容器是否可见
   * @param containerConfig 容器配置
   * @param allContainers 所有容器信息
   * @returns 是否可见
   */
  static isContainerVisible(containerConfig: ControlConfig, allContainers: ContainerInfo[]): boolean {
    // 创建容器映射以提高查找效率
    const containerMap = allContainers.reduce((map, containerInfo) => {
      map[containerInfo.container.name] = containerInfo.container;
      return map;
    }, {} as Record<string, ControlConfig>);

    // 检查容器是否在选项卡控件内可见
    let currentConfig = containerConfig;

    // 使用 while 循环代替递归
    while (currentConfig.fromContainer) {
      const parentTabsContainer = containerMap[currentConfig.fromContainer] as TabsConfig;

      // 如果父容器不存在，则跳出循环
      if (!parentTabsContainer) break;

      // 如果容器在未选中的选项卡中，则应视为不可见
      if (currentConfig.fromTabId && parentTabsContainer.value !== currentConfig.fromTabId) {
        return false; // 容器在非活动选项卡中，因此不可见
      }

      // 移动到父容器继续检查
      currentConfig = parentTabsContainer;
    }

    // 如果没有父容器或父容器不是选项卡控件，则视为可见
    return true;
  }

  /**
   * 处理容器的滚动条位置
   * @param config 控件配置
   * @returns 滚动条位置
   */
  static needlessScrollTopHandler(config: ControlConfig): Coord {
    const { type, scrollTop } = config;
    // 定义一个 map 对象，将不同类型的控件映射到对应的 scrollTop 值
    const scrollTopMap: Record<string, Coord> = {
      Tabs: { x: 0, y: scrollTop?.[config.value] || 0 },
    };

    return scrollTopMap[type] || { x: 0, y: 0 };
  }

  /**
   * 获取所有容器控件的位置信息
   * @param rootConfigId 根控件配置ID
   * @param parentPosition 父级控件的全局位置
   * @param parentScreenPosition 父级控件的屏幕位置
   * @returns 所有容器的位置信息数组
   */
  static getAllContainer(
    rootConfigId?: string,
    parentPosition: Coord = { x: 0, y: 0 },
    parentScreenPosition: Coord = { x: 0, y: 0 }
  ): ContainerInfo[] {
    const designerStore = useDesignerStore();
    const virtualFileSystemStore = useVirtualFileSystemStore();
    
    const actualRootConfigId = rootConfigId || virtualFileSystemStore.currentFile?.id;
    if (!actualRootConfigId) return [];

    const allContainers: ContainerInfo[] = [];
    const { flatConfigs } = designerStore;

    const queue: {
      configId: string;
      parentPos: Coord;
      screenPos: Coord;
    }[] = [
      {
        configId: actualRootConfigId,
        parentPos: parentPosition,
        screenPos: parentScreenPosition,
      },
    ];

    while (queue.length > 0) {
      const { configId, parentPos, screenPos } = queue.shift()!;
      const config = flatConfigs.entities[configId];
      if (!config) continue;

      const childrenIds = flatConfigs.childrenMap[configId] || [];

      for (const childId of childrenIds) {
        const childConfig = flatConfigs.entities[childId];
        if (!childConfig) continue;

        // 计算子控件的全局位置
        const globalLeft = childConfig.left + parentPos.x;
        const globalTop = childConfig.top + parentPos.y;

        // 处理滚动条位置
        const scrollOffset = this.needlessScrollTopHandler(childConfig);
        const childScreenLeft = screenPos.x + scrollOffset.x;
        const childScreenTop = screenPos.y + scrollOffset.y;

        // 如果子控件是容器
        // 且该控件的 adjustType 不是 Move
        // 则将其添加到结果中
        const allControls = GetFormAllControls();
        if (
          childConfig.container &&
          allControls[childConfig.name]?.adjustType !== ControlDeclare.AdjustType.Move
        ) {
          allContainers.push({
            globalLeft,
            globalTop,
            screenLeft: childScreenLeft,
            screenTop: childScreenTop,
            container: childConfig,
          });
        }

        // 添加子控件到队列中以便后续处理
        queue.push({
          configId: childId,
          parentPos: { x: globalLeft, y: globalTop },
          screenPos: { x: childScreenLeft, y: childScreenTop },
        });
      }
    }

    return allContainers;
  }

  /**
   * 切换容器
   */
  static async switchContainer(control: Control, newContainerName: string) {
    const allContainers = this.getAllContainer();
    const containerMap = allContainers.reduce((map, containerInfo) => {
      map[containerInfo.container.name] = containerInfo;
      return map;
    }, {} as Record<string, ContainerInfo>);

    const oldContainer = containerMap[control.config.fromContainer];
    const newContainer = containerMap[newContainerName];

    this.outContainer(control, oldContainer);
    await this.joinContainer(control, newContainer);
  }

  /**
   * 移出容器
   */
  static outContainer(control: Control, container: ContainerInfo) {
    if (!container) return;
    const { globalLeft, globalTop, screenTop } = container;

    control.config.left += globalLeft;
    control.config.top += globalTop - screenTop;

    control.config.fromContainer = null;
    control.config.fromTabId = null;
  }

  /**
   * 加入容器
   */
  static async joinContainer(control: Control, container: ContainerInfo) {
    const { AddControlDeclareToDesignerCode } = await DevelopmentModules.Load();
    const designerStore = useDesignerStore();
    const virtualFileSystemStore = useVirtualFileSystemStore();

    const globalLeft = container?.globalLeft || 0;
    const globalTop = container?.globalTop || 0;
    const screenTop = container?.screenTop || 0;
    const targetContainer =
      container?.container ||
      ({
        name: undefined,
        value: undefined,
      } as any);

    // 获取当前控件的父容器ID，用于从旧容器中移除
    const { flatConfigs } = designerStore;
    const currentFromContainer = control.config.fromContainer;

    // 从旧容器中移除控件引用，但不删除控件配置
    if (currentFromContainer) {
      const oldContainerConfig = Object.values(flatConfigs.entities).find((c) => c.name === currentFromContainer);
      if (oldContainerConfig) {
        const oldContainerChildren = flatConfigs.childrenMap[oldContainerConfig.id] || [];
        const index = oldContainerChildren.indexOf(control.config.id);
        if (index !== -1) {
          oldContainerChildren.splice(index, 1);
        }
      }
    } else {
      // 如果没有旧容器，从根容器中移除
      const rootChildren = flatConfigs.childrenMap[virtualFileSystemStore.currentFile?.id] || [];
      const index = rootChildren.indexOf(control.config.id);
      if (index !== -1) {
        rootChildren.splice(index, 1);
      }
    }

    // 更新控件位置和容器信息
    control.config.left -= globalLeft;
    control.config.top -= globalTop - screenTop;

    if (targetContainer.value) {
      control.config.fromTabId = targetContainer.value;
    }

    control.config.fromContainer = targetContainer.name;

    // 添加到新容器
    const targetContainerId = targetContainer.id || virtualFileSystemStore.currentFile?.id;

    if (!flatConfigs.childrenMap[targetContainerId]) {
      flatConfigs.childrenMap[targetContainerId] = [];
    }
    flatConfigs.childrenMap[targetContainerId].push(control.config.id);

    AddControlDeclareToDesignerCode(control.config);
  }

  /**
   * 处理鼠标抬起时的容器关系
   */
  static async handleContainerOnMouseUp(e: MouseEvent, control: Control) {
    const designerStore = useDesignerStore();

    // 如果当前控件没有选中/调整类型不是移动/控件类型是工具条 则不处理
    if (
      control.adjustType !== ControlDeclare.AdjustType.Move ||
      !control.selected ||
      control.config.type === "ToolStrip"
    ) {
      return;
    }

    const rect = (designerStore.formDesigner.$el as HTMLDivElement).getBoundingClientRect();

    const containers = this.getAllContainer().reverse();

    // 容器 map，避免重复查找
    const containerMap = containers.reduce((map, containerInfo) => {
      map[containerInfo.container.name] = containerInfo;
      return map;
    }, {} as Record<string, ContainerInfo>);

    let { clientX: x, clientY: y } = e;
    x = x - rect.left;
    y = y - rect.top;

    const { Stack, StackAction } = await DevelopmentModules.Load();

    const oldContainer = containerMap[control?.config?.fromContainer] || undefined;
    // 寻找鼠标位置所在的容器
    const newContainer = this.findContainerAtPosition(x, y, containers, control.config.name);

    if (newContainer !== oldContainer) {
      // 禁用 control 的堆栈
      control.disableStack = true;

      const originalConfig = DeepClone(control.config);
      this.outContainer(control, oldContainer);
      await this.joinContainer(control, newContainer);

      // 添加到堆栈
      designerStore.AddStack(
        new Stack(control, DeepClone(control.config), originalConfig, StackAction.SwitchContainer)
      );

      control.disableStack = false;
    }
  }

  /**
   * 根据鼠标位置查找对应的容器
   * @param x 鼠标X坐标
   * @param y 鼠标Y坐标
   * @param containers 所有容器信息
   * @param currentControlName 当前控件名称（用于排除自身）
   * @returns 找到的容器信息，如果没找到则返回undefined
   */
  static findContainerAtPosition(
    x: number,
    y: number,
    containers: ContainerInfo[],
    currentControlName: string
  ): ContainerInfo | undefined {
    for (const containerInfo of containers) {
      const { screenLeft, screenTop, globalLeft: containerLeft, globalTop: containerTop, container } = containerInfo;
      const { width: containerWidth, height: containerHeight } = container;

      // 计算鼠标相对于屏幕的绝对位置
      const absoluteMouseX = x + screenLeft;
      const absoluteMouseY = y + screenTop;

      // 检查鼠标是否在此容器内，并且容器有效
      const isMouseInsideContainer =
        absoluteMouseX >= containerLeft &&
        absoluteMouseX <= containerLeft + containerWidth &&
        absoluteMouseY >= containerTop &&
        absoluteMouseY <= containerTop + containerHeight;

      const isValidContainer = container.name !== currentControlName && this.isContainerVisible(container, containers);

      if (isMouseInsideContainer && isValidContainer) {
        return containerInfo;
      }
    }

    return undefined;
  }
}

export default GlobalContainerManager;