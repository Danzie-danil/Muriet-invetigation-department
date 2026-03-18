import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function SAScrutinyView({ caseData }) {
  const instructions = [
    { id: 1, date: '2026-03-12', author: 'DPP Office', text: 'Obtain medical report (PF3) for the second victim.' },
    { id: 2, date: '2026-03-14', author: 'DPP Office', text: 'Verify the alibi of the accomplice mentioned in IO statement.' },
  ];

  return (
    <div className="u-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600 }}>State Attorney Further Instructions</h3>
        <span style={{ 
          background: '#fef3c7', color: '#92400e', padding: '4px 12px', 
          borderRadius: '20px', fontSize: '12px', fontWeight: 600 
        }}>
          Awaiting Sanctioning
        </span>
      </div>

      <div className="u-stack" style={{ gap: '12px' }}>
        {instructions.map(inst => (
          <div key={inst.id} style={{ 
            padding: '16px', background: 'white', borderLeft: '4px solid #f59e0b', 
            borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>{inst.author}</span>
              <span>{inst.date}</span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{inst.text}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--gutter-m)' }}>
        <Card>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Internal IO Reply</h4>
          <textarea placeholder="Record actions taken regarding SA instructions..." style={{ minHeight: '100px', marginBottom: '16px' }} />
          <Button variant="primary">Submit Progress to SA</Button>
        </Card>
      </div>
    </div>
  );
}
