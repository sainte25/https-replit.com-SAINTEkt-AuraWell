import { apiRequest } from "./queryClient";

export async function processVoiceInput(transcript: string): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/voice/process", { transcript });
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Voice processing error:", error);
    return "I'm having trouble processing that right now. Please try again in a moment.";
  }
}
