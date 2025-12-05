export async function sendMessageToBackground(message: {
  type: any;
  config?: any;
  text: any;
  targetLang: any;
  ","?: any;
}) {
  console.log("sending message to background:", message);
  const response = await browser.runtime.sendMessage(message);
  console.log("Received response from background:", response);
  return response;
}

export async function translateText(
  config: {
    baseUrl: string;
    apiKey: string;
    model: string;
  },
  text?: string,
  targetLang?: string
) {
  console.log("Translating text:", { config, text, targetLang });
  return sendMessageToBackground({
    type: "translate",
    config,
    text,
    targetLang,
  });
}

export async function explainText(
  config: {
    baseUrl: string;
    apiKey: string;
    model: string;
  },
  text?: string,
  targetLang?: string
) {
  console.log("Explaining text:", { config, text, targetLang });
  return sendMessageToBackground({
    type: "explain",
    config,
    text,
    targetLang,
  });
}
