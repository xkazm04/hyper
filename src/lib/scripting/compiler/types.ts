import { NodeGraph, ScriptNode, ScriptEdge } from '@/lib/types/nodes'

export interface CompilationError {
  nodeId: string
  message: string
  type: 'error' | 'warning'
}

export interface CompilationResult {
  code: string
  errors: CompilationError[]
  success: boolean
}

export interface CompilerContext {
  nodes: Map<string, ScriptNode>
  edges: ScriptEdge[]
  errors: CompilationError[]
  compiled: Set<string>
  visiting: Set<string>
}

export function createCompilerContext(graph: NodeGraph): CompilerContext {
  return {
    nodes: new Map(graph.nodes.map(n => [n.id, n])),
    edges: graph.edges,
    errors: [],
    compiled: new Set(),
    visiting: new Set(),
  }
}
