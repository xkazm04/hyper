import { ElementType } from '@/lib/types'

export interface StackTemplateCard {
  name: string
  backgroundColor: string
  elements: {
    type: ElementType
    position: { x: number; y: number; width: number; height: number }
    properties: any
    script: string | null
  }[]
}

export interface StackTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  tags: string[]
  cards: StackTemplateCard[]
}

export const stackTemplates: StackTemplate[] = [
  {
    id: 'interactive-tutorial',
    name: 'Interactive Tutorial',
    description: 'Learn HyperCard by doing - 5 interactive lessons',
    thumbnail: '🎓',
    tags: ['tutorial', 'education', 'beginner'],
    cards: [
      // Card 1: Welcome
      {
        name: 'Welcome',
        backgroundColor: '#E8F4F8',
        elements: [
          {
            type: 'text' as ElementType,
            position: { x: 200, y: 100, width: 400, height: 60 },
            properties: {
              content: 'Welcome to HyperCard!',
              fontSize: 32,
              color: '#000000',
              align: 'center',
              bold: true,
            },
            script: null,
          },
          {
            type: 'text' as ElementType,
            position: { x: 150, y: 180, width: 500, height: 120 },
            properties: {
              content: 'This tutorial will teach you the basics of navigating and interacting with HyperCard stacks.\n\nClick the "Next" button below to continue.',
              fontSize: 16,
              color: '#333333',
              align: 'center',
            },
            script: null,
          },
          {
            type: 'button' as ElementType,
            position: { x: 340, y: 380, width: 120, height: 45 },
            properties: {
              label: 'Next →',
              fontSize: 16,
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
      // Card 2: Click the button
      {
        name: 'Click the Button',
        backgroundColor: '#FFF9E6',
        elements: [
          {
            type: 'text' as ElementType,
            position: { x: 200, y: 80, width: 400, height: 50 },
            properties: {
              content: 'Lesson 1: Buttons',
              fontSize: 28,
              color: '#000000',
              align: 'center',
              bold: true,
            },
            script: null,
          },
          {
            type: 'text' as ElementType,
            position: { x: 150, y: 150, width: 500, height: 80 },
            properties: {
              content: 'Buttons are interactive elements. Try clicking the button below!',
              fontSize: 16,
              color: '#333333',
              align: 'center',
            },
            script: null,
          },
          {
            type: 'button' as ElementType,
            position: { x: 300, y: 260, width: 200, height: 60 },
            properties: {
              label: 'Click Me!',
              fontSize: 18,
              backgroundColor: '#FF9800',
              color: '#FFFFFF',
              borderWidth: 3,
              borderColor: '#000000',
              borderRadius: 8,
            },
            script: 'alert("Great job! You clicked the button!")',
          },
          {
            type: 'button' as ElementType,
            position: { x: 250, y: 400, width: 120, height: 40 },
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
            position: { x: 430, y: 400, width: 120, height: 40 },
            properties: {
              label: 'Next →',
              fontSize: 14,
              backgroundColor: '#4CAF50',
              color: '#FFFFFF',
              borderWidth: 2,
              borderColor: '#000000',
              borderRadius: 4,
            },
            script: 'navigate("next")',
          },
        ],
      },
      // Card 3: Fill the form
      {
        name: 'Fill the Form',
        backgroundColor: '#F0F8FF',
        elements: [
          {
            type: 'text' as ElementType,
            position: { x: 200, y: 80, width: 400, height: 50 },
            properties: {
              content: 'Lesson 2: Input Fields',
              fontSize: 28,
              color: '#000000',
              align: 'center',
              bold: true,
            },
            script: null,
          },
          {
            type: 'text' as ElementType,
            position: { x: 150, y: 150, width: 500, height: 60 },
            properties: {
              content: 'Input fields let users enter text. Try typing your name below:',
              fontSize: 16,
              color: '#333333',
              align: 'center',
            },
            script: null,
          },
          {
            type: 'text' as ElementType,
            position: { x: 200, y: 240, width: 120, height: 30 },
            properties: {
              content: 'Your Name:',
              fontSize: 14,
              color: '#000000',
              align: 'right',
            },
            script: null,
          },
          {
            type: 'input' as ElementType,
            position: { x: 340, y: 240, width: 260, height: 35 },
            properties: {
              placeholder: 'Enter your name here',
              fontSize: 14,
              borderWidth: 2,
              borderColor: '#000000',
            },
            script: null,
          },
          {
            type: 'button' as ElementType,
            position: { x: 250, y: 400, width: 120, height: 40 },
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
            position: { x: 430, y: 400, width: 120, height: 40 },
            properties: {
              label: 'Next →',
              fontSize: 14,
              backgroundColor: '#4CAF50',
              color: '#FFFFFF',
              borderWidth: 2,
              borderColor: '#000000',
              borderRadius: 4,
            },
            script: 'navigate("next")',
          },
        ],
      },
      // Card 4: Quiz
      {
        name: 'Quiz Time',
        backgroundColor: '#FFE6F0',
        elements: [
          {
            type: 'text' as ElementType,
            position: { x: 200, y: 80, width: 400, height: 50 },
            properties: {
              content: 'Lesson 3: Quiz',
              fontSize: 28,
              color: '#000000',
              align: 'center',
              bold: true,
            },
            script: null,
          },
          {
            type: 'text' as ElementType,
            position: { x: 150, y: 160, width: 500, height: 80 },
            properties: {
              content: 'What year was the original HyperCard released?',
              fontSize: 18,
              color: '#000000',
              align: 'center',
              bold: true,
            },
            script: null,
          },
          {
            type: 'button' as ElementType,
            position: { x: 300, y: 260, width: 200, height: 45 },
            properties: {
              label: '1985',
              fontSize: 16,
              backgroundColor: '#FFFFFF',
              color: '#000000',
              borderWidth: 2,
              borderColor: '#000000',
              borderRadius: 4,
            },
            script: 'alert("Not quite! Try again.")',
          },
          {
            type: 'button' as ElementType,
            position: { x: 300, y: 320, width: 200, height: 45 },
            properties: {
              label: '1987',
              fontSize: 16,
              backgroundColor: '#FFFFFF',
              color: '#000000',
              borderWidth: 2,
              borderColor: '#000000',
              borderRadius: 4,
            },
            script: 'alert("Correct! HyperCard was released in 1987."); navigate("next")',
          },
          {
            type: 'button' as ElementType,
            position: { x: 300, y: 380, width: 200, height: 45 },
            properties: {
              label: '1990',
              fontSize: 16,
              backgroundColor: '#FFFFFF',
              color: '#000000',
              borderWidth: 2,
              borderColor: '#000000',
              borderRadius: 4,
            },
            script: 'alert("Not quite! Try again.")',
          },
        ],
      },
      // Card 5: Congratulations
      {
        name: 'Congratulations',
        backgroundColor: '#E8F5E9',
        elements: [
          {
            type: 'text' as ElementType,
            position: { x: 200, y: 120, width: 400, height: 80 },
            properties: {
              content: '🎉 Congratulations! 🎉',
              fontSize: 36,
              color: '#4CAF50',
              align: 'center',
              bold: true,
            },
            script: null,
          },
          {
            type: 'text' as ElementType,
            position: { x: 150, y: 220, width: 500, height: 120 },
            properties: {
              content: 'You\'ve completed the HyperCard tutorial!\n\nYou now know how to:\n• Navigate between cards\n• Click buttons\n• Fill input fields\n• Answer quiz questions',
              fontSize: 16,
              color: '#333333',
              align: 'center',
            },
            script: null,
          },
          {
            type: 'button' as ElementType,
            position: { x: 300, y: 400, width: 200, height: 50 },
            properties: {
              label: 'Start Over',
              fontSize: 16,
              backgroundColor: '#2196F3',
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
  },
  {
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
  },
  {
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
  },
]
