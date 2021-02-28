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

    let statsResponse = await fetch(`${protocol}//api.rbx.cool/admin/stats`, {
        headers: {
            'authorization': token
        }
    });

    let statsJson = await statsResponse.json();

    if (!statsJson.error) {
        $('#users').text(statsJson.data.usersRegistered.toLocaleString());
        $('#offers').text(statsJson.data.offersCompleted.toLocaleString());
        $('#stock').text(`R$${statsJson.data.stock.toLocaleString()}`);
        $('#paid').text(`R$${statsJson.data.robuxPaid.toLocaleString()}`);
    }

    let pendingResponse = await fetch(`${protocol}//api.rbx.cool/admin/transactions/pending`, {
        headers: {
            'authorization': token
        }
    });

    let pendingJson = await pendingResponse.json();

    if (!pendingJson.error) {
        if (pendingJson.data.length < 1) {
            $('#noPending').show();
        } else {
            pendingJson.data.forEach(t => {
                $('#pendingTransactions').append(`
                    <li class="list-group-item mb-2 border-0 shadow-lg">
                        <h5>Username: ${t.username} - Amount: ${t.amount} - Time: ${t.time}</h5>
                        <div class="btn btn-50 grad-danger border-0 text-white mt-3" onclick="deletePending('${t.transactionId}')">Delete</div>
                    </li>
                `);
            });
        }
    }

    let groupsResponse = await fetch(`${protocol}//api.rbx.cool/admin/groups`, {
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
                                    <h5 class="mr-lg-4">Stocked by: <b>${g.stockerName}</b></h5>
                                    <h5 class="mr-lg-4">Funds: <b>R$${g.balance.toLocaleString()}</b></h5>
                                    <div class="btn btn-50 grad-danger border-0 text-white mr-lg-4" onclick="removeGroup(${g.groupId})">
                                        Remove</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                `);
            });
        }
    }

    let promoResponse = await fetch(`${protocol}//api.rbx.cool/admin/promocodes/list`, {
        headers: {
            'authorization': token
        }
    });

    let promoJson = await promoResponse.json();

    if (!promoJson.error) {
        if (promoJson.data.length < 1) {
            $('#noCodes').show();
        } else {
            promoJson.data.forEach(c => {
                $('#promocodes').append(`
                    <li class="list-group-item mb-2 border-0 shadow-lg">
                        <h5>Code: ${c.code} - Type: ${c.codeType} - Value: ${c.value} - Uses: ${c.uses} - Max Uses: ${c.maxUses}</h5>
                    </li>
                `);
            });
        }
    }
});

this.removeGroup = async (id) => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/groups/remove`, {
        method: 'POST',
        headers: {
            'authorization': token,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            groupId: id
        })
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};

this.deletePending = async (id) => {
    let response = await fetch(`${protocol}//api.rbx.cool/admin/transactions/pending/remove/${id}`, {
        method: 'POST',
        headers: {
            'authorization': token
        }
    });

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    showSuccess(json.data.message);
};