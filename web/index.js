import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://192.168.64.1:30000',
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
    });

    // 사용자 정보 가져오기
    const userInfo = keycloak.tokenParsed;
    const userInfoDiv = document.getElementById('user-info');
    const usernameSpan = document.getElementById('username');
    const emailSpan = document.getElementById('email');

    usernameSpan.textContent = userInfo.preferred_username;
    emailSpan.textContent = userInfo.email;
    userInfoDiv.style.display = 'block';

    // JupyterHub 서버 목록 가져오기
    getUserServers(userInfo.preferred_username);
}

const jupyterHubAPItoken = '7c7221f1293444a480ac2c7e6da3ffb4';

async function getUserServers(username) {
    const response = await fetch(`http://192.168.64.1:30002/hub/api/users/${username}?include_stopped_servers=true`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${jupyterHubAPItoken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        console.error("Failed to fetch JupyterHub servers:", response.statusText);
        return;
    }

    const userData = await response.json();
    displayServers(userData.servers);
}

function displayServers(servers) {
    const serversDiv = document.getElementById('servers');
    const tbody = document.getElementById('servers-tbody');
    const templateRow = document.getElementById('server-row-template');
    tbody.innerHTML = ''; // Clear existing rows

    for (const [serverName, serverInfo] of Object.entries(servers)) {
        const status = serverInfo.ready ? (serverInfo.stopped ? 'Stopped' : 'Running') : (serverInfo.pending || 'Pending');
        const row = templateRow.cloneNode(true);
        row.style.display = '';
        row.querySelector('.server-name').textContent = serverInfo.name || '기본';
        row.querySelector('.server-full-name').textContent = serverInfo.full_name;
        row.querySelector('.server-last-activity').textContent = serverInfo.last_activity || 'N/A';
        row.querySelector('.server-started').textContent = serverInfo.started || 'N/A';
        const urlCell = row.querySelector('.server-url a');
        urlCell.href = `http://192.168.64.1:30002${serverInfo.url}`;
        urlCell.textContent = serverInfo.url;
        row.querySelector('.server-profile').textContent = (serverInfo.user_options && serverInfo.user_options.profile) || 'N/A';
        row.querySelector('.server-status').textContent = status;
        tbody.appendChild(row);
    }

    serversDiv.style.display = 'block';
}