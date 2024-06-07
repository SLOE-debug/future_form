import FormControl from "@/Controls/FormControl";
import store from "@/Vuex/Store";
import { ControlDeclare } from "@/Types/ControlDeclare";
import Compiler from "@/Core/Compile/Compiler";
import { reactive, watch } from "vue";
import DataSourceGroupControl from "@/Controls/DataSourceGroupControl";
import { WindowDeclare } from "@/Types/WindowDeclare";
import { GlobalApi } from "@/Plugins/Api/ExtendApi";

type GlobalVariate = ControlDeclare.GlobalVariate;
type TitleBarControl = WindowDeclare.TitleBarControl;
type ToolStripItem = ControlDeclare.ToolStripItem;

export const globalVariate: GlobalVariate = reactive({ ref_no: "" });

/**
 * 数据双向绑定
 * @param obj1 对象1
 * @param prop1 属性1
 * @param obj2 对象2
 * @param prop2 属性2
 */
export function TwoWayBinding(obj1, prop1, obj2, prop2) {
  const stopWatch1 = watch(
    () => obj1[prop1],
    (value) => {
      obj2[prop2] = value;
    }
  );
  const stopWatch2 = watch(
    () => obj2[prop2],
    (value, oldValue) => {
      PropertyChange.call(this, obj2, prop2, value, oldValue);
      obj1[prop1] = value;
    }
  );

  return () => {
    stopWatch1();
    stopWatch2();
  };
}

/**
 * 属性值修改时，触发事件
 */
export function PropertyChange(m, p, nv, ov) {
  const ctor = this.$options.__vfdConstructor;
  if (ctor === DataSourceGroupControl) (this as DataSourceGroupControl).UpdateDiffData(m, p, nv, ov);
}

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

  // 窗体ID
  id: string;

  /**
   * 构造函数
   * @param id 窗体id
   */
  constructor(_id: string) {
    this.id = _id;
  }

  // 全局变量对象
  GlobalVariate = globalVariate;

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
   * 显示窗体
   */
  async Show(dialog: boolean = false, subWindow: boolean = false) {
    await this.LoadConfig();
    return await store.dispatch("Window/CreateWindow", { config: this.formConfig, dialog, subWindow, instance: this });
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
   * 获取公共的ToolStrips配置
   */
  GetCommonToolStrips(): ToolStripItem[] {
    return [
      {
        name: "$_select",
        type: "select",
        placeholder: "请选择案号",
        width: 120,
        height: 24,
        options: [],
        value: "",
        clearable: true,
        loading: false,
        loadingText: "正在搜索...",
        remote: true,
        systemRemoteMethod: this.RemoteSearchCaseNo.bind(this),
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
        events: {},
      },
      {
        name: "$_edit",
        type: "button",
        iconSize: 14,
        text: "修改模式",
        width: 24,
        height: 24,
        icon: "file:WindowBarEdit",
        events: {},
      },
      {
        name: "$_new",
        type: "button",
        iconSize: 14,
        text: "新建",
        width: 24,
        height: 24,
        icon: "file:WindowBarNewFile",
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
        events: {},
      },
      {
        name: "$_refresh",
        type: "button",
        iconSize: 14,
        text: "刷新",
        width: 24,
        height: 24,
        icon: "file:WindowBarRefresh",
        events: {},
      },
    ];
  }

  /**
   * 远程搜索案号
   */
  async RemoteSearchCaseNo(item: ToolStripItem, e: string) {
    if (!!e) {
      let len = e.length;
      if (len < 3) return;
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

        // 如果 item.display 为 table
        if (item.display === "table") {
          item.options = res.data.map((r) => ({ m: r }));
          return;
        }

        item.options = res.data.map((r) => ({ label: r.ref_no, value: r.ref_no }));
      } catch {}
    }
  }

  /**
   * 绑定窗体事件及控件
   * @param config 窗体配置
   * @param form 窗体实例
   */
  BindWindowEventAndControl(config: ControlDeclare.FormConfig, form: FormControl) {
    // 绑定窗体的事件
    let eventNames = Object.keys(config).filter((k) => k.slice(0, 2) == "on");
    for (let i = 0; i < eventNames.length; i++) {
      let name = eventNames[i];
      let controlEvent = config[name].toString();
      if (controlEvent && this[controlEvent]) {
        form.events[name] = this[controlEvent].bind(this);
      }
    }
    // 绑定窗体的控件
    form.$nextTick(() => {
      this.BindControlInstance(config, this, form);
    });
  }
  /**
   * 绑定控件实例
   * @param config 控件配置
   * @param instance 控件实例
   * @param container 控件容器
   */
  private BindControlInstance(config: ControlDeclare.ControlConfig, instance, container) {
    // 如果有子控件，则优先选用子控件
    let children = config.items || config.$children;
    let isItems = !!config.items;

    for (let i = 0; i < children.length; i++) {
      let c = children[i];
      instance[c.name] = c;
      // 为了验证方便，将控件的引用挂载到窗体实例上
      instance.$refs[c.name] = container.$refs[c.name];

      // 获取当前控件配置的所有事件，例如：onLoad、onClick等
      let eventNames = Object.keys(c).filter((k) => k.slice(0, 2) == "on");
      // 遍历事件，绑定事件
      for (let i = 0; i < eventNames.length; i++) {
        // 事件名称，例如：onLoad、onClick等
        let name = eventNames[i];
        // 事件处理函数，例如：btn_1_onClickEvent 等
        let controlEvent = c[name].toString();
        // 如果controlEvent存在，且instance中存在该函数，且container中存在该控件的引用，则绑定事件
        if (controlEvent && instance[controlEvent] && Object.prototype.hasOwnProperty.call(container.$refs, c.name)) {
          let events = container.$refs[c.name].events;
          // 如果是items，则使用item对象的events，否则使用控件的events，例如：FormControl.events
          if (!events && isItems) events = c.events;

          events[name] = instance[controlEvent].bind(instance);
        }
      }

      if ((c.$children?.length || c.items?.length) && Object.prototype.hasOwnProperty.call(container.$refs, c.name)) {
        this.BindControlInstance(c, instance, container.$refs[c.name]);
      }
    }
  }

  /**
   * 释放资源
   */
  Dispose() {
    this.formConfig = null;
    let members = Object.keys(this);
    for (const k of members) {
      this[k] = null;
    }
  }
}
