var uubench = require('uubench'),
  oldSwig = require('swig'),
  swigNext = require('../index'),
  fs = require('fs'),
  _ = require('lodash');

oldSwig.init({
  allowErrors: true,
  cache: false,
  encoding: 'utf8',
  root: __dirname + '/tpl/'
});

swigNext.setDefaults({ cache: false });

console.log('Benchmarking');
console.info('Bigger is better');

var locals = {
    obj: { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' },
    arr: ['a', 'b', 'c', 'd', 'e']
  },
  tpls = _(fs.readdirSync(__dirname + '/tpl/')).filter(function (tpl) {
    return !(/\.i\.html$/).test(tpl);
  }).map(function (tpl) {
    var file = __dirname + '/tpl/' + tpl,
      src = fs.readFileSync(file, 'utf8');
    return {
      name: tpl,
      src: src,
      old: oldSwig.compileFile(file),
      next: swigNext.compileFile(file),
      results: []
    };
  }).value();

function runTpl(idx, render) {
  var tpl = tpls[idx],
    suite = new uubench.Suite({
      start: function start() {
        console.log('');
        console.log('========================================');
        console.log(tpl.name, (render) ? 'render' : 'compile');
        console.log('----------------------------------------');
      },
      result: function result(name, stats) {
        var ops = stats.iterations * (1000 / stats.elapsed);
        console.log(name, Math.round(ops));
        tpls[idx].results.push({ name: name, ops: ops });
      },
      done: function done() {
        var max = _.max(tpls[idx].results, 'ops'),
          min = _.min(tpls[idx].results, 'ops');

        console.log('----------------------------------------');
        console.log(max.name, 'is', Math.round((max.ops / min.ops) * 100) / 100, 'times faster');
        console.log('========================================');

        if (!render) {
          runTpl(idx, true);
          return;
        }
        if (tpls.length - 1 > idx) {
          runTpl(idx + 1);
        } else {
          console.log('');
          console.log('Done.');
        }
      }
    });

  suite.bench('swig@0.14.0', function (next) {
    if (render) {
      tpl.old.render(locals);
      next();
      return;
    }

    oldSwig.compile(tpl.src, { filename: tpl.name });
    next();
  });

  suite.bench('Swig:Next', function (next) {
    if (render) {
      tpl.next(locals);
      next();
      return;
    }

    swigNext.compile(tpl.src, { filename: __dirname + '/tpl/' + tpl.name });
    next();
  });

  suite.run();
}

runTpl(0, false);

// console.log('----------------------------------------')
// console.log(tpls[1].old.render(locals));
// console.log('----------------------------------------')
// console.log(tpls[1].next(locals));
