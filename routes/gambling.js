const router = require('express').Router();

router.get('/gambling/meta', async (req, res) => {
    res.status(200).json({ status: 'ok', data: {} });
});

module.exports = router;