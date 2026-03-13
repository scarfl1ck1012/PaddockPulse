import React, { useState } from 'react';
import { TYRE_PALETTE } from '../../utils/tyrePalette';
import { TEAM_COLOURS } from '../../utils/teamColours';
import './Learn.css';

const sections = [
  {
    title: "What is Formula 1?",
    content: "Formula 1 is the highest class of international racing for open-wheel single-seater formula racing cars. Sanctioned by the FIA, it consists of a series of races known as Grands Prix on purpose-built circuits and public roads."
  },
  {
    title: "How a Race Weekend Works",
    content: "A standard weekend: Friday has Free Practice 1 & 2 (FP1, FP2). Saturday has FP3 and Qualifying, which determines the starting grid for Sunday's Race. Sprint weekends replace some practices with a short Sprint race."
  },
  {
    title: "The Points System",
    content: "Points are awarded to the top 10 finishers: 25 for 1st, 18 for 2nd, 15 for 3rd, 12, 10, 8, 6, 4, 2, and 1. An extra point is given to the driver with the fastest lap (if they finish in the top 10)."
  },
  {
    title: "Understanding Tyres",
    isTyres: true,
    content: "Pirelli supplies F1 with dry slick tyres (Soft, Medium, Hard) and wet tyres (Intermediate, Full Wet)."
  },
  {
    title: "DRS Explained",
    content: "Drag Reduction System (DRS) is an adjustable flap on the rear wing. Opening it reduces aerodynamic drag, increasing top speed. It can only be used in designated DRS zones when a car is less than one second behind the car ahead."
  },
  {
    title: "The Undercut & Overcut",
    content: "Undercut: Pitting earlier than the car ahead to use fresh tyres to go faster and pass them while they pit later. Overcut: Staying out longer on older tyres while the car behind pits, hoping to gain time in clean air."
  },
  {
    title: "Reading Sector Times",
    content: "The track is divided into three sectors. Lap times are shown with colour codes: Purple = fastest overall sector in the session. Green = driver's personal best sector. Yellow = slower than previous best."
  },
  {
    title: "Car Parts Glossary",
    content: "Front Wing: directs air over the car. Sidepods: house the radiators for cooling. Floor: generates the majority of downforce via ground effect. Rear Wing: provides rear downforce and houses the DRS."
  },
  {
    title: "Teams & Constructors",
    isTeams: true,
    content: "There are currently 10 teams on the grid. They design their own chassis and pair it with an engine (power unit) from a supplier like Ferrari, Mercedes, Honda, or Renault."
  }
];

const quizQuestions = [
  { q: "How many points does 1st place get?", options: ["15", "18", "25", "30"], ans: 2 },
  { q: "What does DRS stand for?", options: ["Drag Reduction System", "Direct Racing Speed", "Driver Response System", "Downforce Rear Spoiler"], ans: 0 },
  { q: "Which tyre compound is the fastest but degrades quickest?", options: ["Hard", "Medium", "Soft", "Intermediate"], ans: 2 }
];

const Learn = () => {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [quizMode, setQuizMode] = useState(false);
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [quizState, setQuizState] = useState(''); // '' | 'correct' | 'wrong' | 'finished'

    const toggleAccordion = (idx) => {
        setExpandedIndex(expandedIndex === idx ? null : idx);
    };

    const handleAnswer = (optIdx) => {
        if (optIdx === quizQuestions[currentQ].ans) {
            setScore(s => s + 1);
            setQuizState('correct');
        } else {
            setQuizState('wrong');
        }

        setTimeout(() => {
            if (currentQ < quizQuestions.length - 1) {
                setCurrentQ(c => c + 1);
                setQuizState('');
            } else {
                setQuizState('finished');
            }
        }, 1000);
    };

    const restartQuiz = () => {
        setQuizMode(false);
        setCurrentQ(0);
        setScore(0);
        setQuizState('');
    }

    if (quizMode) {
        return (
            <div className="learn-page">
                <div className="learn-header">
                    <h1>F1 KNOWLEDGE QUIZ</h1>
                </div>
                <div className="quiz-container">
                    {quizState === 'finished' ? (
                        <div className="quiz-results">
                            <h2>You scored {score} / {quizQuestions.length}</h2>
                            <p>{score === quizQuestions.length ? "You're a World Champion! 🏆" : "Good effort! Keep learning. 🏎"}</p>
                            <button className="quiz-btn" onClick={restartQuiz}>Back to Guide</button>
                        </div>
                    ) : (
                        <div className="quiz-card">
                            <h3>Question {currentQ + 1} of {quizQuestions.length}</h3>
                            <p className="question-text">{quizQuestions[currentQ].q}</p>
                            
                            <div className="options-grid">
                                {quizQuestions[currentQ].options.map((opt, i) => (
                                    <button 
                                        key={opt} 
                                        className="quiz-option-btn"
                                        onClick={() => handleAnswer(i)}
                                        disabled={quizState !== ''}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            
                            {quizState && (
                                <div className={`feedback-banner ${quizState}`}>
                                    {quizState === 'correct' ? '✅ Correct!' : '❌ Incorrect!'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="learn-page">
            <div className="learn-header">
                <h1>LEARN FORMULA 1</h1>
                <p>An interactive guide to understanding the pinnacle of motorsport.</p>
            </div>

            <div className="accordion-container">
                {sections.map((sec, idx) => (
                    <div key={idx} className={`accordion-card ${expandedIndex === idx ? 'expanded' : ''}`}>
                        <div className="accordion-header" onClick={() => toggleAccordion(idx)}>
                            <h3>{sec.title}</h3>
                            <span className="expand-icon">{expandedIndex === idx ? '−' : '+'}</span>
                        </div>
                        <div className="accordion-content-outer">
                            <div className="accordion-content-inner">
                                <p>{sec.content}</p>
                                
                                {sec.isTyres && (
                                    <div className="tyre-guide">
                                        <div className="tyre-block" style={{ backgroundColor: TYRE_PALETTE.SOFT }}><span style={{color: '#fff'}}>SOFT</span></div>
                                        <div className="tyre-block" style={{ backgroundColor: TYRE_PALETTE.MEDIUM }}><span style={{color: '#000'}}>MEDIUM</span></div>
                                        <div className="tyre-block" style={{ backgroundColor: TYRE_PALETTE.HARD }}><span style={{color: '#000'}}>HARD</span></div>
                                        <div className="tyre-block" style={{ backgroundColor: TYRE_PALETTE.INTERMEDIATE }}><span style={{color: '#fff'}}>INTER</span></div>
                                        <div className="tyre-block" style={{ backgroundColor: TYRE_PALETTE.WET }}><span style={{color: '#fff'}}>WET</span></div>
                                    </div>
                                )}

                                {sec.isTeams && (
                                    <div className="team-guide">
                                        {Object.entries(TEAM_COLOURS).slice(0, 10).map(([team, col]) => (
                                            <div key={team} className="team-pill" style={{ borderLeftColor: col }}>
                                                {team}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="quiz-cta">
                <h2>Ready to test your knowledge?</h2>
                <button className="quiz-btn" onClick={() => setQuizMode(true)}>Take the Quiz →</button>
            </div>
        </div>
    );
};

export default Learn;
