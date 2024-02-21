

const apiKey = '30425538d7034aa0a3c5401c6bafd59b';
const apiUrl = 'https://api.spoonacular.com/recipes';
const clientId = 'cookingsolved-01345b2209c72f0d71c8ad5402cca8be2632127170105221499';
const clientSecret = 'IRh6Vx5RqGXBtt5lTInreIqz9CQ8uaWgRl6JjP3T';
const redirectUrl = 'http://127.0.0.1:5500/index.html';
const oauth2BaseUrl = 'https://api-ce.kroger.com/v1/connect/oauth2';

// Declare cookingTools
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

// Kroger API-related functions
function addToKrogerCart(accessToken, item) {
  const cartUrl = 'https://api-ce.kroger.com/v1/cart/items';

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(item),
  };

  return fetch(cartUrl, requestOptions)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    });
}

// Add a function to add all items to Kroger cart
function addAllToKrogerCart(accessToken, shoppingList) {
  shoppingList.forEach(item => {
    addToKrogerCart(accessToken, { productId: item, quantity: 1 })
      .then(response => {
        console.log('Item added to Kroger cart:', response);
      })
      .catch(error => {
        console.error('Error adding item to Kroger cart:', error);
      });
  });
}

function exchangeAuthorizationCodeForToken(authorizationCode) {
  const tokenUrl = `${oauth2BaseUrl}/token`;

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: redirectUrl,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  };

  return fetch(tokenUrl, requestOptions)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    });
}

// Sample code to handle OAuth2 callback
const urlParams = new URLSearchParams(window.location.search);
const authorizationCode = urlParams.get('code');

if (authorizationCode) {
  exchangeAuthorizationCodeForToken(authorizationCode)
    .then(tokenData => {
      // Handle the obtained access token, e.g., store it securely for API requests
      console.log('Access Token:', tokenData.access_token);

      // You may store the access token securely for later use
      // For simplicity, we'll use it immediately for recipe fetching
      fetchRecipes('your-ingredients', tokenData.access_token);
    })
    .catch(error => {
      console.error('Error exchanging authorization code for token:', error);
    });
}

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

function fetchRecipes(ingredients, accessToken) {
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
      displayRecipes(processedRecipes, accessToken);
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

function displayRecipes(recipes, accessToken) {
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

    // Add "Add to Cart" button with event listener
    const addToCartButton = document.createElement('button');
    addToCartButton.textContent = 'Add to Cart';
    addToCartButton.addEventListener('click', () => addToCartAndRedirect(recipe, accessToken));

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

    recipeCard.appendChild(addToCartButton);
    recipeCard.appendChild(link);
    recipeContainer.appendChild(recipeCard);
  });
}

// New function to add items to Kroger cart and redirect to Kroger's site
function addToCartAndRedirect(recipe, accessToken) {
  addToCart(recipe, accessToken); // Call the existing addToCart function

  // Redirect to Kroger's site (you may need to replace this URL with the actual Kroger cart URL)
  window.location.href = 'https://www.kroger.com/cart';
}

function addToCart(recipe, accessToken) {
  console.log('Adding to Kroger cart:', recipe.shoppingList);

  recipe.shoppingList.forEach(item => {
    addToKrogerCart(accessToken, { productId: item, quantity: 1 })
      .then(response => {
        console.log('Item added to Kroger cart:', response);
      })
      .catch(error => {
        console.error('Error adding item to Kroger cart:', error);
      });
  });
}

function searchRecipes() {
  const ingredientsInput = document.getElementById('ingredients');
  ingredientsInput.placeholder = 'e.g., steak, mushrooms...';

  const ingredients = ingredientsInput.value.trim();

  if (ingredients === '') {
    return;
  }

  // Fetch recipes and then add items to Kroger cart
  fetchRecipes(ingredients, 'your-access-token');

  ingredientsInput.value = '';
}

// Set initial placeholder for the search box
searchRecipes();