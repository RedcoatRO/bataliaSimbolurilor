
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