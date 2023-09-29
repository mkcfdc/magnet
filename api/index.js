const express = require('express');
const mysql = require('mysql2');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

const {
  DB_HOST,
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE,
  DB_TABLE,
} = process.env;

if (!DB_HOST || !DB_USERNAME || !DB_PASSWORD || !DB_DATABASE || !DB_TABLE) {
  console.error('Missing required environmental variables.');
  process.exit(1);
}

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Log MySQL connection details
pool.getConnection((err, connection) => {
    if (err) {
      console.error('MySQL connection error:', err.message);
    } else {
      console.log('Connected to MySQL database as ID:', connection.threadId);
      connection.release(); // Release the connection
    }
  });

function processSearchResults(results) {
    return results.map((row) => ({
      id: row.id,
      name: row.name,
      hash: row.hash,
      category: row.category
    }));
}

// Function to perform the search and retrieve results
function searchAPI(searchTerm, categories, limit, res) {
  // Convert searchTerm and categories to lowercase
  searchTerm = searchTerm.toLowerCase();
  categories = categories.toLowerCase();

  // Check if the search term is empty
  if (searchTerm.length === 0) {
    // Empty search term, return status 400 (Bad Request) as JSON
    return res.status(400).json({ status: 400, result: 'Missing search term' });
  }

  // Validate categories
  const validCategories = ['movies', 'tv', 'anime', 'xxx'];
  if (categories.length > 0) {
    categories = categories.split(',').map((category) => category.trim());
    categories = categories.filter((category) => validCategories.includes(category));

    if (categories.length === 0) {
      // If no valid categories provided, treat it as if no category was provided
      categories = '';
    }
  } else {
    // If category parameter not provided, search across all categories
    categories = validCategories;
  }

  // Validate limit (maximum of 50 results)
  limit = parseInt(limit) || 50;
  limit = Math.min(50, Math.max(10, limit));

  // Prepare the database query for search term, categories, and limit
  const categoryCondition = categories.length > 0 ? 'AND category IN (?)' : '';
  const sql = `
    SELECT * 
    FROM ${DB_TABLE}
    WHERE REPLACE(name, '.', ' ') LIKE ? ${categoryCondition}
    ORDER BY CASE 
        WHEN name = REPLACE(?, ' ', '.') THEN 1  
        WHEN name LIKE CONCAT(REPLACE(?, ' ', '.'), '%') THEN 2
        WHEN name LIKE CONCAT('%', REPLACE(?, ' ', '.')) THEN 3 
        ELSE 4
    END,
    id DESC 
    LIMIT ?`;

  // Execute the query for search term, categories, and limit
  pool.query(
    sql,
    [
      `%${searchTerm}%`,
      categories,
      searchTerm,
      searchTerm,
      searchTerm,
      limit,
    ],
    (error, results) => {
      if (error) {
        return res.status(500).json({ status: 500, result: 'Internal Server Error' });
      }

      const searchResults = processSearchResults(results);
      console.log('Database query successful.');
      console.log(searchResults);
      return res.status(200).json({ status: 200, result: searchResults });
    }
  );
}

const allowedOrigins = ["http://localhost:3000","http://localhost:3030"];
    app.use(
        cors({
            origin: function(origin, callback) {
                if (!origin) return callback(null, true);
                if (allowedOrigins.indexOf(origin) === -1) {
                    var msg =
                        "The CORS policy for this site does not " +
                        "allow access from the specified Origin.";
                    return callback(new Error(msg), false);
                }
                return callback(null, true);
            }
        })
    );

    app.use(bodyParser.json());

// Middleware to log request details
function logRequestDetails(req, res, next) {
  const { originalUrl, headers, query } = req;
  console.log('Received a request:', { originalUrl, headers, query });
  next();
}

// Middleware to check the API key
function checkApiKey(req, res, next) {
  const apiKey = req.headers.authorization.split(' ')[1];

  const sql = 'SELECT COUNT(*) as count FROM api_keys WHERE `key_value` = ?';
  pool.query(sql, [apiKey], (error, results) => {
    if (error) {
      // Pass the error to the error middleware
      return next(error);
    } else {
      if (results[0].count > 0) {
        // API key is valid, allow the request to proceed
        next();
      } else {
        // API key is not found, return a 401 Unauthorized response
        res.status(401).json({ error: 'Unauthorized' });
      }
    }
  });
}

// Request logging middleware is applied globally
app.use(logRequestDetails);
    
// Define an endpoint for the API
app.get('/search', checkApiKey, async (req, res) => {
  try {
    // Call the API function with the search term, category, and limit, and return the results
    await searchAPI(req.query.query || '', req.query.category || '', req.query.limit || '', res);
  } catch (error) {
    console.error(`Error in /search route: ${error.message}`);
    res.status(500).json({ status: 500, error: 'Internal Server Error' });
  }
});

// Start the Express server
const port = process.env.PORT || 3030;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
