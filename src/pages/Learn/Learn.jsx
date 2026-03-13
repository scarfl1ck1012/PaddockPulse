import React, { useState } from 'react';
import './Learn.css';

const SECTIONS = [
  { title: 'DRS (Drag Reduction System)', content: 'DRS is a movable flap on the rear wing. Drivers can activate it in designated DRS zones when they are within 1 second of the car ahead. It reduces drag and can give a speed boost of up to 15 km/h, making overtaking easier.' },
  { title: 'Tyre Compounds', content: 'Pirelli supplies three dry-weather compounds: Soft (red, fastest but least durable), Medium (yellow, balanced), and Hard (white, slowest but longest lasting). There are also Intermediate (green) and Wet (blue) rain tyres. Strategy around tyre choices is a critical factor in races.' },
  { title: 'Sectors', content: 'Every F1 circuit is divided into three sectors. Timing is measured per sector to analyse driver performance. A green sector time means a personal best, whilst a purple time means the overall fastest of anyone in that session.' },
  { title: 'The Undercut', content: 'A strategic move where a driver pits earlier than a rival to put on fresh tyres. The improved grip from new rubber allows faster laps, and the driver aims to emerge ahead of the rival after they pit later.' },
  { title: 'The Overcut', content: 'Opposite of the undercut: a driver stays out longer on worn tyres while the rival pits. If track position is valuable or the rival gets stuck in traffic, the driver staying out can gain a net advantage.' },
  { title: 'Safety Car & VSC', content: 'A Safety Car (SC) is deployed during major incidents, bunching the field together. The Virtual Safety Car (VSC) requires all drivers to reduce speed by ~40% without bunching up, used for smaller incidents. Both can dramatically alter race strategies.' },
  { title: 'Pit Stops', content: 'Teams can change all four tyres in under 2 seconds. A pit stop typically costs ~22 seconds in total pit lane time. The timing of stops is a key strategic element, and a slow stop can ruin a driver\'s race.' },
  { title: 'Qualifying Format', content: 'Qualifying has three knockout rounds: Q1 (all 20 drivers, bottom 5 eliminated), Q2 (15 drivers, bottom 5 eliminated), and Q3 (top 10 shootout for pole position). Each session has a time limit during which drivers attempt their fastest lap.' },
  { title: 'Points System', content: 'The top 10 finishers score points: 25-18-15-12-10-8-6-4-2-1. An additional point is awarded for the fastest lap, provided the driver finishes in the top 10. Sprint races award points to the top 8: 8-7-6-5-4-3-2-1.' },
  { title: 'Aerodynamics & Downforce', content: 'F1 cars generate enormous downforce (up to 5x their weight at high speed) through wings and floor design. This pushes the car onto the track for higher cornering speeds. Teams balance downforce vs drag based on each circuit\'s characteristics.' },
];

const QUIZ = [
  { q: 'How many DRS zones does a typical circuit have?', options: ['1', '2-3', '5+', 'None'], answer: 1 },
  { q: 'Which tyre compound is the softest?', options: ['Hard (White)', 'Medium (Yellow)', 'Soft (Red)', 'Intermediate (Green)'], answer: 2 },
  { q: 'How many drivers are eliminated in Q1?', options: ['3', '5', '10', '7'], answer: 1 },
  { q: 'What does the undercut involve?', options: ['Pitting later', 'Pitting earlier', 'Not pitting at all', 'Using DRS'], answer: 1 },
  { q: 'How many points does the race winner receive?', options: ['20', '25', '30', '15'], answer: 1 },
];

const AccordionItem = ({ title, content, isOpen, onClick }) => (
  <div className={`accordion-item glass-card ${isOpen ? 'open' : ''}`}>
    <button className="accordion-header" onClick={onClick}>
      <span>{title}</span>
      <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
    </button>
    {isOpen && (
      <div className="accordion-body">
        <p>{content}</p>
      </div>
    )}
  </div>
);

export default function Learn() {
  const [openIndex, setOpenIndex] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleAccordion = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const handleQuizAnswer = (qIdx, optIdx) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
  };

  const score = Object.entries(quizAnswers).reduce((acc, [qIdx, optIdx]) => {
    return acc + (QUIZ[qIdx].answer === optIdx ? 1 : 0);
  }, 0);

  return (
    <div className="learn-page page-container">
      <div className="page-header">
        <h1 className="page-title">📚 F1 Learn</h1>
        <p className="page-subtitle">Master the fundamentals of Formula 1 racing</p>
      </div>

      {/* 10 Accordion Sections */}
      <section className="accordions-section">
        {SECTIONS.map((section, idx) => (
          <AccordionItem
            key={idx}
            title={section.title}
            content={section.content}
            isOpen={openIndex === idx}
            onClick={() => handleAccordion(idx)}
          />
        ))}
      </section>

      {/* 5-Question Interactive Quiz */}
      <section className="quiz-section glass-card">
        <h2>Test Your Knowledge</h2>
        <p className="quiz-desc">Answer 5 quick questions to see how well you know F1!</p>

        <div className="quiz-questions">
          {QUIZ.map((item, qIdx) => (
            <div key={qIdx} className="quiz-question">
              <p className="q-text">{qIdx + 1}. {item.q}</p>
              <div className="q-options">
                {item.options.map((opt, optIdx) => {
                  const isSelected = quizAnswers[qIdx] === optIdx;
                  const isCorrect = item.answer === optIdx;
                  let optClass = '';
                  if (quizSubmitted) {
                    if (isCorrect) optClass = 'correct';
                    else if (isSelected && !isCorrect) optClass = 'wrong';
                  } else if (isSelected) {
                    optClass = 'selected';
                  }

                  return (
                    <button
                      key={optIdx}
                      className={`q-option ${optClass}`}
                      onClick={() => handleQuizAnswer(qIdx, optIdx)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!quizSubmitted ? (
          <button
            className="action-button primary quiz-submit"
            onClick={handleSubmitQuiz}
            disabled={Object.keys(quizAnswers).length < QUIZ.length}
          >
            Submit Quiz
          </button>
        ) : (
          <div className="quiz-result">
            <h3>Your Score: {score}/{QUIZ.length}</h3>
            <p>{score === QUIZ.length ? '🏆 Perfect! You\'re an F1 expert!' : score >= 3 ? '👍 Great job! Keep learning!' : '📖 Keep studying, you\'ll get there!'}</p>
          </div>
        )}
      </section>
    </div>
  );
}
