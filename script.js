const apiKey = '30425538d7034aa0a3c5401c6bafd59b';
const apiUrl = 'https://api.spoonacular.com/recipes';

// Updated client ID and redirect URL
const clientId = 'cookingsolved-01345b2209c72f0d71c8ad5402cca8be2632127170105221499';
const redirectUrl = 'http://127.0.0.1:5500/index.html';

// OAuth2 Base URL
const oauth2BaseUrl = 'https://api.kroger.com/v1/connect/oauth2';

const cookingTools = [
  'Pan',
  'Pot',
  'Skillet',
  'Wok',
  'Dutch oven',
  'Baking sheet',
  'Blender',
  'Food processor',
  'Stand mixer',
  'Hand mixer',
  'Immersion blender',
  'Slow cooker',
  'Rice cooker',
  'Chef\'s knife',
  'Cutting board',
  'Measuring cups',
  'Measuring spoons',
  'Mixing bowls',
  'Whisk',
  'Wooden spoon',
  'Bowl'
];

function fetchRecipeDetails(recipeId) {
  const recipeDetailsUrl = `${apiUrl}/${recipeId}/information?apiKey=${apiKey}`;
  return fetch(recipeDetailsUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    });
}

function fetchRecipes(ingredients) {
  const recipeContainer = document.getElementById('recipe-container');
  recipeContainer.innerHTML = '<p>Loading recipes...</p>';
  recipeContainer.classList.add('recipe-grid');

  const url = `${apiUrl}/search?apiKey=${apiKey}&query=${ingredients}&number=5`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const detailedRecipesPromises = data.results.map(result => fetchRecipeDetails(result.id));
      return Promise.all(detailedRecipesPromises);
    })
    .then(detailedRecipes => {
      const processedRecipes = processRecipes(detailedRecipes, ingredients);
      displayRecipes(processedRecipes);
    })
    .catch(error => {
      console.error('Error fetching recipe details:', error);
      recipeContainer.innerHTML = `<p>Error fetching recipe details. ${error.message}</p>`;
    });
}

function processRecipes(recipes, searchedIngredients) {
  return recipes.map(recipe => {
    const includedIngredients = Array.isArray(recipe.extendedIngredients)
      ? recipe.extendedIngredients.map(ingredient => ingredient.name)
      : [];
    const nonIncludedIngredients = includedIngredients.filter(ingredient => !searchedIngredients.includes(ingredient));

    recipe.shoppingList = nonIncludedIngredients;

    // Include cooking tools in the recipe object
    recipe.cookingTools = cookingTools.filter(tool =>
      (recipe.title + ' ' + recipe.instructions).toLowerCase().includes(tool.toLowerCase())
    );

    return recipe;
  });
}

function displayRecipes(recipes) {
  const recipeContainer = document.getElementById('recipe-container');
  recipeContainer.innerHTML = '';
  recipeContainer.classList.add('recipe-grid');

  recipes.forEach(recipe => {
    const recipeCard = document.createElement('div');
    recipeCard.classList.add('recipe-card');

    // Display the shopping list
    const shoppingList = Array.isArray(recipe.shoppingList) && recipe.shoppingList.length > 0
      ? `<p>Shopping List: ${recipe.shoppingList.join(', ')}</p>`
      : '<p>No shopping list</p>';

    // Display the cooking tools
    const toolsList = Array.isArray(recipe.cookingTools) && recipe.cookingTools.length > 0
      ? `<p>Cooking Tools: ${recipe.cookingTools.join(', ')}</p>`
      : '<p>No cooking tools</p>';

    recipeCard.innerHTML = `
      <h3>${recipe.title}</h3>
      <img src="${recipe.image}" alt="${recipe.title}" style="width: 320px; height: 180px;" />
      ${shoppingList}
      ${toolsList}
    `;

    const link = document.createElement('a');
    link.href = recipe.sourceUrl;
    link.textContent = 'View Recipe Details';
    // Open the link in a new tab
    link.target = '_blank';
    recipeCard.appendChild(link);

    recipeContainer.appendChild(recipeCard);
  });
}

function searchRecipes() {
  const ingredientsInput = document.getElementById('ingredients');
  ingredientsInput.placeholder = 'e.g., pepper flakes, cowgirl steak, olive oil...                                                  ';

  const ingredients = ingredientsInput.value.trim();

  if (ingredients === '') {
    alert('Please enter ingredients.');
    return;
  }

  fetchRecipes(ingredients);

  ingredientsInput.value = '';
}

// Set initial placeholder for the search box
searchRecipes();