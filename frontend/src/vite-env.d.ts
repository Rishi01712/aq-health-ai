/// <reference types="vite/client" />
/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare module '*.css' {
  const content: string;
  export default content;
}