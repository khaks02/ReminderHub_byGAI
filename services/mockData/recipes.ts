import { Recipe } from '../../types';

export const mockRecipes: Recipe[] = [
    {
        id: 'paneer-butter-masala',
        name: 'Paneer Butter Masala',
        description: 'A creamy and rich North Indian curry made with paneer, tomatoes, butter, and a blend of aromatic spices.',
        ingredients: [
            '250g Paneer, cubed', '2 large Tomatoes, pureed', '1 large Onion, finely chopped', '1 tbsp Ginger-garlic paste', '1/2 cup Cashew nuts, soaked',
            '1/4 cup Cream', '2 tbsp Butter', '1 tsp Red chili powder', '1/2 tsp Turmeric powder', '1 tsp Garam masala', '1 tbsp Kasuri methi (dried fenugreek leaves)', 'Salt to taste'
        ],
        instructions: [
            'Heat butter in a pan, add onions and saute until golden brown.', 'Add ginger-garlic paste and cook for a minute.', 'Add tomato puree, cashew paste, and all the spices. Cook until oil separates.',
            'Add cream and kasuri methi, mix well.', 'Add paneer cubes and simmer for 5-7 minutes.', 'Garnish with fresh cream and serve hot.'
        ],
        isVeg: true,
        cuisine: 'North Indian',
        rating: 4.8,
        cookTimeInMinutes: 30,
        servings: 4,
        price: 350,
        deliveryVendors: ['Zomato', 'Swiggy'],
        groceryVendors: ['BigBasket', 'Zepto', 'Blinkit'],
        difficulty: 'Medium',
        calories: 450,
    },
    {
        id: 'chicken-biryani',
        name: 'Hyderabadi Chicken Biryani',
        description: 'A legendary rice dish made with basmati rice, chicken, and a medley of spices, cooked in the traditional "dum" style.',
        ingredients: [
            '500g Chicken, cut into pieces', '2 cups Basmati rice, soaked', '1 cup Yogurt', '2 Onions, thinly sliced and fried', '2 tbsp Ginger-garlic paste',
            '1/2 cup Mint leaves', '1/2 cup Coriander leaves', '4 Green chilies', '1 tsp Red chili powder', '1 tsp Biryani masala', 'A pinch of Saffron', '2 tbsp Ghee', 'Salt to taste'
        ],
        instructions: [
            'Marinate chicken with yogurt, ginger-garlic paste, spices, mint, and coriander for at least 2 hours.', 'Cook basmati rice until 70% done and drain.',
            'Layer the marinated chicken and partially cooked rice in a heavy-bottomed pot.', 'Top with fried onions, saffron milk, and ghee.',
            'Cover and cook on low heat (dum) for 25-30 minutes.', 'Let it rest for 10 minutes before serving.'
        ],
        isVeg: false,
        cuisine: 'Hyderabadi',
        rating: 4.9,
        cookTimeInMinutes: 90,
        servings: 4,
        price: 450,
        deliveryVendors: ['Zomato', 'Swiggy', 'Behrouz Biryani'],
        groceryVendors: ['Licious', 'BigBasket'],
        difficulty: 'Hard',
        calories: 650,
    }
];
