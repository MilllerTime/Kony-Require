/*

The MIT License (MIT)

Copyright (c) 2015 Caleb Miller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/


// lookup and return the specified module
function require(name) {
	if (!require.modules) {
		throw new Error('No modules defined! Please first define a module using define()');
	}
	if (require.modules.hasOwnProperty(name)) {
		// return module if found
		return require.modules[name];
	} else {
		// If module can't be found, check to see if it's in pending array.
		// This is a sign that there's a circular dependency chain
		var pending = define.pending;
		for (var i = pending.length - 1; i >= 0; i--) {
			if (pending[i].name === name) {
				throw new Error('Module "' + name + '" was defined, but was not properly initialized for use with require(). There may be circular dependencies, please review your code design.');
			}
		}
		throw new Error ('Module "' + name + '" is not defined.');
	}
}

// define a new module that can be used with require()
function define(name, dependencies, definition) {
	// declare modules object 
	if (!require.modules) require.modules = {};
	// declare pending array
	if (!define.pending) define.pending = [];
	var pending = define.pending;

	// if a falsy value is given for dependencies, initialize an empty array
	if (!dependencies) {
		dependencies = [];
	}
	// if only one dependency is provided, as a raw string, wrap it in an array
	if (typeof dependencies === 'string') {
		dependencies = [dependencies];
	}

	// if all dependencies have been previously declared, initialize the module immediately. Else, add to pending array
	if (checkDep(dependencies)) {
		declareModule(name, dependencies, definition);
		// after declaring module, try to redeclare pending modules
		// repeatedly loop over pending array as long as each pass successfully declares at least one module
		// NOTE: There are better algorithms to resolve dependency graphs.
		//       This approach does work, and allows modules to start executing before all modules are declared, but could be improved.
		var did_declare;
		do {
			did_declare = false;
			for (var i = pending.length - 1; i >= 0; i--) {
				var pend_def = pending[i];
				if (checkDep(pend_def.dependencies)) {
					declareModule(pend_def.name, pend_def.dependencies, pend_def.definition);
					did_declare = true;
				}
			}
		} while (did_declare);
	} else {
		pending.push({
			name: name,
			dependencies: dependencies,
			definition: definition
		});
	}


	// helper function checks to see if an array of dependencies has been declared
	// returns true if all are declared, false if any dependency isn't declared
	function checkDep(dependencies) {
		for (var i = dependencies.length - 1; i >= 0; i--) {
			if (!require.modules.hasOwnProperty(dependencies[i])) {
				return false;
			}
		}
		return true;
	}
	// helper function initializes and declares a module (all dependencies must be declared!)
	function declareModule(name, dependencies, definition) {
		// replace dependency strings with module references
		for (var i = dependencies.length - 1; i >= 0; i--) {
			dependencies[i] = require(dependencies[i]);
		}
		// declare
		var module = definition.apply(this, dependencies);
		// assign module it's name, as long as the module didn't create a `name` property itself
		if (module && !module.hasOwnProperty('name')) {
			module.name = name;
		}
		require.modules[name] = module;
	}
}
