import type { Timezone } from '@/types';

export const TZ_FILLS: Record<Timezone | string, string> = {
  AKST: '#4B9CD3',
  PST:  '#5B8DEF',
  MST:  '#E8A86B',
  CST:  '#4FAA76',
  EST:  '#A684C7',
  AST:  '#8265A6',
  NST:  '#D977A6',
  HST:  '#4FA8B8',
};

export const TZ_COLORS: Record<Timezone | string, string> = {
  AKST: 'bg-[#4B9CD3] text-white',
  PST:  'bg-[#5B8DEF] text-white',
  MST:  'bg-[#E8A86B] text-white',
  CST:  'bg-[#4FAA76] text-white',
  EST:  'bg-[#A684C7] text-white',
  AST:  'bg-[#8265A6] text-white',
  NST:  'bg-[#D977A6] text-white',
  HST:  'bg-[#4FA8B8] text-white',
};

export const TZ_COLORS_HEX: Record<Timezone | string, string> = {
  AKST: 'bg-[#4B9CD3]',
  PST:  'bg-[#5B8DEF]',
  MST:  'bg-[#E8A86B]',
  CST:  'bg-[#4FAA76]',
  EST:  'bg-[#A684C7]',
  AST:  'bg-[#8265A6]',
  NST:  'bg-[#D977A6]',
  HST:  'bg-[#4FA8B8]',
};
