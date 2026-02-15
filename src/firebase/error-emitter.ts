// Placeholder file for a Firebase error event emitter.
// The original content was lost.
type Listener = (...args: any[]) => void;

class EventEmitter {
  private listeners: { [key: string]: Listener[] } = {};

  on(event: string, listener: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }
}

const errorEmitter = new EventEmitter();
export default errorEmitter;
