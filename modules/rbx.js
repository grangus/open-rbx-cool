require('dotenv').config();

const request = require('request').defaults({ timeout: 5000 });

let proxies = process.env.REQUEST_PROXY.split(",");

module.exports = {
    getGroupIcon: (groupId) => {
        return new Promise((res, rej) => {
            request.get(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=150x150&format=Png`, {
                json: true
            }, (error, response, body) => {
                if (error) return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });

                if (response.statusCode !== 200) return res('https://t1.rbxcdn.com/3ea55b7468646f685e8cc65cbf0be9f6')

                if (body.data.length < 1) return res('https://t1.rbxcdn.com/3ea55b7468646f685e8cc65cbf0be9f6')

                if (body.data[0].state !== 'Completed') return res('https://t1.rbxcdn.com/3ea55b7468646f685e8cc65cbf0be9f6')

                res(body.data[0].imageUrl);
            });
        });
    },
    getIdFromUsername: (username) => {
        return new Promise((res, rej) => {
            let proxy = proxies[Math.floor(Math.random() * proxies.length)];

            console.log(proxy);
            request.post('https://users.roblox.com/v1/usernames/users', {
                json: {
                    "usernames": [
                        username
                    ]
                },
                proxy: `http://${proxy}`
            }, (error, response, body) => {
                if (error) return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });

                if (response.statusCode !== 200) {
                    console.log(response.statusCode, response.statusMessage);
                    console.log(body);
                    return rej({ retry: false, message: 'Internal error!' });
                }

                if (body.data.length < 1) return rej({ retry: false, message: 'User not found!' });

                res(body.data[0].id);
            });
        });
    },
    getIdFromUsernameLegacy: (username) => {
        return new Promise((res, rej) => {
            let proxy = proxies[Math.floor(Math.random() * proxies.length)];

            console.log(`Getting username with proxy: ${proxy}`);
            request.get(`https://api.roblox.com/users/get-by-username?username=${username}`, {
                json: true,
                proxy: `http://${proxy}`
            }, (error, response, body) => {
                if (error) return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });

                if (response.statusCode !== 200) {
                    console.log(response.statusCode, response.statusMessage);
                    console.log(body);
                    return rej({ retry: false, message: 'Internal error!' });
                }

                if (body.success == false) return rej({ retry: false, message: 'User not found!' });

                res(body.Id);
            });
        });
    },
    verifyOwnership: (groupId, userId, proxy) => {
        return new Promise((res, rej) => {
            request.get(`https://groups.roblox.com/v1/groups/${groupId}`, { json: true, proxy: `http://${proxy}` }, (error, response, body) => {
                if (error) {
                    console.log(error)
                    console.log(proxy)
                    console.log("^ownership verification")
                    return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });
                }

                if (response.statusCode == 200) {
                    if (body.owner !== null) {
                        if (body.owner.userId == userId) {
                            res(body);
                        } else {
                            rej({ retry: false, message: 'You are not owner of that group!' });
                        }
                    } else {
                        rej({ retry: false, message: 'You are not owner of that group!' });
                    }
                } else {
                    rej({ retry: false, message: body.errors[0].message, status: response.statusCode  });
                }
            });
        });
    },
    verifyMembership: (groupId, userId) => {
        return new Promise((res, rej) => {
            request.get(`https://api.roblox.com/users/${userId}/groups`, {
                json: true
            }, (error, response, body) => {
                if (error) return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });

                if (body.length > 0) {
                    let group = body.find(g => g.Id == groupId);

                    if (group) {
                        res('User found in group!');
                    } else {
                        rej({ retry: false, message: 'You have not joined the group! Please try again!' });
                    }
                } else {
                    rej({ retry: false, message: 'You have not joined the group! Please try again!' });
                }
            });
        });
    },
    disableManualJoins: (groupId, cookie, proxy) => {
        return new Promise(async (res, rej) => {
            request.patch(`https://groups.roblox.com/v1/groups/${groupId}/settings`, {
                headers: {
                    'Cookie': `.ROBLOSECURITY=${cookie}`
                }
            }, (error, response, body) => {
                if (error) return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });

                let xsrf = response.headers['x-csrf-token'];

                if (!xsrf) return rej({ retry: false, message: 'XSRF token not found!' });

                request.patch(`https://groups.roblox.com/v1/groups/${groupId}/settings`, {
                    headers: {
                        'Cookie': `.ROBLOSECURITY=${cookie}`,
                        'X-CSRF-TOKEN': xsrf
                    },
                    json: {
                        "isApprovalRequired": 0,
                    }
                }, (error, response, body) => {
                    if (error) return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });

                    if (response.statusCode == 200) {
                        res('Successfully turned off manual group joins!');
                    } else {
                        console.log(body);
                        rej({ retry: false, message: 'Failed to disable manual group joins!' });
                    }
                });
            });
        });
    },
    groupPayout: (groupId, userId, amount, cookie) => {
        return new Promise(async (res, rej) => {
            request.post(`https://groups.roblox.com/v1/groups/${groupId}/payouts`, {
                headers: {
                    'Cookie': `.ROBLOSECURITY=${cookie}`
                }
            }, (error, response, body) => {
                if (error) return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });

                let xsrf = response.headers['x-csrf-token'];

                if (!xsrf) return rej({ retry: false, message: 'XSRF token not found!' });

                request.post(`https://groups.roblox.com/v1/groups/${groupId}/payouts`, {
                    headers: {
                        'Cookie': `.ROBLOSECURITY=${cookie}`,
                        'X-CSRF-TOKEN': xsrf
                    },
                    json: {
                        "PayoutType": "FixedAmount",
                        "Recipients": [
                            {
                                "recipientId": userId,
                                "recipientType": "User",
                                "amount": amount
                            }
                        ]
                    }
                }, (error, response, body) => {
                    if (error) return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });

                    if (response.statusCode == 200) {
                        res('Payout successful!');
                    } else {
                        console.log(body);
                        rej({ retry: false, message: 'Failed to payout. Make sure you have joined the group & make sure the site has stock! Contact an admin if the error keeps happening!' });
                    }
                });
            });
        });
    },
    getGroupBalance: (groupId, cookie, proxy) => {
        return new Promise((res, rej) => {
            request.get(`https://economy.roblox.com/v1/groups/${groupId}/currency`, {
                headers: {
                    'Cookie': `.ROBLOSECURITY=${cookie}`
                },
                json: true,
                proxy: `http://${proxy}`
            }, (error, response, body) => {
                if (error) return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });

                if (response.statusCode == 200) {
                    res(parseInt(body.robux));
                } else {
                    rej({ retry: false, message: body.errors[0].message});
                }
            });
        });
    },
    getCookieInfo: (cookie, proxy) => {
        return new Promise((res, rej) => {
            request.get('https://www.roblox.com/mobileapi/userinfo', {
                headers: {
                    'Cookie': `.ROBLOSECURITY=${cookie}`
                },
                json: true,
                proxy: `http://${proxy}`
            }, (error, response, body) => {
                if (error) {
                    console.log(error);
                    console.log(proxy)
                    console.log("^thisis getcookieinfo")
                    return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });
                }

                if (typeof (body) !== 'object') return rej({ retry: false, message: 'Invalid cookie or account banned!' });

                res(body);
            });
        });
    },
    getXsrfToken: (cookie) => {
        return new Promise((res, rej) => {
            request.post('https://api.roblox.com/sign-out/v1', {
                headers: {
                    'Cookie': `.ROBLOSECURITY=${cookie}`
                }
            }, (error, response, body) => {
                if (error) return rej({ retry: true, message: 'There was an error communicating with the Roblox server! Please try again!' });

                let xsrf = response.headers['x-csrf-token'];

                if (!xsrf) return rej({ retry: false, message: 'XSRF token not found!' });

                res(xsrf);
            });
        });
    }
};