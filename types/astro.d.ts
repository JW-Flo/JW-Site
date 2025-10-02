// Minimal shim for astro types in test context
declare module 'astro' {
  export interface APIRouteContext<T=any> { request: Request; locals?: any; params?: Record<string,string>; }
  export type APIRoute = (ctx: APIRouteContext) => Promise<Response> | Response
}
