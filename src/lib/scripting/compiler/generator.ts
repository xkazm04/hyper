import { ScriptNode, NODE_DEFINITIONS } from '@/lib/types/nodes'
import { CompilerContext } from './types'
import { resolveNodeInputs } from './transformer'

/**
 * Generates code from a node and follows execution chain
 */
export function generateFromNode(
  ctx: CompilerContext,
  node: ScriptNode,
  depth: number = 0
): string {
  if (depth > 100) {
    ctx.errors.push({
      nodeId: node.id,
      message: 'Maximum nesting depth exceeded',
      type: 'error',
    })
    return ''
  }

  const def = NODE_DEFINITIONS[node.type]
  if (!def) return ''

  // Get input values
  const inputs = resolveNodeInputs(ctx, node, depth)

  // Compile this node
  const nodeCode = def.compile ? def.compile(node, inputs) : ''

  // For execution flow nodes, follow the execution chain
  if (def.outputs.some(o => o.type === 'void' && o.id === 'exec')) {
    const nextEdge = ctx.edges.find(
      e => e.source === node.id && e.sourceHandle === 'exec'
    )

    if (nextEdge) {
      const nextNode = ctx.nodes.get(nextEdge.target)
      if (nextNode) {
        const nextCode = generateFromNode(ctx, nextNode, depth + 1)
        return nodeCode + (nextCode ? '\n' + nextCode : '')
      }
    }
  }

  // For branching nodes (if/else)
  if (node.type === 'ifElse') {
    return generateBranchingCode(ctx, node, inputs, depth)
  }

  return nodeCode
}

/**
 * Generates code for branching (if/else) nodes
 */
function generateBranchingCode(
  ctx: CompilerContext,
  node: ScriptNode,
  inputs: Record<string, string>,
  depth: number
): string {
  const trueEdge = ctx.edges.find(
    e => e.source === node.id && e.sourceHandle === 'true'
  )
  const falseEdge = ctx.edges.find(
    e => e.source === node.id && e.sourceHandle === 'false'
  )

  let trueBranch = ''
  let falseBranch = ''

  if (trueEdge) {
    const trueNode = ctx.nodes.get(trueEdge.target)
    if (trueNode) {
      trueBranch = generateFromNode(ctx, trueNode, depth + 1)
    }
  }

  if (falseEdge) {
    const falseNode = ctx.nodes.get(falseEdge.target)
    if (falseNode) {
      falseBranch = generateFromNode(ctx, falseNode, depth + 1)
    }
  }

  const condition = inputs.condition || 'true'
  return `if (${condition}) {
  ${indentCode(trueBranch, 2)}
}${falseBranch ? ` else {
  ${indentCode(falseBranch, 2)}
}` : ''}`
}

/**
 * Indents code by a specified number of spaces
 */
export function indentCode(code: string, spaces: number): string {
  const indent = ' '.repeat(spaces)
  return code.split('\n').map(line => indent + line).join('\n')
}
