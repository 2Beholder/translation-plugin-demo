<template>
  <div class="setting">
    <h2 class="setting__title">翻译设置</h2>

    <van-cell-group inset class="setting__group">
      <van-field
        v-model="baseUrl"
        label="接口地址"
        placeholder="例如：https://api.xxx.com"
        input-align="right"
        class="setting__field"
      />
      <van-field
        v-model="apiKey"
        label="API Key"
        type="password"
        placeholder="请输入密钥"
        input-align="right"
        clearable
        class="setting__field"
      />
      <van-field
        v-model="model"
        label="模型"
        placeholder="例如：gpt-4.1"
        input-align="right"
        clearable
        class="setting__field"
      />
    </van-cell-group>

    <van-button
      class="setting__submit"
      @click="save"
      type="primary"
      block
      round
    >
      保存设置
    </van-button>
  </div>
</template>

<script lang="ts" setup>
import { storage } from "wxt/utils/storage";
const baseUrl = ref("");
const apiKey = ref("");
const model = ref("");
const save = async () => {
  console.log(baseUrl.value, apiKey.value, model.value);
  if (!!baseUrl.value || !!apiKey.value || !!model.value) {
    await storage.setItem("local:settings", {
      baseUrl: baseUrl.value,
      apiKey: apiKey.value,
      model: model.value,
    });
    let settings = await storage.getItem("local:settings");
    console.log("7777", settings);
  }
};
</script>

<style scoped>
.setting {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 320px;
  max-width: 420px;
  box-sizing: border-box;
}

.setting__title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2933;
}

/* 焦点态下的高亮边 */
.setting__group :deep(.van-cell--clickable::after),
.setting__group :deep(.van-cell::after) {
  border-bottom-color: #e5e7eb;
}

.setting__group :deep(.van-field--focus) {
  background: #f9fafb;
}

/* 按钮样式 */
.setting__submit {
  margin-top: 16px;
  height: 36px;
  width: 150px;
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  border: none;
  color: #fff;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35);
}

/* hover/active 效果 */
.setting__submit:active {
  opacity: 0.9;
  box-shadow: 0 3px 10px rgba(37, 99, 235, 0.4);
}
</style>
