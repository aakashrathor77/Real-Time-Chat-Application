
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import API from "../services/api";

function Chat() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef(null);
  const selectedUserRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const currentUser = JSON.parse(
    localStorage.getItem("chatUser") || "{}"
  );

  selectedUserRef.current = selectedUser;

  // Socket Connection
  useEffect(() => {
    if (!currentUser.id) return;

    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("userOnline", currentUser.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    socket.on("onlineUsers", (onlineUserIds) => {
      setOnlineUsers(onlineUserIds.map(String));
    });

    // Receive Messages
    socket.on("newMessage", (message) => {
      const activeUser = selectedUserRef.current;

      if (!activeUser) return;

      const senderId = String(message.sender?._id || message.sender);
      const receiverId = String(message.receiver?._id || message.receiver);
      const myId = String(currentUser.id);
      const activeId = String(activeUser._id);

      const belongsToCurrentChat =
        (senderId === myId && receiverId === activeId) ||
        (senderId === activeId && receiverId === myId);

      if (belongsToCurrentChat) {
        setMessages((previousMessages) => [
          ...previousMessages,
          {
            ...message,
            _id:
              message._id ||
              `${senderId}-${message.createdAt}-${message.message}`
          }
        ]);
      }
    });

    // Receive Typing Event
    socket.on("userTyping", ({ userId }) => {
      const activeUser = selectedUserRef.current;

      console.log("Typing received from:", userId);
      console.log("Selected chat user:", activeUser?._id);

      if (
        activeUser &&
        String(userId) === String(activeUser._id)
      ) {
        console.log("Typing indicator ON");
        setIsTyping(true);
      }
    });

    // Receive Stop Typing Event
    socket.on("userStoppedTyping", ({ userId }) => {
      const activeUser = selectedUserRef.current;

      console.log("Stop typing received from:", userId);

      if (
        activeUser &&
        String(userId) === String(activeUser._id)
      ) {
        console.log("Typing indicator OFF");
        setIsTyping(false);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      clearTimeout(typingTimeoutRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser.id]);

  // Fetch Users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await API.get("/users");
      setUsers(response.data.users);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Open Chat
  const openChat = async (user) => {
    if (selectedUserRef.current) {
      socketRef.current?.emit("stopTyping", {
        receiverId: selectedUserRef.current._id
      });
    }

    clearTimeout(typingTimeoutRef.current);

    setIsTyping(false);
    setSelectedUser(user);
    setMessages([]);
    setNewMessage("");

    socketRef.current?.emit("joinChat", {
      userId: currentUser.id,
      receiverId: user._id
    });

    try {
      const response = await API.get(`/messages/${user._id}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    }
  };

  // Handle Typing
  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    const activeUser = selectedUserRef.current;

    if (!activeUser) return;

    if (!socketRef.current?.connected) {
      console.log("Socket is not connected");
      return;
    }

    if (value.trim()) {
      console.log("Typing event triggered:", activeUser._id);

      socketRef.current.emit("typing", {
        receiverId: activeUser._id
      });

      clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        console.log("Stop typing event triggered");

        socketRef.current?.emit("stopTyping", {
          receiverId: activeUser._id
        });
      }, 1000);
    } else {
      clearTimeout(typingTimeoutRef.current);

      socketRef.current.emit("stopTyping", {
        receiverId: activeUser._id
      });
    }
  };

  // Send Message
  const sendMessage = async (e) => {
    e.preventDefault();

    const activeUser = selectedUserRef.current;

    if (!newMessage.trim() || !activeUser) return;

    const messageText = newMessage.trim();

    clearTimeout(typingTimeoutRef.current);

    socketRef.current?.emit("stopTyping", {
      receiverId: activeUser._id
    });

    try {
      await API.post("/messages/send", {
        receiver: activeUser._id,
        message: messageText
      });

      socketRef.current?.emit("sendMessage", {
        sender: currentUser.id,
        receiver: activeUser._id,
        message: messageText
      });

      setNewMessage("");
      setIsTyping(false);
    } catch (error) {
      console.error("Message sending failed:", error);

      alert(
        error.response?.data?.message ||
        "Message could not be sent"
      );
    }
  };

  // Logout
  const logout = () => {
    clearTimeout(typingTimeoutRef.current);
    socketRef.current?.disconnect();

    localStorage.removeItem("chatToken");
    localStorage.removeItem("chatUser");

    window.location.href = "/";
  };

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <h2>Chat<span>Flow</span></h2>
            <p>Messages & Connections</p>
          </div>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="profile-box">
          <div className="avatar">
            {currentUser.name?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3>{currentUser.name || "User"}</h3>
            <p>My Account</p>
          </div>
        </div>

        <div className="contacts-heading">
          <h3>Messages</h3>
          <span>{users.length}</span>
        </div>

        <div className="contacts-list">
          {loading ? (
            <p className="empty-text">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="empty-text">No users found</p>
          ) : (
            users.map((user) => {
              const isOnline = onlineUsers.includes(String(user._id));

              return (
                <button
                  key={user._id}
                  className={`contact-item ${
                    selectedUser?._id === user._id ? "active" : ""
                  }`}
                  onClick={() => openChat(user)}
                >
                  <div className="avatar contact-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="contact-info">
                    <h4>{user.name}</h4>
                    <p>{isOnline ? "Online" : user.email}</p>
                  </div>

                  <span
                    className={`online-dot ${
                      isOnline ? "online" : ""
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main className="chat-main">
        {selectedUser ? (
          <>
            <header className="chat-header">
              <div className="avatar">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <h3>{selectedUser.name}</h3>
                <p>
                  {onlineUsers.includes(String(selectedUser._id))
                    ? "Online"
                    : "Offline"}
                </p>
              </div>
            </header>

            <div className="messages-area">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-icon">✉</div>
                  <h2>Start a conversation</h2>
                  <p>
                    Send your first message to {selectedUser.name}.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const senderId =
                    msg.sender?._id || msg.sender;

                  const isMine =
                    String(senderId) === String(currentUser.id);

                  return (
                    <div
                      key={msg._id || index}
                      className={`message-row ${
                        isMine ? "mine" : "theirs"
                      }`}
                    >
                      <div className="message-bubble">
                        <p>{msg.message}</p>

                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit"
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {isTyping && (
              <div className="typing-indicator">
                {selectedUser.name} is typing...
              </div>
            )}

            <form
              className="message-form"
              onSubmit={sendMessage}
            >
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={handleTyping}
              />

              <button type="submit">Send ➤</button>
            </form>
          </>
        ) : (
          <div className="welcome-chat">
            <div className="welcome-icon">💬</div>
            <h1>Your conversations</h1>
            <p>Select a contact from the left to start chatting.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Chat;
