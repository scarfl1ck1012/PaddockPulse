import React, { useState } from 'react';
import useLiveStore from '../../../store/liveStore';
import './RaceControlPanel.css';

// Formats a date string to just time (HH:mm)
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Simple tag generator based on message content
const getMessageTag = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('safety car') || msg.includes('vsc')) return { class: 'sc', label: 'SAFETY CAR' };
  if (msg.includes('flag')) {
    if (msg.includes('red')) return { class: 'flag-red', label: 'RED FLAG' };
    if (msg.includes('yellow')) return { class: 'flag-yellow', label: 'YELLOW FLAG' };
    if (msg.includes('green')) return { class: 'flag-green', label: 'GREEN FLAG' };
  }
  if (msg.includes('penalty')) return { class: 'penalty', label: 'PENALTY' };
  if (msg.includes('drs')) return { class: 'drs', label: 'DRS' };
  return { class: 'info', label: 'INFO' };
};

export default function RaceControlPanel() {
  const { raceControlMessages, teamRadios } = useLiveStore();
  const [activeTab, setActiveTab] = useState('control'); // 'control' or 'radio'

  return (
    <div className="race-control-panel flex-col h-full">
      {/* Tabs */}
      <div className="feed-tabs">
        <button 
          className={`tab-btn ${activeTab === 'control' ? 'active' : ''}`}
          onClick={() => setActiveTab('control')}
        >
          RACE CONTROL
        </button>
        <button 
          className={`tab-btn ${activeTab === 'radio' ? 'active' : ''}`}
          onClick={() => setActiveTab('radio')}
        >
          TEAM RADIO
        </button>
      </div>

      {/* Feed Content */}
      <div className="feed-scrollable-content">
        
        {/* RACE CONTROL VIEW */}
        {activeTab === 'control' && (
          <div className="message-list">
            {raceControlMessages.length === 0 ? (
              <div className="feed-empty">No messages yet...</div>
            ) : (
              raceControlMessages.map((msg, idx) => {
                const tag = getMessageTag(msg.message);
                return (
                  <div key={idx} className="message-item slide-in">
                    <div className="msg-header">
                      <span className="msg-time">{formatTime(msg.date)}</span>
                      <span className={`msg-tag ${tag.class}`}>{tag.label}</span>
                    </div>
                    <div className="msg-body">{msg.message}</div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TEAM RADIO VIEW */}
        {activeTab === 'radio' && (
          <div className="message-list">
            {teamRadios.length === 0 ? (
              <div className="feed-empty">No radio transmissions...</div>
            ) : (
              teamRadios.map((radio, idx) => (
                <div key={idx} className="radio-item slide-in">
                  <div className="radio-header">
                    <span className="radio-time">{formatTime(radio.date)}</span>
                    <span className="radio-driver">Car {radio.driver_number}</span>
                  </div>
                  <div className="radio-audio-container">
                    {/* Native audio player, styled transparently */}
                    <audio controls controlsList="nodownload noplaybackrate">
                      <source src={radio.recording_url} type="audio/mpeg" />
                      Your browser does not support audio.
                    </audio>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
