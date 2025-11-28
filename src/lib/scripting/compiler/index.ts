import { NodeGraph } from '@/lib/types/nodes'
import { CompilationResult, CompilationError, createCompilerContext } from './types'
import { validateGraph, findEntryNodes } from './parser'
import { generateFromNode } from './generator'

// Re-export types
export type { CompilationError, CompilationResult, CompilerContext } from './types'

/**
 * Compiles a node graph into executable JavaScript code
 */
export class NodeGraphCompiler {
  private graph: NodeGraph

  constructor(graph: NodeGraph) {
    this.graph = graph
  }

  compile(): CompilationResult {
    const ctx = createCompilerContext(this.graph)

    // Validate graph structure
    validateGraph(ctx)

    if (ctx.errors.some(e => e.type === 'error')) {
      return {
        code: '',
        errors: ctx.errors,
        success: false,
      }
    }

    // Find entry point nodes (event nodes)
    const entryNodeIds = findEntryNodes(ctx)

    if (entryNodeIds.length === 0) {
      return {
        code: '',
        errors: ctx.errors,
        success: false,
      }
    }

    // Generate code for each entry point
    const codeSections: string[] = []

    for (const nodeId of entryNodeIds) {
      const node = ctx.nodes.get(nodeId)
      if (node) {
        const code = generateFromNode(ctx, node)
        if (code) {
          codeSections.push(code)
        }
      }
    }

    const finalCode = codeSections.join('\n\n')

    return {
      code: finalCode,
      errors: ctx.errors,
      success: ctx.errors.filter(e => e.type === 'error').length === 0,
    }
  }
}

/**
 * Compile a node graph to JavaScript
 */
export function compileNodeGraph(graph: NodeGraph): CompilationResult {
  const compiler = new NodeGraphCompiler(graph)
  return compiler.compile()
}

/**
 * Validate a node graph without compiling
 */
export function validateNodeGraph(graph: NodeGraph): CompilationError[] {
  const compiler = new NodeGraphCompiler(graph)
  const result = compiler.compile()
  return result.errors
}
