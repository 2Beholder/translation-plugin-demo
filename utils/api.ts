import type { APIRequest, APIResponse } from "@/types";

export async function sendMessageToBackground(message: APIRequest): Promise<APIResponse> {
  console.log("sending message to background:", message);
  const response = await browser.runtime.sendMessage(message);
  console.log("Received response from background:", response);
  return response;
}

export async function translateText(payload: APIRequest): Promise<APIResponse> {
  console.log("Sending request to background:", payload);
  return sendMessageToBackground(payload);
}
