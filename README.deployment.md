# Deployment

Build and push release version:

```
rm -rf dist &&\
    yarn run vite build --base /launcher --sourcemap true --minify terser && \
    aws s3 --endpoint-url=https://storage.yandexcloud.net sync --acl public-read \
    dist s3://vcmi/launcher --delete 
```

Clear the CDN cache (v8.js-dos.com) in dashboard, pattern:
```
/launcher,/launcher/*
```