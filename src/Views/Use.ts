import { dayjs } from "element-plus";
import { computed, ref, unref } from "vue";

export function Use() {
  const tableRows = ref([[], [], [], [], [], [], []]);

  const _dayjs = ref(dayjs().locale("zh-cn"));

  const rows = computed(() => {
    const _rows = unref(tableRows);

    // 7*7二维数组
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        _rows[i][j] = {
          dayjs: unref(_dayjs),
          date: unref(_dayjs).startOf("day"),
          text: unref(_dayjs).format("D"),
          selected: false,
        };
      }
    }

    return _rows;
  });

  const hasSelected = computed(() => {
    return unref(rows)
      .flat()
      .some((row) => row.selected);
  });

  const isSelected = (cell: any) => {
    return (!!unref(hasSelected) && cell.text == "1") || cell.selected;
  };

  return {
    rows,
    isSelected,
  };
}
