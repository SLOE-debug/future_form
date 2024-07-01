<template>
  <div>
    <button @click="show = !show">show/hide</button>
    <div v-if="show" v-for="row in rows">
      <div v-for="cell in row" :ref="(e) => isSelected(cell)">
        {{ cell.text }}
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { Use } from "./Use";

const show = ref(true);

const { rows, isSelected } = Use();
</script>
