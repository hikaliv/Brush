'use strict'

const gulp = require('gulp')
const eslint = require('gulp-eslint')
const chalk = require('chalk')

gulp.task('lint', () => {
  console.log(chalk.bold('\n任务'), chalk.green.bold('lint'), ': 代码检查。\n')
  return gulp.src(['../index.js', '!./*.js'])
    .pipe(eslint({ fix: true }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

gulp.task('default', ['lint'], () => console.log(chalk.green.bold('\n流程完成。\n')))