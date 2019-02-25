FROM golang:1.11-alpine as builder

MAINTAINER Olaoluwa Osuntokun <lightning.engineering>

ENV LND_VERSION=v0.5
RUN wget https://github.com/lightningnetwork/lnd/releases/download/${LND_VERSION}-beta/lnd-linux-amd64-${LND_VERSION}-beta.tar.gz
RUN tar -xzf *.tar.gz
RUN cp lnd-linux-amd64-${LND_VERSION}-beta/* /go/bin

# Force Go to use the cgo based DNS resolver. This is required to ensure DNS
# queries required to connect to linked containers succeed.
ENV GODEBUG netdns=cgo

# Install dependencies and install/build lnd.
# RUN apk add --no-cache --update alpine-sdk \
#     git \
#     make \
# &&  cd /go/src/github.com/lightningnetwork/lnd \
# &&  make \
# &&  make install

# Start a new, final image to reduce size.
FROM alpine as final

# Expose lnd ports (server, rpc).
EXPOSE 9735 10009

# TODO remove
# web app
EXPOSE 3000

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /go/bin/lncli /bin/
COPY --from=builder /go/bin/lnd /bin/

# Add bash.
RUN apk add --no-cache \
    bash

RUN apk add --update nodejs nodejs-npm

# Copy the entrypoint script.
COPY "start-lnd.sh" .
RUN chmod +x start-lnd.sh
