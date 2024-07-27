.PHONY: serve transpile

serve:
	python3 -m http.server

transpile:
	tsc -p ./ts/ -w

tag_release_patch:
	./tag_release.sh patch

tag_release_minor:
	./tag_release.sh minor

tag_mrelease_ajor:
	./tag_release.sh major
