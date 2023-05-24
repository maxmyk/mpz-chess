// export NODE_OPTIONS=--openssl-legacy-provider
// Fixes ERR_OSSL_EVP_UNSUPPORTED
import React, { useState, useEffect } from "react";

const socket = require("./integrations/socket").socket;

const Statistic = () => {
  const [statistic, setStatistic] = useState("Statistic, getting data...");

  useEffect(() => {
    socket.emit("get_statistic");
    socket.on("receive_statistic", (data) => {
      setStatistic(data);
    });
    return () => {
      socket.off("receive_statistic");
    };
  }, []);

  return <div>{statistic}</div>;
};

export default Statistic;
