/**
 * @api {post} /auth/login Login
 * @apiDescription Login to Locker account
 * @apiName PostAuthLogin
 * @apiGroup Auth
 * @apiVersion 0.1.0
 * @apiPermission none
 * @apiParam    (Request body)  {String}      login        <code>Required</code> Username, email address, or phone number
 * @apiParam    (Request body)  {String}      password     <code>Required</code> Password
 * @apiParamExample {json} Request-Example:
 * {
 *  "login"    : "JohnDoe",
 *  "password" : "JohnDoeP@ssw@rd123#"
 * }
 * @apiSuccess  (200) {String}    access_token           JWT access token
 * @apiSuccess  (200) {String}    id_token           JWT ID token
 * @apiSuccess  (200) {String}    refresh_token           JWT refresh token
 * @apiSuccess  (200) {ObjectId}  _id        MongoDB ID of user
 *
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
{
    "access_token": "eyJraWQiOiJSOGNuYnFxM2YzV0V6Zk94NVRuRE1NYU5CdUZsU1llU0lJVFZNclRRSTJJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkNjM5NGM2NS1kZDRiLTQ4MjUtYmRmZi01YWU1ZDNlMGI5MWYiLCJldmVudF9pZCI6ImExNzU4ZTFjLTllZWQtNDE4Mi1iZDM1LTJmNzk4MGM5YjE2NyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MDAxNzkzMTYsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX3hyU2xrRDhXdSIsImV4cCI6MTYwMDE4MjkxNiwiaWF0IjoxNjAwMTc5MzE2LCJqdGkiOiIyZGZmNzY4OS1iZDIxLTRlNTUtODVjMS1jM2U0MDEyNDNjMmEiLCJjbGllbnRfaWQiOiI2bmZpNjAyMmhwNDZqZm8yNmJrMGE4M3JjdCIsInVzZXJuYW1lIjoiZGJjYTY4NDUtZDQwMC00ZTM3LWJlNzgtM2JlYjdlYjdhNjNhIn0.ay4VyBuN1F2kWFsMRxJ2_GtMPOKQjFUkmuyjX8Z2JbSO2RixjYsRmnLCeRakI7kXfobHxgLKfYGKUJ8TQBxJuaQrAO2dvN_zjpaq3UF4y-zUZPvzzU0jeY4RlgcPgJErU6OduGNjaSWPLHvVah3jicrBvkPCGDQdaXHXziwrTLaiuHAoIfYtuHV4dNhPxTH0o_GQqMhKFTCy06KJXP96kJSTUTVcsFMGaHR2Pr0WvL9Cya7UHrGugNX4zQ7aRMaxcuKUF6GgmFl6ixuLxOzLkXxoAMOnImqI3R7sBrgOzbQVME08HqHxjb_j4sTPYIM1MAdKir6vy2UH1enHEBLMfw",
    "id_token": "eyJraWQiOiIyeUJmYzhjWjIwVVJrcWdKZ1R4MktvRW5UT3JYTElWYmNwdkltVlVpVXJrPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkNjM5NGM2NS1kZDRiLTQ4MjUtYmRmZi01YWU1ZDNlMGI5MWYiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfeHJTbGtEOFd1IiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjp0cnVlLCJjb2duaXRvOnVzZXJuYW1lIjoiZGJjYTY4NDUtZDQwMC00ZTM3LWJlNzgtM2JlYjdlYjdhNjNhIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibWF0dGhldzQiLCJhdWQiOiI2bmZpNjAyMmhwNDZqZm8yNmJrMGE4M3JjdCIsImV2ZW50X2lkIjoiYTE3NThlMWMtOWVlZC00MTgyLWJkMzUtMmY3OTgwYzliMTY3IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MDAxNzkzMTYsInBob25lX251bWJlciI6IisxNTAyNjg5MTgyMyIsImV4cCI6MTYwMDE4MjkxNiwiaWF0IjoxNjAwMTc5MzE2LCJlbWFpbCI6Im5ld191c2VyM0BnbWFpbC5jb20ifQ.uiQOxEKXjv2zsu89yQUAnWjIJCixFWK4Y_AIZcV3--U3T3OooLnWn9n-2dfNKbH8TscNyN1nfjI6z8FPTRpx0ysu8qcCsUUI6rCC83GDQD1NeDmyrg9yMCmVEnn3fs-jNgQGhjRKK3fA3_VC7JmMrSFQii-rDOnPgY7YhSKNvqRsnI8R3QWUw47A0MyrGPrT4Wq-mZ-IF5i9flLj7_pWDZl0DQlOjTbjRR-xB_CAcfElGog_-ZogXWChXvT0OHHy43DL4r03nipcLms03OWtbtJInbK4pljo1zZqgXxEHL01xuvkQSW356GE1P8aMUIqDHmu-maYkQsS885lAPuu1w",
    "refresh_token": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.WpNRmabYPIcOgF3UsUHyPRwsSIqvaahnLAHFErJgiOpzcGvsQBeA9cDhcGPrMSRAV3wpXxvjbJbvIKmsiA1EDBRkEcQC2wSpjPQDEe6syHI2PMKJX2aQhE_WgH574KQEhpjdHKDox4wH6LrOxjuGCiaZtAIPzavp5aOch8M3Y4Otata_VEC2ZNcUo0fDaMuObEVFMQfHSr_UgVjyzft-fcjZ2L06kbkNdmsUXn-YZ0jfn-rV4x_YBuhUmr_JuhXbbpEkfLWA5VbzeYJ2nvPDr_CeI-SFfhgCoD__TViN7NiLl1kNYXJ5dN41jkpp-5-R3noJQA3cglItYdeG8eNR-A.wfiYYQC4Ipz6VIxu.EEk89oAYxpxF3E-PoOG-fwtB7bReJcrV_lPUk0j4j4JDGGluGIpTBB5amn6-W6AFphwY_EcrPRngrB48cPO5FIAj919MrHrufPsL0rsHaUMgd1n5WZe8Ra8e9F5dlWA8u35UfYgVO-GqF_DaIMb3wL2wPGA-dewt9PQzOYXhAbvAEb2649qHJ5Kni5sd1X3cOE29gMLoeN7bTPRAVytsXH3XEfAmxk4gaD2ju3ooCiyVGlPNO_WbG5le7uNL4xjR-lw7n6fgjcX33vNt9zfmz5mmpW9kV-YeBXF5N8Q_LLAbBfMFgXTJYZSE-Q4m7dUncMo4c-GIWnUXmq3Cw6GFtwwsl8n7Oda1gMGnj7LFr7bLMS2HiHctrGQ_5Uwz20vGIk5_kiO6u0Vhy6XOfocqsQ2A3qrJgYycVGiOaJjsgrZliTu0tW7RyRkihqCWIE9BMU-YB3hTm7pynDiuqpZ-cfGD4pmPkrKDvYv2U64N7ZfoioQjo2Kbma1RX1eYPqVJDWJXATWCTppYddRlla7UneIt8zmjFDhwH1tijR0sl3r1kmYzJbpqJ-YwQLGWjNy0M_40Fy4fEs---EZ1KKXE22UvwUZ9fzRQZ6aF2SCkdZCE18CpdVgCT-xtwRsTlmzxxmbqAIaVrsL92Rz4mCYpA-QVWb6UhlqgNbAmzg21ui8QNgajfL1GgVTkHxlqVJV15o7JvPvp8S7csNk9nnUms2Vg2YOhAbBMXWFXbxNzvQfxF4Ah4HdeDAbnaFEkk4iPYhQgehAkUxc_WZdWt03aQ9V3y2b6Y6Ar6j96ZQZ7YCPW_aubUYwPhM9Y39lT8p0jI1w47_NSDgQxJ9XT80NOIEH91sZOEN66qrFFdEFAi-naKAhUc0-V6w98vaojQu_g3pEgsLJmOL8zsNRVpxXAxiDzgMFzGRsc3tWhQVZ0QSBjH2Go0kAcYELx3eSrRK0fjwIUnYXRsJZn8JyhDflrxOaZo8TgMTJx8BHQkbQbCY9z2P1_W1CrNipewQaS5RloTTTFZCkTJCUsq_h99706wU6p5k1pNtgzOFULA1MDatm3nWOg1yKtdsxn89HZ_Vks1waUdWqIJwH2Yg3O3-SnMYnQMoxtb5a8ZjNmv9F49MMRreNHUxWp427vmV1Pk75BK_EoExUo5X6onjuEu9DgVgqQlCygdDsBlmVNnI0PNrLjz8ojxCY9A7df_VTZjDN1HpPlDq271VKCQGsi-51A9Y2xJ43ZU2taiSbZ64IbcTRmAFJ0pZJYWgN9vNXoRxzwha8KS58DmeVfNAg4TjQWL9-QdScFU0nnLJfIzHVMkZ1O1KBpFZJBOmdmAQ.BsLVaQWZUM32Oq6XVhh_Vw",
    "_id": "5f60cc7422add441148a35ea"
}
 * @apiError (4xx) 400 Missing username, phone number, email.
 * @apiError (4xx) 400 Missing password
 * @apiError (4xx) 401 Missing username or password (either username or password are incorrect)
 * @apiError (4xx) 404 User not found
 * @apiError (5xx) 500 Server unable to login user
 * @apiErrorExample MissingLoginInfo:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "Username required"
 *     }
  * @apiErrorExample MissingPassword:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "Missing password"
 *     }
 * @apiErrorExample InvalidPassword:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "Incorrect username or password."
 *     }
 * @apiErrorExample ServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Server unable to login user"
 *     }
 */

 /**
 * @api {get} /auth/logout Logout
 * @apiDescription Removes JWT token from Cookies to log out.
 * @apiName GetAuthLogout
 * @apiGroup Auth
 * @apiVersion 0.1.0
 * @apiPermission none
 * @apiSuccess  (200) {String}    message   "Logged out"
 *
 * @apiSuccessExample Response (example):
    HTTP/1.1 200 OK
    {
        "message": "Logged out"
    }
 */

  /**
 * @api {head} /auth/verify_token?token=<YOUR_TOKEN> Verify JWT Token
 * @apiDescription Verifies token query parameter
 * @apiName HeadAuthVerifyToken
 * @apiGroup Auth
 * @apiVersion 0.1.0
 * @apiPermission none
 * @apiSuccess  (2xx) 200 Token is verified  
 * @apiError (4xx) 401 Token is not verified
 */