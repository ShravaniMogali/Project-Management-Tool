import React, { useRef, useEffect } from 'react';

function Chat({ chatMessages, newMessage, setNewMessage, sendMessage }) {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Sort messages by timestamp
  const sortedMessages = [...chatMessages].sort((a, b) => 
    a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime()
  );

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Chat</h2>
        <div 
          className="chat-messages mb-3" 
          style={{height: '200px', overflowY: 'scroll'}}
          ref={chatContainerRef}
        >
          {sortedMessages.map(msg => (
            <div key={msg.id} className="mb-2">
              <strong>{msg.sender}:</strong> {msg.message}
              <br />
              <small className="text-muted ml-2">
                {msg.timestamp.toDate().toLocaleString()}
              </small>
            </div>
          ))}
        </div>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button className="btn btn-primary" onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;