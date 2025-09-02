import { Reminder } from '../../types';

const now = new Date();
const getFutureDate = (days: number, hours: number = 0, minutes: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hours, minutes, 0, 0);
    return date;
};


export const mockReminders: Reminder[] = [
    {
        id: '1',
        title: 'Project Alpha Deadline',
        date: getFutureDate(2, 17, 0),
        type: 'Work',
        description: 'Submit the final report and presentation slides for Project Alpha.',
        is_completed: false,
    },
    {
        id: '2',
        title: 'Dentist Appointment',
        date: getFutureDate(5, 10, 30),
        type: 'Health',
        description: 'Annual check-up and cleaning with Dr. Smith.',
        is_completed: false,
        recurrence_rule: { frequency: 'YEARLY', interval: 1 }
    },
    {
        id: '3',
        title: 'Pay Electricity Bill',
        date: getFutureDate(10, 12, 0),
        type: 'Bill Payment',
        description: 'Due amount is ₹2500. Pay via the official portal.',
        is_completed: false,
    },
    {
        id: '4',
        title: 'Mom\'s Birthday',
        date: new Date(now.getFullYear(), 8, 15, 0, 0), // Sep 15
        type: 'Birthday',
        description: 'Remember to buy a gift and a cake!',
        is_completed: false,
    },
    {
        id: '5',
        title: 'Team Lunch',
        date: getFutureDate(1, 13, 0),
        type: 'Social',
        description: 'Team lunch at "The Grand Eatery". Be there by 1 PM.',
        is_completed: true,
    },
];
