import tkinter as tk
from tkinter import ttk
import asyncio
import websockets
import threading
import json
import time
import os
from pathlib import Path

class ProfessionalChatApp:
    def __init__(self, root):
        self.root = root
        self.messages = []
        self.chat_history = []

        # WebSocket connection state
        self.websocket_server = None
        self.is_connected = False
        
        # Workspace for file uploads
        self.workspace_root = "./workspace"
        self.workspace_files = {}
        
        # Configure window properties
        self.root.title("GitHub Copilot Replica")
        self.root.geometry("800x600")
        self.root.configure(bg="#1e1e1e")  # Dark theme background

        # Create UI elements
        self.create_widgets()

    def create_widgets(self):
        """Create the main chat interface widgets"""
        # Chat display area
        self.chat_display = tk.Text(
            self.root,
            bg="#2d2d30",
            fg="#cccccc",
            font=("Consolas", 12),
            wrap=tk.WORD,
            state=tk.DISABLED
        )
        self.chat_display.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Scrollbar for chat display
        scrollbar = tk.Scrollbar(self.root, command=self.chat_display.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.chat_display.configure(yscrollcommand=scrollbar.set)

        # Input area with entry and send button
        input_frame = tk.Frame(self.root, bg="#1e1e1e")
        input_frame.pack(fill=tk.X, padx=10, pady=5)

        self.message_entry = tk.Entry(
            input_frame,
            bg="white",
            fg="#2c3e50",
            font=("Consolas", 12),
            relief=tk.FLAT
        )
        self.message_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=5)

        send_button = tk.Button(
            input_frame,
            text="Send",
            bg="#3498db",
            fg="white",
            command=self.send_message,
            relief=tk.FLAT
        )
        send_button.pack(side=tk.RIGHT, padx=(5, 0))

        # Connect button for WebSocket
        self.connect_button = tk.Button(
            input_frame,
            text="Connect",
            bg="#27ae60",
            fg="white",
            command=self.toggle_connection,
            relief=tk.FLAT
        )
        self.connect_button.pack(side=tk.RIGHT, padx=(5, 0))

        # Typing indicator
        self.typing_indicator = tk.Label(input_frame, text="", bg="#1e1e1e", fg="#cccccc")
        self.typing_indicator.pack(side=tk.LEFT, fill=tk.X, expand=True)

        # Add styling for copy/edit/regenerate buttons on hover
        self.chat_display.tag_config("hover", background="#3a3d41")

        # Message timestamp configuration
        self.chat_display.tag_config("timestamp", foreground="#888888")

        # Code block styling with syntax highlighting
        self.chat_display.tag_config("code_block", background="#252526", foreground="#cccccc")

        # Add copy/edit/regenerate button styles on hover
        self.chat_display.tag_config("button_hover", background="#3a3d41")

        # Create a frame for buttons to be shown on hover
        self.button_frame = tk.Frame(self.root, bg="#252526")

        # Button styling with GitHub Copilot colors (red for approval/rejection actions)
        self.approval_button_style = {"fg": "white", "bg": "#e74c3c"}

        # Configure diff panel style
        self.chat_display.tag_config("diff_panel", background="#2d2d30")

        # Add styling for reactions and feedback buttons
        self.chat_display.tag_config("reaction_button", foreground="#cccccc", background="#252526")
        
    def toggle_connection(self):
        """Toggle WebSocket connection state"""
        if not self.is_connected:
            self.start_websocket_server()
        else:
            self.disconnect_websocket()

    def start_websocket_server(self):
        """Initialize the WebSocket server in a separate thread"""
        # Update button text
        self.connect_button.config(text="Disconnect")
        
        # Start WebSocket server in background thread
        websocket_thread = threading.Thread(target=self._run_websocket_server, daemon=True)
        websocket_thread.start()
        
        self.is_connected = True
        
    def _run_websocket_server(self):
        """Run the WebSocket server in a new event loop"""
        # Create a new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def handle_client(websocket, path):
            try:
                # Handle messages from client (user input)
                async for message in websocket:
                    data = json.loads(message)
                    
                    if 'type' in data and data['type'] == 'message':
                        user_message = data.get('content', '')
                        
                        # Add to chat history
                        self.add_user_message(user_message)
                        
                        # Check if message contains media files
                        if 'media' in data:
                            # Process uploaded images/files
                            for file_data in data['media']:
                                # Save file to workspace
                                await self.save_uploaded_file(file_data)
                        
                        # Simulate bot response with streaming (in real app, connect to backend)
                        await self.stream_bot_response(user_message, websocket)
                    elif 'type' in data and data['type'] == 'file_upload':
                        # Handle direct file uploads
                        await self.handle_file_upload(data)
                    elif 'type' in data and data['type'] == 'thumbnail_request':
                        # Generate thumbnail for uploaded files
                        file_path = data.get('filePath', '')
                        thumbnail_data = await self.generate_thumbnail(file_path)
                        await websocket.send(json.dumps({
                            'type': 'thumbnail_response',
                            'data': thumbnail_data,
                            'filePath': file_path
                        }))
            except websockets.exceptions.ConnectionClosed:
                pass
        
        start_server = websockets.serve(handle_client, "localhost", 8765)
        
        # Run the server in this new event loop
        try:
            loop.run_until_complete(start_server)
            loop.run_forever()
        finally:
            loop.close()

    def disconnect_websocket(self):
        """Disconnect WebSocket connection"""
        self.connect_button.config(text="Connect")
        self.is_connected = False

    async def stream_bot_response(self, user_message, websocket):
        """Stream bot response to client via WebSocket"""
        # Simulate processing delay
        await asyncio.sleep(0.5)
        
        # Stream response chunks (simulated streaming)
        response_chunks = [
            "Processing your request...",
            "\nAnalyzing code structure...",
            "\nGenerating solution...",
            "\nHere's the complete implementation:\n\n```python\n",
            "def example_function():\n    # Your code here\n    pass\n\n# Additional code\nprint('Hello World')\n```"
        ]
        
        for chunk in response_chunks:
            await websocket.send(json.dumps({
                "type": "response_chunk",
                "content": chunk
            }))
            await asyncio.sleep(0.1)  # Simulate streaming delay
            
        # Send message end indicator
        await websocket.send(json.dumps({
            "type": "response_end",
            "content": ""
        }))

    def add_user_message(self, message):
        """Add a user message to the chat"""
        self.messages.append({"role": "user", "content": message})
        self.chat_display.config(state=tk.NORMAL)
        self.chat_display.insert(tk.END, f"User: {message}\n\n", "user")
        self.chat_display.config(state=tk.DISABLED)

    def add_bot_message(self, message):
        """Add a bot message to the chat"""
        self.messages.append({"role": "assistant", "content": message})
        self.chat_display.config(state=tk.NORMAL)
        self.chat_display.insert(tk.END, f"Bot: {message}\n\n", "bot")
        self.chat_display.config(state=tk.DISABLED)

    def add_system_message(self, message):
        """Add a system message to the chat"""
        self.messages.append({"role": "system", "content": message})
        self.chat_display.config(state=tk.NORMAL)
        self.chat_display.insert(tk.END, f"System: {message}\n\n", "system")
        self.chat_display.config(state=tk.DISABLED)

    def send_message(self, event=None):
        """Handle sending a message"""
        user_input = self.message_entry.get()
        if user_input:
            # Add to chat history
            self.add_user_message(user_input)
            
            # Clear input field
            self.message_entry.delete(0, tk.END)
            
            # Simulate bot response in a separate thread to avoid blocking UI
            typing_thread = threading.Thread(target=self._simulate_typing_and_response, args=(user_input,))
            typing_thread.daemon = True
            typing_thread.start()
    
    def _simulate_typing_and_response(self, user_message):
        """Simulate typing indicator and bot response in a separate thread"""
        # Show typing indicator
        self.root.after(0, lambda: self.typing_indicator.config(text="Bot is typing..."))
        
        # Simulate delay for typing
        time.sleep(1)
        
        # Update UI with response on main thread
        self.root.after(0, lambda: self._update_with_bot_response(user_message))
        
    def _update_with_bot_response(self, user_message):
        """Update the chat display with bot's response"""
        responses = [
            "I can help you with that. What specific task are we working on?",
            "Based on your project structure, here's what I recommend...",
            "Let me analyze your code and provide better suggestions.",
            "Here's how you might implement this feature:"
        ]
        
        # Clear typing indicator
        self.typing_indicator.config(text="")
        
        # Add bot response to chat
        self.add_bot_message(responses[0])

    async def save_uploaded_file(self, file_data):
        """Save uploaded media files to workspace"""
        filename = file_data.get('name', 'unknown')
        content = file_data.get('content', '')
        file_type = file_data.get('type', 'text/plain')
        
        # Determine file path based on type
        if file_type.startswith('image'):
            file_path = os.path.join(self.workspace_root, 'media', filename)
        else:
            file_path = os.path.join(self.workspace_root, filename)
        
        # Create directories if needed
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save file content
        with open(file_path, 'w') as f:
            f.write(content)

    async def handle_file_upload(self, data):
        """Process direct file upload messages"""
        file_content = data.get('content', '')
        file_name = data.get('name', 'file')
        
        # Save to workspace
        save_path = os.path.join(self.workspace_root, file_name)
        with open(save_path, 'w') as f:
            f.write(file_content)

    async def generate_thumbnail(self, file_path):
        """Generate thumbnail for media files (simplified implementation)"""
        # For now just return placeholder data - in real app this would process images
        return {
            'thumbnail_url': f'/thumbnails/{Path(file_path).name}.thumb',
            'size': '100x100'
        }

if __name__ == "__main__":
    root = tk.Tk()
    app = ProfessionalChatApp(root)
    root.mainloop()