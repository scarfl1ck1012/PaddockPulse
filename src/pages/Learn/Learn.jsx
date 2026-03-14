import React, { useState, useEffect, useMemo } from 'react';
import learnContent from '../../data/learnContent.json';
import './Learn.css';

// Progress tracking via localStorage
const PROGRESS_KEY = 'pp_learn_progress';

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch { return {}; }
}

function setProgress(data) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="learn-progress-bar">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-text">{completed}/{total} modules completed • {pct}%</span>
    </div>
  );
}

function TopicCard({ topic, isCompleted, onClick }) {
  return (
    <button className={`topic-card glass-card hover-lift ${isCompleted ? 'completed' : ''}`} onClick={onClick}>
      <div className="topic-icon">{topic.icon}</div>
      <h3>{topic.title}</h3>
      <p>{topic.description}</p>
      {isCompleted && <span className="topic-check">✓</span>}
    </button>
  );
}

function QuizSection({ quiz, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (qIdx, optIdx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete();
  };

  const score = Object.entries(answers).reduce((acc, [qIdx, optIdx]) => {
    return acc + (quiz[qIdx].answer === optIdx ? 1 : 0);
  }, 0);

  const allAnswered = Object.keys(answers).length === quiz.length;

  return (
    <div className="quiz-section">
      <h4>📝 Quick Quiz</h4>
      <div className="quiz-questions">
        {quiz.map((item, qIdx) => (
          <div key={qIdx} className="quiz-question">
            <p className="q-text">{qIdx + 1}. {item.q}</p>
            <div className="q-options">
              {item.options.map((opt, optIdx) => {
                const isSelected = answers[qIdx] === optIdx;
                const isCorrect = item.answer === optIdx;
                let optClass = '';
                if (submitted) {
                  if (isCorrect) optClass = 'correct';
                  else if (isSelected && !isCorrect) optClass = 'wrong';
                } else if (isSelected) {
                  optClass = 'selected';
                }
                return (
                  <button
                    key={optIdx}
                    className={`q-option ${optClass}`}
                    onClick={() => handleAnswer(qIdx, optIdx)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {!submitted ? (
        <button
          className="action-button primary quiz-submit"
          onClick={handleSubmit}
          disabled={!allAnswered}
        >
          Check Answers
        </button>
      ) : (
        <div className="quiz-result">
          <h4>Score: {score}/{quiz.length}</h4>
          <p>{score === quiz.length ? '🏆 Perfect!' : score >= quiz.length / 2 ? '👍 Great job!' : '📖 Keep learning!'}</p>
        </div>
      )}
    </div>
  );
}

function ModuleView({ topic, onBack, onComplete }) {
  return (
    <div className="module-view">
      <button className="back-btn" onClick={onBack}>← Back to Topics</button>
      
      <div className="module-header glass-card">
        <span className="module-icon">{topic.icon}</span>
        <div>
          <h2>{topic.title}</h2>
          <p className="module-desc">{topic.description}</p>
        </div>
      </div>

      {/* Content sections */}
      <div className="module-content glass-card">
        {topic.content.map((paragraph, i) => (
          <p key={i} className="content-paragraph">{paragraph}</p>
        ))}
      </div>

      {/* Video embed */}
      {topic.videoUrl && (
        <div className="module-video glass-card">
          <h4>📺 Watch & Learn</h4>
          <div className="video-container">
            <iframe
              src={topic.videoUrl}
              title={topic.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Quiz */}
      {topic.quiz && topic.quiz.length > 0 && (
        <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <QuizSection quiz={topic.quiz} onComplete={onComplete} />
        </div>
      )}
    </div>
  );
}

export default function Learn() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [progress, setProgressState] = useState(getProgress());

  const completedCount = useMemo(() => 
    learnContent.filter(t => progress[t.id]).length,
    [progress]
  );

  const markComplete = (topicId) => {
    const updated = { ...progress, [topicId]: true };
    setProgressState(updated);
    setProgress(updated);
  };

  if (selectedTopic) {
    const topic = learnContent.find(t => t.id === selectedTopic);
    if (!topic) return null;
    return (
      <div className="learn-page page-container">
        <ModuleView 
          topic={topic} 
          onBack={() => setSelectedTopic(null)}
          onComplete={() => markComplete(topic.id)}
        />
      </div>
    );
  }

  return (
    <div className="learn-page page-container">
      <div className="page-header">
        <h1 className="page-title">📚 F1 Learn</h1>
        <p className="page-subtitle">Master the fundamentals of Formula 1 racing</p>
      </div>

      <ProgressBar completed={completedCount} total={learnContent.length} />

      <section className="topics-grid">
        {learnContent.map(topic => (
          <TopicCard
            key={topic.id}
            topic={topic}
            isCompleted={!!progress[topic.id]}
            onClick={() => setSelectedTopic(topic.id)}
          />
        ))}
      </section>
    </div>
  );
}
