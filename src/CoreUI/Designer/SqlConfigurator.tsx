import { GetFields, GetParams, GetTables } from "@/Utils/Designer/Designer";
import { CloneStruct } from "@/Utils/Index";
import {
  ElForm,
  ElFormItem,
  ElTable,
  ElTableColumn,
  ElSelect,
  ElOption,
  ElButton,
  ElAutoResizer,
  ElTableV2,
  ElCheckbox,
  FormRules,
} from "element-plus";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class SqlConfigurator extends Vue {
  declare $refs: any;

  source = {
    table: "",
    fields: [],
    primaryFields: [],
    params: [],
  };

  tables = [];
  fields = [];
  primaryFields = [];

  get columnConfigs() {
    return [
      {
        key: "fields",
        width: 50,
        cellRenderer: ({ column, rowData }) => {
          let key = column.key;
          return (
            <ElCheckbox
              v-model={rowData.$__check__$}
              onChange={(e) => {
                this.source[key] = this[key].filter((m) => m.$__check__$).map((m) => m.field);
              }}
            />
          );
        },
        headerCellRenderer: ({ column }) => {
          let key = column.key;

          let allSelected = this[key].every((row) => row.$__check__$);
          let containsChecked = this[key].some((row) => row.$__check__$);

          return (
            <ElCheckbox
              v-model={allSelected}
              indeterminate={containsChecked && !allSelected}
              onChange={(value) => {
                this[key].forEach((row) => {
                  row.$__check__$ = value;
                  return row;
                });
                this.source[key] = this[key].filter((m) => m.$__check__$).map((m) => m.field);
              }}
            />
          );
        },
      },
      {
        key: `field`,
        dataKey: `field`,
        title: `名称`,
        width: 150,
        cellRenderer: ({ rowData }) => {
          let str = rowData.field as string;
          return <>{str.substring(str.lastIndexOf(".") + 1)}</>;
        },
      },
    ];
  }

  get rules(): FormRules {
    return {
      table: [{ required: true, message: "请选择表名！", trigger: "change" }],
      fields: [
        {
          required: true,
          validator: (rule, value, cb) => {
            if (!this.fields.filter((m) => m.$__check__$).length) {
              cb(new Error("请选择更新键"));
            }
            cb();
          },
        },
      ],
      primaryFields: [
        {
          required: true,
          validator: (rule, value, cb) => {
            if (!this.primaryFields.filter((m) => m.$__check__$).length) {
              cb(new Error("请选择更新键"));
            }
            cb();
          },
        },
      ],
      params: [
        {
          required: true,
          validator: (rule, value, cb) => {
            if (value.length && value.filter((p) => !p.type).length) {
              cb(new Error("入参参数的类型不得为空！"));
              return;
            }
            cb();
          },
        },
      ],
    };
  }

  created() {
    this.source = CloneStruct(this.$Store.get.VirtualFileSystem.CurrentFile?.extraData);
    this.AnalysisSql(this.$Store.get.VirtualFileSystem.CurrentFile.content);
  }

  /**
   * 解析sql
   */
  AnalysisSql(sql: string) {
    this.tables = GetTables(sql) || [];

    let params = CloneStruct(this.source.params);
    this.source.params = GetParams(sql) || [];
    this.fields = GetFields(sql) || [];
    this.primaryFields = CloneStruct(this.fields);

    if (params) {
      this.source.params.forEach((p) => {
        let param = params.find((m) => m.name == p.name);
        if (param) {
          p.type = param.type;
        }
      });
    }
    if (this.source.fields) {
      this.fields.forEach((m) => {
        m.$__check__$ = this.source.fields.includes(m.field);
      });
    }
    if (this.source.primaryFields) {
      this.primaryFields.forEach((m) => {
        m.$__check__$ = this.source.primaryFields.includes(m.field);
      });
    }
  }

  /**
   * 渲染更新表配置
   * @returns 更新表配置
   */
  RenderTableUpdateConfig() {
    return (
      <>
        <ElFormItem label="更新表" prop="table">
          <ElSelect style={{ width: "100%" }} v-model={this.source.table} placeholder="选择更新表" clearable>
            {this.tables.map((t) => (
              <ElOption key={t} label={t} value={t} />
            ))}
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="主键" prop="primaryFields">
          <ElAutoResizer style={{ height: "20vh" }}>
            {({ width, height }) => {
              let columnConfigs = CloneStruct(this.columnConfigs);
              columnConfigs[0].key = "primaryFields";
              return (
                <ElTableV2 width={width} height={height} columns={columnConfigs} data={this.primaryFields}>
                  {{
                    empty: () => <div class="p-[10px] text-center text-[#999]">No Data</div>,
                  }}
                </ElTableV2>
              );
            }}
          </ElAutoResizer>
        </ElFormItem>
        <ElFormItem label="更新键" prop="fields">
          <ElAutoResizer style={{ height: "30vh" }}>
            {({ width, height }) => (
              <ElTableV2 width={width} height={height} columns={this.columnConfigs} data={this.fields}>
                {{
                  empty: () => <div class="p-[10px] text-center text-[#999]">No Data</div>,
                }}
              </ElTableV2>
            )}
          </ElAutoResizer>
        </ElFormItem>
      </>
    );
  }

  /**
   * 保存源
   */
  SaveSource() {
    this.$refs.source.validate((valid) => {
      if (valid) {
        this.$Store.get.VirtualFileSystem.CurrentFile.extraData = CloneStruct(this.source);
        ElMessage.success("保存成功！");
      }
    });
  }

  render() {
    return (
      <div class="config p-[10px] w-[280px] absolute right-0 h-[100%] bg-white border-l-[2px] border-black border-solid z-[999]">
        <ElForm model={this.source} rules={this.rules} ref="source" labelPosition="top">
          {this.RenderTableUpdateConfig()}
          <ElFormItem label="参数" prop="params">
            <ElTable data={this.source.params} maxHeight="40vh" emptyText="No Data">
              <ElTableColumn label="名称" prop="name" width={70} showOverflowTooltip></ElTableColumn>
              <ElTableColumn label="类型">
                {(scope) => {
                  return (
                    <ElSelect v-model={scope.row.type} clearable placeholder="params type">
                      <ElOption label="string" value="string"></ElOption>
                      <ElOption label="number" value="number"></ElOption>
                    </ElSelect>
                  );
                }}
              </ElTableColumn>
            </ElTable>
          </ElFormItem>
          <ElFormItem>
            <div style="margin: 0 auto;">
              <ElButton type="primary" onClick={this.SaveSource}>
                Save
              </ElButton>
            </div>
          </ElFormItem>
        </ElForm>
      </div>
    );
  }
}
