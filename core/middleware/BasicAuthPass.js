import crypto from 'crypto';

const BasicAuthPass = (req, res, next) => {
    // -----------------------------------------------------------------------
    // authentication middleware
    const auth = {
        username: process.env.AUTH_BASIC_AUTH_USERNAME,
        password: process.env.AUTH_BASIC_AUTH_PASSWORD,
    };

    // parse username and password from headers
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    // Verify login and password are set and correct (timing-safe comparison)
    if (username && password && auth.username && auth.password) {
        const usernameBuf = Buffer.from(username);
        const authUsernameBuf = Buffer.from(auth.username);
        const passwordBuf = Buffer.from(password);
        const authPasswordBuf = Buffer.from(auth.password);
        // timingSafeEqual requires same-length buffers, length mismatch = access denied
        if (
            usernameBuf.length === authUsernameBuf.length
            && passwordBuf.length === authPasswordBuf.length
            && crypto.timingSafeEqual(usernameBuf, authUsernameBuf)
            && crypto.timingSafeEqual(passwordBuf, authPasswordBuf)
        ) {
            return next();
        }
    }

    // Access denied...
    res.set('WWW-Authenticate', 'Basic realm="401"');
    return res.status(401).send('Authentication required.');
    // -----------------------------------------------------------------------
};

export default BasicAuthPass;
