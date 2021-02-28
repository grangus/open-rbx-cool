let siteCaptchaKey = '6Ld23NkUAAAAABDh7m17tDDwAdUDRwNb-9Tk0jbp';
let protocol = window.location.protocol;
let token = localStorage.getItem('token');
let fp;
let blockerEnabled = true;

$(document).ready(async () => {
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

    const postRecovery = async () => {
        let captchaResult = await grecaptcha.execute(siteCaptchaKey);
        let email = $('#emailInput').val();
    
        let response = await fetch(`${protocol}//api.rbx.cool/recovery/send`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'fp': fp
            },
            body: JSON.stringify({
                email: email,
                captchaToken: captchaResult
            })
        }).catch(error => {
            return console.log(`[ERROR]: ${error}`);
        });

        let json = await response.json();

        if(response.status !== 200) return showError(json.error.message);

        showSuccess(json.data.message);
    };
    
    $('#recoveryForm').submit((event) => {
        postRecovery();
        event.preventDefault();
    });
});