// Placeholder file for custom Firebase errors.
// The original content was lost.
export class CustomFirebaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomFirebaseError";
  }
}
