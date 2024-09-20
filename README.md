# Kombo Deduplication

This project is a tech challenge for a Senior Software Developer position. It involves deduplication of employee data using Prisma and PostgreSQL.

[Source](https://kombo-api.notion.site/Kombo-Write-Deduplication-Take-Home-Challenge-477db0bbca0c4ce89f7f096de4786d88)

### Prerequisites

- Node.js
- Docker
- PostgreSQL

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/stiwwelll/kombo-deduplication.git
    cd kombo-deduplication
    ```

2. Install dependencies:
    ```sh
    npm install
    #or
    yarn add
    ```

3. Set up the database using Docker:
    ```sh
    docker-compose -f docker-compose.yml up -d
    ```

4. Apply Prisma migrations and initialize the client:
    ```sh
    npx prisma migrate dev
    npx prisma generate
    ```

### Running the Application

1. Compile and execute the application:
    ```sh
    npm run execute
    #or
    yarn execute
    ```

You can change the employee data in the `src/constants/mockEmployees.ts` file to test the application with different data.

### Running Tests

1. Run the tests using Jest:
    ```sh
    npm test
    #or
    yarn test
    ```

## Project Details

### Database Schema

The database schema is defined in `prisma/schema.prisma`. It includes an `Employee` model with the following fields:
- `id`: Integer, primary key
- `remote_id`: String
- `first_name`: String
- `last_name`: String
- `createdAt`: DateTime, default to current timestamp
- `updatedAt`: DateTime, updated automatically

### Environment Variables

Environment variables are defined in the `.env`) file. Key variables include:
- `DATABASE_URL`: Connection string for the PostgreSQL database.


### Process

1 - The application is setup to theoretically iterate through a paginated list of employees from an external API. For the purpose of this challenge, the list is hardcoded in the `src/constants/mockEmployess.ts` file which only has 2 employee records set for testing.

2 - The application then syncs the employees to the database. The sync process is handled by the `syncBatch` function in the `src/syncBatch.ts`. The function is designed to compare the relevant external values with the database values via a hash comparison and and updates the database accordingly if the hash differs. It also create a new record if the customer is not found in the database.

### Further considerations
1 - To improve the process, we could also save the calculated has value in the database so we can compare it with the incoming hash value. This would reduce the calculation step by one step, however it would require an additional column in the database.

2 - Another consideration could be a caching layer like Redis to store the hash values for a certain period of time to reduce the number of database queries. With this we could check if the hash value of the incoming data is already in the cache and if it is, we can skip the database query entirely.


### Last Thoughts about this challenge...

Whereas I believe that with some external services you perhpas do not have any other option as of to periodically check and sync data with the database, I believe that this does not scale in the long run as I suppose that the number of services and datasets will grow over time.

Therefore, whereever possible, I would look into options to have a more event-driven approach to this problem. For example, if the external service is able to send a webhook to our service whenever a new employee is added or updated, we could then update our database in real-time. This would reduce the number of queries to the external service and would also reduce the number of queries to our database.

Furthermore we can look for filtering options in the external service to only get the data that has changed since the last sync. This would also reduce the number of queries to the external service and the number of queries to our database.
