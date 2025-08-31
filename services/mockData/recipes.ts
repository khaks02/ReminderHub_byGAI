// This file is auto-generated to provide a rich dataset for the app demo.
import { Recipe } from '../../types';

const recipeTemplates = {
    adjectives: ['Spicy', 'Hearty', 'Creamy', 'Crispy', 'Tangy', 'Zesty', 'Smoky', 'Sweet', 'Savory', 'Herbed', 'Garlicky'],
    mains: ['Lentil', 'Paneer', 'Mushroom', 'Chicken', 'Tofu', 'Potato', 'Chickpea', 'Lamb', 'Fish', 'Eggplant', 'Cauliflower'],
    dishes: ['Curry', 'Stir-Fry', 'Roast', 'Tacos', 'Salad', 'Soup', 'Pasta', 'Biryani', 'Pizza', 'Skewers', 'Bowl'],
    cuisines: ['Indian', 'Italian', 'Mexican', 'Chinese', 'Thai', 'Japanese', 'Mediterranean', 'French'],
    ingredients: ['Tomato', 'Onion', 'Garlic', 'Ginger', 'Bell Pepper', 'Spinach', 'Cilantro', 'Basmati Rice', 'Olive Oil', 'Coconut Milk', 'Turmeric', 'Cumin', 'Cabbage', 'Carrot', 'Broccoli', 'Peas', 'Corn', 'Yogurt', 'Lemon'],
    instructions: [
        'Heat oil in a large skillet over medium-high heat.',
        'Add chopped onions and garlic; cook and stir until fragrant.',
        'Stir in the main protein and cook until browned.',
        'Add spices and vegetables, cooking until tender.',
        'Simmer with sauce or coconut milk for 15 minutes.',
        'Garnish with fresh cilantro and serve hot with rice or naan.',
    ],
    vendors: {
        delivery: ['Zomato', 'Swiggy'],
        grocery: ['BigBasket', 'Zepto', 'Instamart']
    }
};

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min: number, max: number, decimals: number = 0) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const shuffleArray = <T,>(arr: T[]): T[] => arr.sort(() => 0.5 - Math.random());

const generateMockRecipes = (count: number): Recipe[] => {
    const recipes: Recipe[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < count; i++) {
        let name = '';
        do {
            name = `${getRandomElement(recipeTemplates.adjectives)} ${getRandomElement(recipeTemplates.mains)} ${getRandomElement(recipeTemplates.dishes)}`;
        } while (usedNames.has(name));
        usedNames.add(name);

        const id = name.toLowerCase().replace(/\s+/g, '-');
        const cuisine = getRandomElement(recipeTemplates.cuisines);
        const isVeg = !['Chicken', 'Lamb', 'Fish'].includes(name.split(' ')[1]);

        recipes.push({
            id: `${id}-${i}`,
            name,
            description: `A delicious and ${name.split(' ')[0].toLowerCase()} ${cuisine} ${name.split(' ')[2].toLowerCase()} featuring ${name.split(' ')[1].toLowerCase()}. Perfect for a weeknight dinner.`,
            ingredients: shuffleArray([...recipeTemplates.ingredients]).slice(0, getRandomNumber(4, 8)),
            instructions: recipeTemplates.instructions,
            isVeg,
            cuisine,
            rating: getRandomNumber(3.8, 5, 1),
            cookTimeInMinutes: getRandomNumber(15, 75),
            servings: getRandomNumber(2, 6),
            price: getRandomNumber(250, 800),
            deliveryVendors: recipeTemplates.vendors.delivery,
            groceryVendors: recipeTemplates.vendors.grocery,
            difficulty: getRandomElement(['Easy', 'Medium', 'Hard']),
            calories: getRandomNumber(250, 700),
        });
    }
    return recipes;
};

export const MOCK_RECIPES: Recipe[] = generateMockRecipes(1000);