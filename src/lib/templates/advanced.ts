// Advanced template - Choose Your Own Adventure

import { ElementType } from '@/lib/types'
import type { StackTemplate } from './basic'

// Choose Your Own Adventure - Advanced interactive story template
export const chooseAdventureTemplate: StackTemplate = {
  id: 'choose-adventure',
  name: 'Choose Your Own Adventure',
  description: 'Interactive story with multiple paths and endings',
  thumbnail: '📖',
  tags: ['story', 'interactive', 'creative'],
  cards: [
    // Card 1: Story Opening
    {
      name: 'The Mysterious Door',
      backgroundColor: '#2C2C2C',
      elements: [
        {
          type: 'text' as ElementType,
          position: { x: 100, y: 80, width: 600, height: 200 },
          properties: {
            content: 'You stand before an ancient door in a forgotten castle. Strange symbols glow faintly on its surface. You hear whispers from beyond...\n\nWhat do you do?',
            fontSize: 18,
            color: '#FFFFFF',
            align: 'center',
          },
          script: null,
        },
        {
          type: 'button' as ElementType,
          position: { x: 250, y: 320, width: 300, height: 50 },
          properties: {
            label: 'Open the door carefully',
            fontSize: 16,
            backgroundColor: '#4CAF50',
            color: '#FFFFFF',
            borderWidth: 3,
            borderColor: '#000000',
            borderRadius: 8,
          },
          script: 'navigate("next")',
        },
        {
          type: 'button' as ElementType,
          position: { x: 250, y: 390, width: 300, height: 50 },
          properties: {
            label: 'Knock three times',
            fontSize: 16,
            backgroundColor: '#2196F3',
            color: '#FFFFFF',
            borderWidth: 3,
            borderColor: '#000000',
            borderRadius: 8,
          },
          script: 'alert("You hear footsteps approaching..."); navigate("next")',
        },
        {
          type: 'button' as ElementType,
          position: { x: 250, y: 460, width: 300, height: 50 },
          properties: {
            label: 'Walk away',
            fontSize: 16,
            backgroundColor: '#FF5722',
            color: '#FFFFFF',
            borderWidth: 3,
            borderColor: '#000000',
            borderRadius: 8,
          },
          script: 'alert("Sometimes the wisest choice is to walk away."); navigate("last")',
        },
      ],
    },
    // Card 2: The Library
    {
      name: 'The Ancient Library',
      backgroundColor: '#3E2723',
      elements: [
        {
          type: 'text' as ElementType,
          position: { x: 100, y: 80, width: 600, height: 180 },
          properties: {
            content: 'The door opens to reveal a vast library filled with ancient books. A glowing tome sits on a pedestal in the center.\n\nWhat catches your attention?',
            fontSize: 18,
            color: '#FFF8DC',
            align: 'center',
          },
          script: null,
        },
        {
          type: 'button' as ElementType,
          position: { x: 250, y: 300, width: 300, height: 50 },
          properties: {
            label: 'Examine the glowing tome',
            fontSize: 16,
            backgroundColor: '#FFD700',
            color: '#000000',
            borderWidth: 3,
            borderColor: '#000000',
            borderRadius: 8,
          },
          script: 'navigate("next")',
        },
        {
          type: 'button' as ElementType,
          position: { x: 250, y: 370, width: 300, height: 50 },
          properties: {
            label: 'Search the shelves',
            fontSize: 16,
            backgroundColor: '#8B4513',
            color: '#FFFFFF',
            borderWidth: 3,
            borderColor: '#000000',
            borderRadius: 8,
          },
          script: 'alert("You find a hidden passage!"); navigate("next")',
        },
        {
          type: 'button' as ElementType,
          position: { x: 340, y: 450, width: 120, height: 40 },
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
      ],
    },
    // Card 3: The Tome's Secret
    {
      name: 'The Tome\'s Secret',
      backgroundColor: '#1A237E',
      elements: [
        {
          type: 'text' as ElementType,
          position: { x: 100, y: 100, width: 600, height: 250 },
          properties: {
            content: 'As you touch the tome, it opens by itself. Ancient text glows with magical energy:\n\n"Knowledge is power, but wisdom is knowing when to use it."\n\nYou feel enlightened. The adventure continues...',
            fontSize: 18,
            color: '#E3F2FD',
            align: 'center',
          },
          script: null,
        },
        {
          type: 'button' as ElementType,
          position: { x: 300, y: 420, width: 200, height: 50 },
          properties: {
            label: 'Continue Journey',
            fontSize: 16,
            backgroundColor: '#9C27B0',
            color: '#FFFFFF',
            borderWidth: 3,
            borderColor: '#000000',
            borderRadius: 8,
          },
          script: 'navigate("last")',
        },
      ],
    },
    // Card 4: Happy Ending
    {
      name: 'The End',
      backgroundColor: '#4A148C',
      elements: [
        {
          type: 'text' as ElementType,
          position: { x: 150, y: 150, width: 500, height: 200 },
          properties: {
            content: '✨ THE END ✨\n\nYour journey through the mysterious castle has come to an end. You\'ve gained wisdom and experience.\n\nThank you for playing!',
            fontSize: 20,
            color: '#FFD700',
            align: 'center',
            bold: true,
          },
          script: null,
        },
        {
          type: 'button' as ElementType,
          position: { x: 300, y: 420, width: 200, height: 50 },
          properties: {
            label: 'Play Again',
            fontSize: 16,
            backgroundColor: '#00BCD4',
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
