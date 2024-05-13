import { ControlDeclare } from "@/Types/ControlDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { GetFields } from "@/Utils/Designer/Designer";
import { CapitalizeFirstLetter } from "@/Utils/Index";
import { GetAllSqlFiles } from "@/Utils/VirtualFileSystem/Index";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  ElButton,
  ElColorPicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElPopconfirm,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
} from "element-plus";
import { Component, Prop, Vue } from "vue-facing-decorator";

type ColumnItem = ControlDeclare.ColumnItem;

@Component
export default class ColumnsConfigurator extends Vue {
  @Prop
  columns: ColumnItem[] = [];

  visible = false;

  Del(i: number) {
    this.columns.splice(i, 1);
  }

  columnType = [
    {
      label: "文字",
      value: "text",
    },
    {
      label: "日期",
      value: "date",
    },
    {
      label: "数字",
      value: "number",
    },
    {
      label: "下拉",
      value: "select",
    },
    {
      label: "单选",
      value: "check",
    },
    {
      label: "按钮",
      value: "button",
    },
    {
      label: "图片",
      value: "pic",
    },
  ];

  Adhering(col: ColumnItem) {
    switch (col.type) {
      case "select":
      case "check":
        return <ColumnOptionsConfigurator {...{ column: col }}></ColumnOptionsConfigurator>;
      case "button":
        return (
          <ElColorPicker
            v-model={col.btnColor}
            show-alpha
            predefine={["#409eff", "#67c23a", "#909399", "#e6a23c", "#f56c6c"]}
          ></ElColorPicker>
        );
      default:
        return;
    }
  }

  AddColumn() {
    let option: ColumnItem = {
      title: "col",
      field: "field",
      type: "text",
      width: 150,
      key: "",
      dataKey: "",
      hidden: false,
      readonly: false,
      sortable: false,
      filter: false,
      options: [],
      dataSource: "",
      btnColor: "#409eff",
    };
    this.columns.push(option);
  }

  render() {
    return (
      <>
        <ElDialog
          v-model={this.visible}
          title="表格列配置"
          onClose={() => {
            // this.$Store.dispatch("RenderControlConfigurator");
            this.$Store.dispatch("Designer/RenderControlConfigurator");
          }}
          width={"80%"}
          draggable
        >
          <ElButton
            type="primary"
            style={{ float: "right", marginBottom: "10px" }}
            onClick={(e) => {
              this.AddColumn();
            }}
          >
            {{ icon: () => <FontAwesomeIcon icon="plus"></FontAwesomeIcon>, default: "新建" }}
          </ElButton>
          <ElTable data={this.columns} maxHeight="50vh">
            <ElTableColumn property="title" label="标题" width={160}>
              {({ row }) => {
                return <ElInput v-model={row.title}></ElInput>;
              }}
            </ElTableColumn>
            <ElTableColumn property="field" label="字段" width={160}>
              {({ row }) => {
                return <ElInput v-model={row.field}></ElInput>;
              }}
            </ElTableColumn>
            <ElTableColumn property="type" class-name={css.type} width={160} label="显示类型">
              {({ row }) => {
                return (
                  <>
                    <ElSelect v-model={row.type}>
                      {this.columnType.map((t) => (
                        <ElOption key={t.value} label={t.label} value={t.value}></ElOption>
                      ))}
                    </ElSelect>
                    {this.Adhering(row)}
                  </>
                );
              }}
            </ElTableColumn>
            <ElTableColumn property="width" label="宽度">
              {({ row }) => {
                return (
                  <ElInputNumber
                    v-model={row.width}
                    controls={false}
                    style={{ width: "100%" }}
                    onChange={(v) => {
                      console.log(row);
                    }}
                  ></ElInputNumber>
                );
              }}
            </ElTableColumn>
            <ElTableColumn property="hidden" label="不可见">
              {({ row }) => {
                return <ElSwitch v-model={row.hidden}></ElSwitch>;
              }}
            </ElTableColumn>
            <ElTableColumn property="readonly" label="只读">
              {({ row }) => {
                return <ElSwitch v-model={row.readonly}></ElSwitch>;
              }}
            </ElTableColumn>
            <ElTableColumn property="sortable" label="排序">
              {({ row }) => {
                return <ElSwitch v-model={row.sortable}></ElSwitch>;
              }}
            </ElTableColumn>
            <ElTableColumn property="filter" label="筛选">
              {({ row }) => {
                return <ElSwitch v-model={row.filter}></ElSwitch>;
              }}
            </ElTableColumn>

            <ElTableColumn label="操作" width={180}>
              {({ row, $index: i }) => {
                return (
                  <>
                    <ElButton
                      size="small"
                      onClick={(e) => {
                        if (i > 0) [this.columns[i], this.columns[i - 1]] = [this.columns[i - 1], this.columns[i]];
                      }}
                    >
                      {{ icon: () => <FontAwesomeIcon icon="arrow-up"></FontAwesomeIcon> }}
                    </ElButton>
                    <ElButton
                      size="small"
                      onClick={(e) => {
                        if (i < this.columns.length - 1)
                          [this.columns[i], this.columns[i + 1]] = [this.columns[i + 1], this.columns[i]];
                      }}
                    >
                      {{ icon: () => <FontAwesomeIcon icon="arrow-down"></FontAwesomeIcon> }}
                    </ElButton>
                    <ElPopconfirm
                      confirm-button-text="确认"
                      cancel-button-text="取消"
                      title="确认要删除该列嘛？"
                      onConfirm={(_) => this.Del(i)}
                    >
                      {{
                        reference: () => {
                          return <ElButton type="danger">删除</ElButton>;
                        },
                      }}
                    </ElPopconfirm>
                  </>
                );
              }}
            </ElTableColumn>
          </ElTable>
        </ElDialog>
        <ElButton circle onClick={(_) => (this.visible = true)}>
          {{ icon: () => <FontAwesomeIcon icon="gear"></FontAwesomeIcon> }}
        </ElButton>
      </>
    );
  }
}

@Component
export class ColumnOptionsConfigurator extends Vue {
  declare $refs: any;
  @Prop
  type: "select" | "check";
  @Prop
  column: ColumnItem;
  visible = false;

  created() {
    if (!this.column.options) this.column.options = [];
    this.SourceChange(this.column.dataSource);
  }

  fields = [];
  SourceChange(v) {
    if (v) {
      let source = this.sqlFiles.find((m) => m.name == v);

      this.fields = GetFields(source.content).map((m) => m.field) as string[];
    } else {
      this.fields = [];
      this.column.dataField = "";
      this.column.displayField = "";
    }
  }

  GetFieldOption() {
    return this.fields.map((m) => {
      if (m.indexOf(".") >= 0) m = m.split(".")[1];
      return <ElOption key={m} label={m} value={m}></ElOption>;
    });
  }

  SelectOptions() {
    return (
      <>
        <div class={css.source}>
          <ElForm inline>
            <ElFormItem label="数据源">
              <ElSelect v-model={this.column.dataSource} filterable onChange={this.SourceChange} clearable>
                {this.sqlFiles.map((m) => {
                  return <ElOption key={m.id} label={m.name} value={m.id}></ElOption>;
                })}
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="显示字段">
              <ElSelect v-model={this.column.displayField} filterable>
                {this.GetFieldOption()}
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="数据字段">
              <ElSelect v-model={this.column.dataField} filterable>
                {this.GetFieldOption()}
              </ElSelect>
            </ElFormItem>
          </ElForm>
        </div>
        <ElButton
          type="primary"
          icon="Plus"
          style={{ float: "right", marginBottom: "10px" }}
          onClick={(e) => {
            let option = { label: "选项", value: "值" };
            this.column.options.push(option);
          }}
        >
          新建
        </ElButton>

        <ElPopconfirm
          confirm-button-text="确认"
          cancel-button-text="取消"
          title="确认要删除选中选项嘛？"
          onConfirm={(_) => {
            let rows = this.$refs["options"].getSelectionRows();
            for (const r of rows) {
              let i = this.column.options.findIndex((o) => o == r);
              this.column.options.splice(i, 1);
            }
          }}
        >
          {{
            reference: () => {
              return (
                <ElButton type="danger" icon="Delete">
                  删除
                </ElButton>
              );
            },
          }}
        </ElPopconfirm>
        <ElTable data={this.column.options} maxHeight="50vh" ref={"options"}>
          <ElTableColumn type="selection" width={55}></ElTableColumn>
          <ElTableColumn property="label" label="显示文本">
            {(scope) => {
              return <ElInput v-model={scope.row.label}></ElInput>;
            }}
          </ElTableColumn>

          <ElTableColumn property="value" label="选中值">
            {(scope) => {
              return <ElInput v-model={scope.row.value}></ElInput>;
            }}
          </ElTableColumn>

          <ElTableColumn label="操作">
            {(scope) => {
              return (
                <ElPopconfirm
                  confirm-button-text="确认"
                  cancel-button-text="取消"
                  title="确认要删除该选项嘛？"
                  onConfirm={(_) => this.column.options.splice(scope.$index, 1)}
                >
                  {{
                    reference: () => {
                      return <ElButton type="danger">删除</ElButton>;
                    },
                  }}
                </ElPopconfirm>
              );
            }}
          </ElTableColumn>
        </ElTable>
      </>
    );
  }

  sqlFiles: VritualFileSystemDeclare.IFile[] = [];
  updated() {
    this.sqlFiles = GetAllSqlFiles();
  }

  CheckOptions() {
    return (
      <ElForm inline>
        <ElFormItem label="选中值">
          <ElInput v-model={this.column.selectValue}></ElInput>
        </ElFormItem>
        <ElFormItem label="未选中值">
          <ElInput v-model={this.column.unSelectValue}></ElInput>
        </ElFormItem>
      </ElForm>
    );
  }

  render() {
    return (
      <>
        <ElDialog v-model={this.visible} title="设置选项" append-to-body>
          {this[`${CapitalizeFirstLetter(this.column.type)}Options`]()}
        </ElDialog>
        <ElButton icon={"Setting"} circle onClick={(_) => (this.visible = true)}></ElButton>
      </>
    );
  }
}
