// Preset templates - Flashcard Study Set

import { ElementType } from '@/lib/types'
import type { StackTemplate } from './basic'

// Flashcard Study Set - Educational preset template
export const flashcardStudyTemplate: StackTemplate = {
  id: 'flashcard-study',
  name: 'Flashcard Study Set',
  description: 'Spanish vocabulary flashcards with show/hide answers',
  thumbnail: '🎴',
  tags: ['education', 'language', 'study'],
  cards: [
    // Title Card
    {
      name: 'Title',
      backgroundColor: '#FFEB3B',
      elements: [
        {
          type: 'text' as ElementType,
          position: { x: 200, y: 150, width: 400, height: 100 },
          properties: {
            content: '📚 Spanish Vocabulary\nSet 1: Greetings',
            fontSize: 32,
            color: '#000000',
            align: 'center',
            bold: true,
          },
          script: null,
        },
        {
          type: 'button' as ElementType,
          position: { x: 300, y: 350, width: 200, height: 50 },
          properties: {
            label: 'Start Learning',
            fontSize: 18,
            backgroundColor: '#4CAF50',
            color: '#FFFFFF',
            borderWidth: 3,
            borderColor: '#000000',
            borderRadius: 8,
          },
          script: 'navigate("next")',
        },
      ],
    },
    // Flashcard 1
    {
      name: 'Card 1',
      backgroundColor: '#FFFFFF',
      elements: [
        {
          type: 'text' as ElementType,
          position: { x: 200, y: 150, width: 400, height: 100 },
          properties: {
            content: 'What is "Hello" in Spanish?',
            fontSize: 24,
            color: '#000000',
            align: 'center',
            bold: true,
          },
          script: null,
        },
        {
          type: 'text' as ElementType,
          position: { x: 200, y: 280, width: 400, height: 80 },
          properties: {
            content: 'Hola',
            fontSize: 32,
            color: '#4CAF50',
            align: 'center',
            bold: true,
          },
          script: null,
        },
        {
          type: 'button' as ElementType,
          position: { x: 340, y: 450, width: 120, height: 40 },
          properties: {
            label: 'Next →',
            fontSize: 14,
            backgroundColor: '#2196F3',
            color: '#FFFFFF',
            borderWidth: 2,
            borderColor: '#000000',
            borderRadius: 4,
          },
          script: 'navigate("next")',
        },
      ],
    },
    // Flashcard 2
    {
      name: 'Card 2',
      backgroundColor: '#FFFFFF',
      elements: [
        {
          type: 'text' as ElementType,
          position: { x: 200, y: 150, width: 400, height: 100 },
          properties: {
            content: 'What is "Goodbye" in Spanish?',
            fontSize: 24,
            color: '#000000',
            align: 'center',
            bold: true,
          },
          script: null,
        },
        {
          type: 'text' as ElementType,
          position: { x: 200, y: 280, width: 400, height: 80 },
          properties: {
            content: 'Adiós',
            fontSize: 32,
            color: '#4CAF50',
            align: 'center',
            bold: true,
          },
          script: null,
        },
        {
          type: 'button' as ElementType,
          position: { x: 250, y: 450, width: 120, height: 40 },
          properties: {
            label: '← Back',
            fontSize: 14,
            backgroundColor: '#E5E5E5',
            color: '#000000',
            borderWidth: 2,
            borderColor: '#000000',
            borderRadius: 4,
          },
          script: 'navigate("prev")',
        },
        {
          type: 'button' as ElementType,
          position: { x: 430, y: 450, width: 120, height: 40 },
          properties: {
            label: 'Next →',
            fontSize: 14,
            backgroundColor: '#2196F3',
            color: '#FFFFFF',
            borderWidth: 2,
            borderColor: '#000000',
            borderRadius: 4,
          },
          script: 'navigate("next")',
        },
      ],
    },
    // Completion Card
    {
      name: 'Complete',
      backgroundColor: '#E8F5E9',
      elements: [
        {
          type: 'text' as ElementType,
          position: { x: 200, y: 180, width: 400, height: 150 },
          properties: {
            content: '🎉 Review Complete!\n\nYou\'ve studied 2 Spanish words.\n\nKeep practicing!',
            fontSize: 22,
            color: '#2E7D32',
            align: 'center',
            bold: true,
          },
          script: null,
        },
        {
          type: 'button' as ElementType,
          position: { x: 300, y: 400, width: 200, height: 50 },
          properties: {
            label: 'Review Again',
            fontSize: 16,
            backgroundColor: '#4CAF50',
            color: '#FFFFFF',
            borderWidth: 3,
            borderColor: '#000000',
            borderRadius: 8,
          },
          script: 'navigate("first")',
        },
      ],
    },
  ],
}
