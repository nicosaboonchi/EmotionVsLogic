import React, { useEffect, useState, useRef } from "react";

const NEUTRAL_QUESTION = `You can save either one close loved person (e.g., a parent you know well) or 100 unrelated people. Which do you choose?`;

export default function TimerQuestion() {
  const [prepDuration] = useState(() => (Math.random() < 0.5 ? 10 : 60));
  const [responseDuration] = useState(10);
  const [timeLeft, setTimeLeft] = useState(prepDuration);
  const [phase, setPhase] = useState("prep"); // prep | response | done
  const [canClick, setCanClick] = useState(false);
  const [choice, setChoice] = useState(null);
  const [status, setStatus] = useState("waiting"); // waiting | sending | done
  const startTimeRef = useRef(null);

  // Check if survey already submitted
  const alreadySubmitted = localStorage.getItem("survey_submitted");

  useEffect(() => {
    if (alreadySubmitted) {
      setPhase("done");
      setStatus("done");
      setCanClick(false);
      return;
    }

    startTimeRef.current = Date.now();

    if (phase === "prep") {
      const prepInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(prepInterval);
            setPhase("response");
            setCanClick(true);
            setTimeLeft(responseDuration);
            return responseDuration;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(prepInterval);
    } else if (phase === "response") {
      const respInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(respInterval);
            setCanClick(false);
            if (!choice) handleChoice("no_choice");
            setPhase("done");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(respInterval);
    }
  }, [phase, alreadySubmitted]);

  function handleChoice(value) {
    if (!canClick) return;

    const respTimeMs = Date.now() - startTimeRef.current;
    setChoice(value);
    setStatus("sending");
    setCanClick(false);

    const payload = {
      question: NEUTRAL_QUESTION,
      prep_seconds: prepDuration,
      response_seconds: responseDuration,
      choice: value,
      response_time_ms: respTimeMs,
      timestamp: new Date().toISOString(),
    };

    saveResponse(payload)
      .then(() => {
        setStatus("done");
        localStorage.setItem("survey_submitted", "true"); // Prevent resubmit
      })
      .catch((err) => {
        console.error(err);
        setStatus("done");
      });
  }

  return (
    <div>
      <div className="mb-4 p-4 rounded-lg border border-slate-100 bg-slate-50">
        <p className="text-lg">{NEUTRAL_QUESTION}</p>
      </div>

      <div className="mb-4 flex items-center justify-center">
        <div className="text-center">
          <span className="text-sm text-gray-500">
            {phase === "prep"
              ? "Get ready..."
              : phase === "response"
              ? "Time to choose!"
              : "Done"}
          </span>
          <div className="text-3xl font-mono">{timeLeft}s</div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          className={`px-4 py-3 rounded-lg w-48 ${
            canClick
              ? "bg-gray-500 hover:opacity-90 text-white"
              : "bg-gray-200 text-white cursor-not-allowed"
          }`}
          onClick={() => handleChoice("save_loved_one")}
          disabled={!canClick || status === "sending" || status === "done"}
        >
          Save loved person
        </button>

        <button
          className={`px-4 py-3 rounded-lg w-48 ${
            canClick
              ? "bg-gray-500 hover:opacity-90 text-white"
              : "bg-gray-200 text-white cursor-not-allowed"
          }`}
          onClick={() => handleChoice("save_100_strangers")}
          disabled={!canClick || status === "sending" || status === "done"}
        >
          Save 100 strangers
        </button>
      </div>

      <div className="mt-6 text-center">
        {status === "sending" && (
          <div className="text-sm text-gray-500">Saving your response…</div>
        )}
        {status === "done" && (
          <div className="text-sm text-green-600">
            {alreadySubmitted
              ? "You have already submitted the survey."
              : "Thanks — your response was recorded."}
          </div>
        )}
      </div>
    </div>
  );
}

// Placeholder: replace with your actual POST function
async function saveResponse(payload) {
  try {
    const response = await fetch("https://sheetdb.io/api/v1/ikkqtocaplg3m", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: payload }), // SheetDB expects { data: {...} }
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Failed to save response:", err);
    throw err;
  }
}
