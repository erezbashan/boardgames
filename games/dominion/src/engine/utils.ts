import { CardInstance } from './types';

// Simple Fisher-Yates shuffle
export function shuffle(array: CardInstance[]): CardInstance[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

let idCounter = 0;
export function generateInstanceId(cardId: string): string {
  return `${cardId}_${++idCounter}_${Math.random().toString(36).substring(2, 7)}`;
}
