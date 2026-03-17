import React from 'react';
import ReactSelect from 'react-select';

export default function Select({ options, value, onChange, placeholder, isError, className, isSearchable = false }) {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '44px',
      borderRadius: '8px',
      border: isError ? '1px solid var(--danger-color)' : '1px solid var(--border-color)',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(39, 73, 119, 0.1)' : 'none',
      '&:hover': { border: isError ? '1px solid var(--danger-color)' : '1px solid var(--border-color)' },
      backgroundColor: 'var(--bg-surface)',
      cursor: 'pointer'
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 16px',
    }),
    input: (provided) => ({ 
      ...provided, 
      margin: '0px',
      padding: '0px',
      color: 'var(--text-primary)',
      border: 'none',
      boxShadow: 'none',
      outline: 'none',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--text-primary)',
      fontWeight: 500,
      fontSize: '14px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--text-muted)',
      fontWeight: 400,
      fontSize: '14px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? 'var(--primary-color)' 
        : state.isFocused 
          ? 'var(--bg-surface-active)' 
          : 'transparent',
      color: state.isSelected ? 'white' : 'var(--text-primary)',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      padding: '10px 16px',
      '&:active': {
        backgroundColor: 'var(--primary-color)',
        color: 'white'
      }
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '8px',
      boxShadow: 'var(--shadow-modal)',
      border: '1px solid var(--border-color)',
      zIndex: 9999,
      overflow: 'hidden',
      marginTop: '4px'
    }),
    menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
    menuList: (provided) => ({
      ...provided,
      padding: '4px'
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? 'var(--primary-color)' : 'var(--text-muted)',
      padding: '0 12px',
      '&:hover': {
        color: 'var(--primary-color)'
      }
    })
  };

  const selectedOption = options.find(op => op.value === value) || null;

  return (
    <div className={`custom-select-wrapper ${className || ''}`} style={{ width: '100%' }}>
      <ReactSelect
        options={options}
        value={selectedOption}
        onChange={(option) => onChange(option ? option.value : '')}
        placeholder={placeholder}
        styles={customStyles}
        classNamePrefix="react-select"
        isClearable={false}
        isSearchable={isSearchable}
        menuPortalTarget={document.body}
        menuPosition={'fixed'}
      />
    </div>
  );
}
