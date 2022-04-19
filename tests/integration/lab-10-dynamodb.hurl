# POST a new JSON fragment to http://localhost:8080 as an authorized user. The fragment's body should be the JSON value, { "service": "DynamoDB" }.
POST http://localhost:8080/v1/fragments
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We're sending a JSON fragment
Content-Type: application/json
# Body of the request
{ "service": "DynamoDB" }

# Confirm that the server returns a 201, and capture the Location header value and the fragment's id in variables 
# named fragment1_url and fragment1_id.
HTTP/1.1 201
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# GET the fragment info (i.e., metadata) for the fragment you just created using the Location URL/info as an authorized user
# and confirm that the server returns a 200 and that all of the metadata properties match what you expect.
GET {{fragment1_url}}/info
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment1_id}}
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 25

# Update (PUT) fragment data we just posted
PUT {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We can update to the same type: so it must be application/json
Content-Type: application/json
# Body
{ "service": "DynamoDB updated fragment" }

HTTP/1.1 201
[Asserts]
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 42

# Try to GET the fragment we just updated
GET {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
Content-Length: 42
[Asserts]
header "Content-Type" startsWith "application/json"

# We can't update it with different type
PUT {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/plain
# Body
```This is an updated fragment!```

HTTP/1.1 400

# POST a second Markdown fragment to http://localhost:8080 as the same authorized user. The fragment's body should be the Markdown value, DynamoDB is **great**..
POST http://localhost:8080/v1/fragments
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We're sending a markdown fragment
Content-Type: text/markdown
# Body of the request
```DynamoDB is **great**.```

# Confirm that the server returns a 201, and once again capture the Location header value
# and the second id in variables named fragment2_url and fragment2_id.
HTTP/1.1 201
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# GET the fragment info (i.e., metadata) you just created using the url/info as an authorized user
# and confirm that the server returns a 200 and that all of the metadata properties match what you expect.
GET {{fragment2_url}}/info
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment2_id}}
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22

# GET all of the fragments for the same authorized user without expanding them (i.e., just get back the IDs) 
# and confirm that the list of fragments includes the two id values you captured above
GET http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}

# DELETE the first fragment you created above
DELETE {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# Confirm that the server returns a 200
HTTP/1.1 200

# Try to GET the first fragment again using the url you captured above as the authorized user.
GET {{fragment1_url}}/info
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# Confirm that the server returns a 404, since the fragment should be deleted.
HTTP/1.1 404

# GET all of the fragments for the same authorized user without expanding them (i.e., just get back the IDs) a second time, 
# and confirm that the first id is NOT included but that the second id is (i.e., that the second was deleted).
GET http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" not includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}