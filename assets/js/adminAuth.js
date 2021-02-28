let siteCaptchaKey = '6Ld23NkUAAAAABDh7m17tDDwAdUDRwNb-9Tk0jbp';
let protocol = window.location.protocol;
let token = localStorage.getItem('atoken');

$(document).ready(async () => {
    let fp;
    let blockerEnabled = true;

    if (token) {
        let response = await fetch(`${protocol}//api.rbx.cool/admin/current`, {
            headers: {
                'authorization': token
            }
        });

        let json = await response.json();

        if (response.status == 200) return document.location.href = '/admin/info';
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

    const postLogin = async () => {
        let user = $('#userInput').val();
        let password = $('#passwordInput').val();
        let captchaResult = await grecaptcha.execute(siteCaptchaKey);

        let response = await fetch(`${protocol}//api.rbx.cool/admin/authentication/login`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'fp': fp
            },
            body: JSON.stringify({
                user: user,
                password: password,
                captchaToken: captchaResult
            })
        }).catch(error => {
            return console.log(`[ERROR]: ${error}`);
        });

        let json = await response.json();

        if (response.status !== 200) return showError(json.error.message);

        localStorage.setItem('atoken', json.data.token);
        document.location.href = '/admin/info';
    };

    $('#loginForm').submit(async (event) => {
        postLogin();
        event.preventDefault();
    });
})