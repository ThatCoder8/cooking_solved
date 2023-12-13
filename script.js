const apiKey = '30425538d7034aa0a3c5401c6bafd59b';
const apiUrl = 'https://api.spoonacular.com/recipes';

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
    recipeCard.appendChild(link);

    recipeContainer.appendChild(recipeCard);
  });
}

function searchRecipes() {
  const ingredientsInput = document.getElementById('ingredients');
  const ingredients = ingredientsInput.value.trim();

  if (ingredients === '') {
    alert('Please enter ingredients.');
    return;
  }

  fetchRecipes(ingredients);

  ingredientsInput.value = '';
}