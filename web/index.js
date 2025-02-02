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
                document.cookie = `token=${keycloak.token}`;
                updateUIForAuthenticatedUser();
            } else {
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

function fetchUserJupyterLab(token) {
    fetch('http://192.168.35.203:30000/realms/jhipster/protocol/openid-connect/userinfo', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(user => {
        displayUserInfo(user);
        if (user.preferred_username) {
            fetchCurrentUserJupyterHub(user.preferred_username, token)
                .then(() => {
                    fetchUserJupyterLabs(user.preferred_username, token);
                })
                .catch(error => {
                    console.error('Error fetching current JupyterHub user info:', error);
                });
        } else {
            console.error('No preferred_username found');
        }
    })
    .catch(error => console.error('Error fetching user info:', error));
}

function fetchCurrentUserJupyterHub(username, token) {
    return fetch(`http://192.168.35.203:8000/hub/api/users/${username}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Current JupyterHub user info:', data);
    })
    .catch(error => {
        console.error('Error fetching current JupyterHub user info:', error);
    });
}

function fetchUserJupyterLabs(username, token) {
    fetch(`http://192.168.35.203:8000/user/${username}/api/sessions`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(sessions => {
        displayJupyterLabs(sessions);
    })
    .catch(error => {
        console.error('Error fetching JupyterLab sessions:', error);
    });
}

function displayUserInfo(user) {
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.innerHTML = `<p>Welcome, ${user.name} (${user.email})</p>`;
}

function displayJupyterLabs(sessions) {
    const container = document.getElementById('container');
    container.innerHTML = '<h2>JupyterLab Sessions</h2>';
    const list = document.createElement('ul');
    sessions.forEach(session => {
        const listItem = document.createElement('li');
        listItem.textContent = `Session: ${session.name}`;
        list.appendChild(listItem);
    });
    container.appendChild(list);
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}