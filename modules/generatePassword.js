module.exports = () => {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
    let password = '';

    for(i =0; i < 32; i++) {
        password += chars.split('')[Math.floor(Math.random() * chars.length)];
    }

    return password;
};