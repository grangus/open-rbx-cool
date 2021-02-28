let siteCaptchaKey = '6Ld23NkUAAAAABDh7m17tDDwAdUDRwNb-9Tk0jbp';
let protocol = window.location.protocol;
let token = localStorage.getItem('rtoken');

$(document).ready(async () => {
    if (token) {
        let response = await fetch(`${protocol}//api.rbx.cool/reseller/current`, {
            headers: {
                'authorization': token
            }
        });

        let json = await response.json();

        if (response.status !== 200) return document.location.href = '/reseller/login';

        this.user = json.data;
    } else {
        return document.location.href = '/reseller/login';
    }

    let rewardUsd = (Math.floor(this.user.rewarded / 1000 * this.user.rewardRates) * 100) / 100;
    let soldUsd = (Math.floor(this.user.sold / 1000 * this.user.saleRates) * 100) / 100;
    let faucetUsd = (Math.floor(this.user.faucet / 1000 * this.user.faucetRates) * 100) / 100;
    let cbUsd = (Math.floor(this.user.chargebackTotal / 1000 * this.user.saleRates) * 100) / 100;
    
    $('#username').text(this.user.username);
    $('#sold').text(`R$${this.user.sold.toLocaleString()}`);
    $('#rewarded').text(`R$${this.user.rewarded.toLocaleString()}`);
    $('#faucet').text(`R$${this.user.faucet.toLocaleString()}`);
    $('#payout').text(`$${(((rewardUsd + soldUsd + faucetUsd) - this.user.transactionFees) - cbUsd).toLocaleString()}`);
    $('#saleRates').text(`$${this.user.saleRates}/k`);
    $('#offerwallRates').text(`$${this.user.rewardRates}/k`);
    $('#faucetRates').text(`$${this.user.faucetRates}/k`);
    $('#reversals').text(`$${cbUsd.toLocaleString()}`);
    $('#fees').text(`$${this.user.transactionFees.toLocaleString()}`);

    let groupsResponse = await fetch(`${protocol}//api.rbx.cool/reseller/groups`, {
        headers: {
            'authorization': token
        }
    });

    let groupsJson = await groupsResponse.json();

    if (!groupsJson.error) {
        if (groupsJson.data.length < 1) {
            $('#noGroups').show();
        } else {
            groupsJson.data.forEach(g => {
                $('#groupsList').append(`
                <div class="col-lg-12 mb-4">
                    <div class="card bg-white border-0 shadow-lg py-3">
                        <div class="card-content mx-3">
                            <div class="row">
                                <div class="col-lg-4">
                                    <img src="${g.groupImage}"
                                        alt="" class="img-fluid rb">
                                </div>
                                <div class="col-lg-8">
                                    <h3 class="px-3 py-1 mr-lg-4">${g.name}</h3>
                                    <h5 class="mr-lg-4">Funds: <b>R$${g.balance.toLocaleString()}</b></h5>
                                    <h5 class="mr-lg-4">Group ID: <b>${g.groupId}</b></h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                `);
            });
        }
    }
});

const addGroup = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/reseller/groups/add`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            groupId: $('#groupIdInput').val(),
            cookie: $('#cookieInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

const removeGroup = async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/reseller/groups/remove`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            groupId: $('#groupRemoveInput').val()
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

$('#addGroupForm').submit((e) => {
    addGroup();
    e.preventDefault();
});

$('#removeGroupForm').submit((e) => {
    removeGroup();
    e.preventDefault();
});

$('#logoutHeaderBtn').click(async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/reseller/logout`, {
        method: 'POST',
        headers: {
            'authorization': token
        }
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    localStorage.removeItem('rtoken');
    document.location.href = '/reseller/login';
});