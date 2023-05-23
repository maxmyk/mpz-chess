import React from "react";
import io from "socket.io-client";
import { useState } from "react";

const socket = io.connect("http://10.10.241.217:3001");

const Statistic = () => {
  const sendMessage = () => {
    socket.emit("send_message", { message });
  };

  const [room, setRoom] = useState("");

  const [message, setMessage] = useState("");
  // const [messageReceived, setMessageReceived] = useState("");

  const joinRoom = () => {
    if (room !== "") {
      socket.emit("join_room", room);
    }
  };

  return (
    <div>
      <input
        placeholder="Room Number..."
        onChange={(event) => {
          setRoom(event.target.value);
        }}
      />
      <button onClick={joinRoom}> Join Room</button>
      <div>
        <input
          placeholder="Message..."
          onChange={(event) => {
            setMessage(event.target.value);
          }}
        />
        <button onClick={sendMessage}> Send Message</button>
      </div>
    </div>
  );
};

export default Statistic;
