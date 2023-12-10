const apiKey = '30425538d7034aa0a3c5401c6bafd59b'
const apiUrl = 'https://api.spoonacular.com/recipes';

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
  recipeContainer.classList.add('recipe-grid'); // Add this line

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

    recipeCard.innerHTML = `
      <h3>${recipe.title}</h3>
      <img src="${recipe.image}" alt="${recipe.title}" style="width: 320px; height: 180px;" />
      ${shoppingList}
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