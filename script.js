// Function to format date to a readable string
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
}

// Function to fetch data for a given GitHub login
async function fetchData(ghLogin) {
    try {
        let response = await fetch(`https://lengthylyova.pythonanywhere.com/api/gh-contrib-graph/fetch-data/?githubLogin=${ghLogin}`, { method: 'GET' });
        let data = await response.json();
        return data['data']['user'];
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Function to reinitialize the graph
function reinitializeGraph(ghLogin, callback) {
    fetchData(ghLogin).then(data => {
        const container = document.getElementById("gh");
        container.innerHTML = '';

        if (data) {
            const calendar = data["contributionsCollection"] ? data["contributionsCollection"]["contributionCalendar"] : {};
            const [table, thead, tbody] = init_table();
            const card = init_card();
            const canvas = init_canvas();
            const header = init_header(calendar["totalContributions"] || 0, ghLogin, data["avatarUrl"] || "images/user.jpeg");
            const footer = init_card_footer();
            const thumbnail = init_thumbnail();

            addWeeks(tbody, calendar["weeks"] || [], calendar["colors"] || []);
            addMonths(thead, calendar["months"] || []);
            canvas.appendChild(table);
            canvas.appendChild(footer);
            card.appendChild(canvas);
            container.appendChild(header);
            container.appendChild(card);
            container.appendChild(thumbnail);

            if (callback && typeof callback === 'function') {
                callback();
            }
        } else {
            container.innerHTML = '<p class="text-white">User not found or data is unavailable.</p>';
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const ghElement = document.getElementById('gh');
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-login') {
                const newGhLogin = mutation.target.getAttribute('data-login');
                reinitializeGraph(newGhLogin, removeThumbnails);
            }
        });
    });

    observer.observe(ghElement, {
        attributes: true
    });

    const initialGhLogin = ghElement.getAttribute('data-login');
    reinitializeGraph(initialGhLogin, removeThumbnails);

    document.querySelector("form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = document.getElementById("search").value.trim();

        if (user === "") {
            document.getElementById("name").textContent = 'User Details';
            elementChange()
            return;
        }

        try {
            const url = `https://api.github.com/users/${user}`;
            const request = await fetch(url);
            if (request.ok) {
                const data = await request.json();
                document.getElementById("image").setAttribute("src", data.avatar_url || "images/user.jpeg");
                document.getElementById("image").onerror = () => document.getElementById("image").setAttribute("src", "images/user.jpeg");

                document.getElementById("name").textContent = `${data.login || 'User Details'}`;
                document.getElementById("bio").textContent = `${data.bio || ''}`;
                document.getElementById("repos").textContent = `Public Repos: ${data.public_repos || ''}`;
                document.getElementById("followers").textContent = `Followers: ${data.followers || ''}`;
                document.getElementById("following").textContent = `Following: ${data.following || ''}`;
                document.getElementById("created").textContent = `Created: ${formatDate(data.created_at) || ''}`;
                document.getElementById("updated").textContent = `Updated: ${formatDate(data.updated_at) || ''}`;
                document.getElementById("link").setAttribute("href", data.html_url || '#');

                document.getElementById("stats").setAttribute(
                    "src",
                    `https://github-readme-stats.vercel.app/api?username=${data.login}&show_icons=true&theme=dark&include_all_commits=true`
                );

                ghElement.setAttribute('data-login', data.login);
            } else {
                document.getElementById("name").textContent = 'User Not Found'; 
                elementChange()
                
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            document.getElementById("name").textContent = 'Error';
            elementChange()
            
        }
    });
});

function elementChange(){
    document.getElementById("image").setAttribute("src", "user.jpeg");
    document.getElementById("bio").textContent = '';
    document.getElementById("repos").textContent = 'Public Repos: ';
    document.getElementById("followers").textContent = 'Followers: ';
    document.getElementById("following").textContent = 'Following: ';
    document.getElementById("created").textContent = 'Created: ';
    document.getElementById("updated").textContent = 'Updated: ';
    document.getElementById("link").setAttribute("href", '#');
    document.getElementById("stats").setAttribute("src", "");
}

// Function to remove all 'ghThumbNail' elements
function removeThumbnails() {
    const ghThumbnails = document.querySelectorAll('.ghThumbNail');
    ghThumbnails.forEach(function (element) {
        element.remove();
    });
}
