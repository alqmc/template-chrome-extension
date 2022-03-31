<template>
  <div class="popup">Hi, template-chrome-extension</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'popup'
});
</script>
<style lang="less" scoped>
.popup {
  width: 200px;
  height: 50px;
  color: green;
  font-size: 20px;
  line-height: 50px;
  text-align: center;
}
</style>
