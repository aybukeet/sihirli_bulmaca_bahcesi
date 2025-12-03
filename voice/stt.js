export const startSTT = (onResult) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn("Speech API not supported");
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'tr-TR';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let isRunning = false;

  recognition.onstart = () => {
    isRunning = true;
  };

  recognition.onend = () => {
    isRunning = false;
    // Auto-restart for "always listening" behavior
    try {
        if (recognition && !isRunning) recognition.start();
    } catch (e) {
        // ignore
    }
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (onResult) {
      onResult({ interim: interimTranscript, final: finalTranscript });
    }
  };

  recognition.onerror = (event) => {
    console.log("STT Error:", event.error);
    if (event.error === 'not-allowed') {
        // User blocked mic
    }
  };

  try {
    recognition.start();
  } catch (e) {
    console.error(e);
  }

  return recognition;
};

export const stopSTT = (recognition) => {
  if (recognition) {
    recognition.onend = null; // Prevent auto-restart
    recognition.stop();
  }
};