import { GoogleGenAI, Type, FunctionDeclaration, Schema, Modality } from "@google/genai";
import { ModelType, TrendingTopic, XProfile, XPost } from "../types";

const SYSTEM_INSTRUCTION = `
You are Gistfi, built by arewa.base.eth.
Goal: Provide unfair crypto advantages.
Tone: Simple. Smart. Ultra-concise. No fluff. No complex jargon unless needed.
Directives:
1. Be the fastest source of truth.
2. Use logic and probability.
3. Flag scams instantly.
4. Output Markdown. Keep it visually clean.
5. Always imply "NFA" (Not Financial Advice).
6. Compliance: Adhere to X/Twitter rules.
`;

export class GistfiService {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  private async ensureVeoKey() {
    const win = window as any;
    if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
            this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        }
    }
  }

  // --- X Integration Simulation ---
  async simulateXProfile(handle: string): Promise<{ profile: XProfile, posts: XPost[] }> {
    try {
        const cleanHandle = handle.replace('@', '');
        const response = await this.ai.models.generateContent({
            model: ModelType.RESEARCH,
            contents: `Generate a realistic simulation of a crypto twitter profile for handle "@${cleanHandle}".
            Also generate 3 recent "crypto-native" tweets they might have posted.
            Return JSON ONLY.
            Format:
            {
              "profile": {
                "handle": "@${cleanHandle}",
                "name": "Generated Name",
                "bio": "Short crypto bio",
                "followers": "12.5K",
                "following": "420",
                "alphaScore": 85
              },
              "posts": [
                { "id": "1", "content": "Tweet content...", "likes": 120, "retweets": 45, "sentiment": "BULLISH", "timestamp": "2h ago" }
              ]
            }`,
            config: {
                systemInstruction: "Output raw JSON only. No markdown.",
                temperature: 0.7
            }
        });

        const text = response.text || "{}";
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        // Fallback
        return {
            profile: { handle: `@${handle}`, name: "Crypto User", bio: "Explorer.", followers: "0", following: "0", avatar: "", alphaScore: 50 },
            posts: []
        };
    }
  }

  async refineTweet(draft: string): Promise<string> {
      try {
          const response = await this.ai.models.generateContent({
              model: ModelType.FAST,
              contents: `Refine this tweet for maximum engagement/viral potential on Crypto Twitter. Keep it under 280 chars. Don't use hashtags unless critical. Input: "${draft}"`,
              config: { systemInstruction: "Return ONLY the refined tweet text." }
          });
          return response.text || draft;
      } catch (e) { return draft; }
  }
  // --------------------------------

  async getTrending(): Promise<TrendingTopic[]> {
    try {
        const response = await this.ai.models.generateContent({
            model: ModelType.RESEARCH, // Using Flash for speed/search balance
            contents: `Identify 4 top trending crypto narratives or tokens on X (Twitter) and TikTok right now.
            Return a JSON array ONLY.
            Format: [{"topic": "$TICKER or Concept", "volume": "High/Med", "source": "X" or "TikTok" or "Mixed", "change": "+XX%"}]
            Use search to get real data.`,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "Output raw JSON array only. No markdown blocks."
            }
        });

        const text = response.text || "[]";
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        // Fallback for extreme speed if API fails or is slow
        return [
            { topic: "$BASE", volume: "High", source: "Mixed", change: "+12%" },
            { topic: "AI Agents", volume: "High", source: "X", change: "+45%" },
            { topic: "Memecoins", volume: "Med", source: "TikTok", change: "+8%" },
            { topic: "$ETH", volume: "High", source: "X", change: "+4%" }
        ];
    }
  }

  async getTokenPrice(ticker: string): Promise<{ price: string; change: string } | null> {
    try {
        const response = await this.ai.models.generateContent({
            model: ModelType.RESEARCH,
            contents: `Get real-time price of ${ticker} in USD and 24h change %.
            Format:
            PRICE: $X.XX
            CHANGE: +X.XX%`,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "Return only price and change. Nothing else."
            }
        });
        
        const text = response.text || "";
        const priceMatch = text.match(/PRICE:\s*(\$[\d,.]+(?:\.\d+)?)/i);
        const changeMatch = text.match(/CHANGE:\s*([+\-]?[\d,.]+%)/i);

        if (priceMatch) {
            return {
                price: priceMatch[1],
                change: changeMatch ? changeMatch[1] : "0.00%"
            };
        }
        return null;
    } catch (e) {
        console.error("Price fetch failed", e);
        return null;
    }
  }

  async getTokenHistory(ticker: string, timeframe: '24h' | '7d'): Promise<any[]> {
    try {
        // We use a lighter prompt for speed
        const response = await this.ai.models.generateContent({
            model: ModelType.RESEARCH,
            contents: `Generate realistic JSON price history for ${ticker} (${timeframe}).
            Format: [{"time": "label", "price": 123.45}].
            Last point must match current market price found via search.
            Return ONLY raw JSON.`,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "Output raw JSON array only."
            }
        });

        const text = response.text || "[]";
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        return [];
    }
  }

  async analyzeToken(token: string, deepDive: boolean = false): Promise<string> {
    const model = deepDive ? ModelType.INTELLIGENCE : ModelType.RESEARCH; // Research is faster
    const tools: any[] = [{ googleSearch: {} }];
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: tools,
    };

    if (deepDive) {
      config.thinkingConfig = { thinkingBudget: 16000 }; 
    }

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: `Analyze ${token}. Brief Fundamentals, Sentiment (BULL/BEAR), Risk (0-100), Buy Prob %, Dev Check. Keep it short.`,
        config: config
      });
      return response.text || "Analysis failed.";
    } catch (error) {
      return "Service unavailable.";
    }
  }

  async quickScan(query: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: ModelType.FAST, // Fastest model
        contents: query,
        config: {
          systemInstruction: "You are Gistfi. 1 sentence max. High signal."
        }
      });
      return response.text || "Scan failed.";
    } catch (error) {
      return "Offline.";
    }
  }

  async generateMeme(prompt: string, aspectRatio: string = "1:1"): Promise<string | null> {
    try {
      await this.ensureVeoKey();
      const response = await this.ai.models.generateContent({
        model: ModelType.IMAGE_GEN,
        contents: prompt,
        config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: "1K" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error) { return null; }
  }

  async editImage(base64Image: string, prompt: string): Promise<string | null> {
    try {
        const response = await this.ai.models.generateContent({
            model: ModelType.IMAGE_EDIT,
            contents: { parts: [{ inlineData: { mimeType: 'image/png', data: base64Image } }, { text: prompt }] }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    } catch (error) { return null; }
  }

  async generateVideo(prompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<any> {
    await this.ensureVeoKey();
    return await this.ai.models.generateVideos({
      model: ModelType.VIDEO_GEN,
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio }
    });
  }

  async pollVideoOperation(operation: any): Promise<string | null> {
    const updatedOp = await this.ai.operations.getVideosOperation({ operation });
    if (updatedOp.done) {
        const uri = updatedOp.response?.generatedVideos?.[0]?.video?.uri;
        if (uri) return `${uri}&key=${process.env.API_KEY}`;
        return null;
    }
    return null;
  }

  async transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
    try {
        const response = await this.ai.models.generateContent({
            model: ModelType.TRANSCRIPTION,
            contents: { parts: [{ inlineData: { mimeType, data: base64Audio } }, { text: "Transcribe for alpha." }] }
        });
        return response.text || "No transcription.";
    } catch (e) { return "Failed."; }
  }

  async textToSpeech(text: string): Promise<ArrayBuffer | null> {
    try {
        const response = await this.ai.models.generateContent({
            model: ModelType.TTS,
            contents: { parts: [{ text: text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }
            }
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
             const binaryString = atob(base64);
             const len = binaryString.length;
             const bytes = new Uint8Array(len);
             for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
             return bytes.buffer;
        }
        return null;
    } catch (e) { return null; }
  }

  getLiveClient() { return this.ai.live; }
}

export const gistfiService = new GistfiService();