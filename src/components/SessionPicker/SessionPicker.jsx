import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as openf1 from '../../api/openf1';
import './SessionPicker.css';

/**
 * SessionPicker — dropdown to browse different sessions
 * Shows recent meetings and their sessions (Practice, Qualifying, Race)
 *
 * Props:
 * - value: current session key (number or null)
 * - onChange: callback with new session key
 * - className: optional extra CSS class
 */
export default function SessionPicker({ value, onChange, className = '' }) {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['openf1AllSessions'],
    queryFn: () => openf1.fetchSessions(),
    staleTime: 5 * 60 * 1000,
  });

  // Group sessions by meeting
  const grouped = useMemo(() => {
    if (!sessions?.length) return [];
    const meetings = {};
    sessions.forEach(s => {
      const key = s.meeting_key || s.meeting_name || 'Unknown';
      if (!meetings[key]) meetings[key] = { name: s.meeting_name || 'Unknown Meeting', sessions: [] };
      meetings[key].sessions.push(s);
    });
    // Sort meetings by most recent and take top 5
    return Object.values(meetings)
      .map(m => ({
        ...m,
        sessions: m.sessions.sort((a, b) => new Date(b.date_start) - new Date(a.date_start)),
      }))
      .sort((a, b) => new Date(b.sessions[0]?.date_start) - new Date(a.sessions[0]?.date_start))
      .slice(0, 5);
  }, [sessions]);

  return (
    <select
      className={`session-picker ${className}`}
      value={value || 'latest'}
      onChange={e => onChange(e.target.value === 'latest' ? null : Number(e.target.value))}
      disabled={isLoading}
    >
      <option value="latest">Latest Session</option>
      {grouped.map((meeting, i) => (
        <optgroup key={i} label={meeting.name}>
          {meeting.sessions.map(s => (
            <option key={s.session_key} value={s.session_key}>
              {s.session_name} — {s.circuit_short_name || ''}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
