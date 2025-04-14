import { Routes, Route } from "react-router-dom";
import React from "react";
import { Login, Dashboard } from "./pages";

const App = () => {
  return (
    <div className="min-h-[90vh]">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
};

export default App;
