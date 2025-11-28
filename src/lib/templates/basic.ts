// Basic template types and the Interactive Tutorial template

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

// Interactive Tutorial - Basic beginner template
export const interactiveTutorialTemplate: StackTemplate = {
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
}
