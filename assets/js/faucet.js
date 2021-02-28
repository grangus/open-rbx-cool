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

    let response = await fetch(`${protocol}//api.rbx.cool/promotions/faucet/info`, {
        headers: {
            'authorization': token
        }
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    $('#award').text(`R$${json.data.award.toLocaleString()}`);
    $('#entered').text(json.data.entries.toLocaleString());
    $('#ending').text(json.data.endsIn);
    $('#last').text(json.data.lastWinner);

    $('#enterBtn').click(async () => {
        let captchaResult = $('[title="widget containing checkbox for hCaptcha security challenge"]').attr('data-hcaptcha-response');

        if(!captchaResult) return showError('Please solve the captcha first!');

        let response = await fetch(`${protocol}//api.rbx.cool/promotions/faucet/enter`, {
            method: 'POST',
            headers: {
                'authorization': token,
                'content-type': 'application/json',
                'fp': fp
            },
            body: JSON.stringify({
                captchaToken: captchaResult
            })
        });

        let json = await response.json();

        if (response.status !== 200) return showError(json.error.message);

        showSuccess(json.data.message, true);
    });
});