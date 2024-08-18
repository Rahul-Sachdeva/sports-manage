
// Make an AJAX request to check the user's login status
fetch('/api/check-login-status')
    .then(response => response.json())
    .then(data => {
        // Check the data to determine the user's login status
        if (data.isLoggedIn) {
            // Display personalized content
            document.getElementById('greeting').textContent = 'Welcome, ' + data.username + '!';
            document.getElementsByClassName('loginoptions').style.display = 'none';
            document.getElementById('role_message').textContent = 'You are logged in a ' + data.role;
        }
    })
    .catch(error => {
        console.error('Error checking login status:', error);
    });


