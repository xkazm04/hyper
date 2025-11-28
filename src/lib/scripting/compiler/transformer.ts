import { ScriptNode, NODE_DEFINITIONS } from '@/lib/types/nodes'
import { CompilerContext } from './types'

/**
 * Gets input values for a node by resolving connections and properties
 */
export function resolveNodeInputs(
  ctx: CompilerContext,
  node: ScriptNode,
  depth: number
): Record<string, string> {
  const def = NODE_DEFINITIONS[node.type]
  if (!def) return {}

  const inputs: Record<string, string> = {}

  for (const input of def.inputs) {
    // Check if there's a connection to this input
    const edge = ctx.edges.find(
      e => e.target === node.id && e.targetHandle === input.id
    )

    if (edge) {
      // Get value from connected node
      const sourceNode = ctx.nodes.get(edge.source)
      if (sourceNode) {
        const sourceOutput = compileNodeOutput(ctx, sourceNode, edge.sourceHandle, depth + 1)
        inputs[input.id] = sourceOutput
      }
    } else if (node.data.properties?.[input.id] !== undefined) {
      // Use property value
      const value = node.data.properties[input.id]
      if (typeof value === 'string') {
        inputs[input.id] = `"${value}"`
      } else {
        inputs[input.id] = String(value)
      }
    }
  }

  return inputs
}

/**
 * Compiles a node's output value
 */
export function compileNodeOutput(
  ctx: CompilerContext,
  node: ScriptNode,
  outputId: string,
  depth: number
): string {
  const def = NODE_DEFINITIONS[node.type]
  if (!def) return ''

  // For data nodes, just compile them directly
  if (def.type === 'data' || def.type === 'variable' || def.type === 'math' || def.type === 'string') {
    const inputs: Record<string, string> = {}

    // Get input values recursively
    for (const input of def.inputs) {
      const edge = ctx.edges.find(
        e => e.target === node.id && e.targetHandle === input.id
      )

      if (edge) {
        const sourceNode = ctx.nodes.get(edge.source)
        if (sourceNode) {
          inputs[input.id] = compileNodeOutput(ctx, sourceNode, edge.sourceHandle, depth + 1)
        }
      } else if (node.data.properties?.[input.id] !== undefined) {
        const value = node.data.properties[input.id]
        if (typeof value === 'string') {
          inputs[input.id] = `"${value}"`
        } else {
          inputs[input.id] = String(value)
        }
      }
    }

    return def.compile ? def.compile(node, inputs) : ''
  }

  return ''
}
