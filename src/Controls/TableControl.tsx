import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import {
  ColumnSortParams,
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDatePicker,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElMessageBox,
  ElPopover,
  ElSelectV2,
  ElTableV2,
  ElTooltip,
  HeaderCellSlotProps,
  TableV2SortOrder,
} from "element-plus";
import { SortOrder } from "element-plus/es/components/table-v2/src/constants";
import { CellRendererParams, SortBy } from "element-plus/es/components/table-v2/src/types";
import { Component } from "vue-facing-decorator";
import { EventDeclare } from "@/Types/EventDeclare";
import { CapitalizeFirstLetter, Guid } from "@/Utils/Index";
import { globalCache } from "@/Utils/Caches";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { watch } from "vue";
import DevelopmentModules from "@/Utils/DevelopmentModules";

type ColumnItem = ControlDeclare.ColumnItem;
type TableConfig = ControlDeclare.TableConfig;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

type RowEventHandlerParams = EventDeclare.RowEventHandlerParams;
type CellEventHandlerParams = EventDeclare.CellEventHandlerParams;

type FilterConfig = {
  optionsKey: string;
  filters: string[];
};

@Component
export default class TableControl extends Control {
  declare config: TableConfig;

  // 排序配置
  sortBy: SortBy = { key: "", order: TableV2SortOrder.ASC };

  // 过滤条件配置，用于存储Header中的过滤条件，在表格中进行过滤
  columnFilterConfigs: { [x: string]: FilterConfig } = {};

  // 列的过滤条件
  columnFilterConditions: Map<string, Map<string, string>> = new Map();
  /**
   * 获取过滤条件的复选框组
   * @param column 列配置
   * @returns 复选框组
   */
  GetFilterCheckBoxsGroup(column: ColumnItem) {
    let { field } = column;
    let map = this.columnFilterConditions.get(field);

    return (
      <ElCheckboxGroup class={css.filterCheckGroup} v-model={this.columnFilterConfigs[field].filters}>
        {(() => {
          let boxs = [];
          for (const v of map.values()) {
            boxs.push(
              <ElTooltip content={v?.toString()} show-after={500}>
                <ElCheckbox label={v?.toString()}></ElCheckbox>
              </ElTooltip>
            );
          }
          return boxs;
        })()}
      </ElCheckboxGroup>
    );
  }

  /**
   * 自定义表头渲染器
   * @param p 表头渲染参数
   * @returns 自定义表头
   */
  CustomHeaderRenderer(p: HeaderCellSlotProps) {
    return (
      <div class={css.customHeader}>
        <span>{p.column.title}</span>
        <ElPopover trigger="click" {...{ width: 200 }}>
          {{
            default: () => (
              <div>
                <div>{this.GetFilterCheckBoxsGroup(p.column as ColumnItem)}</div>
                <div class={css.btns}>
                  <ElButton
                    text
                    onClick={() => {
                      this.columnFilterConfigs[p.column.field].filters = [];
                    }}
                  >
                    重置
                  </ElButton>
                </div>
              </div>
            ),
            reference: () => (
              <ElIcon
                size={14}
                style={{
                  marginLeft: "4px",
                }}
                {...{
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                  },
                }}
              >
                {() => {
                  return <FontAwesomeIcon icon="filter" />;
                }}
              </ElIcon>
            ),
          }}
        </ElPopover>
      </div>
    );
  }

  /**
   * 单元格事件参数
   */
  cellEventHandlerParams: CellEventHandlerParams = {
    rowIndex: -1,
    rowData: null,
    cellKey: "",
    cellData: null,
  };

  /**
   * 调用单元格获取焦点事件
   */
  CallCellFocusEvent(e: CellRendererParams<any>) {
    this.cellEventHandlerParams = {
      rowIndex: e.rowIndex,
      rowData: e.rowData,
      cellKey: e.column.field,
      cellData: e.cellData,
    };
    this.events.onCellFocus && this.events.onCellFocus(this, { ...this.cellEventHandlerParams });
  }

  /**
   * 调用单元格改变事件
   */
  CallCellChangeEvent(e: CellRendererParams<any>) {
    this.cellEventHandlerParams = {
      rowIndex: e.rowIndex,
      rowData: e.rowData,
      cellKey: e.column.field,
      cellData: e.cellData,
    };
    this.events.onCellChange && this.events.onCellChange(this, { ...this.cellEventHandlerParams });
  }

  /**
   * 自定义单元格渲染器
   * @param e 单元格渲染参数
   * @returns 自定义单元格
   */
  CustomCellRenderer(e: CellRendererParams<any>) {
    let column = e.column as ColumnItem;
    // 渲染器方法名
    let rendererMethodName = `${CapitalizeFirstLetter(column.type)}Renderer`;
    if (!this[rendererMethodName]) return;

    return (
      <div
        class={css.customCell}
        onClick={() => {
          this.cellEventHandlerParams = {
            rowIndex: e.rowIndex,
            rowData: e.rowData,
            cellKey: e.column.field,
            cellData: e.cellData,
          };
          this.events.onCellClick && this.events.onCellClick(this, { ...this.cellEventHandlerParams });
        }}
      >
        {this[rendererMethodName](e)}
      </div>
    );
  }

  // 编辑状态
  edits = new Map();

  /**
   * 文本渲染器
   */
  private TextRenderer(e: CellRendererParams<any>) {
    let key = `${e.rowIndex}_${e.columnIndex}`;

    return (
      <ElInput
        v-model={e.rowData[e.column.field]}
        class={this.edits.get(key) ? "" : css.text}
        disabled={this.parentDataSourceControl?.config?.readonly || e.column.readonly}
        onBlur={() => this.edits.set(key, false)}
        onFocus={() => this.CellFocusHandler(e, key)}
        onChange={() => this.CallCellChangeEvent(e)}
      ></ElInput>
    );
  }

  /**
   * 数字输入框渲染器
   */
  private InputNumberRenderer(e: CellRendererParams<any>) {
    let {
      rowData,
      rowIndex,
      column: { field, readonly },
      columnIndex,
    } = e;
    let key = `${rowIndex}_${columnIndex}`;
    // 是否只读
    let isReadOnly = this.parentDataSourceControl?.config?.readonly || readonly;
    return (
      <ElInputNumber
        v-model={rowData[field]}
        class={this.edits.get(key) ? "" : css.text}
        controls={false}
        disabled={isReadOnly}
        onBlur={() => this.edits.set(key, false)}
        onFocus={() => this.CellFocusHandler(e, key)}
        onChange={() => this.CallCellChangeEvent(e)}
      ></ElInputNumber>
    );
  }

  /**
   * 日期选择器渲染器
   */
  private DatePickerRenderer(e: CellRendererParams<any>) {
    let {
      rowData,
      column: { field, readonly },
    } = e;
    let isReadOnly = this.parentDataSourceControl?.config?.readonly || readonly;
    return (
      <ElDatePicker
        v-model={rowData[field]}
        disabled={isReadOnly}
        clearable
        {...{
          onFocus: () => this.CallCellFocusEvent(e),
          onChange: () => this.CallCellChangeEvent(e),
        }}
      ></ElDatePicker>
    );
  }

  /**
   * 下拉框渲染器
   */
  private SelectRenderer(e: CellRendererParams<any>) {
    let {
      rowData,
      column: { field, readonly, dataSource },
    } = e;
    let isReadOnly = this.parentDataSourceControl?.config?.readonly || readonly;

    // 是否是 debug 模式
    let isDebug = this.$Store.get.Designer.Debug;

    // 如果不是 debug 模式，则加载远程下拉框选项
    if (!isDebug) this.RemoteSelectOptionsLoader(e);

    return (
      <ElSelectV2
        v-model={rowData[field]}
        v-el-select-selectAndDelete={(e) => {
          if (this.config.clearable) this.config.value = "";
        }}
        disabled={isReadOnly}
        filterable
        options={
          isDebug
            ? []
            : e.column.options?.map((o) => {
                // 默认的显示字段和值字段
                let label = "label",
                  value = "value";
                if (dataSource) {
                  label = e.column.displayField;
                  value = e.column.dataField;
                }

                return { label: o[label], value: o[value] };
              }) || []
        }
        loading={e.column.loading}
        onFocus={() => this.CallCellFocusEvent(e)}
        onChange={() => this.CallCellChangeEvent(e)}
      ></ElSelectV2>
    );
  }

  /**
   * 远程下拉框选项加载器
   */
  private RemoteSelectOptionsLoader(e: CellRendererParams<any>) {
    let {
      column: { dataSource },
    } = e;
    // 如果有数据源，则请求数据源，如果没有，则不做任何操作
    if (dataSource) {
      // 优先从缓存中获取数据
      let promise = globalCache.dataSourceCache.get(dataSource);

      // 如果没有缓存，则请求数据源
      if (!promise) {
        promise = new Promise(async (resolve) => {
          let mehtodName = "GetSource";
          let params: any = { id: dataSource, args: {} };

          // 如果是预览模式，则请求GetSourceInDebug
          if (this.$Store.get.Designer.Preview) {
            let { GetFileById } = await DevelopmentModules.Load();

            mehtodName = "GetSourceInDebug";
            let file = GetFileById(dataSource);
            params = { sql: file.content, param: file.extraData.params, args: params };
          }

          let data = (await this.$Api[mehtodName](params)).data;
          resolve(data);
        });
        globalCache.dataSourceCache.set(dataSource, promise);
      }

      promise.then((res) => {
        e.column.options = res;
      });
    }
  }

  /**
   * 复选框渲染器
   */
  private CheckRenderer(e: CellRendererParams<any>) {
    let {
      rowData,
      column: { field, readonly, selectValue, unSelectValue },
    } = e;
    let isReadOnly = this.parentDataSourceControl?.config?.readonly || readonly;
    // 如果是数字类型，转换为字符串
    rowData[field] = String(rowData[field]);

    return (
      <ElCheckbox
        v-model={rowData[field]}
        trueValue={selectValue}
        falseValue={unSelectValue}
        size="large"
        disabled={isReadOnly}
        v-onFocus={() => this.CallCellFocusEvent(e)}
        onChange={() => this.CallCellChangeEvent(e)}
      ></ElCheckbox>
    );
  }

  /**
   * 按钮渲染器
   */
  private ButtonRenderer(e: CellRendererParams<any>) {
    let {
      column: { title, btnColor, readonly },
    } = e;
    let isReadOnly = this.parentDataSourceControl?.config?.readonly || readonly;
    return (
      <ElButton color={btnColor} plain disabled={isReadOnly}>
        {title}
      </ElButton>
    );
  }

  /**
   * 单元格获取焦点事件
   */
  CellFocusHandler(e: CellRendererParams<any>, key: string) {
    this.CallCellFocusEvent(e);
    if (!e.column.readonly) {
      this.edits.set(key, true);
    }
  }

  get testData() {
    let obj = {};
    this.config.columns.forEach((c) => {
      switch (c.type) {
        case "check":
          obj[c.field] = true;
          break;
        case "number":
          obj[c.field] = 0;
          break;
        default:
          obj[c.field] = "测试";
          break;
      }
    });
    return [obj];
  }

  get data() {
    if (!this.config.data) return [];
    // let { columns } = this.config;
    return this.config.data.filter((m) => {
      for (const k in this.columnFilterConfigs) {
        let { filters } = this.columnFilterConfigs[k];

        // // 如果是下拉框或其他类型的过滤条件，需要根据显示字段和值字段进行过滤
        // let { options, dataSource, displayField, dataField } = this.config.columns.find((c) => c.field === k);
        // if (options) {
        //   filters = filters.map((f) => {
        //     // 默认的显示字段和值字段
        //     let label = "label",
        //       value = "value";
        //     if (dataSource) {
        //       value = dataField;
        //     }
        //     // 返回选中的过滤条件的值
        //     return options.find((o) => o[label] === f)[value];
        //   });
        // }

        if (filters.length && !filters.includes(m[k])) {
          m.$__check__$ = false;
          return false;
        }
      }
      return true;
    });
  }

  get columns() {
    if (this.config.multiple)
      return [
        {
          field: "selection",
          width: 50,
          cellRenderer: ({ rowData }: CellRendererParams<any>) => {
            return (
              <ElCheckbox
                v-model={rowData.$__check__$}
                onChange={this.UpdateSharedControlData}
                {...{
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                  },
                }}
              />
            );
          },

          headerCellRenderer: () => {
            let allSelected = this.config.data.every((m: any) => m.$__check__$);
            let containsChecked = this.config.data.some((m: any) => m.$__check__$);

            return (
              <ElCheckbox
                v-model={allSelected}
                indeterminate={containsChecked && !allSelected}
                onChange={(v) => {
                  this.config.data.forEach((m: any) => (m.$__check__$ = v));
                }}
              ></ElCheckbox>
            );
          },
        },
        ...this.config.columns,
      ];
    return this.config.columns;
  }

  SetData(data: any[]) {
    this.config.data = data.sort(this.Compare);
    this.rowEventHandlerParams.rowIndex = 0;
    this.rowEventHandlerParams.rowData = data ? data[0] : null;
    data.length && this.SelectRow(0);
    this.InitColumnConfig();
  }

  /**
   * 获取列的过滤条件，用于填充到Header的过滤条件复选框中
   */
  GetColumnFilterConditions(c: ColumnItem) {
    // 过滤条件的key，当前列的字段名和数据源名
    const key = `${c.field}_${c.dataSource || ""}`;
    // 初始化过滤条件配置
    this.columnFilterConfigs[c.field] = {
      optionsKey: key,
      filters: [],
    };
    const map = new Map();
    for (const data of this.config.data) {
      // 获取当前列的值
      const value = data[c.field];
      // 如果map中没有该值，则添加到map中
      if (!map.get(value)) map.set(value, value);
    }
    this.columnFilterConditions.set(c.field, map);
  }

  /**
   * 初始化列配置
   */
  InitColumnConfig() {
    this.config.columns.forEach((c) => {
      c.dataKey = c.field;
      c.key = c.field;

      if (c.filter) {
        this.GetColumnFilterConditions(c);
        c.headerCellRenderer = this.CustomHeaderRenderer;
      }
      c.cellRenderer = this.CustomCellRenderer;
    });
  }

  highlightColumnStyle: HTMLStyleElement;
  highlightColumnStyleId: string;
  AddHighlightColumnStyle() {
    this.highlightColumnStyleId = Guid.NewGuid().replaceAll("-", "");
    this.highlightColumnStyle = document.createElement("style");
    this.highlightColumnStyle.type = "text/css";
    this.highlightColumnStyle.textContent = `${this.columns
      .map((c) => `.hover-${c.field}-${this.highlightColumnStyleId} div[data-key="col-${c.field}"]`)
      .join(",")} { background: #eef5ff; }`;

    document.head.appendChild(this.highlightColumnStyle);
  }

  mounted() {
    if (this.config.highlightColumn) this.AddHighlightColumnStyle();
    this.InitColumnConfig();
    let firstSortCol = this.config.columns.find((c) => c.sortable);
    if (firstSortCol) this.sortBy.key = firstSortCol.field;
    this.config.SelectRow = this.SelectRow;
    this.config.DeleteSelectedRow = this.DeleteSelectedRow;
    this.config.AddRow = this.AddRow;
    this.config.SetData = this.SetData;
  }

  unmounted() {
    delete this.config.SelectRow;
    delete this.config.DeleteSelectedRow;
    delete this.config.AddRow;
    delete this.config.SetData;
    this.highlightColumnStyle?.remove();
    this.highlightColumnStyleId = "";
    this.highlightColumnClass = "";
    super.unmounted();
  }

  /**
   * 更新共享控件的数据
   */
  UpdateSharedControlData() {
    let parent = this.GetParentDataSourceGroupControl();
    if (parent) {
      let sharedControl = parent.sharedControl;
      // 如果有共享控件，则同步数据，因为在渲染第一个数据源控件时，第二个数据源控件还没有渲染，所以初次会出现sharedControl为null的情况
      if (sharedControl) {
        // 更改共享控件在作为表单填充时的数据索引
        sharedControl.populateIndex = this.config.data.findIndex((m) => m.$__check__$);
        sharedControl && sharedControl.PopulateData();
      }
    }
  }

  oldRow;
  SelectRow(rowIndex: number) {
    let change = false;
    change = this.oldRow !== this.data[rowIndex];
    if (this.oldRow) this.oldRow.$__check__$ = false;
    this.data[rowIndex].$__check__$ = true;
    this.oldRow = this.data[rowIndex];
    this.events.onRowClick && this.events.onRowClick(this, { ...this.rowEventHandlerParams });

    if (change) {
      this.events.onRowFocusChange && this.events.onRowFocusChange(this, { ...this.rowEventHandlerParams });
      this.UpdateSharedControlData();
    }
  }

  async DeleteSelectedRow() {
    try {
      await ElMessageBox.confirm("是否要删除选中行", "警告", {
        confirmButtonText: "是",
        cancelButtonText: "否",
        type: "warning",
        center: true,
      });

      const selectedRows = this.config.data.filter((m) => m.$__check__$);
      selectedRows.forEach((m) => {
        const index = this.config.data.findIndex((d) => d === m);
        this.parentDataSourceControl?.UpdateDataStatus(m, ControlDeclare.DataStatus.Delete);

        this.config.data.splice(index, 1);
      });
    } catch (error) {}
  }

  AddRow(object: object = {}) {
    // 循环列配置，初始化新增行的数据
    for (const c of this.config.columns) {
      // 如果object中没有该列的数据，则初始化为Null
      if (!object[c.field]) object[c.field] = null;
    }

    this.config.data.push(object);
    let data = this.config.data[this.config.data.length - 1];
    this.parentDataSourceControl?.UpdateDataStatus(data, ControlDeclare.DataStatus.New);

    // 如果父组件是数据源组控件
    if (this.parentDataSourceControl) {
      // 循环 data 的键
      for (const key in data) {
        let stopWatch = watch(
          () => data[key],
          (value, oldValue) => {
            this.parentDataSourceControl.UpdateDiffData(data, key, value, oldValue);
          }
        );
        this.parentDataSourceControl.twoWayBindingList.push(stopWatch);
      }
    }
  }

  rowEventHandlerParams: RowEventHandlerParams = {
    rowIndex: -1,
    rowData: null,
  };

  CustomCellProps({ column }: { column: ColumnItem }) {
    let key = column.field;
    return {
      ["data-key"]: `col-${key}`,
      onMouseenter: () => {
        this.highlightColumnClass = ` hover-${key}-${this.highlightColumnStyleId}`;
      },
      onMouseleave: () => {
        this.highlightColumnClass = "";
      },
    };
  }

  highlightColumnClass = "";
  render() {
    return super.render(
      <ElTableV2
        width={this.config.width}
        height={this.config.height}
        data={this.$Store.get.Designer.Debug ? this.testData : this.data}
        columns={this.columns}
        style={{ overflow: "hidden" }}
        class={`${css.table}${this.highlightColumnClass}`}
        sortBy={this.sortBy}
        onColumnSort={this.Sort}
        fixed
        rowEventHandlers={{
          onClick: ({ rowData, rowIndex }) => {
            this.rowEventHandlerParams = { rowData, rowIndex };
            this.SelectRow(rowIndex);
          },
        }}
        row-class={({ rowData }) => {
          return rowData.$__check__$ ? css.active : "";
        }}
        cellProps={this.config.highlightColumn ? this.CustomCellProps : null}
      >
        {{
          empty: () => {
            return (
              <div class={css.empty} style={{ height: this.config.height - 50 + "px" }}>
                暂无数据
              </div>
            );
          },
        }}
      </ElTableV2>
    );
  }

  // 自定义排序，通过key和order进行排序
  Compare(a, b) {
    let k = this.sortBy.key;
    if (!k) return 0;
    let v1 = a[k],
      v2 = b[k],
      order = this.sortBy.order;
    if (!isNaN(a[k]) || !isNaN(b[k])) {
      v1 = parseFloat(a[k]);
      v2 = parseFloat(b[k]);
    } else {
      v1 = a[k].length;
      v2 = b[k].length;
    }
    if (order != SortOrder.DESC) {
      [v1, v2] = [v2, v1];
    }
    if (v1 < v2) return 1;
    if (v1 > v2) return -1;

    return 0;
  }

  Sort(e: ColumnSortParams<any>) {
    this.sortBy.key = e.key;
    this.sortBy.order = e.order;
    this.config.data = this.config.data.sort(this.Compare);
  }

  static GetDefaultConfig(): TableConfig {
    return {
      width: 300,
      height: 180,
      type: "Table",
      round: 15,
      columns: [],
      data: [],
      multiple: false,
      highlightColumn: false,
      AddRow: null,
      DeleteSelectedRow: null,
      SelectRow: null,
      SetData: null,
    };
  }
}

export async function GetProps() {
  let { baseProps } = await UtilControl();

  const fieldMap: ConfiguratorItem[] = [...baseProps];
  fieldMap.push(
    ...[
      {
        name: "列",
        des: "Table表格列的配置",
        type: DesignerDeclare.InputType.Columns,
        field: "columns",
      },
      {
        name: "多选",
        des: "Table的行是否支持多选",
        type: DesignerDeclare.InputType.ElSwitch,
        field: "multiple",
      },
      // 是否高亮列
      {
        name: "高亮列",
        des: "选中列时是否支持高亮",
        type: DesignerDeclare.InputType.ElSwitch,
        field: "highlightColumn",
      },
    ]
  );
  return fieldMap;
}

export async function GetEvents() {
  let { baseEvents } = await DevelopmentModules.Load();

  const eventMap: ConfiguratorItem[] = [
    ...baseEvents,
    {
      name: "单击单元格",
      des: "Table表格单击单元格事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "cellClick",
      paramTypes: [["e", "CellEventHandlerParams"]],
    },
    {
      name: "单元格焦点",
      des: "Table表格单元格获取焦点的事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "cellFocus",
      paramTypes: [["e", "CellEventHandlerParams"]],
    },
    {
      name: "单元格修改",
      des: "Table表格单元格内容被修改的事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "cellChange",
      paramTypes: [["e", "CellEventHandlerParams"]],
    },
    {
      name: "单击行",
      des: "Table表格行被单击的事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "rowClick",
      paramTypes: [["e", "RowEventHandlerParams"]],
    },
    {
      name: "切换行",
      des: "Table表格的选中行改变事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "rowFocusChange",
      paramTypes: [["e", "RowEventHandlerParams"]],
    },
  ];
  return eventMap;
}
