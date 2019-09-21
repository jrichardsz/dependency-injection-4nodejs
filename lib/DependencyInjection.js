const fs = require('fs');
const pathUtil = require('path');
var lineNumber = require('line-number');

function DependencyInjection() {

}

DependencyInjection.discover = function(rootPath, entrypoint, express) {

  var files = [];
  var dependencies = [];
  getJsFiles(rootPath, files, entrypoint)
  for (var key in files) {
    var file = files[key];
    var contents = fs.readFileSync(file, 'utf8');
    // console.log(file);
    var dependencyMetadata = detectAdvancedJockers(contents,file);
    if(dependencyMetadata){
      dependencies.push(dependencyMetadata);
    }
  }

  performDependencyInjetion(dependencies,express);

};

/*
Perform instantation and injection
input:   detectede dependencies, global express;
output: controller
*/
var performDependencyInjetion = function(dependencies,express) {

  var instancedDependecies = {};

  console.log("\nPerform instantation...");
  for(dependency of dependencies){
    console.log("Detected dependency:"+dependency.location);
    var functionRequire = require(dependency.location);
    var functionInstance = new functionRequire();
    console.log("Saving as instanced dependency:"+dependency.name);
    instancedDependecies[dependency.name] = functionInstance;
  }

  console.log("\nPerform injection...");
  for(dependency of dependencies){
    var functionInstance = instancedDependecies[dependency.name];
    console.log("Dependency:"+dependency.name);
    if(dependency.variablesToInject && dependency.variablesToInject.length >0){
      for(variableToInject of dependency.variablesToInject){
        if(variableToInject == "express"){
          console.log("Injecting :"+variableToInject);
          functionInstance["express"] = express;
        }else if(!instancedDependecies[variableToInject]){
          console.error(variableToInject+" was not found.");
        }else{
          console.log("Injecting :"+variableToInject);
          functionInstance[variableToInject] = instancedDependecies[variableToInject];
        }
      }
    }else{
      console.log(">"+dependency.name+" does not have variables to inject.");
    }

    functionInstance.main();
  }

}

var detectAdvancedJockers = function(fileContent, file) {

  var dependency = {};

  //lookup @Dependency annotations : /@Dependency\("\w+"\)/g
  var dependencyMatchs = fileContent.match(new RegExp('@Dependency\\(\"\\w+\"\\)', "g"));
  if(dependencyMatchs && dependencyMatchs.length == 1){
    // console.log(parseDependencyAnnotation(dependencyMatchs[0]));
    dependency.location = file;
    dependency.name = parseDependencyAnnotation(dependencyMatchs[0]);
  }

  //continue if this is a valid dependency
  if(!dependency.location){
    return;
  }

  //lookup @Autowire annotations
  var re = /@Autowire/g;
  var autowireMatchs = lineNumber(fileContent, re);
  var variablesToInject = [];
  if(autowireMatchs){
    for(autowire of autowireMatchs){
      if(autowire.number >= 0){
        var rawLine = getLine(fileContent, autowire.number);
        variablesToInject.push(parseAutowireAnnotation(rawLine));
      }
    }
  }

  dependency.variablesToInject = variablesToInject;
  return dependency;
}

/*
Get name of var to autowire.
input:   var controller;
output: controller
*/
var parseAutowireAnnotation = function(stringAnnotationRawData) {
  var match = stringAnnotationRawData.match(new RegExp('\\s+\\w+\\;', "g"));
  if(match && match.length == 1){
    return match[0].replace(" ","").replace(";","");
  }
}

/*
Get name of Dependency.
input: @Dependency("Properties")
output: Properties
*/
var parseDependencyAnnotation = function(stringAnnotationRawData) {
  var startIndex =  stringAnnotationRawData.indexOf("\"");
  var lastIndex =  stringAnnotationRawData.lastIndexOf("\"");
  var dependencyName = stringAnnotationRawData.substring(startIndex+1,lastIndex);
  var dependencyNameCamelCase = dependencyName.charAt(0).toLowerCase() + dependencyName.slice(1);
  return dependencyNameCamelCase;
}

/*
Get list of js files in the main project, without excludes
input: main path, entrypoint to exclude
output: string[]
*/
var getJsFiles = function(path, files,entrypoint) {
  fs.readdirSync(path).forEach(function(file) {
    var subpath = path + '/' + file;
    if (fs.lstatSync(subpath).isDirectory()) {
      if (subpath.includes("node_modules") || subpath.includes(".git")) {
        return;
      }
      getJsFiles(subpath, files,entrypoint);
    } else {
      var ext = pathUtil.extname(file);
      if (ext !== ".js"  || file.endsWith(entrypoint)) {
        return;
      }
      files.push(path + '/' + file);
    }
  });
}

/*
Get line of file using number
input: string content of file, line to lookup
output: string line
*/
function getLine(fileContent, line) {

    var lines = fileContent.split("\n");

    if(+line > lines.length){
      throw new Error('File end reached without finding line');
    }

    return lines[+line];
}


module.exports = DependencyInjection;
