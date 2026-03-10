declare module "jszip" {
  interface JSZipObject {
    file(name: string): unknown | null;
    file(name: string, content: string | ArrayBuffer | Blob | Uint8Array): JSZipObject;
    generateAsync(options: { type: "blob" | "nodebuffer" | "base64" }): Promise<Blob | Buffer | string>;
  }
  interface JSZipConstructor {
    new (): JSZipObject;
  }
  const JSZip: JSZipConstructor;
  export default JSZip;
}
