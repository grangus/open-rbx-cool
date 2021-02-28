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

    const postReset = async () => {
        let code = $('#codeInput').val();
    
        let response = await fetch(`${protocol}//api.rbx.cool/recovery/${code}`, {
            method: 'POST',
            headers: {
                'fp': fp
            }
        }).catch(error => {
            return console.log(`[ERROR]: ${error}`);
        });

        let json = await response.json();

        if(response.status !== 200) return showError(json.error.message);

        showSuccess(json.data.message);
    };
    
    $('#resetForm').submit((event) => {
        postReset();
        event.preventDefault();
    });
});