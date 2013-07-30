var uubench = require('uubench'),
  oldSwig = require('swig'),
  swigNext = require('../index'),
  fs = require('fs'),
  _ = require('lodash');

oldSwig.init({
  allowErrors: false,
  // cache: false,
  encoding: 'utf8',
  root: __dirname + '/tpl/'
});

// swigNext.setDefaults({ cache: false });

console.log('Benchmarking');
console.info('Bigger is better');

var locals = {
    obj: { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' },
    arr: ['a', 'b', 'c', 'd', 'e']
  },
  tpls = _.filter(fs.readdirSync(__dirname + '/tpl/'), function (tpl) {
    // return (/basic/).test(tpl);
    return !(/\.i\.html$/).test(tpl);
  });

function runTpl(idx) {
  var tpl = tpls[idx],
    suite = new uubench.Suite({
      start: function start() {
        console.log('');
        console.log('========================================');
        console.log(tpl);
        console.log('----------------------------------------');
      },
      result: function result(name, stats) {
        var persec = 1000 / stats.elapsed,
          ops = Math.round(stats.iterations * persec);
        console.log(name, ops, 'per second');
      },
      done: function done() {
        console.log('----------------------------------------');
        idx += 1;
        if (tpls.length - 1 >= idx) {
          runTpl(idx);
        } else {
          console.log('');
          console.log('Done.');
        }
      }
    });

  suite.bench('swig@0.14.0             ', function (next) {
    oldSwig.compileFile(__dirname + '/tpl/' + tpl).render(locals);
    next();
  });

  suite.bench('Swig:Next               ', function (next) {
    swigNext.compileFile(__dirname + '/tpl/' + tpl)(locals);
    next();
  });

  suite.run();
}

runTpl(0);

// oldSwig.compileFile(__dirname + '/tpl/basic.html').render(locals)
// console.log('================================')
// swigNext.compileFile(__dirname + '/tpl/basic.html')(locals)
