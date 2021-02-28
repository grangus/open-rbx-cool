let protocol = window.location.protocol;

$(document).ready(async () => {
    let response = await fetch(`${protocol}//api.rbx.cool/stats/leaderboard`);
    let json = await response.json();

    if(response.status == 200) {
        $('#goldName').text(json.data[0].username);
        $('#silverName').text(json.data[1].username);
        $('#bronzeName').text(json.data[2].username);
        $('#goldEarned').text(`R$${json.data[0].totalEarned.toLocaleString()}`);
        $('#silverEarned').text(`R$${json.data[1].totalEarned.toLocaleString()}`);
        $('#bronzeEarned').text(`R$${json.data[2].totalEarned.toLocaleString()}`);
    }
});