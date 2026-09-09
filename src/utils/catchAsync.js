/**
 * Wraps an async route handler or middleware function to automatically catch
 * unhandled promise rejections and forward them to Express error middleware (next).
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = catchAsync;
