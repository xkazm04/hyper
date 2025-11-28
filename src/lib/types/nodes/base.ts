// Base node types - Core type definitions for visual scripting

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
