# If the request is missing the Authorization header, it should be forbidden
PUT http://localhost:8080/v1/fragments/randomid
Content-Type: text/plain
"hello"

HTTP/1.1 401

# If the wrong username/password pair are used (no such user), it should be forbidden
PUT http://localhost:8080/v1/fragments/randomid
# Send random value for authorization
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhjlkkj3JkMQ==
Content-Type: text/plain
"hello"

HTTP/1.1 401

# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We're sending a plain text fragment
Content-Type: text/plain
# Body of the request goes in ```...``` when it's a string
```This is a fragment!```

# We expect to get back an HTTP 201
HTTP/1.1 201
# We have various assertions about the response that we want to check 
[Asserts]
# The Location header should look like what we expect (including the fragment id)
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"

# Capture the Location URL into a variable named `url`
[Captures]
url: header "Location"
id: jsonpath "$.fragment.id"

# Try to GET the fragment we just posted by its URL
GET {{url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Length: 19
[Asserts]
header "Content-Type" startsWith "text/plain"
body == "This is a fragment!"

# If the Content-Type of the request does not match the existing fragment's type, 
# returns an HTTP 400 with an appropriate error message. A fragment's type can not be changed after it is created
PUT {{url}}
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We can update to the same type: so it must be plain text
Content-Type: text/markdown
# Body
```# This is an updated fragment!```

HTTP/1.1 400

# Update (PUT) fragment data we just posted
PUT {{url}}
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We can update to the same type: so it must be plain text
Content-Type: text/plain
# Body
```This is an updated fragment!```

HTTP/1.1 201
# We have various assertions about the response that we want to check 
[Asserts]
jsonpath "$.fragment.id" matches "^[A-Za-z0-9_-]+$"
# Our ownerId hash is a hex encoded string
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
# Basic check for the presence of created and updated date strings.
# You could also write a regex for this and use matches
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/plain"
# 19 is the length of our fragment data: 'This is a fragment!'
jsonpath "$.fragment.size" == 28

# Try to GET the fragment we just updated
GET {{url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Length: 28
[Asserts]
header "Content-Type" startsWith "text/plain"
body == "This is an updated fragment!"

# If no such fragment exists with the given id, returns an HTTP 404 with an appropriate error message
PUT http://localhost:8080/v1/fragments/randomid
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We can update to the same type: so it must be plain text
Content-Type: text/plain
# Body
```This is an updated fragment!```

HTTP/1.1 404