# Docker Compose
to run the Docker compose use 

docker-compose up -d

# Notes
There is no need for migrations as the sensors-monitoring will automatically run the migrations

## Points about the project:

- Notice The application can take up to 2 minutes to start up, this is because of the kafka rebalancing all the consumers
- You can see the faulty sensors logs in the sensors-monitoring service, notice that it only prints its faulty if the sensor wasn’t faulty before, if we get more samples which are faulty it won’t print them ( I did it because i guessed we won’t care because we already know the sensor is faulty and until we fix it there is no reason to spam with logs )
- right now if i delete a sensor i delete its samples, i guessed that we won’t care about data from a delete sensor even if its historic data.
- If i didn’t get any data of a specific face do i need to show that face in the hour / hours that there was no data in the weekly report? I guessed the answer is yes, so I implemented it.
- Let’s say we don’t get data for an hour, how do we decide if its faulty or not? for now i have set it to use the samples_hourly_avg which is the avg hourly temperature for a side.
- Both reports of weekly summary and faulty sensors work this way :
when i start the server i run the query for both and save it to a cache and rerun the query each time it finishes. when i get to around 20m rows the loading can take up to 30 seconds and the time will stop once i reach a week and it will stablize but i don’t want the frontend user to wait so i am infinitely querying and saving the results to the cache and returning that to the user.

## Architecture

We have **timescaleDB** as my database, the 2 biggest reasons are 

- hypertables for big amounts of data, especially good for datetime based data.
- continous aggregation which helps the report summary requested.

We are using **kafka** as a data stream from the gateway service to the monitoring service to give the monitoring service time to process the data in batches.

We are using **nestjs** as the backend framework its an orm based framework, easy to use with postgres which timescaleDB is built upon, and has many built in features.

We are using **react** library for the frontend, component based development and a lot of ready components to use.

The flow of data is this

User send a request → sensors-gateway recieve the request validate its data and sends it to the kafka topic → kafka sends the message to the partition with the least amount of messages → sensors-monitoring consume the messages and process them into the database.

sensors-gateway → http://localhost:3000
sensors-monitoring → http://localhost:3001
frontend → http://localhost:8000