'use strict';

const UTIL_PATH = '../utils'
const CONTRO_PATH = '../controllers'
const router = require('koa-router')()
const path = require('path')
const fs = require('fs')
const { getRealPath } = require(UTIL_PATH)
const { API_VESION } = require('../config')
// 获取控制器目录文件
let controFods = fs.readdirSync(path.resolve(__dirname, CONTRO_PATH))
const controllers = getRealPath(controFods, path.relative(UTIL_PATH, CONTRO_PATH), [])

// console.log('controllers------------:', controllers, path.resolve(controllers[0]))
// api接口控制器设置
controllers.forEach(rPath => {
  // console.log('path-----', path.dirname(path.relative(path.resolve(__dirname, CONTRO_PATH), rPath)).replace('\\', '/'), path.basename(rPath).replace('Controller.js', ''))
  let routerPath = path.dirname(path.relative(path.resolve(__dirname, CONTRO_PATH), rPath)).replace('\\', '/')
  let controName = path.basename(rPath).replace('Controller.js', '').toLocaleLowerCase()
  routerPath = routerPath.startsWith('.') ? routerPath.replace('.', '') : `/${routerPath}`
  routerPath = controName === 'index' ? routerPath : `${routerPath}/${controName}`
  // console.log('r', routerPath, controName)
  let obj = require(path.resolve(rPath))
  for (let c in obj) {
    let method = c.split('_')[0].toLocaleLowerCase() || 'get'
    let cName = c.split('_')[1]
    let apiPath = routerPath.startsWith('/api') ? `/${API_VESION}${routerPath}/${cName}` : `${routerPath}/${cName}`
    // console.log('apiPath', routerPath)
    try {
      router[method](apiPath, obj[c])
    } catch (err) {
      console.log('-------路由控制器方法错误-------')
    }
  }
})

module.exports = router
