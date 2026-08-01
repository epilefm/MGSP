import React, { useState } from 'react';

const CustomDatePicker = ({ value, onChange }) => {
    const [selectedDate, setSelectedDate] = useState(value || '');

    const handleDateChange = (e) => {
        const dateValue = e.target.value;
        setSelectedDate(dateValue);
        if (onChange) {
            onChange(dateValue);
        }
    };

    return (
        <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            style={{ width: 120, padding: '4px' }}
        />
    );
};

export default CustomDatePicker;
