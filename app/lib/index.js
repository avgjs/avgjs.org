var input = document.querySelector('section#sub > input');
var tip = document.querySelector('section#sub > p');
var tipSmall = document.querySelector('section#sub > p > small');

var inputTimeoutId = 0;
input.addEventListener('input', function(e) {
  if (inputTimeoutId) {
    clearTimeout(inputTimeoutId);
    inputTimeoutId = 0;
  }
  inputTimeoutId = setTimeout(function() {
    if (input.value.replace(' ', '')) {
      tip.style.opacity = 1;
      if (tipSmall.textContent !== '按「回车键 ⏎」确认订阅') {
        tipSmall.textContent = '按「回车键 ⏎」确认订阅';
      }
    } else {
      tip.style.opacity = 0;
    }
  }, 400);
});

input.addEventListener('keydown', function(e) {
  if (e.keyCode === 13) {
    if (!input.validity.typeMismatch) {
      input.disabled = true;
      input.style.opacity = 0.3;
      tip.style.opacity = 0;
      changeTip('正在提交', function() {
        submitEmail(function(msg) {
          if (msg) {
            changeTip(msg);
            // input.disabled = false;
            // input.style.opacity = 0.6;
          } else {
            changeTip('已成功订阅发布提醒');
          }
        });
      });
    } else {
      changeTip('请输入正确的电子邮件地址');
    }
  }
});

function changeTip(text, callback) {
  tip.style.opacity = 0;
  setTimeout(function() {
    tip.style.opacity = 1;
    tipSmall.textContent = text;
    callback && callback();
  }, 600);
}

function submitEmail(callback) {
  var req = new XMLHttpRequest();
  req.open('POST', 'https://leancloud.cn:443/1.1/functions/sub');
  req.setRequestHeader('X-LC-Id', 'JK6JVNH6CReaQYgO52JMGWyS-gzGzoHsz');
  req.setRequestHeader('X-LC-Key', 'ww9z96kGAsjJzlgtaTcnasQT');
  // req.setRequestHeader('Access-Control-Allow-Origin', '*');
  req.setRequestHeader('Content-Type', 'application/json');
  
  req.responseType = 'json';

  req.onreadystatechange = function() {
    if (req.readyState === req.DONE) {
      if (req.status === 200) {
        var result = req.response.result;
        if (result.code) {
          callback(result.message);
        } else {
          callback();
        }
      }
    }
  }

  req.send(JSON.stringify({
    email: input.value.replace(' ', '')
  }));
}