.PHONY: serve transpile

serve:
	python3 -m http.server

transpile:
	tsc -p ./ts/ -w

