POST http://localhost:8080/v1/fragments
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We're sending a plain text fragment
Content-Type: text/plain
# Body of the request goes in ```...``` when it's a string
```This is fragment!```

HTTP/1.1 201

# GET all of the fragments for the same authorized user by expanding them
GET http://localhost:8080/v1/fragments?expand=1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# We should get back an HTTP 1.1 200 response
HTTP/1.1 200

# Extra checks to perform against the response
[Asserts]
# We expect to get back a JSON response with { "status": "ok", ... }
jsonpath "$.status" == "ok"
jsonpath "$.fragments" isCollection
# check if one of fragments arrays' element includes a full representations of metadata (i.e., not just id)
jsonpath "$.fragments[0].id" matches "^[A-Za-z0-9_-]+$"
# Our ownerId hash is a hex encoded string
jsonpath "$.fragments[0].ownerId" matches "^[0-9a-fA-F]+$"
# Basic check for the presence of created and updated date strings
jsonpath "$.fragments[0].created" isString
jsonpath "$.fragments[0].updated" isString
jsonpath "$.fragments[0].type" isString
jsonpath "$.fragments[0].size" isInteger