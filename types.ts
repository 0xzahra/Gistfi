export enum View {
  INTEL = 'INTEL', // Now represents Command Center/Dashboard
  WAR_ROOM = 'WAR_ROOM',
  GROWTH = 'GROWTH',
  TOOLS = 'TOOLS'
}

export interface XProfile {
  handle: string;
  name: string;
  bio: string;
  followers: string;
  following: string;
  avatar: string; // URL or placeholder color
  alphaScore: number; // 0-100
}

export interface XPost {
  id: string;
  content: string;
  likes: number;
  retweets: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timestamp: string;
}

export interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'analysis' | 'image' | 'video' | 'audio';
  metadata?: any;
}

export interface AnalysisResult {
  token: string;
  riskScore: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  buyProbability: number;
  devProfile: string;
  catalysts: string[];
  verdict: string;
}

export interface TrendingTopic {
  topic: string;
  volume: string;
  source: 'X' | 'TikTok' | 'Mixed';
  change: string;
}

export enum ModelType {
  INTELLIGENCE = 'gemini-3-pro-preview',
  FAST = 'gemini-2.5-flash-lite',
  RESEARCH = 'gemini-3-flash-preview',
  IMAGE_GEN = 'gemini-3-pro-image-preview',
  IMAGE_EDIT = 'gemini-2.5-flash-image',
  VIDEO_GEN = 'veo-3.1-fast-generate-preview',
  VIDEO_EXTEND = 'veo-3.1-generate-preview',
  AUDIO_LIVE = 'gemini-2.5-flash-native-audio-preview-12-2025',
  TTS = 'gemini-2.5-flash-preview-tts',
  TRANSCRIPTION = 'gemini-3-flash-preview',
}