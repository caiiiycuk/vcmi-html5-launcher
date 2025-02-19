# Deployment

Build and push release version:

```
rm -rf dist && \
    yarn run vite build --base /vcmi/launcher --sourcemap true --minify terser && \
    rm dist/vcmi/vcmi* && \
    aws s3 --endpoint-url=https://storage.yandexcloud.net sync --acl public-read \
    dist s3://dos.zone/vcmi/launcher --delete && \
    cp -r dist ~/js-dos/dos.zone/vcmi

```

Clear the CDN cache (sec.dos.zone) in dashboard, pattern:
```
/vcmi,/vcmi/*
```