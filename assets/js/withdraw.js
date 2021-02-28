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
    } else {
        return document.location.href = '/login';
    }

    let statsResponse = await fetch(`${protocol}//api.rbx.cool/stats/site`);

    let statsJson = await statsResponse.json();

    if (statsResponse.status == 200) {
        $('#stock').text(`R$${statsJson.data.stock.toLocaleString()}`);
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

    $('#withdrawForm').submit((event) => {
        postWithdraw();
        event.preventDefault();
    });
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