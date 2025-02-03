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
    displayServers(userData.servers, username);
}

function displayServers(servers, username) {
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
        if (status !== 'Running') {
            urlCell.style.pointerEvents = 'none';
            urlCell.style.color = 'gray';
        } else {
            urlCell.style.pointerEvents = 'auto';
            urlCell.style.color = 'blue';
        }
        row.querySelector('.server-profile').textContent = (serverInfo.user_options && serverInfo.user_options.profile) || 'N/A';
        row.querySelector('.server-status').textContent = status;

        const actionsCell = row.querySelector('.server-actions');
        actionsCell.innerHTML = ''; // Clear existing actions

        if (status === 'Running') {
            const stopButton = document.createElement('button');
            stopButton.textContent = 'Stop';
            stopButton.addEventListener('click', () => stopServer(username, serverName));
            actionsCell.appendChild(stopButton);
        } else {
            const startButton = document.createElement('button');
            startButton.textContent = 'Start';
            startButton.addEventListener('click', () => startServer(username, serverName));
            actionsCell.appendChild(startButton);

            if (serverName !== "") {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteServer(username, serverName));
                actionsCell.appendChild(deleteButton);
            } else {
                row.addEventListener('mouseenter', (event) => {
                    const tooltip = document.createElement('div');
                    tooltip.textContent = '기본 서버는 삭제할 수 없습니다.';
                    tooltip.style.position = 'fixed';
                    tooltip.style.backgroundColor = 'yellow';
                    tooltip.style.border = '1px solid black';
                    tooltip.style.padding = '5px';
                    tooltip.style.zIndex = '1000';
                    tooltip.style.left = `${event.clientX + 10}px`;
                    tooltip.style.top = `${event.clientY + 10}px`;
                    document.body.appendChild(tooltip);
                    row.tooltip = tooltip;
                });

                row.addEventListener('mousemove', (event) => {
                    if (row.tooltip) {
                        row.tooltip.style.left = `${event.clientX + 10}px`;
                        row.tooltip.style.top = `${event.clientY + 10}px`;
                    }
                });

                row.addEventListener('mouseleave', () => {
                    if (row.tooltip) {
                        document.body.removeChild(row.tooltip);
                        row.tooltip = null;
                    }
                });
            }
        }

        tbody.appendChild(row);
    }

    serversDiv.style.display = 'block';
}

function showLoadingIcon() {
    const loadingIcon = document.getElementById('loading-icon');
    loadingIcon.style.display = 'block';
}

function hideLoadingIcon() {
    const loadingIcon = document.getElementById('loading-icon');
    loadingIcon.style.display = 'none';
}

async function startServer(username, serverName) {
    showLoadingIcon();
    const response = await fetch(`http://192.168.64.1:30002/hub/api/users/${username}/servers/${serverName}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${jupyterHubAPItoken}`,
            'Content-Type': 'application/json'
        }
    });
    hideLoadingIcon();

    if (!response.ok) {
        console.error("Failed to start server:", response.statusText);
        return;
    }

    // 서버 목록을 다시 가져와서 업데이트
    getUserServers(username);
}

async function stopServer(username, serverName) {
    showLoadingIcon();
    const response = await fetch(`http://192.168.64.1:30002/hub/api/users/${username}/servers/${serverName}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${jupyterHubAPItoken}`,
            'Content-Type': 'application/json'
        }
    });
    hideLoadingIcon();

    if (!response.ok) {
        console.error("Failed to stop server:", response.statusText);
        return;
    }

    // 서버 목록을 다시 가져와서 업데이트
    getUserServers(username);
}

async function deleteServer(username, serverName) {
    showLoadingIcon();
    const response = await fetch(`http://192.168.64.1:30002/hub/api/users/${username}/servers/${serverName}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${jupyterHubAPItoken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ remove: true })
    });
    hideLoadingIcon();

    if (!response.ok) {
        console.error("Failed to delete server:", response.statusText);
        return;
    }

    // 서버 목록을 다시 가져와서 업데이트
    getUserServers(username);
}