import { Reminder, AutoReminder } from './types';

export const INITIAL_REMINDER_TYPES: string[] = [
    'Anniversary',
    'Appointment',
    'Bill Payment',
    'Birthday',
    'General',
    'Holiday',
    'Meeting',
    'Renewal',
];

export const INITIAL_REMINDERS: Reminder[] = [
    {
        id: '1',
        title: "Alice's Birthday",
        date: new Date(new Date().setDate(new Date().getDate() + 2)),
        type: 'Birthday',
        description: 'Need to buy a gift and a cake.'
    },
    {
        id: '2',
        title: "Project Phoenix Sync",
        date: new Date(new Date().setDate(new Date().getDate() + 1)),
        type: 'Meeting',
        description: 'Weekly stakeholder sync.',
        recurrenceRule: { frequency: 'WEEKLY', interval: 1 }
    },
    {
        id: '3',
        title: "Car Insurance Renewal",
        date: new Date(new Date().setDate(new Date().getDate() + 10)),
        type: 'Renewal',
        description: 'Current policy expires at the end of the month.'
    },
    {
        id: '4',
        title: "Dentist Appointment",
        date: new Date(new Date().setDate(new Date().getDate() + 5)),
        type: 'Appointment',
        description: 'Annual check-up at Dr. Smith\'s clinic.'
    }
];

export const INITIAL_SUGGESTIONS: Omit<Reminder, 'id'>[] = [
    {
        title: "Pay Netflix Bill",
        date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5),
        type: 'Bill Payment',
        description: "Suggested from your email inbox (invoice from Netflix).",
    },
    {
        title: "Laptop Warranty Expires",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 25),
        type: 'Renewal',
        description: "Suggested from a purchase receipt found in your email.",
    },
    {
        title: "Pay Monthly Rent",
        date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        type: 'Bill Payment',
        description: "Based on previous payment patterns from your SMS.",
        recurrenceRule: { frequency: 'MONTHLY', interval: 1 },
    }
];


export const INITIAL_AUTO_REMINDERS: AutoReminder[] = [
    {
        id: 'auto-1',
        title: "Pay Electricity Bill",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 20),
        type: 'Bill Payment',
        description: "Detected from your Gmail inbox (Adani Electricity invoice).",
        source: 'Gmail',
    },
    {
        id: 'auto-2',
        title: "Phone Bill Due",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
        type: 'Bill Payment',
        description: "Detected from your SMS inbox (Jio bill reminder).",
        source: 'SMS',
    }
];