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

    const postCode = async () => {
        let captchaResult = $('#codeRedeem iframe').attr('data-hcaptcha-response');

        if(!captchaResult) return showError('Please solve the captcha first!');

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

    $('#dailyRewardRedeem').click(async () => {
        let captchaResult = $('#dailyRedeem iframe').attr('data-hcaptcha-response');

        if(!captchaResult) return showError('Please solve the captcha first!');

        let response = await fetch(`${protocol}//api.rbx.cool/promotions/daily/redeem`, {
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

    $('#redemptionForm').submit((event) => {
        postCode();
        event.preventDefault();
    });


    try {
        let ayetResponse = await fetch(`${protocol}//api.rbx.cool/offerwall/ayet`, { headers: { 'authorization': token } });
        let ayetJson = await ayetResponse.json();

        if (!ayetJson.error) {
            if (ayetJson.data.length > 1) {
                ayetJson.data.forEach(offer => {
                    $('#ayetLoading').hide();
                    $('#ayetDynamicContent').append(`
                    <div class="col-lg-6 mb-4">
                        <div class="card bg-white border-0 shadow-lg">
                            <div class="row">
                                <div class="col-lg-4">
                                    <img src="${offer.icon}" alt=""
                                        class="img-fluid rb">
                                </div>
                                <div class="col-lg-8">
                                    <h4 class="px-3 py-1 mr-lg-4">${offer.name}</h4>
                                    <h6 class="mr-lg-4">${offer.conversion_instructions_short}</h6>
                                    <a class="btn btn-50 grad-success text-white mb-2 mr-lg-4" href="${offer.tracking_link.replace(/{subid}/, this.user._id)}" target="_blank">Start - <b>R$${offer.payout_usd}</b></a>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                });
            } else {
                $('#ayetLoading').hide();
                $('#ayetNoContent').show();
            }
        }
    } catch (error) {
        console.log(error);
    }

    try {
        let adgateResponse = await fetch(`${protocol}//api.rbx.cool/offerwall/adgate`, { headers: { 'authorization': token } });
        let adgateJson = await adgateResponse.json();

        if (!adgateJson.error) {
            if (adgateJson.data.length > 1) {
                $('#adgateLoading').hide();
                adgateJson.data.forEach(offer => {
                    $('#adgateDynamicContent').append(`
                    <div class="col-lg-6 mb-4">
                        <div class="card bg-white border-0 shadow-lg">
                            <div class="row">
                                <div class="col-lg-4">
                                    <img src="${offer.icon_url}" alt=""
                                        class="img-fluid rb">
                                </div>
                                <div class="col-lg-8">
                                    <h4 class="px-3 py-1 mr-lg-4">${offer.anchor}</h4>
                                    <h6 class="mr-lg-4">${offer.requirements}</h6>
                                    <a class="btn btn-50 grad-success text-white mb-2 mr-lg-4" href="${offer.click_url}" target="_blank">Start - <b>R$${offer.points}</b></a>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                });
            } else {
                $('#adgateLoading').hide();
                $('#adgateNoContent').show();
            }
        }
    } catch (error) {
        console.log(error);
    }

    try {
        let kiwiResponse = await fetch(`${protocol}//api.rbx.cool/offerwall/kiwi`, { headers: { 'authorization': token } });
        let kiwiJson = await kiwiResponse.json();

        if (!kiwiJson.error) {
            if (kiwiJson.data.length > 1) {
                $('#kiwiLoading').hide();
                kiwiJson.data.forEach(offer => {
                    $('#kiwiDynamicContent').append(`
                    <div class="col-lg-6 mb-4">
                        <div class="card bg-white border-0 shadow-lg">
                            <div class="row">
                                <div class="col-lg-4">
                                    <img src="${offer.logo}" alt=""
                                        class="img-fluid rb">
                                </div>
                                <div class="col-lg-8">
                                    <h4 class="px-3 py-1 mr-lg-4">${offer.name}</h4>
                                    <h6 class="mr-lg-4">${offer.instructions}</h6>
                                    <a class="btn btn-50 grad-success text-white mb-2 mr-lg-4" href="${offer.link}" target="_blank">Start - <b>R$${offer.amount}</b></a>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                });
            } else {
                $('#kiwiLoading').hide();
                $('#kiwiNoContent').show();
            }
        }
    } catch (error) {
        console.log(error);
    }

    /*try {
        let ogadsResponse = await fetch(`${protocol}//api.rbx.cool/offerwall/ogads`, { headers: { 'authorization': token } });
        let ogadsJson = await ogadsResponse.json();

        if (!ogadsJson.error) {
            if (ogadsJson.data.length > 1) {
                $('#ogadsLoading').hide();
                ogadsJson.data.forEach(offer => {
                    $('#ogadsDynamicContent').append(`
                    <div class="col-lg-6 mb-4">
                        <div class="card bg-white border-0 shadow-lg">
                            <div class="row">
                                <div class="col-lg-4">
                                    <img src="${offer.picture}" alt=""
                                        class="img-fluid rb">
                                </div>
                                <div class="col-lg-8">
                                    <h4 class="px-3 py-1 mr-lg-4">${offer.name_short}</h4>
                                    <h6 class="mr-lg-4">${offer.adcopy}</h6>
                                    <a class="btn btn-50 grad-success text-white mb-2 mr-lg-4" href="${offer.link}" target="_blank">Start - <b>R$${offer.payout}</b></a>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                });
            } else {
                $('#ogadsLoading').hide();
                $('#ogadsNoContent').show();
            }
        }
    } catch (error) {
        console.log(error);
    }*/

    try {
        let offertoroResponse = await fetch(`${protocol}//api.rbx.cool/offerwall/offertoro`, { headers: { 'authorization': token } });
        let offertoroJson = await offertoroResponse.json();

        if (!offertoroJson.error) {
            if (offertoroJson.data.length > 1) {
                $('#offertoroLoading').hide();
                offertoroJson.data.forEach(offer => {
                    $('#offertoroDynamicContent').append(`
                    <div class="col-lg-6 mb-4">
                        <div class="card bg-white border-0 shadow-lg">
                            <div class="row">
                                <div class="col-lg-4">
                                    <img src="${offer.image_url}" alt=""
                                        class="img-fluid rb">
                                </div>
                                <div class="col-lg-8">
                                    <h4 class="px-3 py-1 mr-lg-4">${offer.offer_name}</h4>
                                    <h6 class="mr-lg-4">${offer.offer_desc}</h6>
                                    <a class="btn btn-50 grad-success text-white mb-2 mr-lg-4" href="${offer.offer_url.replace('[USER_ID]', this.user._id)}" target="_blank">Start - <b>R$${offer.payout}</b></a>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                });
            } else {
                $('#offertoroLoading').hide();
                $('#offertoroNoContent').show();
            }
        }
    } catch (error) {
        console.log(error);
    }

    try {
        let adgemResponse = await fetch(`${protocol}//api.rbx.cool/offerwall/adgem`, { headers: { 'authorization': token } });
        let adgemJson = await adgemResponse.json();

        if (!adgemJson.error) {
            if (adgemJson.data.length > 1) {
                $('#adgemLoading').hide();
                adgemJson.data.forEach(offer => {
                    $('#adgemDynamicContent').append(`
                    <div class="col-lg-6 mb-4">
                        <div class="card bg-white border-0 shadow-lg">
                            <div class="row">
                                <div class="col-lg-4">
                                    <img src="${offer.icon}" alt=""
                                        class="img-fluid rb">
                                </div>
                                <div class="col-lg-8">
                                    <h4 class="px-3 py-1 mr-lg-4">${offer.name}</h4>
                                    <h6 class="mr-lg-4">${offer.short_description}</h6>
                                    <a class="btn btn-50 grad-success text-white mb-2 mr-lg-4" href="${offer.url}" target="_blank">Start - <b>R$${offer.amount}</b></a>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                });
            } else {
                $('#adgemLoading').hide();
                $('#adgemNoContent').show();
            }
        }
    } catch (error) {
        console.log(error);
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

    if(response.status !== 200) return showError(json.error.message);

    localStorage.removeItem('token');
    document.location.href = '/login';
});