module.exports = (req, res, next) => {
    if(!req.session.isAdminLoggedIn){
        // res.send(`<script>window.alert('Admin Portal unauthorised')</script>`);
        return res.redirect('/admin/login');
    }
    next();
};