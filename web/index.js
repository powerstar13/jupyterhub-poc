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
    const userInfoDiv = document.createElement('div');
    userInfoDiv.id = 'user-info';
    userInfoDiv.innerHTML = `
        <p><strong>Username:</strong> ${userInfo.preferred_username}</p>
        <p><strong>Email:</strong> ${userInfo.email}</p>
        <p><strong>Full Name:</strong> ${userInfo.name}</p>
    `;
    document.body.appendChild(userInfoDiv);
}