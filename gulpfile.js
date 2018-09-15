const gulp = require("gulp");
const del = require("del");

// copu ./hexo/public to ./
gulp.task("copy", () => gulp.src([
    "public/**/*",
    "!public/**/*.map",
    '!public/**/*.scss',
    '!public/**/*[!min].js',
    '!public/**/*[!min].css'
]))

gulp.task('deleteInnerPublicFolder', ['copy'], (cb) => {
    del.sync('public', {
        force: true
    })
    cb()
})

gulp.task('build', ['deleteInnerPublicFolder'])