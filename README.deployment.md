# Deployment

Build and push release version:

```
rm -rf dist && \
    yarn run vite build --base /launcher --sourcemap true --minify terser && \
    rm dist/vcmi/vcmi* && \
    aws s3 --endpoint-url=https://storage.yandexcloud.net sync --acl public-read \
    dist s3://vcmi/launcher --delete 
```

Clear the CDN cache (vcmi.dos.zone) in dashboard, pattern:
```
/launcher,/launcher/*
```