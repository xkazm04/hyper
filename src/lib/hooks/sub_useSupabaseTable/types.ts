/**
 * Base interface that all service classes should implement
 */
export interface CRUDService<T, TCreate, TUpdate> {
  getAll?: () => Promise<T[]>
  getOne?: (id: string) => Promise<T>
  create?: (input: TCreate) => Promise<T>
  update?: (id: string, input: TUpdate) => Promise<T>
  delete?: (id: string) => Promise<void>
}
