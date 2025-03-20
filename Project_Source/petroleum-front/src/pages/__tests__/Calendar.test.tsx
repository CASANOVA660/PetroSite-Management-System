import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Calendar from '../Calendar';
import authReducer from '../../store/slices/authSlice';

// Mock FullCalendar components
jest.mock('@fullcalendar/react', () => ({
    __esModule: true,
    default: () => <div data-testid="fullcalendar">Calendar Mock</div>
}));

jest.mock('@fullcalendar/daygrid', () => ({
    __esModule: true,
    default: jest.fn()
}));

jest.mock('@fullcalendar/timegrid', () => ({
    __esModule: true,
    default: jest.fn()
}));

jest.mock('@fullcalendar/interaction', () => ({
    __esModule: true,
    default: jest.fn()
}));

const mockEvents = [
    // ... existing code ...
];