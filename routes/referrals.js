const router = require('express').Router();

const User = require('../models/User');

router.get('/r/:username', async (req, res) => {
    let user = await User.findOne({username: req.params.username.toLowerCase()});

    if(!user) return res.redirect('https://rbx.cool/register');

    res.redirect(`https://rbx.cool/register?ref=${user._id}`);
});


module.exports = router;