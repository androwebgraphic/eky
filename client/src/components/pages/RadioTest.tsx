import React from 'react';

export default function RadioTest() {
  const [gender, setGender] = React.useState('male');
  return (
    <div style={{ padding: 40, background: '#fff', zIndex: 9999999, position: 'fixed', top: 0, left: 0 }}>
      <h2>Test Radio Buttons</h2>
      <label style={{ userSelect: 'auto', pointerEvents: 'auto' }}>
        <input
          type="radio"
          name="gender"
          value="male"
          checked={gender === 'male'}
          onChange={() => setGender('male')}
          style={{ userSelect: 'auto', pointerEvents: 'auto' }}
        />
        Male
      </label>
      <label style={{ userSelect: 'auto', pointerEvents: 'auto', marginLeft: 20 }}>
        <input
          type="radio"
          name="gender"
          value="female"
          checked={gender === 'female'}
          onChange={() => setGender('female')}
          style={{ userSelect: 'auto', pointerEvents: 'auto' }}
        />
        Female
      </label>
      <div style={{ marginTop: 20 }}>Selected: {gender}</div>
    </div>
  );
}
