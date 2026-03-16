import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const today = new Date();
today.setHours(0, 0, 0, 0);

export default function Calendar({ selectedDate, onDateSelect, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth()));
  const [selectedTime, setSelectedTime] = useState({ hour: 11, minute: 38, ampm: 'AM' });

  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      date.setHours(0, 0, 0, 0);
      days.push({ date, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      days.push({ date, isCurrentMonth: true });
    }

    const totalDays = days.length;
    const remainingCells = 42 - totalDays;

    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      date.setHours(0, 0, 0, 0);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  }, [currentMonth]);

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleDateClick = (date, isCurrentMonth) => {
    if (isCurrentMonth) {
      const newDate = new Date(date);
      const hour = selectedTime.ampm === 'PM' && selectedTime.hour !== 12 ? selectedTime.hour + 12 : 
                   selectedTime.ampm === 'AM' && selectedTime.hour === 12 ? 0 : selectedTime.hour;
      newDate.setHours(hour, selectedTime.minute);
      onDateSelect(newDate);
      onClose();
    }
  };

  const isToday = (date) => date.toDateString() === today.toDateString();
  const isSelected = (date) => date.toDateString() === selectedDate.toDateString();
  const dayHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="absolute top-full left-0 mt-1 z-50 w-80 bg-white text-gray-900 rounded-lg p-5 shadow-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={goToPrevMonth} 
            className="p-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={goToNextMonth} 
            className="p-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-gray-600 mb-2">
        {dayHeaders.map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {calendarGrid.map(({ date, isCurrentMonth }, index) => {
          const todayDate = isToday(date);
          const selected = isSelected(date);
          
          let dayClasses = "h-8 w-8 flex items-center justify-center rounded-full text-sm transition-colors";

          if (isCurrentMonth) {
            dayClasses += " cursor-pointer";
            if (selected) {
              dayClasses += " bg-blue-600 text-white font-bold";
            } else if (todayDate) {
              dayClasses += " bg-gray-200 text-gray-900";
            } else {
              dayClasses += " text-gray-900 hover:bg-gray-100";
            }
          } else {
            dayClasses += " text-gray-400"; 
          }

          return (
            <div
              key={index}
              className={dayClasses}
              onClick={() => handleDateClick(date, isCurrentMonth)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      <hr className="border-gray-200 my-4" />

      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold">Time</span>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-md">
            <input
              type="number"
              min="1"
              max="12"
              value={selectedTime.hour}
              onChange={(e) => setSelectedTime({...selectedTime, hour: parseInt(e.target.value)})}
              className="w-8 bg-transparent text-gray-900 text-center outline-none"
            />
            <span>:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={selectedTime.minute.toString().padStart(2, '0')}
              onChange={(e) => setSelectedTime({...selectedTime, minute: parseInt(e.target.value)})}
              className="w-8 bg-transparent text-gray-900 text-center outline-none"
            />
          </div>
          
          <div className="flex text-sm bg-gray-100 rounded-md p-0.5">
            <button 
              className={`px-2 py-0.5 rounded ${selectedTime.ampm === 'AM' ? 'bg-gray-300 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setSelectedTime({...selectedTime, ampm: 'AM'})}
            >
              AM
            </button>
            <button 
              className={`px-2 py-0.5 rounded ${selectedTime.ampm === 'PM' ? 'bg-gray-300 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setSelectedTime({...selectedTime, ampm: 'PM'})}
            >
              PM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}