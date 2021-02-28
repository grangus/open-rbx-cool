let siteCaptchaKey = '6Ld23NkUAAAAABDh7m17tDDwAdUDRwNb-9Tk0jbp';
let protocol = window.location.protocol;
let token = localStorage.getItem('atoken');

$(document).ready(async () => {
    if (token) {
        let response = await fetch(`${protocol}//api.rbx.cool/admin/current`, {
            headers: {
                'authorization': token
            }
        });

        let json = await response.json();

        if (response.status !== 200) return document.location.href = '/alogin';

        this.user = json.data;
    } else {
        return document.location.href = '/alogin';
    }
});

const banUser = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/users/ban/update`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            username: $('#banUserInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const banRobloxUser = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/roblox/ban/update`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            username: $('#banRobloxUserInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const banFingerprint = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/fps/ban/update`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            fp: $('#banFingerprintInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const banIp = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/ips/ban/update`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            ip: $('#banIpInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const banPP = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/paypals/ban/update`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            email: $('#banPaypalInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const getUserInfo = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/users/userinfo`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            username: $('#userInfoInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showUserInfo(json.data);
};

const getResellerInfo = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/resellers/userinfo`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            username: $('#resellerInfoInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showResellerInfo(json.data);
};

const createPromo = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/promos/promo/create`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            code: $('#promocodeInput').val(),
            value: $('#promocodeValueInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const generateCode = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/promos/code/create`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            value: $('#codeValueInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data);
};

const deletePromo = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/promos/delete`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            code: $('#deletePromocodeInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const createMulti = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/promos/code/multiuse/create`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            code: $('#createMultiCodeInput').val(),
            value: $('#createMultiValueInput').val(),
            uses: $('#createMultiUsesInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const createReseller = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/reseller/create`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            username: $('#resellerNameInput').val(),
            saleRates: $('#resellerSaleRates').val(),
            rewardRates: $('#resellerRewardRates').val(),
            faucetRates: $('#resellerFaucetRates').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(`${json.data.message} Password: ${json.data.password}`);
};

const removeReseller = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/reseller/delete`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            username: $('#removeResellerNameInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(`${json.data.message} Password: ${json.data.password}`);
};

const resetReseller = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/resellers/reset`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            username: $('#resetResellerNameInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(`${json.data.message}`);
};

const changeResellerRates = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/reseller/rates/change`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            username: $('#resellerRatesUsernameInput').val(),
            saleRates: $('#resellerSaleRatesInput').val(),
            rewardRates: $('#resellerRewardRatesInput').val(),
            faucetRates: $('#resellerFaucetRatesInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const changeSiteRates = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/site/rates/change`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            offerwallRate: $('#siteOfferwallRatesInput').val(),
            salesRate: $('#siteSaleRatesInput').val(),
            dailyReward: $('#siteDailyRewardInput').val(),
            faucetBase: $('#siteFaucetBaseInput').val(),
            gameRate: $('#siteGameRatesInput').val(),
            captchaRate: $('#siteCaptchaRatesInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const whitelistUser = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/transactions/whitelist/update`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            username: $('#whitelistUserInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const generateBypass = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/bypasstoken/generate`, {
        method: 'GET',
        headers: {
            'authorization': token,
        },
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(`https://rbx.cool/register?bt=${json.token}`);
};

$('#bypassForm').submit((e) => {
    generateBypass();
    e.preventDefault();
});

$('#banUserForm').submit((e) => {
    banUser();
    e.preventDefault();
});

$('#banRobloxUserForm').submit((e) => {
    banRobloxUser();
    e.preventDefault();
});

$('#banFingerprintForm').submit((e) => {
    banFingerprint();
    e.preventDefault();
});

$('#banIpForm').submit((e) => {
    banIp();
    e.preventDefault();
});

$('#banPaypalForm').submit((e) => {
    banPP();
    e.preventDefault();
});

$('#userInfoForm').submit((e) => {
    getUserInfo();
    e.preventDefault();
});

$('#resellerInfoForm').submit((e) => {
    getResellerInfo();
    e.preventDefault();
});

$('#createPromoForm').submit((e) => {
    createPromo();
    e.preventDefault();
});

$('#generateCodeForm').submit((e) => {
    generateCode();
    e.preventDefault();
});

$('#deletePromoForm').submit((e) => {
    deletePromo();
    e.preventDefault();
});

$('#createMultiForm').submit((e) => {
    createMulti();
    e.preventDefault();
});

$('#resellerCreationForm').submit((e) => {
    createReseller();
    e.preventDefault();
});

$('#removeResellerForm').submit((e) => {
    removeReseller();
    e.preventDefault();
});

$('#resetResellerForm').submit((e) => {
    resetReseller();
    e.preventDefault();
});

$('#resellerRatesForm').submit((e) => {
    changeResellerRates();
    e.preventDefault();
});

$('#siteRatesForm').submit((e) => {
    changeSiteRates();
    e.preventDefault();
});

$('#whitelistTransactionsForm').submit((e) => {
    whitelistUser();
    e.preventDefault();
});