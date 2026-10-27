// SOLO per la verifica nell'ambiente di sviluppo senza accesso a npm (@types/react non installabile).
// Con `npm install` si usano i tipi reali: `npm run typecheck`.
declare module 'react' {
  export type ReactNode = unknown;
  export type Key = string | number;
  export type SetStateAction<S> = S | ((prev: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export interface RefObject<T> { current: T | null }
  export interface MutableRefObject<T> { current: T }
  export interface Context<T> { Provider: (p: { value: T; children?: ReactNode }) => unknown; _t?: T }
  export function useState<S>(init: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
  export function useEffect(fn: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(fn: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...a: never[]) => unknown>(fn: T, deps: readonly unknown[]): T;
  export function useRef<T>(init: T): MutableRefObject<T>;
  export function useRef<T>(init: T | null): RefObject<T>;
  export function useId(): string;
  export function createContext<T>(def: T): Context<T>;
  export function useContext<T>(c: Context<T>): T;
  export function StrictMode(p: { children?: ReactNode }): unknown;
}
declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}
declare module 'react-dom/client' {
  export function createRoot(el: Element): { render(n: unknown): void };
}
declare module '*.css';
declare namespace JSX {
  type Element = unknown;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Ev { target: any; currentTarget: any; preventDefault(): void; key?: string }
  interface Props {
    [k: string]: unknown;
    onChange?: (e: Ev) => void;
    onClick?: (e: Ev) => void;
    onSubmit?: (e: Ev) => void;
    onBlur?: (e: Ev) => void;
  }
  interface IntrinsicElements { [name: string]: Props }
  interface ElementChildrenAttribute { children: unknown }
  interface IntrinsicAttributes { key?: string | number }
}
interface ImportMeta { readonly env?: Record<string, string | undefined> }
