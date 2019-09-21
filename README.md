# Dependency Injection for nodejs

![home](https://raw.githubusercontent.com/jrichardsz/static_resources/master/dependency-injection/dependency-injection.png)

In software engineering, dependency injection is a technique whereby one object (or static method) supplies the dependencies of another object. A dependency is an object that can be used (a service).

After to use several nodejs frameworks, my eyes were damaged with a thousands of **require("...")** and **new("...")**

I researched and I can not find anything compared with java spring framework for dependency injection.

So... :D

# Usage

## Without D.I

**index.js**
```js
var express = require('express');
var app = express();

app.get('/', function(req, res) {
  res.type('text/plain');
  res.send('Hell , its about time!!');
});

app.get('/another', function(req, res) {
  res.type('text/plain');
  res.send('Hell , one more time!!');
});

app.listen(process.env.PORT || 8080);
```

## With D.I

**index.js**
```js
const path = require('path');
const express = require('express');
const di4nodejs = require('dependency-injection-4nodejs').DependencyInjection;
var app = express();
di4nodejs.discover(path.resolve(__dirname), "index.js", app);
app.listen(process.env.PORT || 8080);
```

**Routes.js**
```js
//@Dependency("Routes")
function Routes() {
  var _this = this;

  //@Autowire
  var express;
  this.main = function() {
    _this.express.get('/', function(req, res) {
      res.type('text/plain');
      res.send('Hell , its about time!!');
    });

    _this.express.get('/another', function(req, res) {
      res.type('text/plain');
      res.send('Hell , one more time!!');
    });
  }
}
module.exports = Routes;
```

> As you can see, **express** was autowired.

If you need to use another module inside, Routes.js, just **autowire it**

**Logger.js**
```js
//@Dependency("Logger")
function Logger() {
  var _this = this;

  this.main = function() {
    // logger configurations
  }
}
module.exports = Logger;
```

**Routes.js**
```js
//@Dependency("Routes")
function Routes() {
  var _this = this;

  //@Autowire
  var express;

  //@Autowire
  var logger;

  this.main = function() {
    _this.express.get('/', function(req, res) {
      _this.logger.info("first endpoint");
      res.type('text/plain');
      res.send('Hell , its about time!!');
    });

    _this.express.get('/another', function(req, res) {
      _this.logger.info("second endpoint");
      res.type('text/plain');
      res.send('Hell , one more time!!');
    });
  }
}
module.exports = Routes;
```

# Copyright

- Home image : https://www.freecodecamp.org/news/a-quick-intro-to-dependency-injection-what-it-is-and-when-to-use-it-7578c84fa88f/

# Coming soon

- Tests
- Documentation
- Register as npm dependency
