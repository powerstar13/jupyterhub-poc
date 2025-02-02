import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://192.168.35.203:30000',
    realm: 'jhipster',
    clientId: 'web'
});

document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('auth-btn');
    if (!authButton) {
        console.error("Auth button not found!");
        return;
    }

    // Check if the user is already authenticated
    keycloak.init({ onLoad: 'check-sso', checkLoginIframe: false })
        .then(authenticated => {
            if (authenticated) {
                console.log("User is authenticated.");
                console.log("keycloak info:", keycloak);
                document.cookie = `token=${keycloak.token}`;
                updateUIForAuthenticatedUser();
            } else {
                console.log("User is not authenticated.");
                authButton.textContent = 'Login with Keycloak';
                authButton.addEventListener('click', () => {
                    keycloak.login();
                });
            }
        })
        .catch(error => {
            console.error("Keycloak init error:", error);
        });
});

function updateUIForAuthenticatedUser() {
    const authButton = document.getElementById('auth-btn');
    authButton.textContent = 'Logout';
    authButton.addEventListener('click', () => {
        keycloak.logout();
        deleteCookie('token');
    });

    const token = getCookie('token');
    fetchUserJupyterLab(token);
}

function deleteCookie(name) {
    document.cookie = name + '=; Max-Age=0; path=/';
}

function fetchUserJupyterLab(token) {
    fetch('http://192.168.35.203:30000/realms/jhipster/protocol/openid-connect/userinfo', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(user => {
        console.log('Logged in user:', user);
        displayUserInfo(user);
        if (user.preferred_username) {
            fetchJupyterHubApiToken(token)
                .then(apiToken => {
                    fetchCurrentUserJupyterHub(apiToken)
                        .then(() => {
                            fetchUserJupyterLabs(user.preferred_username, apiToken);
                        })
                        .catch(error => {
                            console.error('Error fetching current JupyterHub user info:', error);
                        });
                })
                .catch(error => {
                    console.error('Error fetching JupyterHub API token:', error);
                });
        } else {
            console.error('No preferred_username found');
        }
    })
    .catch(error => console.error('Error fetching user info:', error));
}

function fetchJupyterHubApiToken(token) {
    return fetch('http://192.168.35.203:30002/hub/api/authorizations/token', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            note: 'API token for accessing JupyterHub',
            expires_in: 3600, // 1 hour
            scopes: ['inherit']
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => data.token);
}

function fetchCurrentUserJupyterHub(apiToken) {
    return fetch('http://192.168.35.203:30002/hub/api/user', {
        headers: {
            'Authorization': `Bearer ${apiToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Current JupyterHub user info:', data);
        displayJupyterHubUserInfo(data);
    });
}

function fetchUserJupyterLabs(username, apiToken) {
    fetch(`http://192.168.35.203:30002/hub/api/users/${username}`, {
        headers: {
            'Authorization': `Bearer ${apiToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Fetched JupyterLab info for user:', data);
        renderJupyterLabList(data);
    })
    .catch(error => console.error('Error fetching JupyterLab info:', error));
}

function displayUserInfo(user) {
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.innerHTML = `
        <p>Name: ${user.name}</p>
        <p>Username: ${user.preferred_username}</p>
        <p>Email: ${user.email}</p>
    `;
}

function displayJupyterHubUserInfo(data) {
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.innerHTML += `
        <p>JupyterHub Admin: ${data.admin}</p>
    `;
}

function renderJupyterLabList(userData) {
    const container = document.getElementById('container');
    container.innerHTML = '';

    if (!userData || !userData.server) {
        container.innerHTML = 'No JupyterLab instances found.';
        return;
    }

    const btn = document.createElement('button');
    btn.textContent = `Open JupyterLab - ${userData.server.name}`;
    btn.addEventListener('click', () => {
        window.open(`http://192.168.35.203:30002/user/${userData.server.name}/lab`, '_blank');
    });
    container.appendChild(btn);
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}