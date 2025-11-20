declare module 'mssql' {
  export interface IConnectionConfig {
    user?: string;
    password?: string;
    server?: string;
    port?: number;
    database?: string;
    connectionTimeout?: number;
    requestTimeout?: number;
    cancelTimeout?: number;
    pool?: {
      max?: number;
      min?: number;
      idleTimeoutMillis?: number;
    };
    options?: {
      encrypt?: boolean;
      trustServerCertificate?: boolean;
    };
  }

  export class ConnectionPool {
    constructor(config: IConnectionConfig);
    connect(): Promise<ConnectionPool>;
    close(): Promise<void>;
    request(): Request;
  }

  export class Request {
    input(name: string, type: any, value: any): Request;
    query(sql: string): Promise<IResult<any>>;
  }

  export interface IResult<T> {
    recordset: T[];
    recordsets: T[][];
    rowsAffected: number[];
    output?: any;
  }

  export const Int: any;
  export const NVarChar: any;
  export const Bit: any;
  export const DateTime: any;
}
