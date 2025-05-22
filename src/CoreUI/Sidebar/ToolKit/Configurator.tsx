import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { ElButton, ElColorPicker, ElInput, ElInputNumber, ElMessage, ElOption, ElSelect, ElSwitch } from "element-plus";
import { Component, Prop, Vue } from "vue-facing-decorator";
import OptionsConfigurator from "./OptionsConfigurator";
import ColumnsConfigurator from "./ColumnsConfigurator";
import { CapitalizeFirstLetter, dataSourceParamPrefix } from "@/Utils";
import { AddMethodToDesignerBackground, LocateMethod } from "@/Utils/Designer/Designer";
import { GetDesignerBackgroundFile, GetFileById, IsDirectory } from "@/Utils/VirtualFileSystem/Index";
import type Control from "@/CoreUI/Designer/Control";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;
type IDirectory = VritualFileSystemDeclare.IDirectory;

@Component
export default class Configurator extends Vue {
  @Prop
  left: number;

  SyncConfiguration(m: ConfiguratorItem, isEvent: boolean) {
    if (!isEvent) {
      for (let i = 1; i < this.selectedControls.length; i++) {
        const control = this.selectedControls[i];
        if (control.config.id != m.config.id) {
          control.config[m.field as string] = m.config[m.field as string];
        }
      }
    }
    this.$Store.dispatch("Designer/RenderControlConfigurator");
  }

  GetConfigurator(m: ConfiguratorItem, isEvent: boolean = false) {
    let ref: object;
    let key: string;
    if (typeof m.field == "object") {
      ref = m.field.ref;
      if (m.field.ref == undefined) return;
      key = m.field.key;
    } else {
      ref = m.config;
      // key = `${isEvent ? "on" + m.field[0].toUpperCase() + m.field.slice(1) : m.field}`;
      key = `${isEvent ? "on" + CapitalizeFirstLetter(m.field) : m.field}`;
    }

    switch (m.type) {
      case DesignerDeclare.InputType.ElInputNumber:
        return (
          <ElInputNumber
            v-model={ref[key]}
            style={{ width: "100%", height: "100%" }}
            min={m.min == undefined ? 10 : m.min}
            max={m.max || Infinity}
            size="small"
            precision={m.precision == undefined ? 2 : m.precision}
            key={m.config.id}
            placeholder={m.des}
            step={m.step || 0.1}
            {...{
              onWheel: (e: WheelEvent) => {
                (ref[key] as number) -= (m.step || 0.1) * Math.sign(e.deltaY);
              },
            }}
            onChange={(_) => {
              this.SyncConfiguration(m, isEvent);
            }}
          ></ElInputNumber>
        );
      case DesignerDeclare.InputType.ElInput:
        return (
          <ElInput
            v-model={ref[key]}
            style={{ width: "100%", height: "100%" }}
            size="small"
            clearable={true}
            key={m.config.id}
            placeholder={m.des}
            onChange={(_) => {
              this.SyncConfiguration(m, isEvent);
            }}
          ></ElInput>
        );
      case DesignerDeclare.InputType.ElSwitch:
        return (
          <ElSwitch
            style={{ width: "25%", height: "100%" }}
            v-model={ref[key]}
            onChange={(_) => {
              this.SyncConfiguration(m, isEvent);
            }}
          ></ElSwitch>
        );
      case DesignerDeclare.InputType.ElSelect:
        return (
          <>
            <ElSelect
              style={{ width: "100%" }}
              v-model={ref[key]}
              filterable={true}
              clearable={true}
              size="small"
              multiple={m.multiple || false}
              placeholder={m.des}
              disabled={
                m.onlyDesign &&
                this.$Store.get.VirtualFileSystem.CurrentFile.suffix != VritualFileSystemDeclare.FileType.FormDesigner
              }
              key={m.config.id}
              {...{
                onDblclick: (e) => {
                  if (isEvent) this.AppendOrLocateMethod(m, ref, key);
                },
              }}
              onChange={(_) => {
                this.SyncConfiguration(m, isEvent);
                m.onChange && m.onChange(ref[key]);
              }}
            >
              {isEvent
                ? this.$Store.get.Designer.EventNames.map((n) => {
                    return <ElOption key={n} label={n} value={n}></ElOption>;
                  })
                : m.options?.map((o) => {
                    return <ElOption key={o.value.toString()} label={o.label} value={o.value}></ElOption>;
                  })}
            </ElSelect>
            {
              // 如果当前的 key 是 dataSource，则添加一个定位至数据源的按钮
              key == "dataSource" && (
                <ElButton
                  circle
                  {...{
                    title: "定位至数据源",
                  }}
                  onClick={() => {
                    this.LocateDataSourceFile(ref[key]);
                  }}
                >
                  {{ icon: () => <FontAwesomeIcon icon="location-dot" /> }}
                </ElButton>
              )
            }
          </>
        );
      case DesignerDeclare.InputType.ElColorPicker:
        return (
          <ElColorPicker
            v-model={ref[key]}
            show-alpha
            onChange={(_) => {
              this.SyncConfiguration(m, isEvent);
            }}
          ></ElColorPicker>
        );
      case DesignerDeclare.InputType.Options:
        return (
          this.$Store.get.Designer.SelectedControls.length == 1 && (
            <OptionsConfigurator {...{ options: ref[key] }}></OptionsConfigurator>
          )
        );
      case DesignerDeclare.InputType.Columns:
        return (
          this.$Store.get.Designer.SelectedControls.length == 1 && (
            <ColumnsConfigurator {...{ columns: ref[key], ...m.extra }}></ColumnsConfigurator>
          )
        );
    }
  }

  // 当前选择的控件数组
  selectedControls: Control[] = [];

  updated() {
    this.selectedControls = this.$Store.get.Designer.SelectedControls;
  }

  /**
   * 定位数据源文件
   */
  LocateDataSourceFile(fileId) {
    let file = GetFileById(fileId);
    if (file) {
      // 向 window 发出一个 按键 1 事件
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));
      this.$Store.dispatch("VirtualFileSystem/SelectFile", file);
      // 循环 file 的 parent 改为全部展开
      let parent = file.parent;
      while (parent) {
        if (IsDirectory(parent)) {
          (parent as IDirectory).spread = true;
        }
        parent = parent.parent;
      }
    }
  }

  /**
   * 添加或定位方法
   * @param m 配置项
   * @param ref 引用对象
   * @param key 键
   */
  AppendOrLocateMethod(m: ConfiguratorItem, ref: any, key: string) {
    if (!GetDesignerBackgroundFile()) {
      ElMessage.error("无效操作，当前选择的文件与设计器无关！");
      return;
    }
    if (!ref[key]) {
      let obj = m.config;
      // 如果配置项不等于ref，则使用ref（如ToolStripConfig的items）
      if (m.config != ref) obj = ref;
      let methodName = `${obj.name}_${key}Event`;

      let type = m.config.type;
      let params = [{ name: "sender", type: `${type}Config` }];
      if (m.paramTypes?.length) {
        params = params.concat(
          m.paramTypes?.map(({ 0: name, 1: type }) => {
            return { name, type };
          })
        );
      }

      if (m.unuseDefaultParam) params.splice(0, 1);

      AddMethodToDesignerBackground(methodName, params);
      ref[key] = methodName;
    } else {
      LocateMethod(ref[key]);
    }
  }

  des: string;
  render() {
    return (
      <div class={css.configurator}>
        <div class={css.container}>
          <ul style={{ marginLeft: -this.left + "%" }}>
            {this.$Store.get.Designer.ControlProps.map((m) => {
              return (
                <li
                  onMouseenter={(e) => {
                    this.des = m.des;
                  }}
                  class={typeof m.field == "string" && m.field.startsWith(dataSourceParamPrefix) ? css.args : ""}
                >
                  <div class={css.item}>
                    <div class={css.label}>{m.name}</div>
                    <div class={css.input}>{this.GetConfigurator(m)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          <ul>
            {this.$Store.get.Designer.ControlEvents.map((m) => {
              return (
                <li
                  onMouseenter={(e) => {
                    this.des = m.des;
                  }}
                >
                  <div class={css.item}>
                    <div class={css.label}>{m.name}</div>
                    <div class={css.input}>{this.GetConfigurator(m, true)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div class={css.des}>{this.des}</div>
      </div>
    );
  }
}
