export class RequestManager {
  private currentRequest: AbortController | null = null;

  abort() {
    if (this.currentRequest) {
      this.currentRequest.abort();
      this.currentRequest = null;
    }
  }

  getSignal(): AbortSignal {
    this.abort(); // Cancel any previous request
    this.currentRequest = new AbortController();
    return this.currentRequest.signal;
  }
}