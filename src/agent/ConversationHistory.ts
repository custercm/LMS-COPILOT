export class ConversationHistory {
  private messages: Array<{ role: string; content: string; timestamp: Date }> =
    [];

  addMessage(role: string, content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: new Date(),
    });
  }

  getMessages(): Array<{ role: string; content: string; timestamp: Date }> {
    return this.messages;
  }

  clear(): void {
    this.messages = [];
  }
}
