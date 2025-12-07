<template>
  <!-- 划词后的小按钮，出现在选区上方 -->
  <button v-if="visibleButton" ref="buttonEl" class="translate-btn" :style="{
    top: buttonPos.top + 'px',
    left: buttonPos.left + 'px',
  }" @click="
    openPanel();
  ">
    <img src="../public/wxt.svg" style="height: 20px;width: 20px;" alt="">
  </button>



  <!-- 点击按钮后弹出的翻译面板（可拖动） -->
  <div v-if="visiblePanel" ref="panelEl" class="demo" :style="{
    top: panelPos.top + 'px',
    left: panelPos.left + 'px',
  }">
    <!-- 作为拖拽区域的头部 -->
    <div class="demo__header" @mousedown="onDragStart" @touchstart.stop.prevent="onDragStartTouch">
      <span>选中内容</span>
      <button class="demo__close" @click.stop="closePanel">×</button>
    </div>
    <p class="demo__source">{{ text }}</p>

    <!-- 中间面板：选择功能类型 -->
    <div class="demo__mode">
      <label>
        <input type="radio" value="translate" v-model="mode" />
        翻译
      </label>
      <label>
        <input type="radio" value="explain" v-model="mode" />
        解释
      </label>
      <button class="demo__action" @click="goTranslate">开始</button>
    </div>

    <p class="demo__result">{{ mode === 'translate' ? '翻译结果：' : '解释结果：' }}</p>
    <p class="demo__result">{{ res }}</p>
  </div>
</template>

<script lang="ts" setup>
import { storage } from "wxt/utils/storage";
import { useTextSelection } from "@vueuse/core";
import type { APIRequest, ResultType } from "@/types";

type Settings = { baseUrl: string; apiKey: string; model: string; targetLang: string };

const { text, rects } = useTextSelection();

const res = ref("");
const mode = ref<ResultType>("translate");

// 控制显示
const visibleButton = ref(false);
const visiblePanel = ref(false);

// 按钮和面板的位置
const buttonPos = reactive({ top: 0, left: 0 });
const panelPos = reactive({ top: 0, left: 0 });

// 引用 DOM，用于判断点击是否在组件内部
const buttonEl = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);

// 拖拽状态
const dragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });

// 监听选区变化：只控制按钮出现 / 消失
watch(
  () => rects.value,
  (r) => {
    const targetRect = Array.isArray(r) ? r[0] : r;

    if (
      !targetRect ||
      targetRect.width === 0 ||
      targetRect.height === 0 ||
      !text.value?.trim()
    ) {
      visibleButton.value = false;
      return;
    }

    const padding = 8;
    const top = targetRect.top - padding;
    const left = targetRect.left + targetRect.width / 2;

    buttonPos.top = Math.max(0, top);
    buttonPos.left = Math.max(0, left);

    visibleButton.value = true;
  },
  { immediate: true, deep: true }
);

// 点击小按钮，打开翻译面板
const openPanel = () => {
  panelPos.top = Math.max(0, buttonPos.top + 24);
  panelPos.left = Math.max(0, buttonPos.left - 150); // 面板宽 300，向左偏 150
  visiblePanel.value = true;
  res.value = "";
};

// 关闭面板和按钮
const closePanel = () => {
  visiblePanel.value = false;
  visibleButton.value = false;
};

// 点击空白关闭（点在按钮/面板外面）
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null;

  if (!target) return;

  const inPanel = panelEl.value && panelEl.value.contains(target);
  const inButton = buttonEl.value && buttonEl.value.contains(target);

  if (!inPanel && !inButton) {
    closePanel();
  }
};

// === 拖拽相关 ===
const onDragStart = (e: MouseEvent) => {
  if (!panelEl.value) return;
  dragging.value = true;

  // 记录鼠标相对面板左上角的偏移
  dragOffset.x = e.clientX - panelPos.left;
  dragOffset.y = e.clientY - panelPos.top;

  document.addEventListener("mousemove", onDragging);
  document.addEventListener("mouseup", onDragEnd);
};

const onDragging = (e: MouseEvent) => {
  if (!dragging.value) return;

  const newLeft = e.clientX - dragOffset.x;
  const newTop = e.clientY - dragOffset.y;

  // 简单防止拖出屏幕太多
  panelPos.left = Math.max(0, newLeft);
  panelPos.top = Math.max(0, newTop);
};

const onDragEnd = () => {
  dragging.value = false;
  document.removeEventListener("mousemove", onDragging);
  document.removeEventListener("mouseup", onDragEnd);
};

// 触摸拖动（移动端）
const onDragStartTouch = (e: TouchEvent) => {
  const touch = e.touches[0];
  if (!touch) return;
  dragging.value = true;
  dragOffset.x = touch.clientX - panelPos.left;
  dragOffset.y = touch.clientY - panelPos.top;

  document.addEventListener("touchmove", onDraggingTouch, { passive: false });
  document.addEventListener("touchend", onDragEndTouch);
};

const onDraggingTouch = (e: TouchEvent) => {
  if (!dragging.value) return;
  const touch = e.touches[0];
  if (!touch) return;

  const newLeft = touch.clientX - dragOffset.x;
  const newTop = touch.clientY - dragOffset.y;

  panelPos.left = Math.max(0, newLeft);
  panelPos.top = Math.max(0, newTop);
};

const onDragEndTouch = () => {
  dragging.value = false;
  document.removeEventListener("touchmove", onDraggingTouch);
  document.removeEventListener("touchend", onDragEndTouch);
};

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside, true);
  document.removeEventListener("mousemove", onDragging);
  document.removeEventListener("mouseup", onDragEnd);
  document.removeEventListener("touchmove", onDraggingTouch);
  document.removeEventListener("touchend", onDragEndTouch);
});

// 调用翻译/解释接口
const goTranslate = async () => {
  try {
    const settings = await storage.getItem<Settings>("local:settings");
    if (!settings) {
      console.error("Translation settings are missing.");
      res.value = "请先在插件设置里配置接口地址和密钥。";
      return;
    }
    if (!text.value?.trim()) {
      res.value = "当前没有选中的文本。";
      return;
    }
    const payload: APIRequest = {
      type: mode.value,
      config: {
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        targetLang: settings.targetLang,
      },
      text: text.value,
      targetLang: settings.targetLang,
    };

    const response = await translateText(payload);
    res.value = response.data?.choices[0].message.content ?? "";
  } catch (err: any) {
    console.error("Translate failed:", err);
    res.value = err?.message || "翻译失败，请稍后重试。";
  }
};
</script>

<style scoped>
.translate-btn {
  position: fixed;
  transform: translate(-50%, -100%);
  z-index: 10000;
  padding: 4px;
  font-size: 12px;
  border-radius: 4px;
  border: none;
  background: #f6f6f7;
  cursor: pointer;
}

.translate-btn:active {
  opacity: 0.9;
}

.demo {
  width: 300px;
  max-height: 500px;
  position: fixed;
  background-color: #f9fafb;
  z-index: 9999;
  padding: 8px 12px;
  box-sizing: border-box;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  font-size: 13px;
}

/* 头部作为拖拽区域，给一点“可拖拽”的手势 */
.demo__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-weight: 600;
  cursor: move;
  user-select: none;
}

.demo__close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.demo__source {
  margin: 4px 0 8px;
  color: #4b5563;
  max-height: 80px;
  overflow: auto;
}

.demo__action {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  border: none;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
}

.demo__mode {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.demo__result {
  margin-top: 8px;
  color: #111827;
  max-height: 260px;
  overflow: auto;
}
</style>
