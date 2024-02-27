import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { ElColorPicker, ElInput, ElInputNumber, ElOption, ElSelect, ElSwitch } from "element-plus";
import { Component, Prop, Vue } from "vue-facing-decorator";
import OptionsConfigurator from "./OptionsConfigurator";
import ColumnsConfigurator from "./ColumnsConfigurator";
import { CapitalizeFirstLetter } from "@/Utils/Index";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { AddMethodToDesignerBackground, GetDesignerBackgroundFile, LocateMethod } from "@/Utils/Designer/Designer";
import { GetParentByFile } from "@/Utils/VirtualFileSystem/Index";

type IFile = VritualFileSystemDeclare.IFile;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class Configurator extends Vue {
  @Prop
  left: number;

  SyncConfiguration(m: ConfiguratorItem, isEvent: boolean) {
    if (!isEvent) {
      for (let i = 0; i < this.$Store.get.Designer.SelectedControls.length; i++) {
        const control = this.$Store.get.Designer.SelectedControls[i];
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
            placeholder={m.des}
            size="small"
            clearable={true}
            key={m.config.id}
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
          <ElSelect
            style={{ width: "100%" }}
            v-model={ref[key]}
            filterable={true}
            clearable={true}
            size="small"
            placeholder={m.des}
            multiple={m.multiple || false}
            key={m.config.id}
            {...{
              onDblclick: (e) => {
                if (isEvent) this.AppendOrLocateMethod(m, ref, key);
              },
            }}
            onChange={(_) => {
              this.SyncConfiguration(m, isEvent);
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
            <ColumnsConfigurator {...{ columns: ref[key] }}></ColumnsConfigurator>
          )
        );
    }
  }

  /**
   * 添加或定位方法
   * @param m 配置项
   * @param ref 引用对象
   * @param key 键
   */
  AppendOrLocateMethod(m: ConfiguratorItem, ref: object, key: string) {
    if (!GetDesignerBackgroundFile()) {
      ElMessage.error("无效操作，当前选择的文件与设计器无关！");
      return;
    }
    if (!ref[key]) {
      let methodName = `${m.config.name}_${key}Event`;

      let params = [{ name: "sender", type: "any" }];
      params.concat(
        m.paramTypes?.map(({ 0: name, 1: type }) => {
          return { name, type };
        })
      );

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
                  class={typeof m.field == "string" && m.field.startsWith("sourceArgs_") ? css.args : ""}
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
