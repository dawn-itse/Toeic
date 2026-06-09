/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CardStatus = 'CẦN ÔN' | 'ĐANG HỌC' | 'ĐÃ THUỘC' | 'MỚI';

export interface Card {
  id: string;
  deckId: string;
  front: string; // The English term/phrase
  back: string;  // The Vietnamese translation/definition
  example?: string; // Example sentence
  status: CardStatus;
  streakCount: number; // For spaced repetition calculations
  nextReviewDate?: string; // ISO string
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  isCompleted?: boolean;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
  category: 'REVIEW' | 'SPELL' | 'IPA';
}

export interface LearnState {
  decks: Deck[];
  cards: Card[];
  streak: number;
  todayReviewedCount: number;
  todayGoal: number;
  xp: number;
  level: number;
  hearts: number;
  unlimitedHearts: boolean;
  quests: DailyQuest[];
  lastActiveDate?: string;
}
