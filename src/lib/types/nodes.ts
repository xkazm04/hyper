// Node-based visual scripting types

export type NodeType =
  | 'event'        // Entry points (onClick, onLoad, etc.)
  | 'logic'        // Conditionals, loops
  | 'data'         // Variables, constants
  | 'navigation'   // Card navigation
  | 'ui'           // UI manipulation
  | 'output'       // Messages, sounds
  | 'math'         // Mathematical operations
  | 'string'       // String operations
  | 'variable'     // Get/Set variables

export type DataType = 'string' | 'number' | 'boolean' | 'any' | 'void' | 'element' | 'card'

export interface NodePort {
  id: string
  name: string
  type: DataType
  required?: boolean
}

export interface NodeDefinition {
  id: string
  type: NodeType
  category: string
  label: string
  description: string
  color: string
  inputs: NodePort[]
  outputs: NodePort[]
  properties?: Record<string, any>
  // Compiler function to generate JS code
  compile?: (node: ScriptNode, inputs: Record<string, string>) => string
}

export interface ScriptNode {
  id: string
  type: string  // References NodeDefinition.id
  position: { x: number; y: number }
  data: {
    label?: string
    properties?: Record<string, any>
  }
}

export interface ScriptEdge {
  id: string
  source: string  // Source node ID
  sourceHandle: string  // Source port ID
  target: string  // Target node ID
  targetHandle: string  // Target port ID
}

export interface NodeGraph {
  nodes: ScriptNode[]
  edges: ScriptEdge[]
  version: string
}

// Extended Card type with node graph support
export interface CardWithNodeGraph {
  script?: string | null
  nodeGraph?: NodeGraph | null
  scriptMode?: 'code' | 'nodes'
}

// Node categories for palette organization
export const NODE_CATEGORIES = {
  EVENTS: 'Events',
  LOGIC: 'Logic',
  DATA: 'Data',
  NAVIGATION: 'Navigation',
  UI: 'UI',
  OUTPUT: 'Output',
  MATH: 'Math',
  STRING: 'String',
  VARIABLES: 'Variables',
} as const

// Pre-defined node type definitions
export const NODE_DEFINITIONS: Record<string, NodeDefinition> = {
  // ========== EVENT NODES ==========
  onClick: {
    id: 'onClick',
    type: 'event',
    category: NODE_CATEGORIES.EVENTS,
    label: 'On Click',
    description: 'Triggered when element is clicked',
    color: '#10b981',
    inputs: [],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
      { id: 'event', name: 'Event', type: 'any' },
    ],
  },

  onLoad: {
    id: 'onLoad',
    type: 'event',
    category: NODE_CATEGORIES.EVENTS,
    label: 'On Load',
    description: 'Triggered when card loads',
    color: '#10b981',
    inputs: [],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
  },

  // ========== NAVIGATION NODES ==========
  goToNextCard: {
    id: 'goToNextCard',
    type: 'navigation',
    category: NODE_CATEGORIES.NAVIGATION,
    label: 'Go to Next Card',
    description: 'Navigate to the next card in the stack',
    color: '#3b82f6',
    inputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
    compile: () => 'goToNextCard()',
  },

  goToPrevCard: {
    id: 'goToPrevCard',
    type: 'navigation',
    category: NODE_CATEGORIES.NAVIGATION,
    label: 'Go to Previous Card',
    description: 'Navigate to the previous card in the stack',
    color: '#3b82f6',
    inputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
    compile: () => 'goToPrevCard()',
  },

  goToCard: {
    id: 'goToCard',
    type: 'navigation',
    category: NODE_CATEGORIES.NAVIGATION,
    label: 'Go to Card',
    description: 'Navigate to a specific card by ID',
    color: '#3b82f6',
    inputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
      { id: 'cardId', name: 'Card ID', type: 'string', required: true },
    ],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
    compile: (node, inputs) => `goToCard(${inputs.cardId || "'CARD_ID'"})`,
  },

  // ========== UI NODES ==========
  updateElement: {
    id: 'updateElement',
    type: 'ui',
    category: NODE_CATEGORIES.UI,
    label: 'Update Element',
    description: 'Update element properties',
    color: '#8b5cf6',
    inputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
      { id: 'elementId', name: 'Element ID', type: 'string', required: true },
      { id: 'updates', name: 'Updates', type: 'any', required: true },
    ],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
    compile: (node, inputs) => {
      return `updateElement(${inputs.elementId}, ${inputs.updates})`
    },
  },

  hideElement: {
    id: 'hideElement',
    type: 'ui',
    category: NODE_CATEGORIES.UI,
    label: 'Hide Element',
    description: 'Hide an element',
    color: '#8b5cf6',
    inputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
      { id: 'elementId', name: 'Element ID', type: 'string', required: true },
    ],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
    compile: (node, inputs) => `hideElement(${inputs.elementId})`,
  },

  showElement: {
    id: 'showElement',
    type: 'ui',
    category: NODE_CATEGORIES.UI,
    label: 'Show Element',
    description: 'Show an element',
    color: '#8b5cf6',
    inputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
      { id: 'elementId', name: 'Element ID', type: 'string', required: true },
    ],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
    compile: (node, inputs) => `showElement(${inputs.elementId})`,
  },

  // ========== OUTPUT NODES ==========
  showMessage: {
    id: 'showMessage',
    type: 'output',
    category: NODE_CATEGORIES.OUTPUT,
    label: 'Show Message',
    description: 'Display a message to the user',
    color: '#f59e0b',
    inputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
      { id: 'message', name: 'Message', type: 'string', required: true },
    ],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
    compile: (node, inputs) => `showMessage(${inputs.message})`,
  },

  playSound: {
    id: 'playSound',
    type: 'output',
    category: NODE_CATEGORIES.OUTPUT,
    label: 'Play Sound',
    description: 'Play an audio file',
    color: '#f59e0b',
    inputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
      { id: 'url', name: 'Sound URL', type: 'string', required: true },
    ],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
    compile: (node, inputs) => `playSound(${inputs.url})`,
  },

  // ========== LOGIC NODES ==========
  ifElse: {
    id: 'ifElse',
    type: 'logic',
    category: NODE_CATEGORIES.LOGIC,
    label: 'If/Else',
    description: 'Conditional branching',
    color: '#ef4444',
    inputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
      { id: 'condition', name: 'Condition', type: 'boolean', required: true },
    ],
    outputs: [
      { id: 'true', name: 'True', type: 'void' },
      { id: 'false', name: 'False', type: 'void' },
    ],
    compile: (node, inputs) => {
      return `if (${inputs.condition || 'true'}) {\n  // True branch\n} else {\n  // False branch\n}`
    },
  },

  compare: {
    id: 'compare',
    type: 'logic',
    category: NODE_CATEGORIES.LOGIC,
    label: 'Compare',
    description: 'Compare two values',
    color: '#ef4444',
    inputs: [
      { id: 'a', name: 'A', type: 'any', required: true },
      { id: 'b', name: 'B', type: 'any', required: true },
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'boolean' },
    ],
    properties: {
      operator: '===',
    },
    compile: (node, inputs) => {
      const operator = node.data.properties?.operator || '==='
      return `${inputs.a} ${operator} ${inputs.b}`
    },
  },

  // ========== VARIABLE NODES ==========
  getVariable: {
    id: 'getVariable',
    type: 'variable',
    category: NODE_CATEGORIES.VARIABLES,
    label: 'Get Variable',
    description: 'Get a stored variable value',
    color: '#06b6d4',
    inputs: [
      { id: 'key', name: 'Variable Name', type: 'string', required: true },
    ],
    outputs: [
      { id: 'value', name: 'Value', type: 'any' },
    ],
    compile: (node, inputs) => `getVariable(${inputs.key})`,
  },

  setVariable: {
    id: 'setVariable',
    type: 'variable',
    category: NODE_CATEGORIES.VARIABLES,
    label: 'Set Variable',
    description: 'Store a variable value',
    color: '#06b6d4',
    inputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
      { id: 'key', name: 'Variable Name', type: 'string', required: true },
      { id: 'value', name: 'Value', type: 'any', required: true },
    ],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
    ],
    compile: (node, inputs) => `setVariable(${inputs.key}, ${inputs.value})`,
  },

  // ========== DATA NODES ==========
  stringConstant: {
    id: 'stringConstant',
    type: 'data',
    category: NODE_CATEGORIES.DATA,
    label: 'String',
    description: 'A constant string value',
    color: '#64748b',
    inputs: [],
    outputs: [
      { id: 'value', name: 'Value', type: 'string' },
    ],
    properties: {
      value: '',
    },
    compile: (node) => `"${node.data.properties?.value || ''}"`,
  },

  numberConstant: {
    id: 'numberConstant',
    type: 'data',
    category: NODE_CATEGORIES.DATA,
    label: 'Number',
    description: 'A constant number value',
    color: '#64748b',
    inputs: [],
    outputs: [
      { id: 'value', name: 'Value', type: 'number' },
    ],
    properties: {
      value: 0,
    },
    compile: (node) => String(node.data.properties?.value || 0),
  },

  booleanConstant: {
    id: 'booleanConstant',
    type: 'data',
    category: NODE_CATEGORIES.DATA,
    label: 'Boolean',
    description: 'A constant boolean value',
    color: '#64748b',
    inputs: [],
    outputs: [
      { id: 'value', name: 'Value', type: 'boolean' },
    ],
    properties: {
      value: false,
    },
    compile: (node) => String(node.data.properties?.value || false),
  },

  // ========== MATH NODES ==========
  mathOperation: {
    id: 'mathOperation',
    type: 'math',
    category: NODE_CATEGORIES.MATH,
    label: 'Math Operation',
    description: 'Perform mathematical operations',
    color: '#14b8a6',
    inputs: [
      { id: 'a', name: 'A', type: 'number', required: true },
      { id: 'b', name: 'B', type: 'number', required: true },
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'number' },
    ],
    properties: {
      operator: '+',
    },
    compile: (node, inputs) => {
      const operator = node.data.properties?.operator || '+'
      return `(${inputs.a} ${operator} ${inputs.b})`
    },
  },

  // ========== STRING NODES ==========
  stringConcat: {
    id: 'stringConcat',
    type: 'string',
    category: NODE_CATEGORIES.STRING,
    label: 'Concatenate',
    description: 'Join strings together',
    color: '#a855f7',
    inputs: [
      { id: 'a', name: 'A', type: 'string', required: true },
      { id: 'b', name: 'B', type: 'string', required: true },
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'string' },
    ],
    compile: (node, inputs) => `(${inputs.a} + ${inputs.b})`,
  },

  userInput: {
    id: 'userInput',
    type: 'output',
    category: NODE_CATEGORIES.OUTPUT,
    label: 'User Input',
    description: 'Prompt user for input',
    color: '#f59e0b',
    inputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
      { id: 'message', name: 'Prompt', type: 'string', required: true },
    ],
    outputs: [
      { id: 'exec', name: 'Execute', type: 'void' },
      { id: 'value', name: 'Value', type: 'string' },
    ],
    compile: (node, inputs) => `prompt(${inputs.message})`,
  },
}
