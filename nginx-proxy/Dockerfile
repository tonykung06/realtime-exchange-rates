FROM nginx:1.19.9

# Install curl
RUN apt-get update -qq && \
    apt-get install -qy curl

# Set EnvPlate version
ENV ENVPLATE 0.0.4

# Install EnvPlate
RUN curl -sLo /usr/local/bin/ep https://github.com/kreuzwerker/envplate/releases/download/v$ENVPLATE/ep-linux && \
    chmod +x /usr/local/bin/ep

# Copy files in the image
COPY . .

# fix windows CRLF to LF
RUN apt-get update && apt-get install -y dos2unix
RUN dos2unix ./*.sh

# Add volume for ssl certificates
VOLUME /certs

# Launch EnvPlate then Nginx
ENTRYPOINT ["./run.sh"]
