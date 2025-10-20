import TimerQuestion from "./TimerQuestion.jsx";
import React from "react";

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-6">
        <TimerQuestion />
      </div>
    </div>
  );
}
