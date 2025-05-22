import { GlobalApi } from "@/Plugins/Api/ExtendApi";
import { ControlDeclare } from "@/Types";
import { GetOrCreateFromStorage } from "..";

type ToolStripConfig = ControlDeclare.ToolStripConfig;
type ToolStripItem = ControlDeclare.ToolStripItem;

/// 以上为 monaco editor 时需删除的代码

// 远程搜索回调类型
type RemoteSearchHandler = typeof DefaultRemoteCaseNoSearch;
// 选择变更回调类型
type SelectChangeHandler = typeof DefaultCaseNoSelectChange;

export function GetCaseNumberSearchToolbar(
  remoteSearchHandler?: RemoteSearchHandler,
  selectChangeHandler?: SelectChangeHandler
): ToolStripItem {
  return {
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
      onRemoteMethod: remoteSearchHandler,
      onChange: selectChangeHandler,
    },
  };
}

/**
 * 默认的远程搜索案号方法
 */
async function DefaultRemoteCaseNoSearch(config: ToolStripConfig, item: ToolStripItem, e: string) {
  if (e?.length > 2) {
    item.loading = true;

    try {
      const { data } = await GlobalApi.GetListByExpression({
        exp: `SELECT ref_no, 
                            CASE 
                                WHEN case_type = 2 THEN pct_file_no
                                WHEN app_source IN (3, 5) THEN file_no
                                ELSE file_no
                            END AS applicationNumber,
                            client_id,
                            invention_title
                            FROM patent_primary
                            WHERE ref_no LIKE @ref_no`,
        paramters: { ref_no: `%${e}%` },
      });

      item.options = data.map((r) => ({
        label: r.ref_no,
        value: r.ref_no,
        m: r,
      }));
    } catch (error) {
    } finally {
      item.loading = false;
    }
  } else {
    const history = GetOrCreateFromStorage(historySelectRefNoKey, []);
    item.options = history.map((h) => ({
      label: h.ref_no,
      value: h.ref_no,
      m: h,
    }));
  }
}

// 历史记录的所选案号
const historySelectRefNoKey = "historySelectRefNo";

/**
 * 选择案号
 */
function DefaultCaseNoSelectChange(config: ToolStripConfig, item: ToolStripItem, e: string) {
  if (!e) return;

  // 获取选中的案件数据
  const selectedCase = item.options.find((o) => o.value === e)?.m;
  if (!selectedCase) return;

  // 更新历史记录最多保留5个
  const history = GetOrCreateFromStorage(historySelectRefNoKey, []);

  const filteredHistory = history.filter((h) => h.ref_no !== e);
  filteredHistory.unshift(selectedCase);

  // 仅保留最近的5个
  const updatedHistory = filteredHistory.slice(0, 5);

  localStorage.setItem(historySelectRefNoKey, JSON.stringify(updatedHistory));
}
