fetch('/api/check-login-status')
    .then(response => response.json())
    .then(data => {
        // Check the data to determine the user's login status
        if (data.role == 'teacher') {
            // Display personalized content
            document.getElementsByClassName('teacheronly').style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error checking login status:', error);
    });

    document.addEventListener('DOMContentLoaded', function () {
        // Fetch scheduled and completed matches from the API
        fetch('/api/scheduled-matches')
            .then((response) => response.json())
            .then((data) => {
                // Handle the retrieved scheduled matches
                displayScheduledMatches(data);
            })
            .catch((error) => {
                console.error('Error fetching scheduled matches:', error);
            });
    
        fetch('/api/completed-matches')
            .then((response) => response.json())
            .then((data) => {
                // Handle the retrieved completed matches
                displayCompletedMatches(data);
            })
            .catch((error) => {
                console.error('Error fetching completed matches:', error);
            });
    });
    

function displayScheduledMatches(matches) {
    const matchesContainer = document.getElementById('matchesContainer');
    
    // Clear existing content (if any)
    matchesContainer.innerHTML = '';

    // Iterate through the matches and create HTML elements
    matches.forEach((match) => {
        const matchElement = document.createElement('div');
        matchElement.className = 'match';
        
        // Create elements for match details (date, teams, etc.)
        const dateElement = document.createElement('p');
        const matchDate = new Date(match.date);
        const formattedDate = matchDate.toISOString().split('T')[0]; // Format date as "YYYY-MM-DD"
        dateElement.textContent = `Date: ${formattedDate}`;
        matchElement.appendChild(dateElement);
        
        const timeElement = document.createElement('p');
        timeElement.textContent = `Time: ${match.time}`;
        matchElement.appendChild(timeElement);
        
        const locationElement = document.createElement('p');
        locationElement.textContent = `Location: ${match.location}`;
        matchElement.appendChild(locationElement);

        const teamsElement = document.createElement('p');
        teamsElement.textContent = `Teams: ${match.team1} vs ${match.team2}`;
        matchElement.appendChild(teamsElement);

        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update Match';

        // Add a click event listener to navigate to updateform.html
        updateButton.addEventListener('click', () => {
            // Pass the `match` object to the updateform.html page
            sessionStorage.setItem('updateMatch', JSON.stringify(match));
            window.location.href = 'updateform.html'; // Navigate to updateform.html
        });
        matchElement.appendChild(updateButton);
        // Add more elements for other match details as needed
        
        matchesContainer.appendChild(matchElement);
    });
}

function handleUpdateMatch(match) {
    // Step 3: Populate the update form with current match details
    const updateForm = document.getElementById('updateForm');
    updateForm.style.display = 'block'; // Show the update form

    // Populate form fields with current match details
    document.getElementById('updateDate').value = match.date;
    document.getElementById('updateTime').value = match.time;
    document.getElementById('updateTeam1').value = match.team1;
    document.getElementById('updateTeam2').value = match.team2;
    document.getElementById('updateLocation').value = match.location;
    document.getElementById('updateMatch_id').value = match.match_id;
    document.getElementById('updateStatus').value = match.status;
    document.getElementById('updateDescription').value = match.description;
    document.getElementById('updateResult').value = match.result;
    // Add more fields as needed
}

document.getElementById('updateForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // Get updated form data
    const updatedMatchData = {
        match_id: document.getElementById('updateMatchID').value,
        date: document.getElementById('updateDate').value,
        time: document.getElementById('updateTime').value,
        team1: document.getElementById('updateTeam1').value,
        team2: document.getElementById('updateTeam2').value,
        location: document.getElementById('updateLocation').value,
        status: document.getElementById('updateStatus').value,
        description: document.getElementById('updateDescription').value,
        result: document.getElementById('updateResult').value,
        // Add more fields as needed
    };

    // Send a request to the server to update the match details
    fetch('/api/update-match', {
        method: 'POST',
        body: JSON.stringify(updatedMatchData),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.error) {
            console.error('Error:', data.error);
        } else {
            console.log('Match updated successfully');
            // Optionally, you can update the UI to reflect the changes
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});


function displayCompletedMatches(completedMatches) {
    const pastMatchesContainer = document.getElementById('pastmatchesContainer');

    // Clear existing content (if any)
    pastMatchesContainer.innerHTML = '';

    // Iterate through the completed matches and create HTML elements
    completedMatches.forEach((match) => {
        const matchElement = document.createElement('div');
        matchElement.className = 'previous-matches'; // Apply appropriate CSS class

        // Create elements for match details (date, teams, result, etc.)
        const dateElement = document.createElement('p');
        const matchDate = new Date(match.date);
        const formattedDate = matchDate.toISOString().split('T')[0]; // Format date as "YYYY-MM-DD"
        dateElement.textContent = `Date: ${formattedDate}`;
        matchElement.appendChild(dateElement);
        
        const locationElement = document.createElement('p');
        locationElement.textContent = `Location: ${match.location}`;
        matchElement.appendChild(locationElement);

        const teamsElement = document.createElement('p');
        teamsElement.textContent = `Teams: ${match.team1} vs ${match.team2}`;
        matchElement.appendChild(teamsElement);

        const resultsElement = document.createElement('p');
        resultsElement.textContent = `Result: ${match.result}`;
        matchElement.appendChild(resultsElement);

        const descriptionElement = document.createElement('p');
        descriptionElement.textContent = `Description: ${match.description}`;
        matchElement.appendChild(descriptionElement);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Match';
        deleteButton.addEventListener('click', () => {
            deleteMatch(match.match_id); // Call the deleteMatch function
        });
        matchElement.appendChild(deleteButton);
        // Add more elements for other match details as needed

        pastMatchesContainer.appendChild(matchElement);
    });
}

function deleteMatch(matchId) {
    // Send a DELETE request to the server to delete the match
    fetch(`/api/delete-match/${matchId}`, {
        method: 'DELETE',
    })
    .then((response) => {
        if (response.ok) {
            // Remove the deleted match element from the UI
            const matchElement = document.querySelector(`.match[data-match-id="${matchId}"]`);
            if (matchElement) {
                matchElement.remove();
            }
        } else {
            console.error('Error deleting match:', response.statusText);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}










