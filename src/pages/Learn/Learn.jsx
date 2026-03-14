import React, { useState, useEffect, useMemo } from 'react';
import learnData from '../../data/learnContent.json';
import './Learn.css';

const modules = learnData.modules;
const PROGRESS_KEY = 'paddockpulse_learn_progress';

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { completedModules: [], quizScores: {} };
  } catch { return { completedModules: [], quizScores: {} }; }
}

function saveProgress(data) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(data)); } catch {}
}

// --- Components ---

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

function FactCard({ text }) {
  return (
    <div className="fact-card">
      <span className="fact-icon">💡</span>
      <p>{text}</p>
    </div>
  );
}

function QuizBlock({ quizzes, onScoreUpdate }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (qIdx, optIdx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const score = quizzes.reduce((acc, q, i) =>
      acc + (answers[i] === q.correct ? 1 : 0), 0);
    onScoreUpdate(score, quizzes.length);
  };

  const allAnswered = Object.keys(answers).length === quizzes.length;
  const score = quizzes.reduce((acc, q, i) =>
    acc + (answers[i] === q.correct ? 1 : 0), 0);

  return (
    <div className="quiz-section">
      <h4>📝 Knowledge Check</h4>
      <div className="quiz-questions">
        {quizzes.map((q, qIdx) => (
          <div key={qIdx} className="quiz-question">
            <p className="q-text">{qIdx + 1}. {q.question}</p>
            <div className="q-options">
              {q.options.map((opt, optIdx) => {
                const isSelected = answers[qIdx] === optIdx;
                const isCorrect = q.correct === optIdx;
                let cls = '';
                if (submitted) {
                  if (isCorrect) cls = 'correct';
                  else if (isSelected && !isCorrect) cls = 'wrong';
                } else if (isSelected) cls = 'selected';
                return (
                  <button key={optIdx} className={`q-option ${cls}`} onClick={() => handleAnswer(qIdx, optIdx)}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <p className="q-explanation">{q.explanation}</p>
            )}
          </div>
        ))}
      </div>
      {!submitted ? (
        <button className="action-button primary quiz-submit" onClick={handleSubmit} disabled={!allAnswered}>
          Check Answers
        </button>
      ) : (
        <div className="quiz-result">
          <h4>Score: {score}/{quizzes.length}</h4>
          <p>{score === quizzes.length ? '🏆 Perfect!' : score >= quizzes.length / 2 ? '👍 Great job!' : '📖 Keep learning!'}</p>
        </div>
      )}
    </div>
  );
}

function ModuleView({ mod, onBack, onComplete }) {
  const quizzes = mod.sections.filter(s => s.type === 'quiz');
  const textSections = mod.sections.filter(s => s.type === 'text' || s.type === 'fact');

  const handleScoreUpdate = (score, total) => {
    onComplete(score, total);
  };

  return (
    <div className="module-view">
      <button className="back-btn" onClick={onBack}>← Back to Topics</button>

      <div className="module-header glass-card">
        <span className="module-icon">{mod.icon}</span>
        <div>
          <div className="module-meta">
            {mod.isNew2026 && <span className="new-2026-badge">NEW 2026</span>}
            <span className="category-badge">{mod.category}</span>
            <span className="difficulty-badge">{mod.difficulty}</span>
            <span className="read-time">{mod.readTime}</span>
          </div>
          <h2>{mod.title}</h2>
          <p className="module-desc">{mod.subtitle}</p>
        </div>
      </div>

      {/* Content sections */}
      <div className="module-content glass-card">
        {textSections.map((section, i) => {
          if (section.type === 'fact') return <FactCard key={i} text={section.text} />;
          return <p key={i} className="content-paragraph">{section.content}</p>;
        })}
      </div>

      {/* Video embed */}
      {mod.videoId && (
        <div className="module-video glass-card">
          <h4>📺 Watch & Learn</h4>
          <div className="video-container">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${mod.videoId}?rel=0&modestbranding=1`}
              title={mod.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Quizzes */}
      {quizzes.length > 0 && (
        <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <QuizBlock quizzes={quizzes} onScoreUpdate={handleScoreUpdate} />
        </div>
      )}
    </div>
  );
}

function TopicCard({ mod, isCompleted, quizScore, onClick }) {
  return (
    <button className={`topic-card glass-card hover-lift ${isCompleted ? 'completed' : ''}`} onClick={onClick}>
      {mod.isNew2026 && <span className="card-new-badge">2026</span>}
      <div className="topic-icon">{mod.icon}</div>
      <h3>{mod.title}</h3>
      <p>{mod.subtitle}</p>
      <div className="card-meta">
        <span className="meta-category">{mod.category}</span>
        <span className="meta-time">{mod.readTime}</span>
      </div>
      {isCompleted && <span className="topic-check">✓</span>}
      {quizScore && <span className="quiz-score-badge">{quizScore}</span>}
    </button>
  );
}

// --- Main ---

export default function Learn() {
  const [selectedModule, setSelectedModule] = useState(null);
  const [progress, setProgress] = useState(getProgress());
  const [filterCategory, setFilterCategory] = useState('All');

  const completedCount = useMemo(() => progress.completedModules.length, [progress]);

  const categories = useMemo(() => {
    const cats = new Set(modules.map(m => m.category));
    return ['All', ...cats];
  }, []);

  const filteredModules = useMemo(() => {
    if (filterCategory === 'All') return modules;
    return modules.filter(m => m.category === filterCategory);
  }, [filterCategory]);

  const markComplete = (modId, score, total) => {
    const updated = { ...progress };
    if (!updated.completedModules.includes(modId)) {
      updated.completedModules = [...updated.completedModules, modId];
    }
    if (score !== undefined) {
      updated.quizScores = { ...updated.quizScores, [modId]: `${score}/${total}` };
    }
    setProgress(updated);
    saveProgress(updated);
  };

  if (selectedModule) {
    const mod = modules.find(m => m.id === selectedModule);
    if (!mod) return null;
    return (
      <div className="learn-page page-container">
        <ModuleView
          mod={mod}
          onBack={() => setSelectedModule(null)}
          onComplete={(score, total) => markComplete(mod.id, score, total)}
        />
      </div>
    );
  }

  return (
    <div className="learn-page page-container">
      <div className="page-header">
        <h1 className="page-title">📚 F1 Learn</h1>
        <p className="page-subtitle">Master the fundamentals of Formula 1 — updated for 2026</p>
      </div>

      <ProgressBar completed={completedCount} total={modules.length} />

      {/* Category filter */}
      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-chip ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="topics-grid">
        {filteredModules.map(mod => (
          <TopicCard
            key={mod.id}
            mod={mod}
            isCompleted={progress.completedModules.includes(mod.id)}
            quizScore={progress.quizScores[mod.id]}
            onClick={() => setSelectedModule(mod.id)}
          />
        ))}
      </section>
    </div>
  );
}
