import type { Timezone } from '@/types';

export const TZ_FILLS: Record<Timezone | string, string> = {
  AKST: '#0EA5E9',
  PST: '#3B82F6',
  MST: '#F97316',
  CST: '#22C55E',
  EST: '#8B5CF6',
  AST: '#6D28D9',
  NST: '#EC4899',
  HST: '#06B6D4',
};

export const TZ_COLORS: Record<Timezone | string, string> = {
  AKST: 'bg-sky-700 text-white',
  PST:  'bg-blue-600 text-white',
  MST:  'bg-orange-500 text-white',
  CST:  'bg-green-600 text-white',
  EST:  'bg-purple-600 text-white',
  AST:  'bg-purple-800 text-white',
  NST:  'bg-pink-700 text-white',
  HST:  'bg-cyan-600 text-white',
};

export const TZ_COLORS_HEX: Record<Timezone | string, string> = {
  AKST: 'bg-[#0EA5E9]',
  PST:  'bg-[#3B82F6]',
  MST:  'bg-[#F97316]',
  CST:  'bg-[#22C55E]',
  EST:  'bg-[#8B5CF6]',
  AST:  'bg-[#6D28D9]',
  NST:  'bg-[#EC4899]',
  HST:  'bg-[#06B6D4]',
};
