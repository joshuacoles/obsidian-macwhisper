delete-tag tag:
	git tag -d {{tag}}
	git push origin :refs/tags/{{tag}}

new-tag name sha:
	git tag {{name}} {{sha}}

push tag:
	jj git push
	git push --tags origin {{tag}}
