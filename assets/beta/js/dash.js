let siteCaptchaKey = '6Ld23NkUAAAAABDh7m17tDDwAdUDRwNb-9Tk0jbp';
let protocol = window.location.protocol;
let token = localStorage.getItem('token');

$(document).ready(async () => {
    let fp;
    let blockerEnabled = true;

    if (token) {
        let response = await fetch(`${protocol}//api.rbx.cool/users/me`, {
            headers: {
                'authorization': token
            }
        });

        let json = await response.json();

        if (response.status !== 200) return document.location.href = '/login';

        this.user = json.data;

        $('#balance').text(`R$${(this.user.balance + this.user.purchasedBalance + this.user.entryBalance).toLocaleString()}`);
        $('#pending').text(`R$${this.user.pendingBalance.toLocaleString()}`);
        $('#stock').text(`R$${this.user.stock.toLocaleString()}`);
        $('#referrals').text(`${this.user.referrals.toLocaleString()}`);
        $('#referralBtn').attr('data-clipboard-text', `https://ref.rbx.cool/r/${this.user.username}`);
        
        $('#loginBtnLink').hide();
        $('#registerBtnLink').hide();
        new ClipboardJS('#referralBtn');
    } else {
        return document.location.href = '/login';
    }

    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            if (typeof (Fingerprint2) == 'undefined') return showError('Disable your ad blocker and refresh the page to continue!');

            Fingerprint2.get((components) => {
                fp = Fingerprint2.x64hash128(components.map((p) => { return p.value; }).join(), 31);
                blockerEnabled = components.find(c => c.key == 'adBlock').value;
                if (!fp || blockerEnabled == true) return showError('Disable your ad blocker and refresh the page to continue!');
            });
        });
    } else {
        setTimeout(() => {
            if (typeof (Fingerprint2) == 'undefined') return showError('Disable your ad blocker and refresh the page to continue!');

            Fingerprint2.get((components) => {
                fp = Fingerprint2.x64hash128(components.map((p) => { return p.value; }).join(), 31);
                blockerEnabled = components.find(c => c.key == 'adBlock').value;
                if (!fp || blockerEnabled == true) return showError('Disable your ad blocker and refresh the page to continue!');
            });
        }, 500)
    }

    const postCode = async () => {
        let captchaResult = $('#codeRedeem iframe').attr('data-hcaptcha-response');

        if (!captchaResult) return showError('Please solve the captcha first!');

        let code = $('#promocodeInput').val();

        let response = await fetch(`${protocol}//api.rbx.cool/promotions/code/redeem`, {
            method: 'POST',
            headers: {
                'authorization': token,
                'content-type': 'application/json',
                'fp': fp
            },
            body: JSON.stringify({
                code: code,
                captchaToken: captchaResult
            })
        });

        let json = await response.json();

        if (response.status !== 200) return showError(json.error.message);

        showSuccess(json.data.message, true);
    };

    const postWithdraw = async () => {
        let amount = $('#amountInput').val();
        let username = $('#userInput').val();

        let response = await fetch(`${protocol}//api.rbx.cool/transactions/create`, {
            method: 'POST',
            headers: {
                'authorization': token,
                'fp': fp,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                username: username
            })
        });

        let json = await response.json();
    
        if(response.status == 409) return showCancelConfirmation(json.error.message);
        
        if (response.status !== 200) return showError(json.error.message);
    
        getConfirmation(json.data);
    };

    const postEmailChange = async () => {
        let email = $('#newEmailInput').val();
        let password = $('#emailPasswordInput').val();

        let response = await fetch(`${protocol}//api.rbx.cool/users/me/email/update`, {
            method: 'POST',
            headers: {
                'authorization': token,
                'content-type': 'application/json',
                'fp': fp
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        let json = await response.json();

        if (response.status !== 200) return showError(json.error.message);

        showSuccess(json.data.message, false);
    };

    const postPasswordChange = async () => {
        let currentPassword = $('#currentPasswordInput').val();
        let newPassword = $('#newPasswordInput').val();

        let response = await fetch(`${protocol}//api.rbx.cool/users/me/password/change`, {
            method: 'POST',
            headers: {
                'authorization': token,
                'content-type': 'application/json',
                'fp': fp
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        let json = await response.json();

        if (response.status !== 200) return showError(json.error.message);

        showSuccess(json.data.message, false);
    };

    $('#withdrawForm').submit((event) => {
        postWithdraw();
        event.preventDefault();
    });

    $('#redemptionForm').submit((event) => {
        postCode();
        event.preventDefault();
    });

    $('#emailForm').submit((event) => {
        postEmailChange();
        event.preventDefault();
    });

    $('#passwordForm').submit((event) => {
        postPasswordChange();
        event.preventDefault();
    });


    if (this.user.latestTransactions.length > 0) {
        this.user.latestTransactions.forEach(transaction => {
            $('.transaction-list').append(`
                <li class="transaction-item">
                    <div class="transaction-header">
                        <span class="transaction-type">${transaction.type}</span>
                        <b class="transaction-amount ${transaction.color}">${transaction.amount}</b>
                        to
                        <span class="transaction-destination">${transaction.destination}</span>
                    </div>
                    <span class="transaction-date">${Number.isInteger(transaction.time) ? moment(transaction.time).format('LLL') : transaction.time}</span>
                </li>
            `);
        });

        $('.transaction-list').removeClass('d-none');
        $('.no-transactions').addClass('d-none');
    }
});

$('#logoutHeaderBtn').click(async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/users/me/logout`, {
        method: 'POST',
        headers: {
            'authorization': token
        }
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    localStorage.removeItem('token');
    document.location.href = '/login';
});