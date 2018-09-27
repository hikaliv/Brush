'use strict'

const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const printf = require('format').printf
const os = require('os')

function mkdir(dirname, absolute) {
  const dir = absolute === true ? dirname : path.join(__dirname, '../repo', dirname)
  return new Promise((resolve, reject) => {
    fs.access(dir, err => {
      if (err) {
        fs.mkdir(dir, err => {
          if (err) {
            reject(err)
          } else {
            console.log(`创建 ${dir}`)
            resolve()
          }
        })
      } else {
        resolve()
      }
    })
  })
}

const settingNum = process.argv[2]
if (settingNum !== undefined && !Number.isInteger(Number(settingNum))) {
  console.error('参数应为正整数，表示下载进程数。')
  process.exit(1)
}

/**
 * 在此设置下载的工程
 */
const workers = ['hidom', 'sinonumber', 'css-parse-file']
const procNum = settingNum || os.cpus().length / 2

console.log(`开启 ${procNum} 个下载进程。可以在命令行尾置正整数参数指定额外开启进程数。`)

const list = []
for (let itor = 0; itor < procNum; itor++) list.push({
  name: `npm${itor}`,
  cache: `$HOME/.npm/.cache/npm${itor}`
})

let total = {}

const execute = worker => {
  console.log(`开始下载 ${worker}`)
  const run = npm => {
    const dir = path.join(__dirname, '../repo', worker, npm.name)
    const go = npm => {
      exec(`rm -rf ${npm.cache}/${worker} && cd ${dir} && rm -rf node_modules/${worker} && npm --cache=${npm.cache} install ${worker}`, (err, stdout, stderr) => {
        if (err) console.error(err)
        if (stderr) console.error(`${stderr}`)
        // if (stdout) console.log(`${stdout}`)
        total[worker][npm.name]++
        go(npm)
      })
    }
    mkdir(dir, true).then(() => exec(`cd ${dir} && echo { \\"description\\": \\"brush ${worker}\\", \\"license\\": \\"MIT\\", \\"repository\\": {} } > package.json`, (err, stdout, stderr) => {
      if (err) console.error(err)
      else if (stderr) console.error(`${stderr}`)
      else go(npm)
    })).catch(console.error)
  }
  mkdir(worker).then(() => list.forEach(run)).catch(console.error)
}

workers.forEach(worker => {
  total[worker] = {}
  list.forEach(npm => total[worker][npm.name] = 0)
})

const date = new Date()
console.log(`北京时间 ${date.toString()}`)

workers.forEach(execute)

/**
 * Ctrl + c 时，进程接收该信号
 */
process.on('SIGINT', () => {
  const minutes = ((new Date()).getTime() - date.getTime()) / 1000 / 60
  console.log()
  printf(`历时 %2f 分钟。`, minutes)
  workers.forEach(key => {
    const sum = list.map(item => total[key][item.name]).reduce((pre, pro) => pre + pro, 0)
    printf(`${key} 共下载：${sum} 次，平均每分钟 %2f 次。`, sum / minutes)
    list.forEach(npm => printf(`\t${npm.name} 下载 ${total[key][npm.name]} 次，平均每分钟 %2f 次。`, total[key][npm.name] / minutes))
  })
  console.log()
  process.exit()
})