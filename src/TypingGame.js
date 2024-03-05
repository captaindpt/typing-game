import React, { useState, useEffect } from "react";
import "./TypingGame.css";

// Separate component for displaying the sentence
const SentenceDisplay = ({ sentence, userInput, currentPosition }) => {
  return (
    <div className="sentence">
      {sentence.split(" ").map((word, index) => (
        <span key={index} className="word">
          {word.split("").map((char, charIndex) => {
            let charClasses = [];
            let absoluteIndex =
              index === 0
                ? charIndex
                : userInput.split(" ").slice(0, index).join(" ").length +
                  1 +
                  charIndex;
            if (absoluteIndex < userInput.length) {
              charClasses.push(
                userInput[absoluteIndex] === char ? "correct" : "incorrect"
              );
            }
            if (absoluteIndex === currentPosition) {
              charClasses.push("cursor-position");
            }
            return (
              <span key={charIndex} className={charClasses.join(" ")}>
                {char}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
};

// Separate component for displaying stats
const StatsDisplay = ({ wpm, accuracy }) => (
  <div className="stats-container">
    <p>Words per minute: {wpm.toFixed(2)}</p>
    <p>Accuracy: {accuracy}%</p>
  </div>
);

function TypingGame() {
  const [generatedSentence, setGeneratedSentence] = useState("");
  const [userInput, setUserInput] = useState("");
  const [currentPosition, setCurrentPosition] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [dictionary, setDictionary] = useState([]);
  const [wordsTyped, setWordsTyped] = useState(0);


  useEffect(() => {
    // Load the dictionary from the `public` directory
    fetch("/dictionary.txt")
      .then((response) => response.text())
      .then((text) => {
        const wordsArray = text.split("\n").filter(Boolean);
        setDictionary(wordsArray);
      })
      .catch((error) => {
        console.error("Failed to load dictionary:", error);
        // Display an error message or fallback to a default dictionary
        setDictionary(["apple", "banana", "cherry", "date", "elderberry"]);
      });
  }, []);

  // Moved generateRandomSentence to a separate function
  const generateRandomSentence = () => {
    let sentence = "";
    while (sentence.length < 115) {
      if (sentence.length >= 110) {
        const suitableWords = dictionary.filter(
          (word) => sentence.length + word.length + 1 <= 125
        );
        const word =
          suitableWords[Math.floor(Math.random() * suitableWords.length)];
        sentence += (sentence ? " " : "") + word;
      } else {
        const word = dictionary[Math.floor(Math.random() * dictionary.length)];
        sentence += (sentence ? " " : "") + word;
      }
    }
    return sentence;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const expectedChar = generatedSentence[currentPosition];
      const inputChar = e.key;
  
      if (inputChar === expectedChar) {
        setUserInput((prev) => prev + inputChar);
        setCurrentPosition((prev) => prev + 1);
  
        // Check if the inputChar is a space (new word)
        if (inputChar === " ") {
          setWordsTyped((prev) => prev + 1);
        }
  
        if (currentPosition + 1 === generatedSentence.length) {
          setEndTime(new Date());
        }
      } else if (inputChar.length === 1) {
        setMistakes((prev) => prev + 1);
      }
  
      if (!startTime) {
        setStartTime(new Date());
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [generatedSentence, currentPosition, startTime]);

  useEffect(() => {
    if (dictionary.length) {
      generateSentence();
    }
  }, [dictionary]);

  const generateSentence = () => {
    const sentence = generateRandomSentence();
    setGeneratedSentence(sentence);
    setUserInput("");
    setCurrentPosition(0);
    setStartTime(null);
    setEndTime(null);
    setMistakes(0);
    setWordsTyped(0);
  };

  const calculateWPM = () => {
    if (!startTime) return 0;
  
    const currentTime = endTime || new Date();
    const elapsedTime = (currentTime - startTime) / 1000 / 60; // Minutes
    const wordsPerMinute = wordsTyped / elapsedTime;
  
    return isNaN(wordsPerMinute) ? 0 : Math.round(wordsPerMinute);
  };

  const calculateSpeed = () => {
    if (!endTime || !startTime) return 0;
    const timeDiff = (endTime - startTime) / 1000; // in seconds
    const words = generatedSentence.split(" ").length;
    return (words / timeDiff) * 60; // words per minute
  };

  const calculateAccuracy = () => {
    const totalChars = userInput.length + mistakes;
    return totalChars > 0
      ? ((userInput.length / totalChars) * 100).toFixed(2)
      : "100.00";
  };

  return (
    <div className="game-container">
      <h2>Typing Speed Game</h2>
      <StatsDisplay wpm={calculateWPM()} accuracy={calculateAccuracy()} />
      <p>Type the following sentence:</p>
      <SentenceDisplay
        sentence={generatedSentence}
        userInput={userInput}
        currentPosition={currentPosition}
      />
      {endTime && (
        <div className="stats-container">
          <p>Congratulations! You've completed the sentence.</p>
        </div>
      )}
      <button onClick={generateSentence} className="button">
        Try another sentence
      </button>
    </div>
  );
}

export default TypingGame;