this.showError = (message) => {
    Swal.fire({
        icon: 'error',
        title: 'Whoops!',
        text: message,
        confirmButtonColor: '#475EFE',
        cancelButtonColor: '#d33',
        customClass: {
            cancelButton: 'rounded',
            confirmButton: 'rounded'
        }
    });
};

this.showPurchaseSuccess = (message) => {
    Swal.fire({
        imageUrl: 'https://tinyimg.io/i/Of0ocvI.gif',
        title: 'Epic!',
        text: message,
        confirmButtonColor: '#475EFE',
        cancelButtonColor: '#d33',
        customClass: {
            cancelButton: 'rounded',
            confirmButton: 'rounded'
        }
    }).then(() => {
        window.location.href = '/dashboard';
    })
};

this.showSuccess = (message, refresh) => {
    Swal.fire({
        imageUrl: 'https://tinyimg.io/i/Of0ocvI.gif',
        title: 'Epic!',
        text: message,
        confirmButtonColor: '#475EFE',
        cancelButtonColor: '#d33',
        customClass: {
            cancelButton: 'rounded',
            confirmButton: 'rounded'
        }
    }).then(() => {
        if(refresh) {
            location.reload();
        }
    })
};

this.showUserInfo = (data) => {
    Swal.fire({
        title: 'User info',
        html: `
            <h6>Username: ${data.username}</h6>
            <h6>Email: ${data.email || "None"}</h6>
            <h6>Balance: R$${(data.balance + data.purchasedBalance + data.entryBalance).toLocaleString()}</h6>
            <h6>Referer: ${data.referer || "None"}</h6>
            <h6>Total Earned: R$${data.totalEarned}</h6>
            <h6>Total Purchased: R$${(data.totalWithdrawed + data.purchasedBalance).toLocaleString()}</h6>
        `,
        confirmButtonColor: '#475EFE',
        cancelButtonColor: '#d33'
    });
};

this.showResellerInfo = (data) => {
    let rewardUsd = (Math.floor(data.rewarded / 1000 * data.rewardRates) * 100) / 100;
    let soldUsd = (Math.floor(data.sold / 1000 * data.saleRates) * 100) / 100;
    let cbUsd = (Math.floor(data.chargebackTotal / 1000 * data.saleRates) * 100) / 100;

    Swal.fire({
        title: 'User info',
        html: `
            <h6>Username: ${data.username}</h6>
            <h6>Reward rates: $${data.rewardRates}/k</h6>
            <h6>Sale rates: $${data.saleRates}/k</h6>
            <h6>Sold: R$${data.sold.toLocaleString()}</h6>
            <h6>Rewarded: ${data.rewarded.toLocaleString()}</h6>
            <h6>Chargeback'd: ${data.chargebackTotal.toLocaleString()}</h6>
            <h6>Fees: ${data.transactionFees.toLocaleString()}</h6>
            <h6>Sold: ${(soldUsd + rewardUsd).toLocaleString()}</h6>
            <h6>Estimated Payout: $${(((soldUsd + rewardUsd) - cbUsd) - data.transactionFees).toLocaleString()}</h6>
        `,
        confirmButtonColor: '#475EFE',
        cancelButtonColor: '#d33'
    });
};

this.showCancelConfirmation = (message) => {
    Swal.fire({
        icon: 'error',
        title: 'Whoops!',
        text: message,
        showCancelButton: true,
        confirmButtonColor: '#475EFE',
        cancelButtonColor: '#d33',
        confirmButtonText: "Don't cancel!",
        customClass: {
            cancelButton: 'rounded',
            confirmButton: 'rounded'
        }
    }).then(async (result) => {
        if(!result.value) {
            await fetch(`${window.location.protocol}//api.rbx.cool/transactions/cancel`, {
                method: 'POST',
                headers: {
                    'authorization': token,
                    'content-type': 'application/json'
                }
            });
        }
    });
};

this.getConfirmation = async (transaction) => {
    let token = localStorage.getItem('token');

    Swal.fire({
        title: `Join ${transaction.groupName} to receive your payout!`,
        html: `<a href="https://roblox.com/groups/${transaction.groupId}" target="_blank" class="btn btn-blue">Click here to view the group!</a>`,
        imageUrl: transaction.groupImage,
        showCancelButton: true,
        confirmButtonColor: '#475EFE',
        cancelButtonColor: '#d33',
        confirmButtonText: "I've joined the group!",
        customClass: {
            cancelButton: 'rounded',
            confirmButton: 'rounded'
        }
    }).then( async (result) => {
        if (result.value) {
            let response = await fetch(`${window.location.protocol}//api.rbx.cool/transactions/complete`, {
                method: 'POST',
                headers: {
                    'authorization': token,
                    'content-type': 'application/json'
                }
            });

            let json = await response.json();

            if(response.status !== 200) return showError(json.error.message);

            showSuccess(json.data.message, true);
        } else {
            await fetch(`${window.location.protocol}//api.rbx.cool/transactions/cancel`, {
                method: 'POST',
                headers: {
                    'authorization': token,
                    'content-type': 'application/json'
                }
            });
        }
    })
};