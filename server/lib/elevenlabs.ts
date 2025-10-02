export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Voice synthesis will fall back to browser TTS.');
    }
  }

  async generateSpeech(text: string, voiceId = 'EXAVITQu4vr4xnSDxMaL'): Promise<Buffer | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5', // Latest high-quality natural model for human-like conversation
          voice_settings: {
            stability: 0.75,        // More stable for natural conversation flow
            similarity_boost: 0.9,  // Higher authenticity for human-like voice
            style: 0.35,           // Natural conversational style (not dramatic)
            use_speaker_boost: true
          },
          pronunciation_dictionary_locators: [],
          seed: null,
          previous_text: null,
          next_text: null,
          previous_request_ids: [],
          next_request_ids: []
        }),
      });

      if (!response.ok) {
        console.error('ElevenLabs API error:', response.status, await response.text());
        return null;
      }

      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer);
    } catch (error) {
      console.error('ElevenLabs synthesis error:', error);
      return null;
    }
  }

  async getVoices() {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch voices:', response.status);
        return [];
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }
}

export const elevenLabsService = new ElevenLabsService();