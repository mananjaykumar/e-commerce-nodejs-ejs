exports.get404 = (req, res, next) => {
    res.status(400).render('404', {
        pageTitle: 'Page Not Found',
        path: '/404'
    });
};