# REST API Documentation

Steps to Update the Back-End

1. Determine new test cases
    - Update `/test/<model>.test.js` file
2. Update the Model (`/server/routes`)
    - Validate new fields
3. Update the Routes
    - Check to make sure a route can't be re-used
4. Run `npm test` to see if all tests pass
5. Update API Documentation

## User (Customers)

### No Authentication

* [List All Users](user/list.md) : `GET /api/users/`