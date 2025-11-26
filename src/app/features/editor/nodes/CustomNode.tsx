'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { NODE_DEFINITIONS } from '@/lib/types/nodes'

export interface CustomNodeData {
  label?: string
  properties?: Record<string, any>
}

const CustomNode = ({ data, id, type }: NodeProps<CustomNodeData>) => {
  const definition = NODE_DEFINITIONS[type]

  if (!definition) {
    return (
      <div className="px-4 py-2 bg-red-100 border-2 border-red-500 rounded">
        Unknown node type: {type}
      </div>
    )
  }

  const { label, color, inputs, outputs } = definition

  return (
    <div
      className="bg-white border-2 rounded-lg shadow-lg min-w-[180px]"
      style={{ borderColor: color }}
      data-testid={`node-${type}-${id}`}
    >
      {/* Header */}
      <div
        className="px-3 py-2 text-white text-sm font-semibold rounded-t"
        style={{ backgroundColor: color }}
      >
        {data.label || label}
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-2">
        {/* Inputs */}
        {inputs.map((input, index) => (
          <div key={input.id} className="flex items-center gap-2">
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              style={{
                top: `${((index + 1) * 100) / (inputs.length + 1)}%`,
                background: input.type === 'void' ? color : '#94a3b8',
                width: '10px',
                height: '10px',
              }}
              data-testid={`node-handle-input-${input.id}`}
            />
            <span className="text-xs text-gray-700">
              {input.name}
              {input.required && <span className="text-red-500">*</span>}
            </span>
          </div>
        ))}

        {/* Node properties */}
        {definition.properties && Object.keys(definition.properties).length > 0 && (
          <div className="pt-1 border-t border-gray-200">
            {Object.entries(definition.properties).map(([key, defaultValue]) => {
              const currentValue = data.properties?.[key] ?? defaultValue
              return (
                <div key={key} className="text-xs">
                  <span className="text-gray-500">{key}:</span>
                  <span className="ml-1 font-mono text-gray-700">
                    {typeof currentValue === 'string'
                      ? `"${currentValue}"`
                      : String(currentValue)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Outputs */}
        {outputs.map((output, index) => (
          <div key={output.id} className="flex items-center justify-end gap-2">
            <span className="text-xs text-gray-700">{output.name}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              style={{
                top: `${((index + 1) * 100) / (outputs.length + 1)}%`,
                background: output.type === 'void' ? color : '#94a3b8',
                width: '10px',
                height: '10px',
              }}
              data-testid={`node-handle-output-${output.id}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(CustomNode)
