
# If the request is missing the Authorization header, it should be forbidden
DELETE http://localhost:8080/v1/fragments

HTTP/1.1 401

# If the wrong username/password pair are used (no such user), it should be forbidden
DELETE http://localhost:8080/v1/fragments
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhjlkkj3JkMQ==

HTTP/1.1 401

# POST a new JSON fragment to http://localhost:8080 as an authorized user
POST http://localhost:8080/v1/fragments
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# We're sending a JSON fragment
Content-Type: application/json
# Body of the request
{ "route": "delete" }

# Confirm that the server returns a 201, and capture the Location header value and the fragment's id in variables 
# named fragment1_url and fragment1_id
HTTP/1.1 201
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# GET the fragment info (i.e., metadata) for the fragment you just created using the Location URL/info as an authorized user
# and confirm that the server returns a 200 and that metadata properties match what you expect
GET {{fragment1_url}}/info
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment1_id}}

# DELETE the the fragment you created above
DELETE {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# Confirm that the server returns a 200
HTTP/1.1 200

# Since we already deleted the fragment,
# If we try to delete it again, it returns 404 error (since no fragment with the given id)
DELETE {{fragment1_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# Confirm that the server returns a 404
HTTP/1.1 404