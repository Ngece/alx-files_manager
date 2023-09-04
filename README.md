This project is a summary of this back-end trimester: authentication, NodeJS, MongoDB, Redis, pagination and background processing.

The objective is to build a simple platform to upload and view files:

    User authentication via a token
    List all files
    Upload a new file
    Change permission of a file
    View a file
    Generate thumbnails for images


utils/redis.js                  contains the class RedisClient with:
    the constructor that creates a client to Redis:
        any error of the redis client must be displayed in the console (you should use on('error') of the redis client)
    a function isAlive that returns true when the connection to Redis is a success otherwise, false
    an asynchronous function get that takes a string key as argument and returns the Redis value stored for this key
    an asynchronous function set that takes a string key, a value and a duration in second as arguments to store it in Redis (with an expiration set by the duration argument)
    an asynchronous function del that takes a string key as argument and remove the value in Redis for this key





utils/db.js                     contains the class DBClient with:
    the constructor that creates a client to MongoDB:
        host: from the environment variable DB_HOST or default: localhost
        port: from the environment variable DB_PORT or default: 27017
        database: from the environment variable DB_DATABASE or default: files_manager
    a function isAlive that returns true when the connection to MongoDB is a success otherwise, false
    an asynchronous function nbUsers that returns the number of documents in the collection users
    an asynchronous function nbFiles that returns the number of documents in the collection files




server.js                       An express server:
    it listens on the port set by the environment variable PORT or by default 5000
    it loads all routes from the file routes/index.js




routes/index.js                 contains all routes of the application:
    GET /status => AppController.getStatus
    GET /stats => AppController.getStats




controllers/AppController.js    contains the definition of the 2 endpoints:
    GET /status should return if Redis is alive and if the DB is alive too by using the 2 utils created previously: { "redis": true, "db": true } with a status code 200
    GET /stats should return the number of users and files in DB: { "users": 12, "files": 1231 } with a status code 200
        users collection is used for counting all users
        files collection is used for counting all files




A user authentication system with the following functionalities:
    added 3 new endpoints:
        GET /connect => AuthController.getConnect
        GET /disconnect => AuthController.getDisconnect
        GET /users/me => UserController.getM
    Inside controllers, added a file AuthController.js that contains new endpoints:
        GET /connect should sign-in the user by generating a new authentication token:
        By using the header Authorization and the technique of the Basic auth (Base64 of the <email>:<password>), the server will attempt to find the user associated with this email and with this password (reminder: we are storing the SHA1 of the password)
        If no user has been found, it returns an error Unauthorized with a status code 401
        Otherwise:
            Generates a random string (using uuidv4) as token
            Creates a key: auth_<token>
            Uses this key for storing in Redis (by using the redisClient create previously) the user ID for 24 hours
            Returns this token: { "token": "155342df-2399-41da-9e8c-458b6ac52a0c" } with a status code 200

    Now, we have a way to identify a user, we create a token (= avoiding to store the password on any front-end) and use this token for 24h to access to the API!
    Every authenticated endpoints of our API will look at this token inside the header X-Token.

    GET /disconnect will sign-out the user based on the token:
        Retrieving the user based on the token:
            If not found, returns an error Unauthorized with a status code 401
            Otherwise, server will delete the token in Redis and return nothing with a status code 204

    Inside the file controllers/UsersController.js, we added a new endpoint:
        GET /users/me which retrieves the user based on the token used:
        Retrieving the user based on the token:
            If not found, returns an error Unauthorized with a status code 401
            Otherwise, returns the user object (email and id only)




A simple file uploader with the following functionalities:
    add a new endpoint:
    POST /files => FilesController.postUpload

    POST /files will create a new file in DB and in disk:
    Retrieving the user based on the token:
        If not found, returns an error Unauthorized with a status code 401
    File specifications:
        name: as filename
        type: either folder, file or image
        parentId: (optional) as ID of the parent (default: 0 -> the root)
        isPublic: (optional) as boolean to define if the file is public or not (default: false)
        data: (only for type=file|image) as Base64 of the file content
    If the name is missing, returns an error 'Missing name' with a status code 400
    If the type is missing or not part of the list of accepted type, returns an error 'Missing type' with a status code 400
    If the data is missing and type != folder, return an error 'Missing data' with a status code 400
    If the parentId is set:
        If no file is present in DB for this parentId, returns an error Parent not found with a status code 400
        If the file present in DB for this parentId is not of type folder, returns an error 'Parent is not a folder' with a status code 400
    The user ID will be added to the document saved in DB - as owner of a file
    If the type is folder, the server adds the new file document in the DB and returns the new file with a status code 201
    Otherwise:
        All file will be stored locally in a folder (to create automatically if not present):
            The relative path of this folder is given by the environment variable FOLDER_PATH
            If this variable is not present or empty, we use /tmp/files_manager as storing folder path
        Using a local path in the storing folder with filename UUID
        We store the file in clear in this local path
        Adding the new file document in the collection files with these attributes:
            userId: ID of the owner document (owner from the authentication)
            name: same as the value received
            type: same as the value received
            isPublic: same as the value received
            parentId: same as the value received - if not present: 0
            localPath: for a type=file|image, the absolute path to the file save in local
        Return the new file with a status code 201





A simple file viewer with the following functionalities:
    added 2 new endpoints:
    GET /files/:id => FilesController.getShow
    GET /files => FilesController.getIndex

    In the file controllers/FilesController.js, added the 2 new endpoints:

    GET /files/:id will retrieve the file document based on the ID:
        Retrieving the user based on the token:
        If not found, the server returns an error Unauthorized with a status code 401
        If no file document is linked to the user and the ID passed as parameter, returns an error Not found with a status code 404
        Otherwise, returns the file document

    GET /files will retrieve all users file documents for a specific parentId and with pagination:
        Retrieving the user based on the token:
            If not found, return an error Unauthorized with a status code 401
        Based on the query parameters parentId and page, returns the list of file document
            parentId:
                No validation of parentId needed - if the parentId is not linked to any user folder, returns an empty list
                By default, parentId is equal to 0 = the root
            Pagination:
                Each page should be 20 items max
                page query parameter starts at 0 for the first page. If equals to 1, it means it’s the second page (form the 20th to the 40th), etc…
                Pagination is done directly by the aggregate of MongoDB





A simple file sharer with the following functionalities:
    added 2 new endpoints:
    PUT /files/:id/publish => FilesController.putPublish
    PUT /files/:id/publish => FilesController.putUnpublish

    In the file controllers/FilesController.js, we added the 2 new endpoints:

    PUT /files/:id/publish will set isPublic to true on the file document based on the ID:
        Retrieving the user based on the token:
        If not found, the server returns an error Unauthorized with a status code 401
        If no file document is linked to the user and the ID passed as parameter, returns an error Not found with a status code 404
        Otherwise:
            Updates the value of isPublic to true
            And returns the file document with a status code 200

    PUT /files/:id/unpublish should set isPublic to false on the file document based on the ID:
        Retrieving the user based on the token:
        If not found,the server returns an error Unauthorized with a status code 401
        If no file document is linked to the user and the ID passed as parameter, returns an error Not found with a status code 404
        Otherwise:
            Updates the value of isPublic to false
            And returns the file document with a status code 200





A simple file date viewer with the following functionalities:
    added one new endpoint:
    GET /files/:id/data => FilesController.getFile

    In the file controllers/FilesController.js, added the new endpoint:
    GET /files/:id/data will return the content of the file document based on the ID:
        If no file document is linked to the ID passed as parameter, returns an error 'Not found' with a status code 404
        If the file document (folder or file) is not public (isPublic: false) and no user authenticate or not the owner of the file, returns an error 'Not found' with a status code 404
        If the type of the file document is folder, returns an error 'A folder doesn't have content' with a status code 400
        If the file is not locally present, returns an error 'Not found' with a status code 404
        Otherwise:
            By using the module 'mime-types', the server gets the MIME-type based on the name of the file
            Returns the content of the file with the correct MIME-type




A simple file thumbnail viewer with the following functionalities:
    Update the endpoint POST /files endpoint to start a background processing for generating thumbnails for a file of type image:

        We create a Bull queue fileQueue
        When a new image is stored (in local and in DB), server adds a job to this queue with the userId and fileId

    Creating a file worker.js:
        By using the module Bull, we create a queue fileQueue
        Processing this queue:
            If fileId is not present in the job, raise an error Missing fileId
            If userId is not present in the job, raise an error Missing userId
            If no document is found in DB based on the fileId and userId, raise an error 'File not found'
            By using the module image-thumbnail, the server generates 3 thumbnails with width = 500, 250 and 100 - stores each result on the same location of the original file by appending _<width size>

    Updating the endpoint GET /files/:id/data to accept a query parameter size:
        size can be 500, 250 or 100
        Based on size, returns the correct local file
        If the local file doesn’t exist, returns an error Not found with a status code 404





Tests for redisClient and dbClient classes:
    Tests for each endpoints:
        GET /status
        GET /stats
        POST /users
        GET /connect
        GET /disconnect
        GET /users/me
        POST /files
        GET /files/:id
        GET /files (don’t forget the pagination)
        PUT /files/:id/publish
        PUT /files/:id/unpublish
        GET /files/:id/data




A New User welcome email:
    Updated the endpoint POST /users endpoint to start a background processing for sending a “Welcome email” to the user:

        Contains a Bull queue userQueue
        When a new user is stored (in DB), the server adds a job to this queue with the userId
        Updated the file worker.js:
        By using the module Bull, we created a queue userQueue
        Processing this queue:
            If userId is not present in the job, raise an error Missing userId
            If no document is found in DB based on the userId, raise an error User not found
            Print in the console Welcome <email>!
