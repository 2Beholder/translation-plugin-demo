import { createApp } from "vue";
import Translation from "@/components/Translation.vue";

export default defineContentScript({
  matches: ['*://*/*'],
  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // Create the app and mount it to the UI container
        const app = createApp(Translation);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        // Unmount the app when the UI is removed
        if (app) {
          app.unmount();
        }
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
