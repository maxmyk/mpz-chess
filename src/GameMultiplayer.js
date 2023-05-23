import "./App.css";
import React, { useEffect, useState } from "react";
import WithMoveValidation from "./integrations/validator";
import { useLocation, useNavigate } from "react-router-dom";
const socket = require("./integrations/socket").socket;

const GameMultiplayer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [room_id, setRoomId] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const room_id_param = searchParams.get("room_id");

    if (!room_id_param) {
      const newRoomId = Math.floor(Math.random() * 1000000).toString();
      searchParams.set("room_id", newRoomId);
      navigate({ search: searchParams.toString() });
      setRoomId(newRoomId);
    } else {
      setRoomId(room_id_param);
    }
  }, [location.search, navigate]);

  if (!room_id) {
    return null; // Render nothing until the room_id is available
  }

  return (
    <div id="really_cool_div">
      <h1>Really cool multiplayer chess</h1>
      <div>Send this link to your friend:</div>
      <a href={window.location.href}>{window.location.href}</a>
      <div style={boardsContainer}>
        <WithMoveValidation room_id={room_id} />
      </div>
      <a href="/">Back to home</a>
    </div>
  );
};

const boardsContainer = {
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  flexWrap: "wrap",
  width: "100vw",
  marginTop: 30,
  marginBottom: 50,
};

export default GameMultiplayer;
