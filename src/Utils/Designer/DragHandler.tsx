// import { useDesignerStore } from "@/Stores/DesignerStore";
// import { ControlDeclare, UtilsDeclare } from "@/Types";

// type Coord = UtilsDeclare.Coord;

// export interface DraggableConfig {
//   id?: string;
//   left: number;
//   top: number;
//   width: number;
//   height: number;
//   fromContainer?: string;
// }

// // 新增拖拽点配置接口
// interface DragHandleOptions {
//   lt?: boolean; // 左上
//   t?: boolean; // 上
//   rt?: boolean; // 右上
//   r?: boolean; // 右
//   rb?: boolean; // 右下
//   b?: boolean; // 下
//   lb?: boolean; // 左下
//   l?: boolean; // 左
// }

// /**
//  * 拖拽处理类
//  */
// export default class DragHandler {
//   offset: number[] = [];
//   adjustType: ControlDeclare.AdjustType = null;
//   startCoord: Coord;
//   designerStore = useDesignerStore();
//   config: DraggableConfig;
//   // bigShot: boolean = false;
//   private getBigShot: () => boolean;

//   MIN_SIZE: number = 20;

//   // requestAnimationFrame 优化相关属性
//   private animationFrameId: number | null = null;
//   private pendingUpdate: { x: number; y: number; type: "move" | "adjust" } | null = null;

//   // 拖拽点状态
//   lt: boolean = true;
//   t: boolean = true;
//   rt: boolean = true;
//   r: boolean = true;
//   rb: boolean = true;
//   b: boolean = true;
//   lb: boolean = true;
//   l: boolean = true;

//   constructor(
//     config: DraggableConfig,
//     options: {
//       bigShot?: () => boolean;
//       handles?: DragHandleOptions;
//     } = {}
//   ) {
//     this.config = config;
//     this.getBigShot = options.bigShot || (() => false);

//     // 如果提供了handles配置，使用它来覆盖默认值
//     if (options.handles) {
//       const { lt, t, rt, r, rb, b, lb, l } = options.handles;
//       this.lt = lt ?? this.lt;
//       this.t = t ?? this.t;
//       this.rt = rt ?? this.rt;
//       this.r = r ?? this.r;
//       this.rb = rb ?? this.rb;
//       this.b = b ?? this.b;
//       this.lb = lb ?? this.lb;
//       this.l = l ?? this.l;
//     }
//   }

//   BeginAdjust(e: MouseEvent) {
//     if (e.activity == false) return;
//     e.activity = false;
//     if (e.button != 0) return;

//     let { offset, type } = (e.target as HTMLDivElement).dataset;

//     if (type) this.adjustType = ControlDeclare.AdjustType.Move;
//     if (offset) {
//       this.adjustType = ControlDeclare.AdjustType.Resize;
//       this.offset = offset.split(",").map((s) => parseInt(s));
//     }

//     this.startCoord = { x: e.clientX, y: e.clientY };
//     this.SyncStateToSelectedControls();
//   }

//   Adjust(e: MouseEvent) {
//     if (!this.startCoord) return;
//     if (e.button != 0 || this.adjustType == null || !this.designerStore.debug) return;

//     let { x: sx, y: sy } = this.startCoord || { x: 0, y: 0 };
//     let x = e.clientX - sx;
//     let y = e.clientY - sy;

//     switch (this.adjustType) {
//       case ControlDeclare.AdjustType.Resize:
//         this.HandleAdjust(x, y);
//         break;
//       case ControlDeclare.AdjustType.Move:
//         this.HandleMove(x, y);
//         break;
//     }
//     this.startCoord = { x: e.clientX, y: e.clientY };
//     e.stopPropagation();
//   }

//   // 处理调整
//   HandleAdjust(x: number, y: number): void {
//     // 如果已经有待处理的更新，取消之前的动画帧
//     if (this.animationFrameId) {
//       cancelAnimationFrame(this.animationFrameId);
//     }

//     // 缓存待处理的更新
//     this.pendingUpdate = { x, y, type: "adjust" };

//     // 使用 requestAnimationFrame 批量处理更新
//     this.animationFrameId = requestAnimationFrame(() => {
//       if (this.pendingUpdate && this.pendingUpdate.type === "adjust") {
//         const adjustX = this.pendingUpdate.x * this.offset[0];
//         const adjustY = this.pendingUpdate.y * this.offset[1];
//         let l = Math.sign(this.offset[0]) == -1;
//         let t = Math.sign(this.offset[1]) == -1;

//         let w = this.config.width + adjustX >= this.MIN_SIZE;
//         let h = this.config.height + adjustY >= this.MIN_SIZE;

//         if (l && w) this.config.left = this.config.left + -adjustX;
//         if (t && h) this.config.top = this.config.top - adjustY;

//         this.config.width += w ? adjustX : 0;
//         this.config.height += h ? adjustY : 0;

//         this.pendingUpdate = null;
//       }
//       this.animationFrameId = null;
//     });
//   }

//   // 处理移动
//   HandleMove(x: number, y: number): void {
//     // 如果已经有待处理的更新，取消之前的动画帧
//     if (this.animationFrameId) {
//       cancelAnimationFrame(this.animationFrameId);
//     }

//     // 缓存待处理的更新
//     this.pendingUpdate = { x, y, type: "move" };

//     // 使用 requestAnimationFrame 批量处理更新
//     this.animationFrameId = requestAnimationFrame(() => {
//       if (this.pendingUpdate && this.pendingUpdate.type === "move") {
//         this.config.top += this.pendingUpdate.y;
//         this.config.left += this.pendingUpdate.x;
//         this.pendingUpdate = null;
//       }
//       this.animationFrameId = null;
//     });
//   }

//   /**
//    * 将当前拖拽处理器的状态同步到目标拖拽处理器
//    * @param targetDragHandler 目标拖拽处理器
//    */
//   SyncStateTo(targetDragHandler: DragHandler): void {
//     if (!targetDragHandler) return;

//     // 同步拖拽状态
//     targetDragHandler.adjustType = this.adjustType;
//     targetDragHandler.startCoord = this.startCoord ? { ...this.startCoord } : null;
//     targetDragHandler.offset = [...this.offset];
//   }

//   /**
//    * 同步状态到所有选中的控件
//    */
//   SyncStateToSelectedControls(): void {
//     if (!this.getBigShot()) return;

//     for (const control of this.designerStore.selectedControls) {
//       if (control.config.id !== this.config.id && control.config.fromContainer === this.config.fromContainer) {
//         this.SyncStateTo(control.dragHandler);
//       }
//     }
//   }
//   /**
//    * 取消拖拽或调整
//    */
//   Cancel() {
//     // 清理 requestAnimationFrame 相关状态
//     if (this.animationFrameId) {
//       cancelAnimationFrame(this.animationFrameId);
//       this.animationFrameId = null;
//     }
//     this.pendingUpdate = null;

//     this.startCoord = null;
//     this.adjustType = null;
//     this.offset = [];
//   }
// }
