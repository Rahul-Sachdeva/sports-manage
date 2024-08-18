const express = require('express');
const app = express();
const port = 4000;
const mysql = require('mysql2'); // Import the mysql2 library
const bcrypt = require('bcrypt'); // Import the bcrypt library
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { dir } = require('console');

app.use(bodyParser.json());
app.use(express.json());
app.set('view engine', 'ejs'); // Set EJS as the view engine
app.set('views', path.join(__dirname, 'views')); // Set the views directory
app.use(express.static('public')); // Make sure 'public' is the correct directory

// Middleware to check if the user is authorized to access routes
// Middleware to check if the user is authorized to access routes
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
    secret: 'your-secret-key', // Replace with a secret key for session management
    resave: false,
    saveUninitialized: true
}));

// Create a MySQL database connection
const db = mysql.createConnection({
    host: 'localhost', // Replace with your MySQL server host
    user: 'root',      // Replace with your MySQL username
    password: 'rahul@11',  // Replace with your MySQL password
    database: 'sports_manage'  // Replace with the name of your database (sports)
});

function isAuthorized(req, res, next) {
    // Check if the user is logged in (you might have a session variable for this)
    if (req.session.isLoggedIn) {
        // The user is authorized, so continue to the next middleware or route handler
        next();
    } else {
        // The user is not authorized, so you can redirect them to a login page or send an error message
        // Alternatively, you can send an error response
        res.status(401).send('This feature is not accessible for Guests');
    }
}

// Middleware to check if the user is a teacher
// Middleware to check if the user is a teacher
function isTeacher(req, res, next) {
    // Check if the user is a teacher (you might have a session variable for the user's role)
    if (req.session.role === 'teacher') {
        // The user is a teacher, so continue to the next middleware or route handler
        next();
    } else {
        // The user is not a teacher, so you can send an error message or deny access
        res.status(403).send('Access denied. You are not a teacher.');
    }
}

// Connect to the MySQL database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Serve the registration form
// Example route for rendering the registration page
app.get('/register', isAuthorized, isTeacher, (req, res) => {
    // Render the registration.html page if access is allowed
    res.sendFile(__dirname + '/public/registration.html');
});

// Handle registration form submissions
app.post('/register', (req, res) => {
    // Retrieve user registration data from req.body (username, password, email, role)
    const { username, password, email, role } = req.body;

    // Hash the user's password securely using bcrypt
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.send('Registration failed.');
        } else {
            // Insert user data into the database
            const insertSql = 'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)';
            const values = [username, hashedPassword, email, role];

            db.query(insertSql, values, (err, result) => {
                if (err) {
                    console.error('Error inserting user data:', err);
                    res.send('Registration failed.');
                } else {
                    console.log('User registered successfully');
                    res.redirect('/home');
                }
            });
        }
    });
});

app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Replace with the actual path to your home page
});

// Add a new route for the login page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Handle login form submissions
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Query the database to retrieve user data
    const selectSql = 'SELECT * FROM users WHERE username = ?';

    db.query(selectSql, [username], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            res.send('Login failed.');
        } else {
            if (results.length === 0) {
                res.send('User not found. Please register.');
            } else {
                const user = results[0];
                // Compare the hashed password from the database with the provided password
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err || !isMatch) {
                        console.error('Invalid password:', err);
                        res.send('Invalid password. Please try again.');
                    } else {
                        // Successful login
                        req.session.isLoggedIn = true;
                        req.session.username = user.username;
                        req.session.email = user.email;
                        req.session.role = user.role; // Store the user's role in the session

                        // Redirect to the appropriate page based on the user's role
                        res.redirect('/home');
                    }
                }); 
            }
        }
    });
});

// Add this route to your app.js or a separate routes file
app.get('/api/check-login-status', (req, res) => {
    // Check if the user is logged in and retrieve relevant data
    const isLoggedIn = req.session.isLoggedIn;
    const username = req.session.username; // You can add more user data here
    const role = req.session.role;
    const email = req.session.email;

    // Return the login status as JSON
    res.json({ isLoggedIn, username, role, email });
});

app.get('/schedule', (req, res) => {
    res.sendFile(__dirname + '/public/schedule.html'); // Replace with the actual path to your home page
});
app.get('/results', (req, res) => {
    res.sendFile(__dirname + '/public/results.html'); // Replace with the actual path to your home page
});

app.get('/schedulenewmatch', isAuthorized, isTeacher, (req, res) => {
    res.sendFile(__dirname + '/public/schedulenewmatch.html'); // Replace with the actual path to your home page
});

function insertEventIntoDatabase(eventData) {
    return new Promise((resolve, reject) => {
        const { date, time, team1, team2, location, status, description, result } = eventData;
        const insertSql = 'INSERT INTO matches(date, time, team1, team2, location, status, description, result) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [date, time, team1, team2, location, status, description, result];

        db.query(insertSql, values, (err, result) => {
            if (err) {
                console.error('Error inserting event data:', err);
                reject(err);
            } else {
                console.log('Event inserted successfully');
                resolve(result.insertId); // Resolve with the ID of the inserted event
            }
        });
    });
}


app.post('/api/schedule-match', (req, res) => {
    try {
        const eventData = req.body; // Extract event details from the request body

        // Insert the eventData into your database
        // Replace the following line with your actual database insertion code
        const eventId = insertEventIntoDatabase(eventData);

        if (eventId) {
            // Optionally, you can send a success message or the inserted event ID
            res.json({ message: 'Event scheduled successfully'});
        } else {
            res.status(400).json({ error: 'Failed to schedule event' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create an endpoint to handle match updates
app.post('/api/update-match', (req, res) => {
    const updatedMatch = req.body; // The updated match data from the request body

    // Update the match details in the database
    const updateSql = 'UPDATE matches SET date = ?, time = ?, team1 = ?, team2 = ?, location = ?, status = ?, description = ?, result = ? WHERE match_id = ?';
    const values = [updatedMatch.date, updatedMatch.time, updatedMatch.team1, updatedMatch.team2, updatedMatch.location, updatedMatch.status, updatedMatch.description, updatedMatch.result, updatedMatch.match_id];

    db.query(updateSql, values, (err, result) => {
        if (err) {
            console.error('Error updating match data:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            // Respond with a success message
            res.json({ message: 'Match updated successfully' });
        }
    });
});


app.get('/api/scheduled-matches', (req, res) => {
    const query = 'SELECT * FROM matches WHERE date >= CURDATE()';

    // Execute the database query
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching scheduled matches:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            // Send the retrieved matches as JSON response
            res.json(results);
        }
    });
});

// Add an API endpoint to fetch completed matches
app.get('/api/completed-matches', (req, res) => {
    const query = 'SELECT * FROM matches WHERE status = "Completed"'; // Query to retrieve completed matches

    // Execute the database query
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching completed matches:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            // Send the retrieved completed matches as JSON response
            res.json(results);
        }
    });
});


// Add an API endpoint to delete a match by match ID
app.delete('/api/delete-match/:matchId', (req, res) => {
    const matchId = req.params.matchId; // Get the match ID from the URL parameter

    // Implement your logic to delete the match from the database
    const deleteQuery = 'DELETE FROM matches WHERE match_id = ?';

    db.query(deleteQuery, [matchId], (err, result) => {
        if (err) {
            console.error('Error deleting match:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Check if a match was deleted (affected rows is greater than 0)
        if (result.affectedRows === 0) {
            // Match not found, send a 404 error response
            return res.status(404).json({ error: 'Match not found' });
        }

        // Respond with a success message
        res.json({ message: 'Match deleted successfully' });
    });
});


app.use(bodyParser.urlencoded({ extended: false }));

// Serve HTML and CSS files
app.get('/inventory',isAuthorized,isTeacher, (req, res) => {
    res.sendFile(__dirname + '/public/inventory.html');
});
// API route to get sports data
app.get('/api/inventory', (req, res) => {
    // Query the database to get distinct sport names
    db.query('SELECT * FROM inventory order by sport_name', (err, results) => {
        if (err) {
            console.error('Error fetching sports:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        // Send the retrieved sports data as JSON response
        res.json(results);
    });
});



// API route to add an item to a sport
app.post('/api/items', (req, res) => {
    const { sportName, itemName, quantity } = req.body;

    if (!sportName || !itemName || !quantity) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }

    // Insert a new item into the database for a specific sport
    db.query('INSERT INTO inventory (sport_name, item_name, quantity) VALUES (?, ?, ?)',
        [sportName, itemName, quantity], (err, result) => {
            if (err) {
                console.error('Error adding item:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            // Respond with the ID of the newly added item
            res.json({ id: result.insertId, sportName, itemName, quantity });
        });
});

// API route to delete an item
app.delete('/api/items/:itemId', (req, res) => {
    const { itemId } = req.params;

    if (!itemId) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }

    // Delete an item from the database
    db.query('DELETE FROM inventory WHERE id = ?', [itemId], (err, result) => {
        if (err) {
            console.error('Error deleting item:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        // Respond with a success message
        res.status(204).send();
    });
});

// API route to update an item's quantity
app.put('/api/items/:itemId', (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!itemId || !quantity) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }

    // Update the item's quantity in the database
    db.query('UPDATE inventory SET quantity = ? WHERE id = ?', [quantity, itemId], (err, result) => {
        if (err) {
            console.error('Error updating item quantity:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        // Respond with a success message
        res.status(204).send();
    });
});

app.get('/gallery', isAuthorized, (req, res) => {
    res.sendFile(__dirname + '/public/gallery.html');
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
  const upload = multer({ storage });
  
  // Handle image uploads
  app.post('/upload', upload.single('image'), (req, res) => {
    const { originalname, filename } = req.file;
    const imagePath = 'uploads/' + filename;
  
    const query = 'INSERT INTO images (name, path) VALUES (?, ?)';
    db.query(query, [originalname, imagePath], (err, results) => {
      if (err) {
        console.error('Error uploading image:', err);
        res.status(500).json({ message: 'Error uploading image' });
      } else {
        res.status(200).json({ message: 'Image uploaded successfully' });
      }
    });
  });
  
  // Fetch and send image data to the client
  app.get('/getImages', (req, res) => {
    const query = 'SELECT * FROM images';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching images:', err);
        res.status(500).json({ message: 'Error fetching images' });
      } else {
        res.status(200).json(results);
      }
    });
  });
  
  // Handle image deletion
  app.delete('/delete/:id', (req, res) => {
    const imageId = req.params.id;
  
    // Retrieve image path from the database
    db.query('SELECT path FROM images WHERE id = ?', [imageId], (err, results) => {
      if (err) {
        console.error('Error fetching image path:', err);
        res.status(500).json({ message: 'Error deleting image' });
      } else if (results.length > 0) {
        const imagePath = 'public/' + results[0].path;
  
        // Delete the image file from the server
        fs.unlink(imagePath, unlinkErr => {
          if (unlinkErr) {
            console.error('Error deleting image file:', unlinkErr);
            res.status(500).json({ message: 'Error deleting image file' });
          } else {
            // Delete the image record from the database
            db.query('DELETE FROM images WHERE id = ?', [imageId], deleteErr => {
              if (deleteErr) {
                console.error('Error deleting image record:', deleteErr);
                res.status(500).json({ message: 'Error deleting image record' });
              } else {
                res.status(200).json({ message: 'Image deleted successfully' });
              }
            });
          }
        });
      } else {
        res.status(404).json({ message: 'Image not found' });
      }
    });
  });

app.get('/registerEvent', (req,res) => {
    res.sendFile(__dirname + '/public/eventregister.html');
})
// Handle event registration
app.post('/registerEvent', (req, res) => {
    const { eventName, sportName, crn, urn, studentName, branch, year, email } = req.body;
  
    // Validate and sanitize the input data as needed
    // You should add validation and sanitization logic here to ensure data integrity and security
  
    // Assuming you have a MySQL connection called 'db' already established
  
    // Define the name of your table (you can choose a suitable name)
    const tableName = 'eventregistrations';
  
    // Create an SQL query to insert the data into the database
    const query = 'INSERT INTO ' + tableName + ' (eventName, sportName, crn, urn, studentName, branch, year, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [eventName, sportName, crn, urn, studentName, branch, year, email];
  
    // Execute the SQL query to insert the data
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error registering event:', err);
        res.status(500).json({ message: 'Error registering event' });
      } else {
        // Registration successful
        res.status(200).json({ message: 'Event registration successful' });
      }
    });
  });
  
app.get('/teameventregister.html',(req, res) => {
    res.sendFile(__dirname + '/public/teamregister.html');
})
 


// Handle team registration
app.post('/teameventregister.html', (req, res) => {
    const { teamName, eventName, sportName, teamMembers } = req.body;
  
    // Insert team-related information into the teamRegistrations table
    db.query('INSERT INTO teamRegistrations (teamName, eventName, sportName) VALUES (?, ?, ?)', [teamName, eventName, sportName], (err, result) => {
      if (err) {
        console.error('Error registering team:', err);
        res.status(500).json({ message: 'Error registering team' });
      } else {
        const teamId = result.insertId; // Get the generated teamId
  
        // Insert each team member's credentials into the teamMembers table
        for (const member of teamMembers) {
          const { crn, urn, studentName, branch, year, email } = member;
          db.query('INSERT INTO teamMembers (teamId, crn, urn, studentName, branch, year, email) VALUES (?, ?, ?, ?, ?, ?, ?)', [teamId, crn, urn, studentName, branch, year, email], (err) => {
            if (err) {
              console.error('Error registering team member:', err);
              // Handle the error appropriately
            }
          });
        }
  
        // Respond with a success message
        res.status(200).json({ message: 'Team registration successful' });
      }
    });
  });
  
app.get('/teamdata', isAuthorized, isTeacher, (req,res)=>{
    res.sendFile(__dirname+'/public/teamdata.html');
})

// Define routes to fetch team registrations and team members
app.get('/teamregistrations', (req, res) => {
    // Fetch team registrations from the database
    db.query('SELECT * FROM teamRegistrations', (err, results) => {
      if (err) {
        console.error('Error fetching team registrations:', err);
        res.status(500).json({ message: 'Error fetching team registrations' });
      } else {
        res.json(results);
      }
    });
  });
  
  // Modify the server-side code to fetch additional details of team members
app.get('/teammembers/:teamId', (req, res) => {
  const { teamId } = req.params;

  // Fetch team members for the specified teamId from the database
  db.query('SELECT * FROM teamMembers WHERE teamId = ?', [teamId], (err, results) => {
    if (err) {
      console.error('Error fetching team members:', err);
      res.status(500).json({ message: 'Error fetching team members' });
    } else {
      res.json(results);
    }
  });
});





app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




