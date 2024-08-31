import React, { useRef, useEffect } from 'react';

function Chat({ chatMessages, newMessage, setNewMessage, sendMessage }) {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Chat</h2>
        <div 
          className="chat-messages mb-3" 
          style={{height: '200px', overflowY: 'scroll'}}
          ref={chatContainerRef}
        >
          {chatMessages.map(msg => (
            <div key={msg.id} className="mb-2">
              <strong>{msg.sender}:</strong> {msg.message}
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
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button className="btn btn-primary" onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;