import FormControl from "@/Controls/FormControl";
import Compiler from "@/Core/Compile/Compiler";
import { GlobalApi } from "@/Plugins/Api/ExtendApi";
import { ControlDeclare } from "@/Types";
import store from "@/Vuex/Store";
import { ElMessage, ElMessageBox } from "element-plus";
import { WatchStopHandle, watch } from "vue";
import { GetOrCreateFromStorage } from "../BasicUtils";
import { globalVariate } from "./Data";

type ToolStripConfig = ControlDeclare.ToolStripConfig;
type ToolStripItem = ControlDeclare.ToolStripItem;

/**
 * 不需要释放的键
 */
const noDisposeMembers = [
  "$refs",
  "$Window",
  "$globalVariate",
  "$watchList",
  "$historySelectRefNoKey",
  "isLoaded",
  "id",
  "formConfig",
];

/**
 * 窗体基类
 */
export class BaseWindow {
  /**
   * 窗体配置
   */
  formConfig: ControlDeclare.FormConfig;

  /**
   * 窗体控件的引用
   */
  $refs: { [x: string]: any } = {};

  /**
   * 当前窗体的FormControl实例，在 FormControl Creted 时赋值
   */
  $Window: FormControl;

  // 窗体ID，该ID是编译后的文件ID
  id: string;

  // 继承自该窗体的窗体id列表
  inheritIds: string[] = [];

  /**
   * 构造函数
   * @param id 窗体id
   */
  constructor(_id: string) {
    this.id = _id;
  }

  // 全局变量对象
  $globalVariate = globalVariate;

  // 是否已经加载过窗体的Config
  isLoaded: boolean = false;

  /**
   * 加载窗体的Config
   */
  async LoadConfig() {
    if (this.isLoaded) return;

    let file = Compiler.CompiledFiles.find((f) => f.fileId == this.id);
    if (file) {
      this.formConfig = file.extraData;

      // 如果有继承的窗体，则先加载继承的窗体
      if (this.inheritIds.length) {
        for (const inheritId of this.inheritIds) {
          let inheritFile = Compiler.CompiledFiles.find((f) => f.fileId == inheritId);
          if (inheritFile) {
            let inheritConfig = inheritFile.extraData;
            this.formConfig.$children.push(...inheritConfig.$children);
          }
        }
      }
    }
    this.isLoaded = true;
  }

  /**
   * 弹出提示
   * @param message 提示信息
   * @param type 提示类型
   * @param duration 显示时间
   */
  Alert(message: string, type: any = "info", duration: number = 3000) {
    ElMessage({ message, type, duration });
  }

  /**
   * 弹出确认框
   */
  Confirm(
    message: string,
    title: string = "提示",
    type: "success" | "warning" | "info" | "error" = "info",
    confirmButtonText: string = "确定",
    cancelButtonText: string = "取消",
    showConfirmButton: boolean = true,
    showCancelButton: boolean = true
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        ElMessageBox.confirm(message, title, {
          confirmButtonText,
          cancelButtonText,
          type,
          showClose: false,
          showConfirmButton,
          showCancelButton,
          draggable: true,
          closeOnClickModal: false,
          callback: (action) => {
            resolve(action == "confirm");
          },
        });
      } catch (e) {
        console.log(e);

        resolve(false);
      }
    });
  }

  /**
   * 显示窗体
   */
  async Show(dialog: boolean = false, subWindow: boolean = false) {
    await this.LoadConfig();
    return await store.dispatch("Window/CreateWindow", {
      compileFileId: this.id,
      dialog,
      subWindow,
      instance: this,
    });
  }

  /**
   * 显示窗体以对话框形式
   */
  async ShowDialog() {
    return await this.Show(true);
  }

  /**
   * 显示子窗体
   */
  async ShowSubWindow() {
    return await this.Show(false, true);
  }

  /**
   * 关闭窗体
   */
  Close() {
    store.dispatch("Window/CloseWindow", this.$Window.instanceId);
  }

  /**
   * 获取公共的ToolStrips配置
   */
  GetCommonToolStrips(): ToolStripItem[] {
    return [
      {
        name: "$_select",
        type: "select",
        placeholder: "请选择案号",
        width: 150,
        height: 24,
        options: [],
        value: "",
        clearable: true,
        loading: false,
        loadingText: "正在搜索案号中，请稍后...",
        empty: "未找到相关案号<br />请尝试输入完整案号！",
        remote: true,
        display: "table",
        columns: [
          { title: "案件文号", field: "ref_no", width: 150 },
          {
            title: "申请号",
            field: "applicationNumber",
            width: 120,
          },
          {
            title: "委托客户",
            field: "client_id",
            width: 50,
          },
          {
            title: "发明名称",
            field: "invention_title",
            width: 200,
          },
        ],
        filterable: true,
        events: {
          systemRemoteMethod: this.RemoteSearchCaseNo.bind(this),
          systemOnChange: this.systemOnChange.bind(this),
        },
      },
      {
        name: "$_edit",
        type: "button",
        iconSize: 14,
        text: "修改模式",
        width: 24,
        height: 24,
        icon: "file:WindowBarEdit",
        showDownStyle: true,
        events: {
          systemOnClick: this.EditMode.bind(this),
        },
      },
      {
        name: "$_new",
        type: "button",
        iconSize: 14,
        text: "新建",
        width: 24,
        height: 24,
        icon: "file:WindowBarNewFile",
        disabled: false,
        events: {},
      },
      {
        name: "$_delete",
        type: "button",
        iconSize: 14,
        text: "删除",
        width: 24,
        height: 24,
        icon: "file:WindowBarDelete",
        disabled: true,
        events: {},
      },
      {
        name: "$_save",
        type: "button",
        iconSize: 14,
        text: "保存",
        width: 24,
        height: 24,
        icon: "file:WindowBarSave",
        disabled: true,
        events: {
          systemOnClick: this.Save.bind(this),
        },
      },
      {
        name: "$_refresh",
        type: "button",
        iconSize: 14,
        text: "刷新",
        width: 24,
        height: 24,
        icon: "file:WindowBarRefresh",
        events: {
          systemOnClick: this.Refresh.bind(this),
        },
      },
    ];
  }

  // 历史案号列表key
  protected readonly $historySelectRefNoKey = "historySelectRefNo";

  /**
   * 远程搜索案号
   */
  private async RemoteSearchCaseNo(config: ToolStripConfig, item: ToolStripItem, e: string) {
    if (!!e && e.length > 2) {
      item.loading = true;

      try {
        let res = await GlobalApi.GetListByExpression({
          exp: `SELECT ref_no
                    , CASE 
                        WHEN case_type = 2
                            THEN pct_file_no
                        WHEN app_source = 3
                            OR app_source = 5
                            THEN file_no
                        ELSE file_no
                        END AS applicationNumber
                    , client_id
                    , invention_title
                FROM patent_primary
                WHERE ref_no LIKE @ref_no`,
          paramters: {
            ref_no: `%${e}%`,
          },
        });
        item.loading = false;

        item.options = res.data.map((r) => ({
          label: r.ref_no,
          value: r.ref_no,
          m: r,
        }));
      } catch {
        item.loading = false;
      }
    } else {
      let history = GetOrCreateFromStorage(this.$historySelectRefNoKey, []);
      item.options = history.map((h) => ({
        label: h.ref_no,
        value: h.ref_no,
        m: h,
      }));
    }
  }

  /**
   * 选择案号
   */
  private systemOnChange(config: ToolStripConfig, item: ToolStripItem, e: string) {
    if (!e) return;
    // 筛选出当前案号的数据
    let m = item.options.find((o) => o.value == e)?.m;

    // 获取历史选择的案号
    let history = GetOrCreateFromStorage(this.$historySelectRefNoKey, []);
    // 如果历史数据中没有当前案号，则添加
    if (!history.find((h) => h.ref_no == e)) {
      history.push(m);
    } else {
      // 反之，将当前案号移动到第一个
      history = history.filter((h) => h.ref_no != e);
      history.unshift(m);
    }
    // 如果历史案号大于5个，则删除第一个
    if (history.length > 5) history.shift();
    localStorage.setItem("historySelectRefNo", JSON.stringify(history));
  }

  /**
   * 修改模式
   */
  private EditMode(config: ToolStripConfig, item: ToolStripItem, e: MouseEvent) {
    // 将 删除、保存按钮置为可用
    config.items.forEach((i) => {
      if (i.name == "$_delete" || i.name == "$_save") {
        i.disabled = !i.disabled;
      }
    });

    for (const d of this.$Window.dataSourceControls) {
      d.config.readonly = !d.config.readonly;
    }
  }

  /**
   * 刷新
   */
  async Refresh(config: ToolStripConfig, item: ToolStripItem, e: MouseEvent) {
    // 如果当前 $Window 有 dataSourceControls 组件，且无数据修改，则刷新窗体
    let isChanged = this.$Window.dataSourceControls.some((d) => d.diffData.size > 0);
    if (!isChanged) {
      store.dispatch("Window/RefreshWindow", this.$Window.instanceId);
      e.stopPropagation();
    } else {
      try {
        await this.Confirm("当前窗体有未保存的数据，是否要刷新？", "警告", "warning");
        store.dispatch("Window/RefreshWindow", this.$Window.instanceId);
        e.stopPropagation();
      } catch {}
    }
  }

  /**
   * 保存
   */
  Save(config: ToolStripConfig, item: ToolStripItem, e: MouseEvent) {
    for (const d of this.$Window.dataSourceControls) {
      d.SaveSource(null);
    }
  }

  /**
   * 绑定窗体事件及控件
   * @param config 窗体配置
   * @param form 窗体实例
   */
  BindWindowEventAndControl(config: ControlDeclare.FormConfig, form: FormControl) {
    // 一次性立即绑定事件，无需等待下一个渲染周期
    this.bindEvents(config, form.events, this);

    // 将控件绑定任务放入微任务队列，不阻塞主线程，但仍在当前渲染周期内完成
    queueMicrotask(() => {
      this.bindControlsRecursively(config, this, form);
    });
  }

  /**
   * 绑定事件处理程序
   * @param config 控件配置
   * @param eventTarget 事件目标对象
   * @param context 上下文(this)
   */
  private bindEvents(config: Record<string, any>, eventTarget: Record<string, Function>, context: any) {
    // 使用 Map 缓存事件名称，提高性能
    const eventPrefix = "on";

    // 使用 entries 单次迭代，避免重复的 Object.keys() 调用
    Object.entries(config).forEach(([key, value]) => {
      if (key.startsWith(eventPrefix) && typeof value === "string") {
        const handlerName = value.toString();
        if (typeof context[handlerName] === "function") {
          eventTarget[key] = context[handlerName].bind(context);
        }
      }
    });
  }

  /**
   * 递归绑定控件实例
   * @param config 控件配置
   * @param instance 控件实例
   * @param container 控件容器
   */
  private bindControlsRecursively(config: ControlDeclare.ControlConfig, instance: any, container: any) {
    const children = config.items || config.$children || [];
    const isItems = !!config.items;

    // 使用批量处理，减少循环次数
    children.forEach((child) => {
      // 绑定控件引用
      instance[child.name] = child;

      // 获取控件的 DOM 引用
      const controlRef = container.$refs[child.name];
      if (controlRef) {
        instance.$refs[child.name] = controlRef;

        // 绑定事件
        const eventTarget = isItems ? child.events || {} : controlRef.events || {};
        this.bindEvents(child, eventTarget, instance);

        // 递归绑定子控件
        if ((child.$children?.length || child.items?.length) && controlRef) {
          this.bindControlsRecursively(child, instance, controlRef);
        }
      }
    });
  }

  // watch列表
  private $watchList: WatchStopHandle[] = [];

  /**
   * Watch函数，用于监控数据变化
   */
  Watch(data: any, prop: string, callback: (nv: any, ov: any) => void) {
    let stop = watch(() => data[prop], callback);
    this.$watchList.push(stop);
    return stop;
  }

  /**
   * 释放资源
   */
  Dispose(refresh: boolean = false) {
    // 清除所有监听器
    this.$watchList.forEach((unwatch) => unwatch());
    this.$watchList = [];

    // 如果是刷新模式，只清除非保留成员
    if (refresh) {
      // 只清除需要释放的成员
      Object.keys(this)
        .filter((key) => !noDisposeMembers.includes(key))
        .forEach((key) => {
          this[key] = null;
        });
    } else {
      // 完全释放所有成员
      Object.keys(this).forEach((key) => {
        this[key] = null;
      });
    }
  }
}
