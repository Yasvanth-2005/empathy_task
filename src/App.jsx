import { Routes, Route } from "react-router-dom";
import React from "react";
import { Login, Dashboard } from "./pages";

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
};

export default App;
