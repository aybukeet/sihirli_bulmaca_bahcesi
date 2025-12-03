export const speak = (text) => {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "tr-TR";
  utterance.rate = 0.85;
  utterance.pitch = 1.35;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const softFemaleTr = voices.find(v =>
    v.lang === "tr-TR" && (
      v.name.includes("Female") ||
      v.name.includes("Kadın") ||
      v.name.includes("Soft") ||
      v.name.includes("Google") ||
      v.name.includes("Yelda") ||
      v.name.includes("Samantha")
    )
  );
  
  if (softFemaleTr) {
    utterance.voice = softFemaleTr;
  }

  window.speechSynthesis.speak(utterance);
};