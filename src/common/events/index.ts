// Reexporting events modules in a cleaner interface
export * from './events';

export { default as TypeEnum } from './TypeEnum';
import TypeEnum from './TypeEnum';

// Erases underlying events.IKind type with more specific enum
export interface IKind {
  type: TypeEnum;
}
