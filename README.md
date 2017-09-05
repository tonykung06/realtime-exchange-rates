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

# Architecture
<img src="https://ptpaiq-dm2305.files.1drv.com/y4m_7SPD70ViE3jvgShqg9tEuEuhWZoZ1aKTXYZv9vhDjnaruYLyZ2CaUwWh5tgti8w2cFPoewudXrLHmZbI7Mskf9Rh36ZXtLhiSheiFOP_0PrP8U6uTbdTjfiOumBLfWIf0snZdXGL5DDM8PIAeXfQAtJis4GqTCHSEYbcBqv3vnh3oQhcX777uhIQN86kysgM52NKO35HY6b23zKXKfb9A?width=660&height=463&cropmode=none" width="660" height="463" />

