import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as $exports from '../src';

function pass(pkg, expects, ...args) {
	let out = $exports.resolve(pkg, ...args);
	assert.is(out, expects);
}

function fail(pkg, target, ...args) {
	try {
		$exports.resolve(pkg, ...args);
		assert.unreachable();
	} catch (err) {
		assert.instance(err, Error);
		assert.is(err.message, `Missing "${target}" export in "${pkg.name}" package`);
	}
}

// ---

const resolve = suite('resolve');

resolve('should be a function', () => {
	assert.type($exports.resolve, 'function');
});

resolve('exports=string', () => {
	let pkg = {
		"name": "foobar",
		"exports": "$string",
	};

	pass(pkg, '$string');
	pass(pkg, '$string', '.');
	pass(pkg, '$string', 'foobar');

	fail(pkg, './other', 'other');
	fail(pkg, './other', 'foobar/other');
	fail(pkg, './hello', './hello');
});

resolve('exports = { self }', () => {
	let pkg = {
		"name": "foobar",
		"exports": {
			"import": "$import",
			"require": "$require",
		}
	};

	pass(pkg, '$import');
	pass(pkg, '$import', '.');
	pass(pkg, '$import', 'foobar');

	fail(pkg, './other', 'other');
	fail(pkg, './other', 'foobar/other');
	fail(pkg, './hello', './hello');
});

resolve('exports["."] = string', () => {
	let pkg = {
		"name": "foobar",
		"exports": {
			".": "$self",
		}
	};

	pass(pkg, '$self');
	pass(pkg, '$self', '.');
	pass(pkg, '$self', 'foobar');

	fail(pkg, './other', 'other');
	fail(pkg, './other', 'foobar/other');
	fail(pkg, './hello', './hello');
});

resolve('exports["."] = object', () => {
	let pkg = {
		"name": "foobar",
		"exports": {
			".": {
				"import": "$import",
				"require": "$require",
			}
		}
	};

	pass(pkg, '$import');
	pass(pkg, '$import', '.');
	pass(pkg, '$import', 'foobar');

	fail(pkg, './other', 'other');
	fail(pkg, './other', 'foobar/other');
	fail(pkg, './hello', './hello');
});

resolve('exports["./foo"] = string', () => {
	let pkg = {
		"name": "foobar",
		"exports": {
			"./foo": "$import",
		}
	};

	pass(pkg, '$import', './foo');
	pass(pkg, '$import', 'foobar/foo');

	fail(pkg, '.');
	fail(pkg, '.', 'foobar');
	fail(pkg, './other', 'foobar/other');
});

resolve('exports["./foo"] = object', () => {
	let pkg = {
		"name": "foobar",
		"exports": {
			"./foo": {
				"import": "$import",
				"require": "$require",
			}
		}
	};

	pass(pkg, '$import', './foo');
	pass(pkg, '$import', 'foobar/foo');

	fail(pkg, '.');
	fail(pkg, '.', 'foobar');
	fail(pkg, './other', 'foobar/other');
});

// TODO: folder mappings -- https://nodejs.org/api/packages.html#packages_subpath_folder_mappings

// https://nodejs.org/api/packages.html#packages_nested_conditions
resolve('nested conditions', () => {
	let pkg = {
		"name": "foobar",
		"exports": {
			"node": {
				"import": "$node.import",
				"require": "$node.require"
			},
			"default": "$default",
		}
	};

	pass(pkg, '$node.import');
	pass(pkg, '$node.import', 'foobar');

	// browser => no "node" key
	pass(pkg, '$default', '.', { browser: true });
	pass(pkg, '$default', 'foobar', { browser: true });

	fail(pkg, './hello', './hello');
	fail(pkg, './other', 'foobar/other');
	fail(pkg, './other', 'other');
});

// TODO: incomplete
// TODO? do require.resolve on directory?
// https://nodejs.org/api/packages.html#packages_subpath_folder_mappings
resolve('exports["./"]', () => {
	let pkg = {
		"name": "foobar",
		"exports": {
			".": {
				"require": "$require",
				"import": "$import"
			},
			"./package.json": "./package.json",
			"./": "./"
		}
	};

	pass(pkg, '$import');
	pass(pkg, '$import', 'foobar');
	pass(pkg, '$require', 'foobar', { requires: true });

	pass(pkg, './package.json', 'package.json');
	pass(pkg, './package.json', 'foobar/package.json');
	pass(pkg, './package.json', './package.json');

	// "loose" / everything exposed
	// pass(pkg, './hello.js', 'hello.js');
	// pass(pkg, './hello.js', 'foobar/hello.js');
	// pass(pkg, './hello/world.js', './hello/world.js');
});

resolve.run();
