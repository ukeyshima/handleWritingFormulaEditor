const katex = require('katex');
const mathjs = require('mathjs');
const mathIntegral = require('mathjs-simple-integral');
const atl = require('asciimath-to-latex');

mathjs.import(mathIntegral);
let latex2js,
  radix,
  frac,
  pow,
  sin,
  cos,
  tan,
  leftright,
  naturalLog,
  log,
  sum,
  definiteIntegral,
  indefiniteIntegral,
  differential,
  limit,
  matrixParse,
  matrix,
  matrixMultiplication,
  matrixAddition,
  matrixSubtraction,
  matrixShape,
  shape,
  nextMulti;

radix = input => {
  return input.index
    ? `Math.pow(${shape(input.body)},1/${shape(input.index.body)})`
    : input.body.body[0].type === 'leftright'
      ? `Math.sqrt${shape(input.body.body)}`
      : `Math.sqrt(${shape(input.body.body)})`;
};

frac = input => {
  return `${shape(input.numer.body)}/${shape(input.denom.body)}`;
};

pow = input => {
  return `Math.pow(${
    input.base.type === 'leftright' ? shape(input.base.body) : shape(input.base)
  },${
    input.sup.body[0].type === 'leftright'
      ? shape(input.sup.body[0].body)
      : shape(input.sup.body)
  })`;
};

sin = input => {
  return input.type === 'leftright'
    ? `Math.sin${shape(input)}`
    : `Math.sin(${shape(input)})`;
};

cos = input => {
  return input.type === 'leftright'
    ? `Math.cos${shape(input)}`
    : `Math.cos(${shape(input)})`;
};

tan = input => {
  return input.type === 'leftright'
    ? `Math.tan${shape(input)}`
    : `Math.tan(${shape(input)})`;
};

leftright = input => {
  let left = '(';
  let right = ')';
  if (input.left === '[') {
    left = 'Math.floor(';
  }
  return `${left}${shape(input.body)}${right}`;
};

naturalLog = input => {
  return input.type === 'leftright'
    ? `Math.log${shape(input)}`
    : `Math.log(${shape(input)})`;
};

log = input => {
  const base = shape(input[0].sub.body);
  const expression = input[1];
  return expression.type === 'leftright'
    ? `Math.log${shape(expression)}/Math.log(${base})`
    : `Math.log(${shape(expression)})/Math.log(${base})`;
};

sum = input => {
  const expression = shape(input.slice(1, input.length));
  const start = shape(input[0].sub.body);
  const end = shape(input[0].sup.body);
  return `((() => {
        let result = 0;
        for(let ${start[0]}=${start.slice(2, start.length)};${
    start[0]
  }<${end};${start[0]}++){
            result += ${expression};
        }
        return result;
    })())`;
};

definiteIntegral = (input, deltaIndex) => {
  const start = shape(input[0].sub.body);
  const end = shape(input[0].sup.body);
  const expression = shape(input.slice(1, deltaIndex)).replace(/Math\./g, '');
  const val = shape(input[deltaIndex + 1]);
  return `((${val}=>{return ${latex2js(
    atl(mathjs.integral(expression, val).toString())
  )}})(${end})-(${val}=>{return ${latex2js(
    atl(mathjs.integral(expression, val).toString())
  )}})(${start}))`;
};

indefiniteIntegral = (input, deltaIndex) => {
  const expression = shape(input.slice(1, deltaIndex)).replace(/Math\./g, '');
  const val = shape(input[deltaIndex + 1]);
  return `(${latex2js(atl(mathjs.integral(expression, val).toString()))})`;
};

differential = input => {
  const expression = shape(input.base)
    .replace(/Math\./g, '')
    .replace(/pow\((.*)\,(.*)\)/g, '$1^$2');
  return mathjs.derivative(expression, 'x').toString();
};

limit = input => {
  const index = input[0].sub.body.findIndex(e => {
    return e.value === '\\rightarrow';
  });
  return `((${shape(input[0].sub.body.slice(0, index - 1))})=>${shape(
    input[1]
  )})(${shape(input[0].sub.body.slice(index, input[0].sub.body.length))})`;
};

matrixParse = input => {
  input = input.replace(/\\\\[\s\n]*(\w)/g, '\\ $1');
  return input;
};

matrix = input => {
  input =
    input.length === 1
      ? shape(input[0])
      : input.reduce((previousValue, currentValue) => {
          return shape(previousValue).match(/\[$/) ||
            currentValue.type === 'spacing'
            ? `${shape(previousValue)}${shape(currentValue)}`
            : `${shape(previousValue)},${shape(currentValue)}`;
        });
  return `[[${input}]]`;
};

matrixMultiplication = input => {
  input = input.map(i => {
    return typeof i === 'string'
      ? eval(i)
      : eval(matrix(i.body[0].body[0]).replace(/([a-zA-Z](\[\d\])?)/g, "'$1'"));
  });
  input =
    input[0][0].length === 1 && input[1][0].length === 1
      ? (input => {
          let result = '';
          input[0].forEach((e, i) => {
            result += `+${e}*${input[1][i]}`;
          });
          result = result.slice(1, result.length);
          return `(${result})`;
        })(input)
      : (input => {
          input = input.reduce((previousValue, currentValue) => {
            const o = [];
            previousValue.forEach((e, i) => {
              const q = [];
              e.forEach((f, j) => {
                let r = '';
                for (let k = 0; k < currentValue.length; k++) {
                  r += `+${f}*${currentValue[k][i]}`;
                }
                r = r.slice(1, r.length);
                q.push(r);
              });
              o.push(q);
            });
            return o;
          });
          let result = '[';
          input.forEach(e => {
            result += '[';
            e.forEach(f => {
              result += f + ',';
            });
            result = result.slice(0, result.length - 1);
            result += '],';
          });
          result = result.slice(0, result.length - 1);
          result += ']';
          return result;
        })(input);
  return input;
};

matrixAddition = input => {
  input = input.map(i => {
    return typeof i === 'string'
      ? eval(i)
      : eval(matrix(i.body[0].body[0]).replace(/([a-zA-Z](\[\d\])?)/g, "'$1'"));
  });
  input = input.reduce((pre, cur) => {
    const o = [];
    pre.forEach((e, i) => {
      const q = [];
      e.forEach((f, j) => {
        let r = `${f}+${cur[i][j]}`;
        q.push(r);
      });
      o.push(q);
    });
    return o;
  });
  let result = '[';
  input.forEach(e => {
    result += '[';
    e.forEach(f => {
      result += f + ',';
    });
    result = result.slice(0, result.length - 1);
    result += '],';
  });
  result = result.slice(0, result.length - 1);
  result += ']';
  return result;
};

matrixSubtraction = input => {
  input = input.map(i => {
    return typeof i === 'string'
      ? eval(i)
      : eval(matrix(i.body[0].body[0]).replace(/([a-zA-Z](\[\d\])?)/g, "'$1'"));
  });
  input = input.reduce((pre, cur) => {
    const o = [];
    pre.forEach((e, i) => {
      const q = [];
      e.forEach((f, j) => {
        let r = `${f}-${cur[i][j]}`;
        q.push(r);
      });
      o.push(q);
    });
    return o;
  });
  let result = '[';
  input.forEach(e => {
    result += '[';
    e.forEach(f => {
      result += f + ',';
    });
    result = result.slice(0, result.length - 1);
    result += '],';
  });
  result = result.slice(0, result.length - 1);
  result += ']';
  return result;
};

matrixShape = input => {
  let result;
  if (typeof input === 'string') return input;
  if (input.length === 1) return matrix(input[0].body[0].body[0]);
  switch (input[1].type) {
    case 'leftright':
      result = matrixShape(
        matrixMultiplication(input.slice(0, 2)),
        input.slice(2, input.length)
      );
      break;
    case 'atom':
      switch (input[1].text) {
        case '+':
          result = matrixShape(
            matrixAddition([input[0], input[2]]),
            input.slice(3, input.length)
          );
          break;
        case '-':
          result = matrixShape(
            matrixSubtraction([input[0], input[2]]),
            input.slice(3, input.length)
          );
          break;
      }
      break;
  }
  return result;
};

nextMulti = (input, num) => {
  return input.length > num
    ? (input[num].type !== 'atom' &&
      input[num].type !== 'punct' &&
      input[num].type !== 'bin'
        ? '*'
        : '') + shape(input.slice(num, input.length))
    : ``;
};

shape = input => {
  let result;
  if (!Array.isArray(input)) {
    switch (typeof input) {
      case 'object':
        input = [input];
        break;
      case 'string':
        return input;
      default:
        break;
    }
  }
  switch (input[0].type) {
    case 'textord':
      result = `${input[0].text === '\\infty' ? Infinity : input[0].text}${
        input.length > 1
          ? (input[1].type !== 'textord' &&
            input[1].type !== 'atom' &&
            input[1].type !== 'bin' &&
            input[1].type !== 'spacing'
              ? '*'
              : '') + shape(input.slice(1, input.length))
          : ``
      }`;
      break;
    case 'mathord':
      result = `${input[0].text === '\\pi' ? `Math.PI` : input[0].text}${
        input.length > 1
          ? input[1].type === 'leftright' && input[1].left === '['
            ? `[${shape(input[1].body)}]${
                input.length > 2
                  ? (input[2].type !== 'atom' &&
                    input[2].type !== 'punct' &&
                    input[2].type !== 'bin' &&
                    input[2].type !== 'spacing' &&
                    (input[2].type === 'leftright'
                      ? shape(input[2]).length !== 3 &&
                        !/\,/.test(shape(input[1])) &&
                        !input[2].left === '['
                      : true)
                      ? `*`
                      : ``) + shape(input.slice(2, input.length))
                  : ``
              }`
            : (input[1].type !== 'atom' &&
              input[1].type !== 'punct' &&
              input[1].type !== 'bin' &&
              input[1].type !== 'spacing' &&
              (input[1].type === 'leftright'
                ? shape(input[1]).length !== 3 &&
                  !/\,/.test(shape(input[1])) &&
                  !input[1].left === '['
                : true)
                ? `*`
                : ``) + shape(input.slice(1, input.length))
          : ``
      }`;
      break;
    case 'spacing':
      result = `],[${
        input.length > 1 ? shape(input.slice(1, input.length)) : ''
      }`;
      break;
    case 'styling':
      result = shape(input[0].body);
      break;
    case 'atom':
      switch (input[0].text) {
        case '\\cdot':
          result = '*';
          break;
        default:
          result = input[0].text;
          break;
      }
      result += input.length > 1 ? shape(input.slice(1, input.length)) : ``;
      break;
    case 'punct':
      result = `${input[0].value}${
        input.length > 1 ? shape(input.slice(1, input.length)) : ``
      }`;
      break;
    case 'ordgroup':
      result = `${shape(input[0].body)}${nextMulti(input, 1)}`;
      break;
    case 'sqrt':
      result = `${radix(input[0])}${nextMulti(input, 1)}`;
      break;
    case 'leftright':
      result = `${
        input[0].body[0].type === 'array'
          ? input.length > 1
            ? matrixShape(input)
            : matrix(input[0].body[0].body[0])
          : `${leftright(input[0])}${nextMulti(input, 1)}`
      }`;
      break;
    case 'array':
      result = shape(input[0].body[0][0]);
      break;
    case 'genfrac':
      result = `${frac(input[0])}${nextMulti(input, 1)}`;
      break;
    case 'bin':
      switch (input[0].value) {
        case '\\cdot':
          result = `*${shape(input.slice(1, input.length))}`;
          break;
        default:
          result = `${input[0].value}${nextMulti(input, 1)}`;
          break;
      }
      break;
    case 'op':
      switch (input[0].name) {
        case '\\sin':
          result = `${sin(input[1])}${nextMulti(input, 2)}`;
          break;
        case '\\cos':
          result = `${cos(input[1])}${nextMulti(input, 2)}`;
          break;
        case '\\tan':
          result = `${tan(input[1])}${nextMulti(input, 2)}`;
          break;
        case '\\log':
          result = `${naturalLog(input[1])}${nextMulti(input, 2)}`;
          break;
        case '\\int':
          const deltaIndex = input.findIndex(e => {
            return e.type === 'mathord' && e.text === 'd';
          });
          result = `${indefiniteIntegral(input, deltaIndex)}${nextMulti(
            input,
            deltaIndex + 2
          )}`;
          break;
        default:
          break;
      }
      break;
    case 'supsub':
      if (input[0].sub) {
        switch (input[0].base.name) {
          case '\\log':
            result = `${log(input)}${nextMulti(input, 2)}`;
            break;
          case '\\sum':
            result = `${sum(input)}${nextMulti(input, 2)}`;
            break;
          case '\\int':
            const deltaIndex = input.findIndex(e => {
              return e.type === 'mathord' && e.text === 'd';
            });
            result = `${definiteIntegral(input, deltaIndex)}${nextMulti(
              input,
              deltaIndex + 2
            )}`;
            break;
          case '\\lim':
            result = `${limit(input)}${nextMulti(input, 2)}`;
            break;
          default:
            break;
        }
      } else {
        if (input[0].sup.body[0].text === '\\prime') {
          result = `${differential(input[0])}${nextMulti(input, 1)}`;
        } else {
          result = `${pow(input[0])}${nextMulti(input, 1)}`;
        }
      }
      break;
    default:
      result = `${input[0]}${nextMulti(input, 1)}`;
      break;
  }
  return result;
};

export default (latex2js = input => {
  while (input.search(/\n/) >= 0) {
    input = input.replace(/\n/g, ' ');
  }
  input = matrixParse(input);
  const parseTree = katex.__parse(input);
  return shape(parseTree);
});
