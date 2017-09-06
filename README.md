# Steps to run the application
1. install docker 17.07 on your computer
2. git clone this repo
3. cd into this repo directory
4. make sure there is nothing listening on your computer port 80
5. execute `docker-compose up -d --force-recreate`, be prepared this steps will take a while and build/download quite a bit of docker images
6. open Chrome browser and go to `http://localhost`, or `http://192.168.99.100` if you are running docker toolbox on windows

# Troubleshooting to get all apps up in docker
- `docker-compose ps` to see if all containers are up
- `docker-compose logs` to read the logs
- `docker-compose up -d --force-recreate` to restart the apps.
### Note: There are some inter-dependencies among the apps. Docker engine will start the apps in order with respect to the configs in docker-compose.yml. But it will not wait for an applicaton up and ready before going to the next app. So we need to handle things some intermittent failure connections to Redis by retries (TODO). When you see this problem, try to execute `docker-compose up -d --force-recreate` for now.
### Note: If you are using docker-machine, which is a linux VM, there is a known issue (https://forums.docker.com/t/docker-fails-to-perform-name-resolution/2655) of occasionally failed DNS lookup and people need to do `docker-machine restart` to get around it. Since `scheduled_jobs` app is dependent on DNS lookup for the external API endpoint, you may see `getaddrinfo EAI_AGAIN` error shown in logs `docker-compose logs scheduled_jobs`.

# Architecture
<img src="https://ptpaiq-dm2305.files.1drv.com/y4m_7SPD70ViE3jvgShqg9tEuEuhWZoZ1aKTXYZv9vhDjnaruYLyZ2CaUwWh5tgti8w2cFPoewudXrLHmZbI7Mskf9Rh36ZXtLhiSheiFOP_0PrP8U6uTbdTjfiOumBLfWIf0snZdXGL5DDM8PIAeXfQAtJis4GqTCHSEYbcBqv3vnh3oQhcX777uhIQN86kysgM52NKO35HY6b23zKXKfb9A?width=660&height=463&cropmode=none" width="660" height="463" />

# Technologies used
- The UI is built with React.js with UI states managed with redux pattern. Universal UI rending is also included.
- All the web and socket backend apps are builit on Node.js runtime.

# Code structure
- Things are splitted into 4 applications and their corresponding entry files are in `./bin/` directory.
- `api.js` for serving exchange rates GET requests by reading redis cache.
- `scheduledJobs.js` for fetching latest exchange rates data from external api and propagating updates to redis cache and sockets.
- `socket.js` for pushing exchange rate updates to persistent socket io clients
- `server.js` for universal UI rendering.
- Some basic api test on the endpoint serving exchange rates GET request are included in `./api/__test__/` directory.

# Difficult points
1. Scaling web socket connections to serve millions of clients. Since web socket connections are persistent and every connection is holding up connection resources on a server, we cannot easily scale stateful connections in the same way as stateless HTTP web servers, which could be load balanced.
    - Nginx could help load balance persistent socket connections by using ways like IP hashing, but this is still questionable for NAT networks.
    - We split apart socket servers, api/UI servers to allow scaling socket servers individually.
    - redis pub/sub pattern is adopted to fan out exchange rate updates to all web socket servers and thus all connected clients
2. The external api will reject api requests with 503 when we make 10 concurrent requests to fetch those 10 exchange rates displayed on the UI.
    - we need to batch HTTP GET requests to the external API
3. Need to reduce the number of external external rate API calls while still make sure we have latest data shown on our UI
    - It is observed that the exchange rates are updated every 60s and the updates have up to 1-min delay. In other words, I could get 13:00 exchange rate for BTC-USD at 13:01 and get 13:01 data at 13:02.
    - When we query too often, we could possibly rate-limited by the external API service.
    - When we query the same exchange currency pair like BTC-USD too often, we may get the same data of same timestamp, which we have already got before. This is a wastage of our quota and network resources.
    - I come up with the approach of making a GET request to the exchange rate external API every 6s. For 10 currency pairs, every pair will be updated every 60 seconds. Right now, the selection of the next currency pair to be fetched is done round-robin with Javascript generator. This could be further optimzed by ways such as get the single currency pair with the oldest timestamp from redis (could easily be done with sorted set).
