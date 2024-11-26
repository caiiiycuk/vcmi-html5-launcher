# vcmi-html5-launcher

## Prepare

1. Checkout [vcmi-html5](https://github.com/caiiiycuk/vcmi-html5)
2. Build it for WebAssembly target
3. Copy `html5` directory to `public/vcmi`, for example:

```
rm -rf public/vcmi && cp -rv ../vcmi-html5/emscripten/html5 public/vcmi
```

## Develop

```yarn run vite```