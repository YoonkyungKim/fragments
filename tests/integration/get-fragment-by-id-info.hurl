# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We're sending a markdown fragment
Content-Type: text/markdown
# Body of the request goes in ```...``` when it's a string
```# This is a fragment!```

# We expect to get back an HTTP 201
HTTP/1.1 201
# We have various assertions about the response that we want to check 
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/markdown"

# Capture the Location URL into a variable named `url`
[Captures]
url: header "Location"

# If the request is missing the Authorization header, it should be forbidden
GET {{url}}/info

HTTP/1.1 401

# If the wrong username/password pair are used (no such user), it should be forbidden
GET {{url}}/info
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhjlkkj3JkMQ==

HTTP/1.1 401

# GET the fragment with info
GET {{url}}/info
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
header "Content-Type" startsWith "application/json"

jsonpath "$.status" == "ok"
# Our fragment ids use https://www.npmjs.com/package/nanoid
jsonpath "$.fragment.id" matches "^[A-Za-z0-9_-]+$"
# Our ownerId hash is a hex encoded string
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
# Basic check for the presence of created and updated date strings.
# You could also write a regex for this and use matches
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/markdown"
# 19 is the length of our fragment data: '# This is a fragment!'
jsonpath "$.fragment.size" == 21

# no fragments with the given id returns 404 error
GET http://localhost:8080/v1/fragments/randomid/info
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 404