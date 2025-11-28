import { NODE_DEFINITIONS } from '@/lib/types/nodes'
import { CompilerContext, CompilationError } from './types'

/**
 * Validates the graph structure and detects issues
 */
export function validateGraph(ctx: CompilerContext): void {
  // Check for disconnected nodes
  for (const node of ctx.nodes.values()) {
    const def = NODE_DEFINITIONS[node.type]
    if (!def) {
      ctx.errors.push({
        nodeId: node.id,
        message: `Unknown node type: ${node.type}`,
        type: 'error',
      })
      continue
    }

    // Check required inputs
    const requiredInputs = def.inputs.filter(i => i.required)
    for (const input of requiredInputs) {
      const hasConnection = ctx.edges.some(
        e => e.target === node.id && e.targetHandle === input.id
      )
      const hasPropertyValue = node.data.properties?.[input.id] !== undefined

      if (!hasConnection && !hasPropertyValue) {
        ctx.errors.push({
          nodeId: node.id,
          message: `Missing required input: ${input.name}`,
          type: 'warning',
        })
      }
    }
  }

  // Check for cycles in execution flow
  detectCycles(ctx)
}

/**
 * Detects cycles in the graph using DFS
 */
function detectCycles(ctx: CompilerContext): void {
  const visited = new Set<string>()
  const recStack = new Set<string>()

  const dfs = (nodeId: string): boolean => {
    if (recStack.has(nodeId)) {
      ctx.errors.push({
        nodeId,
        message: 'Circular dependency detected',
        type: 'error',
      })
      return true
    }

    if (visited.has(nodeId)) {
      return false
    }

    visited.add(nodeId)
    recStack.add(nodeId)

    const outgoingEdges = ctx.edges.filter(e => e.source === nodeId)
    for (const edge of outgoingEdges) {
      if (dfs(edge.target)) {
        return true
      }
    }

    recStack.delete(nodeId)
    return false
  }

  for (const nodeId of ctx.nodes.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId)
    }
  }
}

/**
 * Finds entry point nodes (event nodes) in the graph
 */
export function findEntryNodes(ctx: CompilerContext): string[] {
  const entryNodeIds: string[] = []
  
  for (const node of ctx.nodes.values()) {
    const def = NODE_DEFINITIONS[node.type]
    if (def?.type === 'event') {
      entryNodeIds.push(node.id)
    }
  }

  if (entryNodeIds.length === 0) {
    ctx.errors.push({
      nodeId: '',
      message: 'No entry point found. Add an event node (e.g., "On Click" or "On Load")',
      type: 'error',
    })
  }

  return entryNodeIds
}
