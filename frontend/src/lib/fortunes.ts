const fortuneWaitMessages = [
  'The Buddha says patience brings noodles',
  'A tiger waits silently before it pounces on pad thai',
  'Good things simmer slowly in a clay pot',
  'The monk who waits eats the freshest spring rolls',
  'Even the Mekong river takes time to reach the sea',
  'A watched pot never boils, but an unwatched one overflows',
  'The lotus blooms for those who wait with a hungry heart',
  'Your table is being blessed by the kitchen spirits',
  'The chili is being ground with your name in mind',
  'Patience is the secret ingredient in every great curry',
];

const spiceOutcomes = [
  { label: 'Mild', color: '#4ade80', emoji: '🍃', desc: 'Gentle like a morning breeze' },
  { label: 'Medium', color: '#fbbf24', emoji: '🌶️', desc: 'A warm Thai afternoon' },
  { label: 'Hot', color: '#f97316', emoji: '🔥', desc: 'Fire dancer approved' },
  { label: 'Fire', color: '#ef4444', emoji: '💥', desc: 'Dragon breath incoming' },
  { label: 'Volcano', color: '#dc2626', emoji: '🌋', desc: 'You get a free Thai iced tea!' },
];

export function getFortuneWaitMessage(minutes: number): string {
  const index = minutes % fortuneWaitMessages.length;
  return fortuneWaitMessages[index];
}

export { spiceOutcomes, fortuneWaitMessages };
