let protocol = window.location.protocol;
let token = localStorage.getItem('token');

$(document).ready(async () => {
    if (token) {
        let response = await fetch(`${protocol}//api.rbx.cool/users/me`, {
            headers: {
                'authorization': token
            }
        });

        let json = await response.json();

        if (response.status !== 200) return document.location.href = '/login';

        this.user = json.data;
    } else {
        return document.location.href = '/login';
    }

    $('#username').text(this.user.username);
    $('#email').text(this.user.email || 'None');
    $('#balance').text(`R$${(this.user.balance + this.user.purchasedBalance + this.user.entryBalance).toLocaleString()}`);
    $('#referrals').text(this.user.referrals);
    $('#pending').text(`R$${this.user.pendingBalance}`);
    $('#referralBtn').attr('data-clipboard-text', `${protocol}//${window.location.hostname}/register?ref=${this.user._id}`);

    new ClipboardJS('#referralBtn');
});


const postPasswordChange = async () => {
    const currentPassword = $('#currentPasswordInput').val();
    const newPassword = $('#newPasswordInput').val();

    let response = await fetch(`${protocol}//api.rbx.cool/users/me/password/change`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    localStorage.setItem('token', json.data.authorization);

    showSuccess(json.data.message, true);
};

const postEmailChange = async () => {
    let password = $('#currentEmailPasswordInput').val();
    let email = $('#newEmailInput').val();

    let response = await fetch(`${protocol}//api.rbx.cool/users/me/email/update`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

$('#passwordChangeForm').submit((event) => {
    postPasswordChange();
    event.preventDefault();
});

$('#emailChangeForm').submit((event) => {
    postEmailChange();
    event.preventDefault();
});

$('#logoutHeaderBtn').click(async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/users/me/logout`, {
        method: 'POST',
        headers: {
            'authorization': token
        }
    });

    let json = await response.json();

    if(response.status !== 200) return showError(json.error.message);

    localStorage.removeItem('token');
    document.location.href = '/login';
});