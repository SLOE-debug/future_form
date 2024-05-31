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
  ElOption,
  ElPopover,
  ElSelect,
  ElSelectV2,
  ElTableV2,
  ElTooltip,
  HeaderCellSlotProps,
  TableV2SortOrder,
} from "element-plus";
import { SortOrder } from "element-plus/es/components/table-v2/src/constants";
import { CellRendererParams, SortBy } from "element-plus/es/components/table-v2/src/types";
import { Component } from "vue-facing-decorator";
import DataSourceGroupControl from "./DataSourceGroupControl";
import { baseProps, baseEvents } from "@/Utils/Designer/Controls";
import { EventDeclare } from "@/Types/EventDeclare";
import { Guid } from "@/Utils/Index";
import { DataConsistencyProxyCreator } from "@/Core/Designer/DataConsistency/DataConsistencyProxy";
import { toRaw } from "vue";
import { GetFileById } from "@/Utils/VirtualFileSystem/Index";

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

  sortBy: SortBy = { key: "", order: TableV2SortOrder.ASC };
  filterConfigs: { [x: string]: FilterConfig } = {};

  filterConditionMap: Map<string, Map<string, string>> = new Map();
  /**
   * 获取过滤条件的复选框组
   * @param column 列配置
   * @returns 复选框组
   */
  GetFilterCheckBoxsGroup(column: ColumnItem) {
    let { field } = column;
    let map = this.filterConditionMap.get(field);

    return (
      <ElCheckboxGroup class={css.filterCheckGroup} v-model={this.filterConfigs[field].filters}>
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
                      this.filterConfigs[p.column.field].filters = [];
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
                {...{
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                  },
                }}
              >
                {() => {
                  let icon = this.$.appContext.components["Filter"];
                  return <icon style={{ cursor: "pointer" }}></icon>;
                }}
              </ElIcon>
            ),
          }}
        </ElPopover>
      </div>
    );
  }

  edits = new Map();
  Text(e: CellRendererParams<any>) {
    let key = `${e.rowIndex}_${e.columnIndex}`;

    return (
      <ElInput
        v-model={e.rowData[e.column.field]}
        class={this.edits.get(key) ? "" : css.text}
        disabled={this.parentDataSourceControl?.config?.readonly || e.column.readonly}
        onBlur={() => {
          this.edits.set(key, false);
        }}
        onFocus={() => {
          this.CallCellFocusEvent(e);
          if (!e.column.readonly) {
            this.edits.set(key, true);
          }
        }}
        onChange={() => {
          this.CallCellChangeEvent(e);
        }}
      ></ElInput>
    );
  }

  cellEventHandlerParams: CellEventHandlerParams = {
    rowIndex: -1,
    rowData: null,
    cellKey: "",
    cellData: null,
  };

  CallCellFocusEvent(e: CellRendererParams<any>) {
    this.cellEventHandlerParams = {
      rowIndex: e.rowIndex,
      rowData: e.rowData,
      cellKey: e.column.field,
      cellData: e.cellData,
    };
    this.events.onCellFocus && this.events.onCellFocus(this, { ...this.cellEventHandlerParams });
  }

  CallCellChangeEvent(e: CellRendererParams<any>) {
    this.cellEventHandlerParams = {
      rowIndex: e.rowIndex,
      rowData: e.rowData,
      cellKey: e.column.field,
      cellData: e.cellData,
    };
    this.events.onCellChange && this.events.onCellChange(this, { ...this.cellEventHandlerParams });
  }

  optionsCache: Map<string, any[]> = new Map();
  async GetColumnOptions(column: ColumnItem) {
    let key = `${column.field}_${column.dataSource || ""}`;

    if (column.dataSource) {
      let data = this.optionsCache.get(key);
      if (!data) {
        this.optionsCache.set(key, []);

        let mehtodName = "GetSource";
        let params: any = { id: column.dataSource, args: {} };

        // 如果是预览模式，则请求GetSourceInDebug
        if (this.$Store.get.Designer.Preview) {
          mehtodName = "GetSourceInDebug";
          let file = GetFileById(this.config.dataSource);
          params = { sql: file.content, param: file.extraData.params, args: params };
        }

        data = (await this.$Api[mehtodName](params)).data;

        let map = this.filterConditionMap.get(column.field);
        if (map) {
          data.forEach((m) => {
            map.set(m[column.displayField], m[column.displayField]);
          });
        }

        this.optionsCache.set(
          key,
          data.map((m) => {
            return { label: m[column.displayField], value: m[column.dataField] };
          })
        );
      }
    } else {
      let map = this.filterConditionMap.get(column.field);
      if (map) {
        column.options?.forEach((m) => {
          map.set(m.label, m.label);
        });
      }
      this.optionsCache.set(
        key,
        column.options?.map((o) => {
          return { label: o.label, value: o.value };
        })
      );
    }
  }

  CustomCellRenderer(e: CellRendererParams<any>) {
    let column = e.column as ColumnItem;
    let content;
    let key = `${e.rowIndex}_${e.columnIndex}`;
    switch (column.type) {
      case "number":
        content = (
          <ElInputNumber
            v-model={e.rowData[column.field]}
            class={this.edits.get(key) ? "" : css.text}
            controls={false}
            disabled={this.parentDataSourceControl?.config?.readonly || column.readonly}
            onBlur={() => {
              this.edits.set(key, false);
            }}
            onFocus={() => {
              this.CallCellFocusEvent(e);
              if (!e.column.readonly) {
                this.edits.set(key, true);
              }
            }}
            onChange={() => {
              this.CallCellChangeEvent(e);
            }}
          ></ElInputNumber>
        );
        break;
      case "date":
        content = (
          <ElDatePicker
            v-model={e.rowData[column.field]}
            disabled={this.parentDataSourceControl?.config?.readonly || column.readonly}
            clearable
            {...{
              onFocus: () => {
                this.CallCellFocusEvent(e);
              },
              onChange: () => {
                this.CallCellChangeEvent(e);
              },
            }}
          ></ElDatePicker>
        );
        break;
      case "select":
        if (!this.optionsCache?.get(`${column.field}_${column.dataSource || ""}`) && !this.$Store.get.Designer.Debug)
          this.GetColumnOptions(column);
        content = (
          <ElSelectV2
            v-model={e.rowData[column.field]}
            disabled={this.parentDataSourceControl?.config?.readonly || column.readonly}
            filterable
            style={{ height: "65%" }}
            options={this.optionsCache?.get(`${column.field}_${column.dataSource || ""}`) || []}
            onFocus={() => {
              this.CallCellFocusEvent(e);
            }}
            onChange={() => {
              this.CallCellChangeEvent(e);
            }}
          ></ElSelectV2>
        );
        break;
      case "check":
        if (typeof e.rowData[column.field] == "number") e.rowData[column.field] = e.rowData[column.field].toString();

        content = (
          <ElCheckbox
            v-model={e.rowData[column.field]}
            trueLabel={column.selectValue}
            falseLabel={column.unSelectValue}
            size="large"
            disabled={this.parentDataSourceControl?.config?.readonly || column.readonly}
            v-onFocus={() => {
              this.CallCellFocusEvent(e);
            }}
            onChange={() => {
              this.CallCellChangeEvent(e);
            }}
          ></ElCheckbox>
        );
        break;
      case "button":
        content = (
          <ElButton
            color={column.btnColor}
            plain
            disabled={this.parentDataSourceControl?.config?.readonly || column.readonly}
          >
            {column.title}
          </ElButton>
        );
        break;
      default:
        content = this.Text(e);
        break;
    }
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
        {content}
      </div>
    );
  }

  get data() {
    return this.config.data.filter((m) => {
      for (const k in this.filterConfigs) {
        let { optionsKey, filters } = this.filterConfigs[k];

        let options = this.optionsCache.get(optionsKey);
        if (options) {
          filters = filters.map((f) => {
            let option = options.find((o) => o.props.label == f);
            if (option) f = option.props.value;
            return f;
          });
        }

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
                onChange={this.ChangeSharedData}
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

  GetFilterCondition(c: ColumnItem) {
    let key = `${c.field}_${c.dataSource || ""}`;
    this.filterConfigs[c.field] = {
      optionsKey: key,
      filters: [],
    };
    let map = new Map();
    for (let i = 0; i < this.config.data.length; i++) {
      let f = this.config.data[i][c.field];
      if (!map.get(f)) map.set(f, f);
    }
    this.filterConditionMap.set(c.field, map);
  }

  InitColumnConfig() {
    this.config.columns.forEach((c) => {
      c.dataKey = c.field;
      c.key = c.field;

      if (c.filter) {
        this.GetFilterCondition(c);
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
      .join(",")} { background: var(--el-table-row-hover-bg-color); }`;

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
  }

  unmounted() {
    this.highlightColumnStyle?.remove();
    this.highlightColumnStyleId = "";
    this.highlightColumnClass = "";
  }

  ChangeSharedData() {
    if (this.GetParentDataSourceGroupControl()) {
      let parent = this.$parent as DataSourceGroupControl;
      parent.FillSharedData();
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
      this.ChangeSharedData();
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

        if (m[ControlDeclare.DataStatusField] === ControlDeclare.DataStatus.New) {
          this.parentDataSourceControl.diffData.delete(m);
        } else {
          m[ControlDeclare.DataStatusField] = ControlDeclare.DataStatus.Delete;
        }

        this.config.data.splice(index, 1);
      });
    } catch (error) {}
  }

  AddRow(object: object) {
    object = object || {};
    // for (const k in object) {
    //   object[`@Insert#${k}`] = object[k];
    //   delete object[k];
    // }
    // object["#DataType"] = "Insert";

    let data = DataConsistencyProxyCreator(
      object,
      this.parentDataSourceControl.SyncTrack.bind(this.parentDataSourceControl)
    );
    // 添加新增标记
    data[ControlDeclare.DataStatusField] = ControlDeclare.DataStatus.New;

    this.config.data.push(data);
  }

  // DeclarationPatch() {
  //   return `{ \n\t\tSelectRow(i: number): void;\n\t\tDeleteSelectedRow(): Promise<void>;\n\t\tAddRow(object?: object): void;\n\t }`;
  // }

  rowEventHandlerParams: RowEventHandlerParams = {
    rowIndex: -1,
    rowData: null,
  };

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
    };
  }
}

export function GetProps() {
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
    ]
  );
  return fieldMap;
}

export function GetEvents() {
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
