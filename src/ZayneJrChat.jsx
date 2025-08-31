import { useState } from "react";
import Zaynejr from './zaynejr.json'
import './Zaynejr.css'

const Chat = () => {
 const [messages, setMessages] = useState([
    { sender: "bot", text: "Hey, I'm ZayneJr! Ask me something " }
  ]);
const [input, setInput] = useState("");
const handleSend = () => {
  if (!input.trim()) return;

  const userMessage = { sender: "user", text: input };
  setMessages((prev) => [...prev, userMessage]);

 
  const lowerInput = input.toLowerCase();

  const match = Zaynejr.find(
    (entry) =>
      lowerInput.includes(entry.question.toLowerCase()) ||
      entry.keywords?.some((kw) => lowerInput.includes(kw.toLowerCase()))
  );

  const response = match
    ? match.answer
    : "Hmm... I don’t know that yet ,try asking something else";

  const botMessage = { sender: "bot", text: response };
  setMessages((prev) => [...prev, botMessage]);
  setInput("");
};

       return ( 
        <>
        <h1 id="heading">ZayneJr</h1>
         <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${msg.sender === "bot" ? "bot" : "user"}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
        </>
     );
}
 
export default Chat;