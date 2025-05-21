import { ControlDeclare, DesignerDeclare, UtilsDeclare } from "@/Types";
import DevelopmentModules from "../DevelopmentModules";
import Control, { CloneControlConfig } from "@/CoreUI/Designer/Control";

type ControlConfig = ControlDeclare.ControlConfig;
type TabsConfig = ControlDeclare.TabsConfig;
type ContainerInfo = DesignerDeclare.ContainerInfo;
type Coord = UtilsDeclare.Coord;

export default class ContainerManager {
  $Store: any;
  control: Control;
  get config() {
    return this.control.config;
  }

  constructor(control: Control) {
    this.control = control;
    this.$Store = control.$Store;
  }

  /**
   * 检查容器是否可见
   * @param containerConfig 容器配置
   * @param allContainers 所有容器信息
   * @returns 是否可见
   */
  IsContainerVisible(containerConfig: ControlConfig, allContainers: ContainerInfo[]): boolean {
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
  NeedlessScrollTopHandler(config: ControlConfig): Coord {
    const { type, scrollTop } = config;
    // 定义一个 map 对象，将不同类型的控件映射到对应的 scrollTop 值
    const scrollTopMap: Record<string, Coord> = {
      Tabs: { x: 0, y: scrollTop?.[config.value] || 0 },
    };

    return scrollTopMap[type] || { x: 0, y: 0 };
  }

  /**
   * 获取所有容器控件的位置信息
   * @param rootConfig 根控件配置
   * @param parentPosition 父级控件的全局位置
   * @param parentScreenPosition 父级控件的屏幕位置
   * @returns 所有容器的位置信息数组
   */
  GetAllContainer(
    rootConfig: ControlConfig = this.$Store.get.Designer.FormConfig,
    parentPosition: Coord = { x: 0, y: 0 },
    parentScreenPosition: Coord = { x: 0, y: 0 }
  ): ContainerInfo[] {
    const allContainers: ContainerInfo[] = [];
    const queue: {
      config: ControlConfig;
      parentPos: Coord;
      screenPos: Coord;
    }[] = [
      {
        config: rootConfig,
        parentPos: parentPosition,
        screenPos: parentScreenPosition,
      },
    ];

    while (queue.length > 0) {
      const { config, parentPos, screenPos } = queue.shift()!;
      const children = config.$children || [];

      for (const childConfig of children) {
        // 计算子控件的全局位置
        const globalLeft = childConfig.left + parentPos.x;
        const globalTop = childConfig.top + parentPos.y;

        // 处理滚动条位置
        const scrollOffset = this.NeedlessScrollTopHandler(childConfig);
        const childScreenLeft = screenPos.x + scrollOffset.x;
        const childScreenTop = screenPos.y + scrollOffset.y;

        // 如果子控件是容器，则将其添加到结果中
        if (childConfig.container) {
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
          config: childConfig,
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
  async SwitchContainer(newContainerName) {
    let allContainer = this.GetAllContainer(this.$Store.get.Designer.FormConfig);

    let oldContainer = allContainer.find((c) => c.container.name == this.config.fromContainer);
    let newContainer = allContainer.find((c) => c.container.name == newContainerName);

    this.OutContainer(oldContainer);
    await this.JoinContainer(newContainer);
  }

  OutContainer(container: ContainerInfo) {
    if (!container) return;
    const { globalLeft, globalTop, screenTop } = container;

    this.config.left += globalLeft;
    this.config.top += globalTop - screenTop;

    this.config.fromContainer = null;
    this.config.fromTabId = null;
  }

  async JoinContainer(container: ContainerInfo) {
    const { AddControlDeclareToDesignerCode } = await DevelopmentModules.Load();

    const globalLeft = container?.globalLeft || 0;
    const globalTop = container?.globalTop || 0;
    const screenTop = container?.screenTop || 0;
    const targetContainer =
      container?.container ||
      ({
        name: undefined,
        value: undefined,
        $children: this.$Store.get.Designer.FormConfig.$children,
      } as any);

    await this.control.Delete(false);

    this.config.left -= globalLeft;
    this.config.top -= globalTop - screenTop;

    if (targetContainer.value) {
      this.config.fromTabId = targetContainer.value;
    }
    this.config.fromContainer = targetContainer.name;

    targetContainer.$children.push(this.config);

    AddControlDeclareToDesignerCode(this.config);
  }

  /**
   * 处理鼠标抬起时的容器关系
   */
  async HandleContainerOnMouseUp(e: MouseEvent) {
    const { control, $Store } = this;

    if (
      control.dragHandler.adjustType !== ControlDeclare.AdjustType.Move ||
      !control.selected ||
      control.config.type === "ToolStrip"
    ) {
      return;
    }

    let rect = ($Store.get.Designer.$FormDesigner.$el as HTMLDivElement).getBoundingClientRect();

    let containers = this.GetAllContainer($Store.get.Designer.FormConfig).reverse();

    // 容器 map，避免重复查找
    const containerMap = containers.reduce((map, containerInfo) => {
      map[containerInfo.container.name] = containerInfo;
      return map;
    }, {} as Record<string, ContainerInfo>);

    let { clientX: x, clientY: y } = e;
    x = x - rect.left;
    y = y - rect.top;

    const { Stack, StackAction } = await DevelopmentModules.Load();

    for (const c of $Store.get.Designer.SelectedContainerControls) {
      let oldContainer = containerMap[c?.config?.fromContainer] || undefined;
      // 寻找鼠标位置所在的容器
      let newContainer = this.FindContainerAtPosition(x, y, containers, c.config.name);

      if (newContainer !== oldContainer) {
        // 禁用 c 的堆栈
        c.disableStack = true;

        let oldConfig = control.watchOldValue;
        // 如果 oldConfig 为空，意味着最近已经添加过一次堆栈了，watchOldValue 已经被清空，则需要克隆当前的配置
        if (!oldConfig) {
          oldConfig = CloneControlConfig(c.config);
          // 为 oldConfig 添加 "最近一次的" 标记
          oldConfig.$last = true;
        }

        this.OutContainer(oldContainer);
        await this.JoinContainer(newContainer);

        // 添加到堆栈
        $Store.dispatch(
          "Designer/AddStack",
          new Stack(c, CloneControlConfig(c.config), oldConfig, StackAction.SwitchContainer)
        );

        control.watchOldValue = null;
      }
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
  FindContainerAtPosition(
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

      const isValidContainer = container.name !== currentControlName && this.IsContainerVisible(container, containers);

      if (isMouseInsideContainer && isValidContainer) {
        return containerInfo;
      }
    }

    return undefined;
  }
}
