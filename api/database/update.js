const axios = require('axios');
const gunzipMaybe = require('gunzip-maybe');
const mysql = require('mysql2');
const fs = require('fs').promises;
const util = require('util');

// Define your database connection settings
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// Constants
const LAST_FETCH_FILE = 'lastFetch.txt';
const FILE_URL = 'https://torrentgalaxy.to/cache/tgx24hdump.txt.gz';
const BATCH_SIZE = 500;

// Create a MySQL database connection
const connection = mysql.createConnection(dbConfig);
const queryAsync = util.promisify(connection.query).bind(connection);

// Function to create a table if it does not exist
async function createTableIfNotExists(tableName, createTableSQL) {
  const query = `CREATE TABLE IF NOT EXISTS ${tableName} ${createTableSQL}`;
  try {
    await queryAsync(query);
    console.log(`Table ${tableName} created or already exists.`);
  } catch (error) {
    console.error(`Error creating table ${tableName}: ${error}`);
  }
}

// Function to check and insert data into the api_keys table
async function checkAndInsertApiKeys() {
  const query = 'SELECT COUNT(*) as count FROM api_keys';
  const result = await queryAsync(query);

  if (result && result[0].count === 0) {
    // Insert default data into the api_keys table
    const insertQuery = `
    INSERT IGNORE INTO api_keys (id, key_value, email, created_at) 
    VALUES (1, '${process.env.REACT_APP_API_KEY}', 'bob@softcon.com', '2023-07-27 01:36:38')`;

    await queryAsync(insertQuery);
    console.log('Default keys inserted into the api_keys table.');
  }
}


// Function to fetch file contents using Axios
async function fetchFileContents(url) {
  try {
    const lastFetchTime = await fs.readFile(LAST_FETCH_FILE, 'utf8').catch(() => null);
    const headers = { 'If-Modified-Since': lastFetchTime || '' };

    const response = await axios.get(url, { headers, responseType: 'stream' });

    if (response.status === 304) {
      console.log('No updates needed. No changes made.');
      return null; // Terminate the Node.js script
    }

    const gunzip = gunzipMaybe();
    response.data.pipe(gunzip);

    let data = '';

    gunzip.on('data', (chunk) => {
      data += chunk.toString('utf8');
    });

    return new Promise((resolve, reject) => {
      gunzip.on('end', () => {
        if (response.headers['last-modified']) {
          fs.writeFile(LAST_FETCH_FILE, response.headers['last-modified']).catch(() => {});
        }
        resolve(data);
      });

      gunzip.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error during file fetching or data processing:', error);
    return null; // Handle the error gracefully
  }
}

// Function to delete duplicate rows
async function deleteDuplicates() {
  const query = `DELETE t1 FROM ${process.env.DB_TABLE} t1
                 INNER JOIN (
                   SELECT hash, MIN(id) as min_id FROM ${process.env.DB_TABLE} GROUP BY hash HAVING COUNT(*) > 1
                 ) t2
                 ON t1.hash = t2.hash AND t1.id > t2.min_id`;

  const results = await queryAsync(query);

  console.log(`Number of deleted rows: ${results.affectedRows}\n`);
}

// Function to insert batch data
async function insertBatchHelper(batchData) {
  const query = `INSERT IGNORE INTO ${process.env.DB_TABLE} (hash, name, category) VALUES ?`;
  const results = await queryAsync(query, [batchData]);
  return results.affectedRows;
}

// Function to insert batch data
async function insertBatch(batchData) {
  let totalRowsInserted = 0;
  const batchedData = [];

  for (const params of batchData) {
    if (params.length !== 3) {
      continue;
    }

    batchedData.push(params);
    if (batchedData.length === BATCH_SIZE) {
      totalRowsInserted += await insertBatchHelper(batchedData);
      batchedData.length = 0;
    }
  }

  if (batchedData.length > 0) {
    totalRowsInserted += await insertBatchHelper(batchedData);
  }

  console.log(`Number of rows added: ${totalRowsInserted}\n`);
  return totalRowsInserted;
}

console.log(':: Running database update ::\n\n');

connection.connect(async (err) => {
  if (err) {
    console.error(`Database connection failed: ${err}\n`);
    process.exit(1);
  }

  try {

// Create the table if it does not exist
await createTableIfNotExists(`${process.env.DB_TABLE}`, `
  (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    UNIQUE KEY id (id),
    UNIQUE KEY hash (hash),
    KEY idx_name (name) USING BTREE
  )
`);

  // Example for the 'api_keys' table
  await createTableIfNotExists('api_keys', `
    (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_value VARCHAR(64) NOT NULL,
      email VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY key_value (key_value)
    )
  `);

    // Create the API key if it doesn't exist.
    await checkAndInsertApiKeys();

    const fileContents = await fetchFileContents(FILE_URL);

    if (fileContents !== null) {
      const lines = fileContents.toString('utf8').split('\n');
      const batchParams = lines.map((line) => line.split('|').slice(0, 3));

      await insertBatch(batchParams);
      await deleteDuplicates();


      connection.end();
      console.log('File ran successfully. Database updated.\n');
    }
  } catch (error) {
    console.error('Error during file fetching or data processing:', error);
    connection.end();
  }
});
