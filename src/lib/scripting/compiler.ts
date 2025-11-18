import { NodeGraph, ScriptNode, ScriptEdge, NODE_DEFINITIONS } from '@/lib/types/nodes'

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

/**
 * Compiles a node graph into executable JavaScript code
 */
export class NodeGraphCompiler {
  private nodes: Map<string, ScriptNode>
  private edges: ScriptEdge[]
  private errors: CompilationError[]
  private compiled: Set<string>
  private visiting: Set<string>

  constructor(graph: NodeGraph) {
    this.nodes = new Map(graph.nodes.map(n => [n.id, n]))
    this.edges = graph.edges
    this.errors = []
    this.compiled = new Set()
    this.visiting = new Set()
  }

  compile(): CompilationResult {
    this.errors = []
    this.compiled = new Set()
    this.visiting = new Set()

    // Validate graph structure
    this.validateGraph()

    if (this.errors.some(e => e.type === 'error')) {
      return {
        code: '',
        errors: this.errors,
        success: false,
      }
    }

    // Find entry point nodes (event nodes)
    const entryNodes = Array.from(this.nodes.values()).filter(node => {
      const def = NODE_DEFINITIONS[node.type]
      return def?.type === 'event'
    })

    if (entryNodes.length === 0) {
      this.errors.push({
        nodeId: '',
        message: 'No entry point found. Add an event node (e.g., "On Click" or "On Load")',
        type: 'error',
      })
      return {
        code: '',
        errors: this.errors,
        success: false,
      }
    }

    // Generate code for each entry point
    const codeSections: string[] = []

    for (const entryNode of entryNodes) {
      const code = this.compileFromNode(entryNode)
      if (code) {
        codeSections.push(code)
      }
    }

    const finalCode = codeSections.join('\n\n')

    return {
      code: finalCode,
      errors: this.errors,
      success: this.errors.filter(e => e.type === 'error').length === 0,
    }
  }

  private validateGraph(): void {
    // Check for disconnected nodes
    for (const node of this.nodes.values()) {
      const def = NODE_DEFINITIONS[node.type]
      if (!def) {
        this.errors.push({
          nodeId: node.id,
          message: `Unknown node type: ${node.type}`,
          type: 'error',
        })
        continue
      }

      // Check required inputs
      const requiredInputs = def.inputs.filter(i => i.required)
      for (const input of requiredInputs) {
        const hasConnection = this.edges.some(
          e => e.target === node.id && e.targetHandle === input.id
        )
        const hasPropertyValue = node.data.properties?.[input.id] !== undefined

        if (!hasConnection && !hasPropertyValue) {
          this.errors.push({
            nodeId: node.id,
            message: `Missing required input: ${input.name}`,
            type: 'warning',
          })
        }
      }
    }

    // Check for cycles in execution flow
    this.detectCycles()
  }

  private detectCycles(): void {
    const visited = new Set<string>()
    const recStack = new Set<string>()

    const dfs = (nodeId: string): boolean => {
      if (recStack.has(nodeId)) {
        this.errors.push({
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

      const outgoingEdges = this.edges.filter(e => e.source === nodeId)
      for (const edge of outgoingEdges) {
        if (dfs(edge.target)) {
          return true
        }
      }

      recStack.delete(nodeId)
      return false
    }

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId)
      }
    }
  }

  private compileFromNode(node: ScriptNode, depth: number = 0): string {
    if (depth > 100) {
      this.errors.push({
        nodeId: node.id,
        message: 'Maximum nesting depth exceeded',
        type: 'error',
      })
      return ''
    }

    const def = NODE_DEFINITIONS[node.type]
    if (!def) {
      return ''
    }

    // Get input values
    const inputs: Record<string, string> = {}

    for (const input of def.inputs) {
      // Check if there's a connection to this input
      const edge = this.edges.find(
        e => e.target === node.id && e.targetHandle === input.id
      )

      if (edge) {
        // Get value from connected node
        const sourceNode = this.nodes.get(edge.source)
        if (sourceNode) {
          const sourceOutput = this.compileNodeOutput(sourceNode, edge.sourceHandle, depth + 1)
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

    // Compile this node
    const nodeCode = def.compile ? def.compile(node, inputs) : ''

    // For execution flow nodes, follow the execution chain
    if (def.outputs.some(o => o.type === 'void' && o.id === 'exec')) {
      const nextEdge = this.edges.find(
        e => e.source === node.id && e.sourceHandle === 'exec'
      )

      if (nextEdge) {
        const nextNode = this.nodes.get(nextEdge.target)
        if (nextNode) {
          const nextCode = this.compileFromNode(nextNode, depth + 1)
          return nodeCode + (nextCode ? '\n' + nextCode : '')
        }
      }
    }

    // For branching nodes (if/else)
    if (node.type === 'ifElse') {
      const trueEdge = this.edges.find(
        e => e.source === node.id && e.sourceHandle === 'true'
      )
      const falseEdge = this.edges.find(
        e => e.source === node.id && e.sourceHandle === 'false'
      )

      let trueBranch = ''
      let falseBranch = ''

      if (trueEdge) {
        const trueNode = this.nodes.get(trueEdge.target)
        if (trueNode) {
          trueBranch = this.compileFromNode(trueNode, depth + 1)
        }
      }

      if (falseEdge) {
        const falseNode = this.nodes.get(falseEdge.target)
        if (falseNode) {
          falseBranch = this.compileFromNode(falseNode, depth + 1)
        }
      }

      const condition = inputs.condition || 'true'
      return `if (${condition}) {
  ${this.indentCode(trueBranch, 2)}
}${falseBranch ? ` else {
  ${this.indentCode(falseBranch, 2)}
}` : ''}`
    }

    return nodeCode
  }

  private compileNodeOutput(node: ScriptNode, outputId: string, depth: number): string {
    const def = NODE_DEFINITIONS[node.type]
    if (!def) {
      return ''
    }

    // For data nodes, just compile them directly
    if (def.type === 'data' || def.type === 'variable' || def.type === 'math' || def.type === 'string') {
      const inputs: Record<string, string> = {}

      // Get input values recursively
      for (const input of def.inputs) {
        const edge = this.edges.find(
          e => e.target === node.id && e.targetHandle === input.id
        )

        if (edge) {
          const sourceNode = this.nodes.get(edge.source)
          if (sourceNode) {
            inputs[input.id] = this.compileNodeOutput(sourceNode, edge.sourceHandle, depth + 1)
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

  private indentCode(code: string, spaces: number): string {
    const indent = ' '.repeat(spaces)
    return code.split('\n').map(line => indent + line).join('\n')
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
