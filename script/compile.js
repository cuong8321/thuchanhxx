#! /usr/bin/env node
'use strict'

const {dirname, extname, join, parse} = require('path')
const {readdirSync, readFileSync, statSync, mkdirSync, writeFileSync} = require('fs')
const {info} = global.console
const pug = require('pug')
const stylus = require('stylus')
const less = require('less')
const jtry = require('just-try')
const projdir = dirname(__dirname)
const src = join(projdir, 'src')
const out = join(projdir, 'out')
const lib = join(projdir, 'lib')

compile(src, out, 0)
info('done.')

function compile (source, target, level) {
  const stats = statSync(source)
  if (stats.isDirectory()) {
    jtry(() => statSync(target).isDirectory(), () => false) || mkdirSync(target)
    readdirSync(source).forEach(item => compile(join(source, item), join(target, item), level + 1))
  } else if (stats.isFile()) {
    const sourcecode = readFileSync(source)
    const {dir, name} = parse(target)
    switch (extname(source).toLowerCase()) {
      case '.pug': case '.jade': {
        const fn = pug.compile(sourcecode.toString('utf8'), {doctype: 'html', pretty: true, filename: source})
        const html = fn({projdir, src, out, source, target, dir, name, sourcecode, require, getlib, jreq})
        writeFileSync(join(dir, name + '.html'), html, {encoding: 'utf8'})
        break
      }
      case '.stylus': case '.styl': {
        const css = stylus.render(sourcecode.toString('utf8'))
        writeFileSync(join(dir, name + '.css'), css, {encoding: 'utf8'})
        break
      }
      case '.less': {
        less.render(sourcecode.toString('utf8')).then(
          ({css}) => writeFileSync(join(dir, name + '.css'), css, {encoding: 'utf8'})
        )
        break
      }
      default: {
        writeFileSync(target, sourcecode, {encoding: 'utf8'})
      }
    }
  } else {
    throw new Error(`Invalid type of fs entry: ${source}`)
  }
}

function getlib (...name) {
  return jreq(lib, ...name)
}

function jreq (...name) {
  return require(join(...name))
}
