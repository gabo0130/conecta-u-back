import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  traceId: string;
}

const storage = new AsyncLocalStorage<RequestContextStore>();

// Contexto compartido a través de toda la cadena async de una misma
// petición (controller -> use-case -> repositorio), sin tener que pasar
// el traceId a mano por cada función. Node no tiene hilos por request;
// esto es el equivalente correcto para ese caso de uso.
export class RequestContext {
  static run<T>(store: RequestContextStore, callback: () => T): T {
    return storage.run(store, callback);
  }

  static get traceId(): string | undefined {
    return storage.getStore()?.traceId;
  }
}
