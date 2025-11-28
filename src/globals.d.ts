/**
 * Global type declarations for Akeneo PIM SDK
 */

interface PIMContext {
  get?: () => Promise<{
    productUuid?: string;
    uuid?: string;
    entityId?: string;
    id?: string;
    product?: {
      uuid?: string;
      productUuid?: string;
      id?: string;
    };
    [key: string]: unknown;
  }>;
  productUuid?: string;
  uuid?: string;
  entityId?: string;
  id?: string;
  product?: {
    uuid?: string;
    productUuid?: string;
    id?: string;
  };
  [key: string]: unknown;
}

interface PIMExternalResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
  blob: () => Promise<Blob>;
}

interface PIMSDKGlobal {
  context?: PIMContext;
  api?: {
    product_uuid?: {
      get: (params: { uuid: string }) => Promise<any>;
      save: (params: { uuid: string; body: any }) => Promise<void>;
    };
    external?: {
      call: (params: {
        method: string;
        url: string;
        credentials_code?: string;
        headers?: Record<string, string>;
        body?: FormData | string | Blob;
      }) => Promise<PIMExternalResponse>;
    };
    [key: string]: any;
  };
  [key: string]: unknown;
}

declare const PIM: PIMSDKGlobal;
