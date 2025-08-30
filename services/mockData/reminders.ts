// This file is auto-generated to provide a rich dataset for the app demo.
import { Reminder } from '../../types';
const MOCK_USER_ID = 'mock-user-123';

const reminderTemplates = [
    { type: 'Finance', title: 'Pay Credit Card Bill', description: 'Bill for {Bank} card ending in {RND4} is due.' },
    { type: 'Health', title: 'Doctor Appointment', description: 'Follow-up with Dr. {Name} at {Location} Clinic.' },
    { type: 'Personal', title: 'Call {FamilyMember}', description: 'Catch up with {FamilyMember}.' },
    { type: 'Work', title: 'Project {ProjectName} Deadline', description: 'Final submission for {ProjectName} project.' },
    { type: 'Home', title: 'Water the plants', description: 'The green ones are looking thirsty.' },
    { type: 'Social', title: 'Birthday: {Name}', description: 'Don\'t forget to wish {Name} a happy birthday!' },
    { type: 'Renewal', title: 'Renew Car Insurance', description: 'Policy with {Insurance} expires soon.' },
    { type: 'Shopping', title: 'Buy groceries', description: 'Need milk, bread, and {Fruit}.' },
    { type: 'Fitness', title: 'Go for a run', description: '30-minute jog in the park.' },
    { type: 'Hobby', title: 'Practice Guitar', description: 'Learn the new chords for {Song}.' },
    { type: 'Travel', title: 'Book flights to {City}', description: 'Plan the upcoming trip.' },
    { type: 'Appointment', title: 'Dentist Check-up', description: 'Annual cleaning and check-up.' },
    { type: 'Bill Payment', title: 'Pay Electricity Bill', description: 'Avoid the late fee.' },
    { type: 'Personal Goal', title: 'Read a chapter', description: 'Continue reading "{Book}".' },
    { type: 'Event', title: 'Concert: {Band}', description: 'The show starts at 8 PM.' },
    { type: 'Anniversary', title: 'Wedding Anniversary', description: 'Celebrate with {SpouseName}.' },
    { type: 'Car Maintenance', title: 'Service {CarModel}', description: 'Regular 6-month servicing for the car.' },
    { type: 'Pet Care', title: 'Vet appointment for {PetName}', description: 'Annual check-up and vaccinations for {PetName}.' },
    { type: 'Learning', title: 'Learn {Skill}', description: 'Complete a module on {Platform}.' },
    { type: 'Home Improvement', title: 'Paint the living room', description: 'Buy paint and supplies for the weekend project.' },
];

const placeholders = {
    Bank: ['HDFC', 'ICICI', 'Axis', 'SBI'],
    RND4: () => Math.floor(1000 + Math.random() * 9000),
    Name: ['Alex', 'Priya', 'Ben', 'Chloe', 'Sameer'],
    Location: ['City', 'Community', 'Downtown'],
    FamilyMember: ['Mom', 'Dad', 'Grandma', 'your sister', 'your brother'],
    ProjectName: ['Phoenix', 'Odyssey', 'Falcon', 'Neptune'],
    Insurance: ['Acko', 'PolicyBazaar', 'Digit', 'HDFC Ergo'],
    Fruit: ['apples', 'bananas', 'oranges', 'grapes'],
    Song: ['Wonderwall', 'Stairway to Heaven', 'Bohemian Rhapsody'],
    City: ['Goa', 'Paris', 'Tokyo', 'New York'],
    Book: ['Dune', 'The Hobbit', 'Sapiens'],
    Band: ['Coldplay', 'The Local Train', 'Indian Ocean'],
    SpouseName: ['your partner', 'your spouse', 'your love'],
    CarModel: ['Maruti Swift', 'Hyundai Creta', 'Tata Nexon', 'Honda City'],
    PetName: ['Buddy', 'Lucy', 'Max', 'Bella'],
    Skill: ['Python', 'Graphic Design', 'Public Speaking', 'Digital Marketing'],
    Platform: ['Coursera', 'Udemy', 'LinkedIn Learning'],
};

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateDescription(template: string): string {
    // FIX: Ensure the return value from the placeholder function is a string to satisfy the `replace` callback's type requirements.
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        const list = placeholders[key as keyof typeof placeholders];
        if (typeof list === 'function') return String(list());
        if (Array.isArray(list)) return getRandomElement(list);
        return match;
    });
}

// FIX: Corrected the return type to accurately reflect that `date` is a string, which resolves downstream type errors.
const generateMockReminders = (): (Omit<Reminder, 'date'> & { date: string })[] => {
    // FIX: Updated the array type to match the function's return type.
    const reminders: (Omit<Reminder, 'date'> & { date: string })[] = [];
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1];
    
    years.forEach(year => {
        for (let month = 0; month < 12; month++) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);

                // Add 2 reminders per day
                for (let i = 0; i < 2; i++) {
                    const template = getRandomElement(reminderTemplates);
                    const title = generateDescription(template.title); // Generate title from template
                    const description = generateDescription(template.description);
                    const hour = 9 + Math.floor(Math.random() * 10); // 9 AM to 6 PM
                    const minute = Math.random() > 0.5 ? 30 : 0;
                    const reminderDate = new Date(year, month, day, hour, minute);

                    reminders.push({
                        id: `mock-${year}-${month}-${day}-${i}`,
                        user_id: MOCK_USER_ID,
                        title: title,
                        date: reminderDate.toISOString(),
                        type: template.type,
                        description: description,
                        is_completed: date < new Date() && Math.random() > 0.2, // Mark some past reminders as complete
                    });
                }
            }
        }
    });

    return reminders;
};


// FIX: Corrected the type of the exported constant to match the data structure.
export const MOCK_REMINDERS: (Omit<Reminder, 'date'> & { date: string })[] = generateMockReminders();