$(document).ready(async () => {
    let siteCaptchaKey = '6Ld23NkUAAAAABDh7m17tDDwAdUDRwNb-9Tk0jbp';
    let protocol = window.location.protocol;
    let token = localStorage.getItem('token');
    let fp;
    let blockerEnabled = true;

    if (token) {
        let response = await fetch(`${protocol}//api.rbx.cool/users/me`, {
            headers: {
                'authorization': token
            }
        });

        if (response.status == 200) {
            let json = await response.json();
            localStorage.setItem("uid", json.data._id);
            return document.location.href = '/dashboard';
        }

        
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


    const postRegister = async () => {
        let user = $('#userInput').val();
        let email = $('#emailInput').val();
        let password = $('#passwordInput').val();
        let referral = new URLSearchParams(window.location.search).get('ref');
        let captchaResult = await grecaptcha.execute(siteCaptchaKey);
        
        const params = new URLSearchParams(window.location.search);
        const bt = params.get('bt');

        let postData = {
            user: user,
            password: password,
            captchaToken: captchaResult
        };

        if (email) {
            postData.email = email;
        }

        if (referral) {
            postData.ref = referral;
        }

        let response = await fetch(`${protocol}//api.rbx.cool/authentication/register${bt ? `?bt=${bt}` : ""}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'fp': fp
            },
            body: JSON.stringify(postData)
        }).catch(error => {
            return console.log(`[ERROR]: ${error}`);
        });

        let json = await response.json();

        if (response.status !== 200) return showError(json.error.message);

        localStorage.setItem('token', json.data.token);
        localStorage.setItem("uid", json.data._id);
        document.location.href = '/dashboard';
    };

    const postLogin = async () => {
        let user = $('#userInput').val();
        let password = $('#passwordInput').val();
        let captchaResult = await grecaptcha.execute(siteCaptchaKey);

        let response = await fetch(`${protocol}//api.rbx.cool/authentication/login`, {
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

        if(response.status == 201) return document.location.href = json.url;

        if (response.status !== 200) return showError(json.error.message);

        localStorage.setItem('token', json.data.token);
        localStorage.setItem("uid", json.data._id);
        
        document.location.href = '/dashboard';
    };

    $('#registerForm').submit((event) => {
        postRegister();
        event.preventDefault();
    });

    $('#loginForm').submit(async (event) => {
        postLogin();
        event.preventDefault();
    });
});