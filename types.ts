
export enum PlayerType {
  USER = 'USER',
  AI = 'AI',
}

export interface ImprovedExample {
  score: number;
  text: string;
}

export interface DuelMessage {
  id: string;
  player: PlayerType;
  text: string;
  score?: number;
  explanation?: string;
  improvedExamples?: ImprovedExample[];
  detailedExplanation?: string; // For the "Explain this" feature
  isLiked?: boolean; // For the "Like" button
  isMarkedTooComplex?: boolean; // For the "Too complicated" button
}

export interface GeminiDuelResponse {
  aiResponseText: string;
  playerScore: number;
  playerScoreExplanation: string;
  playerImprovedExamples: ImprovedExample[];
  aiScore: number;
  aiScoreExplanation:string;
  isGameOver: boolean;
  gameOverReason: string;
}

export interface DuelSettings {
    difficulty: number;
    excludedTopics: string[];
}

// Type for displaying system messages in the chat history (e.g., challenge results)
export interface SystemMessage {
    id: string;
    type: 'SYSTEM';
    text: string;
    details: string;
    isSuccess: boolean; // To style the message (e.g., green for success, red for failure)
}

// A union type for items that can appear in the history
export type HistoryItem = DuelMessage | SystemMessage;


// Type for storing the complete result of a challenge
export interface ChallengeResult {
  id: string;
  wager: number;
  isApproved: boolean;
  reasoning: string;
  penalty: number; // How many points AI lost
  challengedMessages: { id1: string, text1: string, id2: string, text2: string };
  userArgument?: string;
}

// Type for the structured response from Gemini when analyzing a challenge
export interface GeminiChallengeAnalysisResponse {
    isApproved: boolean;
    reasoning: string;
    penalty: number;
}
