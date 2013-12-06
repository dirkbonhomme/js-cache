browserify:
	mkdir -p bundle
	browserify index.js -o bundle/cache.js -s cache

publish:
	make browserify
	npm publish

test:
	./node_modules/.bin/mocha --reporter spec
	./node_modules/.bin/mocha --reporter html-cov --require blanket > coverage.html

.PHONY: test