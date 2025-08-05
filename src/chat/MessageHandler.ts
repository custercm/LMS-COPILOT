class MessageHandler {
  private chatProvider: ChatProvider;
  private agentManager: AgentManager;

  constructor(chatProvider: ChatProvider, agentManager: AgentManager) {
    this.chatProvider = chatProvider;
    this.agentManager = agentManager;
  }

  // Process incoming messages and route to appropriate handlers
  async handleMessage(message: string): Promise<void> {
    if (message.startsWith('/')) {
      await this.handleCommand(message);
    } else {
      await this.handleChatMessage(message);
    }
  }

  private async handleCommand(command: string): Promise<void> {
    // Handle VS Code commands like /workspace, /help
  }

  private async handleChatMessage(message: string): Promise<void> {
    // Send message to LM Studio and get response
    const response = await this.agentManager.processTask(message);
    this.chatProvider.appendMessage(response);
  }
}